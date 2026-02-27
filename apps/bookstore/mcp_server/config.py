"""
Global configuration for the Bookstore MCP Server.

All external service URLs and server settings are loaded from environment
variables, following the 12-factor app principle. Copy .env.example to .env
and adjust values for your local environment.
"""

import os

from dotenv import load_dotenv

# Load .env from the mcp_server/ directory (where this file lives)
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

# ---------------------------------------------------------------------------
# External service URLs
# ---------------------------------------------------------------------------

# Base URL of the Bookstore Next.js app (exposes /api/books, /api/orders)
BOOKSTORE_API_BASE_URL: str = os.getenv(
    "BOOKSTORE_API_BASE_URL", "http://localhost:3000"
)

# Base URL of the Helix-ID app backend (exposes /api/vp/verify)
HELIX_ID_BACKEND_URL: str = os.getenv(
    "HELIX_ID_BACKEND_URL", "http://localhost:3005"
)

# ---------------------------------------------------------------------------
# MCP Server settings
# ---------------------------------------------------------------------------

MCP_SERVER_HOST: str = os.getenv("MCP_SERVER_HOST", "0.0.0.0")
MCP_SERVER_PORT: int = int(os.getenv("MCP_SERVER_PORT", "8001"))
