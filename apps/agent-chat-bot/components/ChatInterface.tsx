'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Terminal, User, Bot, AlertCircle, Loader2, Shield } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';

interface ConfirmationModalProps {
  isOpen: boolean;
  tool: string;
  params: Record<string, unknown>;
  onConfirm: () => void;
  onCancel: () => void;
}

interface ToolCall {
  tool: string;
  params: Record<string, unknown>;
  result?: string;
}

interface Message {
  role: 'user' | 'agent' | 'system';
  content: string;
  toolCalls?: ToolCall[];
}

interface AuthState {
  userDid: string;
  publicKey: string;
  privateKey: string; // For demo - in production, use wallet
  authenticated: boolean;
}

interface ToolAuthRequest {
  id: string;
  tool: string;
  params: Record<string, unknown>;
  required_vc_type: string;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [typing, setTyping] = useState(false);
  const [status, setStatus] = useState('Not connected');
  const [connected, setConnected] = useState(false);
  const [agentKey, setAgentKey] = useState('');

  const [authState, setAuthState] = useState<AuthState>({
    userDid: 'did:hedera:testnet:3gWoENfxywCDMLSEPmrSf5fzE1jkonNjdPpM8Yq8SwaN_0.0.7532608',
    publicKey: '302a300506032b657003210027d6b791faf45707d627b0601ebf99f0aa414beb2b3a1a1f342789751e8601bf',
    privateKey: '302e020100300506032b65700422042069c3c5665c0abe98dff9c0de17112b397b275087da6cbc649b9a7b0f33730f5a',
    authenticated: false
  });

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [currentToolRequests, setCurrentToolRequests] = useState<ToolAuthRequest[]>([]);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [agentDid, setAgentDid] = useState<string>('');
  // Show authorize modal once per page load when place_order is first requested
  const [hasAuthorizedBooking, setHasAuthorizedBooking] = useState(false);

  const ws = useRef<WebSocket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef('');
  const agentDidRef = useRef<string>(''); // Use ref for immediate access, avoiding React state timing issues

  useEffect(() => {
    sessionId.current = Math.random().toString(36).substring(7);
    // Auto-connect on mount — no need for manual auth screen
    setTimeout(() => connectWithAuth(), 0);
  }, []);
  const hasConnected = useRef(false);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typing]);

  const generateSignature = async (message: string, privateKeyString: string): Promise<string> => {
    try {
      // Import Hedera SDK dynamically (client-side only)
      const { PrivateKey } = await import('@hashgraph/sdk');

      // Parse DER-encoded private key
      const privateKey = PrivateKey.fromStringDer(privateKeyString);

      // Sign the message
      const messageBytes = new TextEncoder().encode(message);
      const signature = privateKey.sign(messageBytes);

      // Return signature as hex string
      return Buffer.from(signature).toString('hex');
    } catch (error) {
      console.error('Signature generation error:', error);
      throw new Error(`Failed to generate signature: ${error}`);
    }
  };

  const extractPublicKeyFromDer = (publicKeyString: string): string => {
    try {
      // DER format for Ed25519: 302a300506032b657003210 + [32 bytes public key]
      // Extract the last 32 bytes (64 hex chars)
      const cleanHex = publicKeyString.replace(/^0x/, '');
      // The public key is the last 64 hex characters (32 bytes)
      const rawPublicKey = cleanHex.slice(-64);
      return rawPublicKey;
    } catch (error) {
      console.error('Public key extraction error:', error);
      return publicKeyString; // Return as-is if extraction fails
    }
  };

  const connectWithAuth = async () => {
    if (!authState.userDid || !authState.publicKey || !authState.privateKey) {
      alert('Please enter your DID, public key, and private key');
      return;
    }

    setStatus('Generating signature...');

    try {
      // Generate challenge
      const challenge = `Sign this message to authenticate with HelixID\nDID: ${authState.userDid}\nTimestamp: ${Date.now()}`;

      // Generate REAL signature using Hedera SDK
      const signature = await generateSignature(challenge, authState.privateKey);

      // Extract raw public key from DER format
      const rawPublicKey = extractPublicKeyFromDer(authState.publicKey);

      setStatus('Connecting...');

      // Use 127.0.0.1 to avoid IPv6 issues with localhost
      ws.current = new WebSocket(`ws://127.0.0.1:8000/ws/chat/${sessionId.current}`);

      ws.current.onopen = () => {
        // Send initialization with auth data
        ws.current?.send(JSON.stringify({
          type: 'init',
          api_key: '',
          user_did: authState.userDid,
          challenge: challenge,
          signature: signature,
          public_key: rawPublicKey, // Send raw public key
          agent_vp: null // Optional: can add agent VP here
        }));
      };

      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setAgentKey(data.agent_key);

        if (data.type === 'status') {
          setStatus(data.message);
        } else if (data.type === 'connected') {
          console.log('📡 Received "connected" message from backend:', data);
          console.log('   agent_did in message:', data.agent_did);
          console.log('   agent_did type:', typeof data.agent_did);

          setConnected(true);
          setStatus('Connected');
          setAuthState(prev => ({ ...prev, authenticated: true }));

          const receivedAgentDid = data.agent_did || '';
          console.log('   Setting agentDid to:', receivedAgentDid);

          // CRITICAL: Set both ref (for immediate access) and state (for UI)
          agentDidRef.current = receivedAgentDid;
          setAgentDid(receivedAgentDid);

          console.log('   ✅ agentDidRef.current set to:', agentDidRef.current);

          setMessages([{
            role: 'system',
            content: `🛠️ Available tools: ${data.tools.map((t: any) => t.name).join(', ')}`
          }]);
        } else if (data.type === 'tool_auth_request') {
          const reqs = data.requests as ToolAuthRequest[];
          console.log('[FRONT] Received tool_auth_request:', reqs.length, 'tool(s):', reqs.map((r: ToolAuthRequest) => r.tool));
          handleToolAuthRequest(reqs);
        } else if (data.type === 'typing') {
          setTyping(true);
        } else if (data.type === 'response') {
          setTyping(false);
          console.log('[FRONT] Received final response from backend (conversation turn done)');

          const newMessage: Message = {
            role: 'agent',
            content: data.content,
            toolCalls: data.tool_calls
          };

          setMessages(prev => [...prev, newMessage]);
        } else if (data.type === 'error') {
          console.log('[FRONT] Received error from backend:', data.message);
          setTyping(false);
          setMessages(prev => [...prev, {
            role: 'system',
            content: `❌ Error: ${data.message}`
          }]);

          if (data.message.includes('authentication failed') || data.message.includes('verification failed')) {
            setStatus('Authentication failed');
            setConnected(false);
          }
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setStatus('Connection error. Check backend console.');
      };

      ws.current.onclose = () => {
        setConnected(false);
        setStatus('Disconnected');
        hasConnected.current = false;
      };

    } catch (e) {
      console.error("Connection creation failed:", e);
      setStatus(`Failed: ${e}`);
    }
  };

  const handleToolAuthRequest = async (requests: ToolAuthRequest[]) => {
    // Check if any request needs explicit user confirmation
    // Only require confirmation for place_order, and only once
    const hasPlaceOrder = requests.some(req => req.tool === 'place_order');
    const needsConfirmation = hasPlaceOrder && !hasAuthorizedBooking;
    console.log('[FRONT] handleToolAuthRequest — tools:', requests.map(r => r.tool), 'hasPlaceOrder:', hasPlaceOrder, 'hasAuthorizedBooking:', hasAuthorizedBooking, '=> showModal:', needsConfirmation);

    // Map tool to required VC type
    const tool_type_map: Record<string, string> = {
      "search_books": "BookOrderingCredential",
      "view_inventory": "BookOrderingCredential",
      "place_order": "BookOrderingCredential",
      "check_order_status": "BookOrderingCredential"
    };

    const updatedRequests = requests.map(req => ({
      ...req,
      required_vc_type: tool_type_map[req.tool] || "BookOrderingCredential"
    }));

    setCurrentToolRequests(updatedRequests);

    if (needsConfirmation) {
      console.log('[FRONT] Showing authorize modal (place_order, first time)');
      setTyping(false);
      setShowConfirmation(true);
    } else {
      console.log('[FRONT] Auto-authorizing (no modal) — calling authorizeTools');
      // Auto-authorize background tools (search, inventory, etc.)
      authorizeTools(updatedRequests);
    }
  };

  const authorizeTools = async (requests: ToolAuthRequest[]) => {
    setIsAuthorizing(true);
    setShowConfirmation(false);

    // Use ref to get the current agent DID (avoids React state timing issues)
    const currentAgentDid = agentDidRef.current;

    console.log('\n' + '='.repeat(60));
    console.log('🔐 VP CREATION FLOW STARTED');
    console.log('='.repeat(60));
    console.log(`📋 Number of tools requiring authorization: ${requests.length}`);
    console.log(`🤖 Agent DID (from ref): ${currentAgentDid}`);
    console.log(`🤖 Agent DID (from state): ${agentDid}`);

    // CRITICAL: Validate agent DID is available
    if (!currentAgentDid || currentAgentDid.trim() === '') {
      const errorMsg = 'Agent DID is not available. Cannot create VP without agent DID.';
      console.error('\n' + '='.repeat(60));
      console.error('❌ VP CREATION FAILED - MISSING AGENT DID');
      console.error('='.repeat(60));
      console.error(`Agent DID (ref): "${currentAgentDid}"`);
      console.error(`Agent DID (state): "${agentDid}"`);
      console.error('This should have been set from the backend "connected" message.');
      console.error('='.repeat(60) + '\n');

      setMessages(prev => [...prev, {
        role: 'system',
        content: `❌ Authorization failed: ${errorMsg}\n\n` +
          `The agent DID was not received from the backend. ` +
          `Please check that the backend is sending the agent_did in the "connected" message.`
      }]);
      setStatus('Auth failed: Missing agent DID');
      ws.current?.send(JSON.stringify({ type: 'tool_auth_response', vps: {} }));
      setIsAuthorizing(false);
      return;
    }

    const vps: Record<string, any> = {};

    try {
      for (const req of requests) {
        console.log(`\n🔧 Processing tool: ${req.tool}`);
        console.log(`   Required VC type: ${req.required_vc_type}`);
        console.log(`   Request ID: ${req.id}`);

        setStatus(`Generating VP for ${req.tool}...`);

        // Call helixid-backend to generate VP for the required type
        // const encodedAgentDid = encodeURIComponent(currentAgentDid);
        const externalurl = window.location.host
        const vpApiUrl = `http://localhost:3005/api/vps/agent?challenge=auth_${req.id}&type=${req.required_vc_type}&external_url=${externalurl}&agentkey=1234`;

        console.log(`   📡 Calling VP creation API:`);
        console.log(`      Full URL: ${vpApiUrl}`);
        console.log(`      Agent DID: ${currentAgentDid}`);
        console.log(`   🎯 Challenge: auth_${req.id}`);

        const response = await fetch(vpApiUrl);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`   ❌ VP creation failed: ${response.status} ${response.statusText}`);
          console.error(`   Error details: ${errorText}`);
          throw new Error(`Failed to generate VP for ${req.tool}: ${response.statusText}`);
        }

        const data = await response.json();
        vps[req.id] = data.vp;

        console.log(`   ✅ VP created successfully for ${req.tool}`);
        console.log(`   VP holder: ${data.vp?.holder?.slice(0, 30)}...`);
      }

      console.log('\n' + '='.repeat(60));
      console.log(`✅ ALL VPs CREATED SUCCESSFULLY (${requests.length} total)`);
      console.log('📤 Sending VPs to agent backend for verification...');
      console.log('='.repeat(60) + '\n');

      // Send VPs back to agent
      ws.current?.send(JSON.stringify({
        type: 'tool_auth_response',
        vps: vps
      }));

      if (requests.some(req => req.tool === 'place_order')) {
        setHasAuthorizedBooking(true);
        console.log('[FRONT] Set hasAuthorizedBooking=true (place_order authorized this session)');
      }
      setStatus('Authorized');
      console.log('[FRONT] tool_auth_response sent to backend —', Object.keys(vps).length, 'VP(s)');

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      console.error('\n' + '='.repeat(60));
      console.error('❌ VP CREATION FAILED');
      console.error('='.repeat(60));
      console.error(`Error: ${errorMessage}`);
      console.error('🚫 Tool execution will be blocked');
      console.error('='.repeat(60) + '\n');

      setMessages(prev => [...prev, {
        role: 'system',
        content: `❌ Authorization failed: ${errorMessage}\n\n` +
          `VP creation is required before tool execution. ` +
          `Please ensure the agent has valid credentials.`
      }]);

      // Send empty VPs so backend does not hang waiting for tool_auth_response.
      // Backend will then fail with "VP required" and surface a clear error.
      ws.current?.send(JSON.stringify({ type: 'tool_auth_response', vps: {} }));
      setStatus(`Auth failed: ${errorMessage}`);
    } finally {
      setIsAuthorizing(false);
    }
  };

  const sendMessage = () => {
    if (!inputValue.trim() || !connected) return;

    const userMessage: Message = {
      role: 'user',
      content: inputValue
    };

    setMessages(prev => [...prev, userMessage]);

    ws.current?.send(JSON.stringify({
      type: 'message',
      content: inputValue
    }));

    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[80vh] w-full max-w-4xl bg-white dark:bg-zinc-900 rounded-[24px] shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmation}
        tool={currentToolRequests.length > 0 ? currentToolRequests[0].tool : ''}
        params={currentToolRequests.length > 0 ? currentToolRequests[0].params : {}}
        onConfirm={() => authorizeTools(currentToolRequests)}
        onCancel={() => {
          setShowConfirmation(false);
          setMessages(prev => [...prev, { role: 'system', content: '🚫 Action denied by user.' }]);
          ws.current?.send(JSON.stringify({ type: 'tool_auth_response', vps: {} }));
        }}
      />

      {/* Header */}
      <div className="bg-gradient-to-r from-[#667eea] to-[#764ba2] p-6 text-white shrink-0">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">BookGenie AI</h1>
            <p className="text-white/80 text-sm mt-1">
              Powered by Verifiable AI
              {authState.authenticated && ` • ${authState.userDid.slice(0, 20)}...`}
            </p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full backdrop-blur-sm text-xs font-medium ${status.includes('Error') || status.includes('Disconnected') ? 'bg-red-500/20 text-red-50' : 'bg-white/20 text-white'}`}>
            <div className={`w-2 h-2 rounded-full ${status === 'Connected' || status.includes('Connected') ? 'bg-green-400 animate-pulse' : 'bg-current'}`} />
            {status}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-zinc-50 dark:bg-zinc-950/50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm
                    ${msg.role === 'user' ? 'bg-[#764ba2] text-white' :
                  msg.role === 'agent' ? 'bg-white text-[#667eea] border border-zinc-200' : 'bg-transparent'}`}>
                {msg.role === 'user' && <User size={16} />}
                {msg.role === 'agent' && <Bot size={16} />}
                {msg.role === 'system' && <AlertCircle size={16} className="text-amber-500" />}
              </div>

              {/* Content */}
              <div className="flex flex-col gap-2">
                {msg.role === 'system' ? (
                  <div className="bg-amber-50 text-amber-800 px-4 py-2 rounded-xl text-sm border border-amber-100 mx-auto text-center whitespace-pre-line">
                    {msg.content}
                  </div>
                ) : (
                  <div className={`p-4 rounded-2xl shadow-sm leading-relaxed
                            ${msg.role === 'user'
                      ? 'bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white rounded-tr-none'
                      : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 rounded-tl-none border border-zinc-100 dark:border-zinc-700'}`}>
                    {msg.content}

                    {/* Render interactive choices if message looks like it has options */}
                    {msg.role === 'agent' && msg.content.includes(' - ') && (
                      <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-700 space-y-2">
                        <div className="text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">Quick Actions</div>
                        <div className="flex flex-wrap gap-2">
                          {msg.content.split(' - ').map((choice, idx) => {
                            // Extract the primary text (strip emojis if we want, but keeping them is fine)
                            const cleanChoice = choice.split('\n')[0].trim();
                            if (!cleanChoice) return null;

                            return (
                              <button
                                key={idx}
                                onClick={() => {
                                  const userResponse = cleanChoice.replace(/^[^\w\s]*\s*/, ''); // Strip leading emoji/symbol
                                  setInputValue(userResponse);
                                  // Auto-send could be an option here, but for now just fill input
                                  // or better, actually send it if we want it to feel like a "confirmation box"
                                }}
                                className="px-4 py-2 bg-zinc-50 dark:bg-zinc-700/50 hover:bg-[#667eea] hover:text-white border border-zinc-200 dark:border-zinc-600 rounded-xl text-sm transition-all shadow-sm flex items-center gap-2"
                              >
                                {cleanChoice}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Tool Calls */}
                {msg.toolCalls && msg.toolCalls.map((tool, i) => (
                  <div key={i} className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl overflow-hidden text-sm">
                    <div className="flex items-center gap-2 bg-blue-100/50 dark:bg-blue-800/30 px-3 py-2 text-blue-700 dark:text-blue-300 font-medium">
                      <Terminal size={14} />
                      <span>Used tool: {tool.tool}</span>
                    </div>
                    <div className="p-3 font-mono text-xs text-blue-800 dark:text-blue-200 overflow-x-auto">
                      <div className="opacity-70 mb-1">Input:</div>
                      <div className="bg-white/50 dark:bg-black/20 p-2 rounded mb-2">{JSON.stringify(tool.params)}</div>

                      {tool.result && (
                        <>
                          <div className="opacity-70 mb-1">Result:</div>
                          <div className="bg-white/50 dark:bg-black/20 p-2 rounded text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
                            {tool.result.length > 300 ? tool.result.substring(0, 300) + '...' : tool.result}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {typing && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-white text-[#667eea] border border-zinc-200 flex items-center justify-center shrink-0 shadow-sm">
              <Bot size={16} />
            </div>
            <div className="bg-white dark:bg-zinc-800 px-4 py-3 rounded-2xl rounded-tl-none border border-zinc-100 dark:border-zinc-700 shadow-sm flex items-center gap-1">
              <div className="w-2 h-2 bg-[#667eea] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-[#764ba2] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-[#667eea] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        {isAuthorizing && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0 shadow-sm">
              <Shield size={16} />
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-3 rounded-2xl rounded-tl-none border border-blue-100 dark:border-blue-800 shadow-sm flex items-center gap-3">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Generating Verifiable Presentation...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 shrink-0">
        <div className="flex gap-2 max-w-4xl mx-auto bg-zinc-50 dark:bg-zinc-800 p-2 rounded-[28px] border border-zinc-200 dark:border-zinc-700 focus-within:ring-2 focus-within:ring-[#667eea]/50 transition-all shadow-sm">
          <input
            type="text"
            placeholder="Ask me to find books, check inventory, or place orders..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={!connected}
            className="flex-1 bg-transparent px-4 py-3 outline-none min-w-0 text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={!connected || !inputValue.trim()}
            className="w-12 h-12 bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white rounded-full flex items-center justify-center hover:shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:hover:scale-100 disabled:cursor-not-allowed"
          >
            <Send size={20} className="ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
}