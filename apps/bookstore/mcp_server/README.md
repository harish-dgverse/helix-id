# Bookstore MCP Server

The MCP server for the bookstore. It exposes bookstore operations as MCP tools that `agent-backend` can call. **Every tool call is gated behind VP (Verifiable Presentation) verification**, which is delegated to the Helix-ID app backend.

## Architecture

```
agent-backend  ──(tool call + VP)──►  bookstore MCP server  ──(verify VP)──►  helix-id-app
                                               │
                                               ▼
                                       bookstore Next.js API
                                       (/api/books, /api/orders)
```

**Transport**: SSE over HTTP — `http://localhost:8001/sse`

## Tools

| Tool | Description |
|---|---|
| `list_books` | List all books with stock levels |
| `get_orders` | Get all orders |
| `place_order` | Place a new order (deducts stock) |

All tools take a mandatory `vp_token: str` argument. The server verifies it before executing.

## Configuration

All config is in `config.py`, loaded from environment variables.

| Variable | Default | Description |
|---|---|---|
| `BOOKSTORE_API_BASE_URL` | `http://localhost:3000` | Bookstore Next.js app URL |
| `HELIX_ID_BACKEND_URL` | `http://localhost:4000` | Helix-ID VP verification URL |
| `MCP_SERVER_HOST` | `0.0.0.0` | Host to bind |
| `MCP_SERVER_PORT` | `8001` | Port to listen on |

## Setup

```bash
cd apps/bookstore/mcp_server

# 1. Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# Edit .env as needed

# 4. Run the server
python server.py
# MCP server is now running at http://localhost:8001/sse
```

## Running via pnpm (from apps/bookstore/)

The bookstore's `package.json` `dev` script starts both Next.js and the MCP server together:

```bash
# First-time setup (only needed once):
cd apps/bookstore/mcp_server
python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt
cp .env.example .env

# Then from apps/bookstore/:
pnpm dev
```

## Testing with MCP Inspector

```bash
npx @modelcontextprotocol/inspector http://localhost:8001/sse
```

## VP Verification

The `vp_verifier.py` module calls `POST {HELIX_ID_BACKEND_URL}/api/vp/verify` with the VP token. The response is expected to be:

```json
{ "verified": true, "reason": "" }
```

If the Helix-ID backend is not yet running, tool calls will return:
```
Unauthorized — VP verification failed: VP verification service unavailable (connection refused)
```
This is **intentional** — the server is fail-closed.
