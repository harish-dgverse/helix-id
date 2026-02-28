#!/usr/bin/env python3
"""
BookOrderer AI Agent - Backend Server (Azure OpenAI Version)
FastAPI server with WebSocket for real-time chat interface
"""

import json
import os
import sys
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import AzureOpenAI
import httpx
from eth_account import Account
from eth_account.messages import encode_defunct
import nacl.signing
import nacl.encoding
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# -----------------------------
# Azure OpenAI Configuration
# -----------------------------
AZURE_ENDPOINT = os.getenv("AZURE_ENDPOINT")
AZURE_API_VERSION = os.getenv("AZURE_API_VERSION", "2024-12-01-preview")
AZURE_DEPLOYMENT = os.getenv("AZURE_DEPLOYMENT", "gpt-5.2-chat")
AZURE_API_KEY = os.getenv("AZURE_API_KEY")

# Booking App API
BOOKING_API_URL = os.getenv("BOOKING_API_URL", "http://localhost:3000/api")
HELIXID_BACKEND_URL = os.getenv("HELIXID_BACKEND_URL", "http://localhost:3005/api")

# Agent Info (the agent this backend represents)
AGENT_DID = os.getenv("AGENT_DID", "did:hedera:testnet:52vnnEG9pRG4Fy2Qn1yRNFhYvcY5PevKF1sM4NxN4YPh_0.0.7882614")
AGENT_NAME = os.getenv("AGENT_NAME", "BookGenie AI")

# -----------------------------
# FastAPI setup
# -----------------------------
app = FastAPI(title="BookGenie AI Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------
# Authentication Functions
# -----------------------------
async def verify_agent_vp(vp: dict) -> dict:
    """Verify agent's Verifiable Presentation (calls helixid-backend)"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{HELIXID_BACKEND_URL}/vps/verify",
                json={"vp": vp},
                timeout=5.0
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"VP verification error: {e}")
            return {"valid": False, "error": str(e)}

async def log_agent_activity(type: str, description: str, metadata: dict = None):
    """Log agent activity to helixid-backend"""
    async with httpx.AsyncClient() as client:
        try:
            payload = {
                "type": type,
                "description": description,
                "metadata": metadata or {}
            }
            # Add common metadata
            payload["metadata"]["agent_did"] = AGENT_DID
            payload["metadata"]["agent_name"] = AGENT_NAME
            
            await client.post(
                f"{HELIXID_BACKEND_URL}/activity",
                json=payload,
                timeout=2.0
            )
        except Exception as e:
            print(f"Failed to log activity: {str(e)}")


async def verify_user_signature(did: str, message: str, signature: str) -> dict:
    """Verify user signature (REAL verification)
    
    Supports both:
    - Ed25519 (Hedera DIDs) 
    - ECDSA/secp256k1 (Ethereum DIDs)
    
    Auto-detects which algorithm to use based on the public key format.
    """
    try:
        # Fetch user's public key from helixid-backend
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{HELIXID_BACKEND_URL}/users/{did}",
                timeout=5.0
            )
            if response.status_code != 200:
                return {"valid": False, "error": "User not found"}
            
            user = response.json()
            public_key = user.get("public_key")
            
            if not public_key:
                return {"valid": False, "error": "No public key found for user"}
        
        # Determine signature algorithm based on public key format
        # Ed25519 public keys are 32 bytes (64 hex chars without 0x prefix)
        # ECDSA public keys are 65 bytes (130 hex chars, starts with 0x04)
        
        if public_key.startswith('0x04'):
            # ECDSA verification (Ethereum)
            try:
                message_hash = encode_defunct(text=message)
                recovered_address = Account.recover_message(message_hash, signature=signature)
                expected_address = Account.from_key(public_key).address
                
                if recovered_address.lower() == expected_address.lower():
                    return {
                        "valid": True,
                        "user_did": did,
                        "user_id": user["id"],
                        "user_name": user.get("name", "Unknown"),
                        "algorithm": "ECDSA"
                    }
                else:
                    return {"valid": False, "error": "Invalid ECDSA signature"}
            except Exception as e:
                return {"valid": False, "error": f"ECDSA verification failed: {str(e)}"}
        
        else:
            # Ed25519 verification (Hedera)
            try:
                # Convert hex public key to bytes
                if public_key.startswith('0x'):
                    public_key_bytes = bytes.fromhex(public_key[2:])
                else:
                    public_key_bytes = bytes.fromhex(public_key)
                
                # Convert hex signature to bytes
                if signature.startswith('0x'):
                    signature_bytes = bytes.fromhex(signature[2:])
                else:
                    signature_bytes = bytes.fromhex(signature)
                
                # Create verify key from public key
                verify_key = nacl.signing.VerifyKey(public_key_bytes)
                
                # Verify signature
                message_bytes = message.encode('utf-8')
                verify_key.verify(message_bytes, signature_bytes)
                
                return {
                    "valid": True,
                    "user_did": did,
                    "user_id": user["id"],
                    "user_name": user.get("name", "Unknown"),
                    "algorithm": "Ed25519"
                }
            except nacl.exceptions.BadSignatureError:
                return {"valid": False, "error": "Invalid Ed25519 signature"}
            except Exception as e:
                return {"valid": False, "error": f"Ed25519 verification failed: {str(e)}"}
            
    except Exception as e:
        print(f"Signature verification error: {e}")
        return {"valid": False, "error": str(e)}


async def verify_user_signature_with_key(did: str, message: str, signature: str, public_key: str) -> dict:
    """Verify user signature with provided public key (for testing)
    
    This bypasses the database lookup and uses the provided public key directly.
    Useful for testing without registering users first.
    """
    try:
        # Determine signature algorithm based on public key format
        if public_key.startswith('0x04'):
            # ECDSA verification (Ethereum)
            try:
                message_hash = encode_defunct(text=message)
                recovered_address = Account.recover_message(message_hash, signature=signature)
                expected_address = Account.from_key(public_key).address
                
                if recovered_address.lower() == expected_address.lower():
                    return {
                        "valid": True,
                        "user_did": did,
                        "user_id": "test_user",
                        "user_name": "Test User",
                        "algorithm": "ECDSA"
                    }
                else:
                    return {"valid": False, "error": "Invalid ECDSA signature"}
            except Exception as e:
                return {"valid": False, "error": f"ECDSA verification failed: {str(e)}"}
        
        else:
            # Ed25519 verification (Hedera)
            try:
                # Convert hex public key to bytes
                if public_key.startswith('0x'):
                    public_key_bytes = bytes.fromhex(public_key[2:])
                else:
                    public_key_bytes = bytes.fromhex(public_key)
                
                # Convert hex signature to bytes
                if signature.startswith('0x'):
                    signature_bytes = bytes.fromhex(signature[2:])
                else:
                    signature_bytes = bytes.fromhex(signature)
                
                # Create verify key from public key
                verify_key = nacl.signing.VerifyKey(public_key_bytes)
                
                # Verify signature
                message_bytes = message.encode('utf-8')
                verify_key.verify(message_bytes, signature_bytes)
                
                return {
                    "valid": True,
                    "user_did": did,
                    "user_id": "test_user",
                    "user_name": "Test User (Hedera)",
                    "algorithm": "Ed25519"
                }
            except nacl.exceptions.BadSignatureError:
                return {"valid": False, "error": "Invalid Ed25519 signature"}
            except Exception as e:
                return {"valid": False, "error": f"Ed25519 verification failed: {str(e)}"}
            
    except Exception as e:
        print(f"Signature verification error: {e}")
        return {"valid": False, "error": str(e)}


# -----------------------------
# Bookstore Tools (Direct HTTP)
# -----------------------------
async def search_books_tool(query: str) -> str:
    """Search for books by title or author"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{BOOKING_API_URL}/books", timeout=5.0)
            response.raise_for_status()
            books = response.json()
            
            query = query.lower()
            results = [
                book for book in books 
                if query in book["title"].lower() or query in book["author"].lower()
            ]
            
            if not results:
                return "No books found matching your query."
            
            return "\n".join([
                f"ID: {b['id']} | Title: {b['title']} | Author: {b['author']} | Price: ${b['price']} | Stock: {b['stock']}"
                for b in results
            ])
        except Exception as e:
            return f"Error searching books: {str(e)}"


async def view_inventory_tool() -> str:
    """View the full inventory of books"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{BOOKING_API_URL}/books", timeout=5.0)
            response.raise_for_status()
            books = response.json()
            
            if not books:
                return "Inventory is empty."
            
            return "\n".join([
                f"ID: {b['id']} | Title: {b['title']} | Author: {b['author']} | Price: ${b['price']} | Stock: {b['stock']}"
                for b in books
            ])
        except Exception as e:
            return f"Error fetching inventory: {str(e)}"


async def place_order_tool(book_id: str, quantity: int = 1) -> str:
    """Place an order for a book"""
    async with httpx.AsyncClient() as client:
        try:
            payload = {"book_id": book_id, "quantity": quantity, "ordered_by": 'agent'}
            response = await client.post(f"{BOOKING_API_URL}/orders", json=payload, timeout=5.0)
            
            if response.status_code == 201:
                order = response.json()  # API returns the order object directly (no wrapper)
                return f"Order placed successfully! Order ID: #{order['order_id']}. You ordered {quantity} copy/copies of '{order['book_title']}' for ${order['total_price']}."
            else:
                try:
                    error_msg = response.json().get('error', 'Unknown error')
                except:
                    error_msg = response.text
                return f"Failed to place order: {error_msg}"
        except Exception as e:
            return f"Error placing order: {str(e)}"


async def check_order_status_tool(order_id: int) -> str:
    """Check the status of an order"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{BOOKING_API_URL}/orders", timeout=5.0)
            response.raise_for_status()
            orders = response.json()
            
            order = next((o for o in orders if int(o["order_id"]) == int(order_id)), None)
            
            if not order:
                return f"Order #{order_id} not found."
            
            return f"Order #{order_id}: {order['quantity']} x '{order['book_title']}' - Total: ${order['total_price']} (Status: {order['status']})"
        except Exception as e:
            return f"Error checking order status: {str(e)}"


# Tool definitions for Azure OpenAI
BOOKSTORE_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_books",
            "description": "Search for books by title or author",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The search query string"
                    }
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "view_inventory",
            "description": "View the full inventory of books with stock details",
            "parameters": {
                "type": "object",
                "properties": {}
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "place_order",
            "description": "Place an order for a book",
            "parameters": {
                "type": "object",
                "properties": {
                    "book_id": {
                        "type": "string",
                        "description": "The ID of the book to order"
                    },
                    "quantity": {
                        "type": "integer",
                        "description": "The number of copies to order (default is 1)",
                        "default": 1
                    }
                },
                "required": ["book_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "check_order_status",
            "description": "Check the status of an order",
            "parameters": {
                "type": "object",
                "properties": {
                    "order_id": {
                        "type": "integer",
                        "description": "The ID of the order to check"
                    }
                },
                "required": ["order_id"]
            }
        }
    }
]


# -----------------------------
# Agent Session with Azure OpenAI
# -----------------------------
class AgentSession:
    """Manages agent conversation with Azure OpenAI"""
    
    def __init__(self, api_key: str, session_id: str):
        self.client = AzureOpenAI(
            api_version=AZURE_API_VERSION,
            azure_endpoint=AZURE_ENDPOINT,
            api_key=api_key,
        )
        self.session_id = session_id
        self.conversation_history: List[Dict] = []
        self.permissions: List[str] = []  # Agent permissions from VC
        self.user_id: Optional[str] = None  # Authenticated user ID
        self.user_did: Optional[str] = None  # Authenticated user DID
    
    async def get_llm_response(self, user_message=None, allow_tools=True):
        """Get response from Azure OpenAI, handling conversation history.
        When allow_tools=False (e.g. after a round of tool execution), force a final
        text-only response so we don't loop another tool_auth_request."""
        if user_message:
            self.conversation_history.append({
                "role": "user",
                "content": user_message
            })
        
        system_prompt = """You are BookOrderer, an AI agent that helps users order books from a bookstore.

You can:
- Search for books by title or author
- View the full inventory
- Place orders for books
- Check order status

Always confirm with the user before placing an order. Be friendly and helpful."""
        
        messages = [
            {"role": "system", "content": system_prompt},
            *self.conversation_history
        ]
        
        # Filter tools based on permissions (and whether we allow more tool calls this turn)
        if not allow_tools:
            allowed_tools = []
            tool_choice = "none"
        else:
            allowed_tools = [
                tool for tool in BOOKSTORE_TOOLS
                if tool["function"]["name"] in self.permissions
            ]
            if not self.permissions:
                allowed_tools = BOOKSTORE_TOOLS
            tool_choice = "auto" if allowed_tools else "none"
            
        print(f"[LLM] get_llm_response(allow_tools={allow_tools}) — tools={len(allowed_tools)}, tool_choice={tool_choice}")
        response = self.client.chat.completions.create(
            model=AZURE_DEPLOYMENT,
            messages=messages,
            tools=allowed_tools,
            tool_choice=tool_choice,
            max_completion_tokens=4096
        )
        
        msg = response.choices[0].message
        if not allow_tools and getattr(msg, "tool_calls", None):
            print(f"[LLM] API returned {len(msg.tool_calls)} tool_calls despite tool_choice=none (chat loop will break after one round)")
        return msg

    async def execute_tool(self, tool_name, tool_args, vp = None):
        """Verify VP (STRICTLY REQUIRED) and execute tool
        
        This method enforces that a Verifiable Presentation (VP) must be created
        and verified before ANY tool execution, including MCP server tools.
        
        Flow:
        1. Check VP is provided (created via /api/vps/create or /api/vps/agent/:agent_did)
        2. Verify VP via helixid-backend (/api/vps/verify)
        3. Execute tool only if VP is valid
        """
        
        print(f"\n{'='*60}")
        print(f"🔐 VP VERIFICATION REQUIRED FOR TOOL: {tool_name}")
        print(f"{'='*60}")
        
        # 1. STRICT VP REQUIREMENT CHECK
        if not vp:
            error_msg = (
                f"❌ Authorization failed: Verifiable Presentation is REQUIRED to execute '{tool_name}'. "
                f"Please ensure /api/vps/create or /api/vps/agent/:agent_did is called before tool execution."
            )
            print(error_msg)
            return error_msg

        print(f"✓ VP provided for tool '{tool_name}'")
        
        # 2. VERIFY VP VIA HELIXID-BACKEND
        # Map tool to required VC type
        tool_type_map = {
            "search_books": "BookOrderingCredential",
            "view_inventory": "BookOrderingCredential",
            "place_order": "BookOrderingCredential",
            "check_order_status": "BookOrderingCredential"
        }
        required_type = tool_type_map.get(tool_name)
        print(f"📋 Required VC type: {required_type}")
        
        # Verify the VP via helixid-backend
        print(f"🔍 Verifying VP via /api/vps/verify...")
        verification = await verify_agent_vp(vp)
        
        if not verification.get("valid"):
            error_msg = (
                f"❌ VP verification failed for '{tool_name}': "
                f"{verification.get('error', 'Invalid VP')}. "
                f"Tool execution blocked."
            )
            print(error_msg)
            print(f"{'='*60}\n")
            return error_msg
        
        print(f"✅ VP verified successfully!")
        print(f"{'='*60}\n")
        
        # NEW: Log tool execution to helixid-backend
        # await log_agent_activity(
        #     type="AGENT_TOOL_CALL",
        #     description=f"Agent '{AGENT_NAME}' executing tool '{tool_name}'",
        #     metadata={
        #         "tool": tool_name,
        #         "arguments": tool_args,
        #         "session_id": self.session_id
        #     }
        # )
        
        # 3. EXECUTE THE ACTUAL TOOL (only after VP verification succeeds)
        print(f"🚀 Executing tool '{tool_name}' with args: {tool_args}")
        
        if tool_name == "search_books":
            return await search_books_tool(tool_args["query"])
        elif tool_name == "view_inventory":
            return await view_inventory_tool()
        elif tool_name == "place_order":
            return await place_order_tool(
                tool_args["book_id"],
                tool_args.get("quantity", 1)
            )
        elif tool_name == "check_order_status":
            return await check_order_status_tool(tool_args["order_id"])
        else:
            return f"Unknown tool: {tool_name}"


# -----------------------------
# Session Management
# -----------------------------
sessions: Dict[str, AgentSession] = {}


# -----------------------------
# API Endpoints
# -----------------------------
@app.get("/")
async def root():
    return {
        "message": "BookOrderer AI Agent API (Azure OpenAI)",
        "status": "running",
        "version": "1.0.0",
        "bookstore_enabled": True
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}


# -----------------------------
# WebSocket Chat Endpoint
# -----------------------------
@app.websocket("/ws/chat/{session_id}")
async def websocket_chat(websocket: WebSocket, session_id: str):
    """WebSocket endpoint for real-time chat"""
    await websocket.accept()
    
    try:
        # Wait for initialization message
        init_msg = await websocket.receive_json()
        
        if init_msg.get("type") != "init":
            await websocket.send_json({
                "type": "error",
                "message": "First message must be of type 'init'"
            })
            await websocket.close()
            return
        
        # Extract authentication data
        user_did = init_msg.get("user_did")
        challenge = init_msg.get("challenge")
        signature = init_msg.get("signature")
        public_key_override = init_msg.get("public_key")  # Optional: for testing
        agent_vp = init_msg.get("agent_vp")
        
        # Verify user authentication (REAL signature verification)
        if user_did and challenge and signature:
            # If public_key is provided in init message, use it (for testing)
            # Otherwise, verify_user_signature will fetch from database
            if public_key_override:
                user_auth = await verify_user_signature_with_key(user_did, challenge, signature, public_key_override)
            else:
                user_auth = await verify_user_signature(user_did, challenge, signature)
            
            if not user_auth["valid"]:
                await websocket.send_json({
                    "type": "error",
                    "message": f"User authentication failed: {user_auth.get('error', 'Invalid signature')}"
                })
                await websocket.close()
                return
        else:
            # For now, allow without user auth (will be required in Phase 4)
            user_auth = {"valid": False, "user_did": None, "user_id": None}
        
        # Verify agent VP (if provided)
        agent_permissions = ["search_books", "place_order", "view_inventory", "check_order_status"]  # Default
        if agent_vp:
            vp_result = await verify_agent_vp(agent_vp)
            if not vp_result["valid"]:
                await websocket.send_json({
                    "type": "error",
                    "message": f"Agent VP verification failed: {vp_result.get('error', 'Invalid VP')}"
                })
                await websocket.close()
                return
            agent_permissions = vp_result.get("permissions", agent_permissions)
        
        # Use hardcoded Azure API key
        api_key = AZURE_API_KEY
        print(f"Session {session_id}: User {user_auth.get('user_did', 'anonymous')} authenticated")
        
        # Create agent session
        try:
            agent = AgentSession(api_key, session_id)
            agent.permissions = agent_permissions
            agent.user_id = user_auth.get("user_id")
            agent.user_did = user_auth.get("user_did")
            sessions[session_id] = agent
            
            await websocket.send_json({
                "type": "status",
                "message": "Agent initialized successfully!"
            })
            
            # Send connected message with tools
            connected_message = {
                "type": "connected",
                "message": "Connected to bookstore!",
                "user": user_auth.get("user_did", "anonymous"),
                "agent_did": AGENT_DID,
                "agent_permissions": agent_permissions,
                "agent_key":"1234",
                "tools": [
                    {"name": "search_books", "description": "Search for books by title or author"},
                    {"name": "view_inventory", "description": "View full inventory"},
                    {"name": "place_order", "description": "Place an order for a book"},
                    {"name": "check_order_status", "description": "Check order status"}
                ]
            }
            
            print(f"\n📤 Sending 'connected' message to frontend:")
            print(f"   agent_did: {AGENT_DID}")
            print(f"   Full message: {connected_message}\n")
            
            await websocket.send_json(connected_message)
            
        except Exception as e:
            await websocket.send_json({
                "type": "error",
                "message": f"Failed to initialize agent: {str(e)}"
            })
            await websocket.close()
            return
        
        # Chat loop
        while True:
            data = await websocket.receive_json()
            
            if data.get("type") == "message":
                user_message = data.get("content")
                if not user_message: continue
                
                await websocket.send_json({"type": "typing", "message": "Agent is thinking..."})
                
                try:
                    # Loop until we have a final text response (handle multiple rounds of tool calls if needed)
                    print(f"\n[CHAT] User message received (len={len(user_message or '')})")
                    current_message = await agent.get_llm_response(user_message)
                    tool_round = 0
                    while current_message.tool_calls:
                        tool_round += 1
                        print(f"\n[CHAT] Tool round #{tool_round} — LLM requested {len(current_message.tool_calls)} tool(s): {[tc.function.name for tc in current_message.tool_calls]}")
                        # 1. Request Authorization/VP for ALL tool calls in this turn
                        tool_auth_requests = []
                        tool_type_map = {
                            "search_books": "BookOrderingCredential",
                            "view_inventory": "BookOrderingCredential",
                            "place_order": "BookOrderingCredential",
                            "check_order_status": "BookOrderingCredential"
                        }
                        
                        for tc in current_message.tool_calls:
                            tool_auth_requests.append({
                                "id": tc.id,
                                "tool": tc.function.name,
                                "params": json.loads(tc.function.arguments),
                                "required_vc_type": tool_type_map.get(tc.function.name, "AgentPermissionCredential")
                            })
                        
                        print(f"[CHAT] Sending tool_auth_request to frontend ({len(tool_auth_requests)} requests)")
                        await websocket.send_json({
                            "type": "tool_auth_request",
                            "requests": tool_auth_requests
                        })
                        
                        # 2. Wait for UI to respond with VPs
                        print(f"[CHAT] Waiting for tool_auth_response from frontend...")
                        auth_response = await websocket.receive_json()
                        if auth_response.get("type") != "tool_auth_response":
                            raise Exception("Expected tool_auth_response from UI")
                        
                        vps = auth_response.get("vps", {}) # id -> vp mapping
                        print(f"[CHAT] Received tool_auth_response — VPs count: {len(vps)}")
                        
                        # 3. Execute tools with VPs
                        self_message_entry = {
                            "role": "assistant",
                            "content": None,
                            "tool_calls": current_message.tool_calls
                        }
                        agent.conversation_history.append(self_message_entry)
                        
                        tool_calls_info = []
                        for tc in current_message.tool_calls:
                            tool_name = tc.function.name
                            tool_args = json.loads(tc.function.arguments)
                            vp = vps.get(tc.id)
                            
                            result = await agent.execute_tool(tool_name, tool_args, vp)
                            
                            agent.conversation_history.append({
                                "role": "tool",
                                "tool_call_id": tc.id,
                                "content": result
                            })
                            
                            tool_calls_info.append({
                                "tool": tool_name,
                                "params": tool_args,
                                "result": result[:300]
                            })
                        
                        # 4. Get next response from LLM — force text-only so we don't loop another auth round
                        print(f"[CHAT] Tool execution done. Getting final LLM response (allow_tools=False)...")
                        current_message = await agent.get_llm_response(allow_tools=False)
                        # Force single tool round: exit so we never send a second tool_auth_request
                        if getattr(current_message, "tool_calls", None):
                            print(f"[CHAT] WARN: LLM still returned {len(current_message.tool_calls)} tool_calls — single round only, exiting loop")
                        break
                    
                    # Final text response
                    final_content = current_message.content or "Done."
                    print(f"[CHAT] Sending final response to frontend (content len={len(final_content)})")
                    agent.conversation_history.append({
                        "role": "assistant",
                        "content": final_content
                    })
                    
                    await websocket.send_json({
                        "type": "response",
                        "content": final_content,
                        "tool_calls": [] # We don't need to send tool_calls info here as UI already has it from the interactive flow
                    })
                    
                except Exception as e:
                    print(f"Error in chat loop: {e}")
                    try:
                        await websocket.send_json({"type": "error", "message": f"Error: {str(e)}"})
                    except Exception:
                        print("Could not send error to client (connection may be closed)")
    
    except WebSocketDisconnect:
        if session_id in sessions:
            del sessions[session_id]
        print(f"Client {session_id} disconnected (normal)")
    
    except Exception as e:
        print(f"WebSocket error: {e}")
        import traceback
        traceback.print_exc()
        try:
            await websocket.send_json({
                "type": "error",
                "message": f"Unexpected error: {str(e)}"
            })
        except Exception:
            print("Could not send error to client (connection may be closed)")
        finally:
            if session_id in sessions:
                del sessions[session_id]


# -----------------------------
# Run Server
# -----------------------------
if __name__ == "__main__":
    import signal
    import uvicorn

    def _exit_gracefully(*_):
        print("\nShutting down gracefully...")
        sys.exit(0)

    signal.signal(signal.SIGINT, _exit_gracefully)
    if hasattr(signal, "SIGTERM"):
        signal.signal(signal.SIGTERM, _exit_gracefully)

    print("=" * 60)
    print("📚 BookOrderer AI Agent - Backend Server")
    print("=" * 60)
    print(f"Azure OpenAI Endpoint: {AZURE_ENDPOINT}")
    print(f"Deployment: {AZURE_DEPLOYMENT}")
    print(f"Bookstore API: {BOOKING_API_URL}")
    print("=" * 60)
    try:
        uvicorn.run(app, host="0.0.0.0", port=8000)
    except KeyboardInterrupt:
        print("\nShutting down gracefully...")
        sys.exit(0)