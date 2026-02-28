# HelixID – Digital Passport for AI Agents
 
HelixID is a decentralized identity and verification layer designed specifically for autonomous AI agents.  
It acts as a **Digital Passport for AI Agents**, replacing API keys and shared credentials with **Verifiable Credentials (VCs)** and cryptographic proof of delegated authority.
 
This hackathon repository demonstrates how AI agents can securely act on behalf of users using portable, verifiable identity — instead of blind trust.
 
---
 
## 🚀 High-Level Idea
 
AI agents are increasingly performing real-world actions like placing orders, accessing APIs, and executing workflows.  
However, most systems still authenticate them using API keys or tokens, which:
 
- Do not prove the agent’s identity  
- Do not verify delegated authority  
- Do not provide strong attribution  
- Cannot scale across ecosystems safely  
 
HelixID introduces:
 
- 🆔 Unique cryptographic identity for each agent  
- 📜 Verifiable Credentials for identity & delegated authority  
- 🔍 Independent verification before every action  
- 🧾 Auditable, accountable autonomous operations  
 
This repo demonstrates this concept using a **Book Store + Booking AI Agent** example.
 
---
 
## 🧩 What This Repository Contains
 
### 1️⃣ Book Store App
 
A sample bookstore application that:
 
- Exposes APIs for browsing and ordering books  
- Runs an **MCP (Model Context Protocol) server**  
- Requires agents to present valid Verifiable Credentials before placing orders  
- Verifies:
  - Agent identity  
  - Delegated authority  
  - Credential validity  
 
This simulates a merchant platform that does not rely on API keys but on verifiable agent identity.
 
---
 
### 2️⃣ Booking AI Agent
 
An autonomous AI agent that:
 
- Is onboarded through HelixID  
- Receives:
  - Identity Credential  
  - Delegated Authority Credential  
- Interacts with the Book Store via MCP  
- Presents Verifiable Proof before ordering a book  
- Executes the purchase only if verification succeeds  
 
This demonstrates secure autonomous commerce.
 
---
 
### 3️⃣ HelixID App (Identity & Credential Layer)
 
The `helixID/` folder contains the core identity infrastructure.
 
HelixID is built on top of **Hedera Hashgraph DLT (Distributed Ledger Technology)** to provide:
 
- Ledger-anchored Decentralized Identifiers (DIDs)  
- Tamper-proof credential verification  
- Immutable audit trails  
- Revocation and trust validation  
 
It includes:
 
- Agent onboarding logic  
- DID creation  
- Issuance of:
  - Agent Identity VC  
  - Delegated Authority VC  
- Credential verification components  
- Revocation / authority validation logic  
 
This acts as the **Trust Layer** for the ecosystem.
 
---
 
## 🔄 How the Flow Works
 
1. Agent is created and onboarded in HelixID  
2. HelixID issues:
   - Identity Credential  
   - Delegation Credential  
3. Agent connects to Book Store MCP server  
4. Agent presents Verifiable Credentials  
5. Book Store verifies:
   - Identity authenticity  
   - Authority scope  
   - Credential validity  
6. If valid → Order is processed  
7. Action is logged for accountability  
 
---
 
## 🔐 What This Demonstrates
 
- No API keys  
- No shared secrets  
- No blind trust  
- Cryptographic proof before action  
- Clear attribution of autonomous decisions  
 
This is a practical example of how a Digital Passport for AI Agents can enable safe, scalable agentic commerce.
 
---
 
## 🌍 Vision
 
HelixID enables:
 
- Checkoutless commerce  
- Personal AI workforce  
- Cross-platform autonomous agents  
- Enterprise-grade AI accountability  
 
As AI agents become decision-makers, they need identity systems built for autonomy — not humans.
 
HelixID provides that foundation.
