"""
Bookstore MCP Server.

Exposes bookstore operations as MCP tools that the agent-backend can call.
Every tool requires a valid Verifiable Presentation (VP) token, which is
verified against the Helix-ID backend before the tool executes.

Run:
    python server.py

The MCP server starts on SSE transport (default: http://0.0.0.0:8001/sse).
"""

import httpx
import uvicorn

from mcp.server.fastmcp import FastMCP

from config import BOOKSTORE_API_BASE_URL, MCP_SERVER_HOST, MCP_SERVER_PORT
from vp_verifier import verify_vp

# ---------------------------------------------------------------------------
# MCP server instance
# ---------------------------------------------------------------------------

mcp = FastMCP(
    name="Bookstore MCP Server",
    instructions=(
        "This server provides access to the bookstore. "
        "Every tool call requires a valid VP token for authorization. "
        "Pass the VP token you received from the Helix-ID wallet as the "
        "`vp_token` argument to each tool."
    ),
)


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------


async def _require_valid_vp(vp_token: str) -> None:
    """Raise ValueError if the VP token is invalid or verification fails."""
    is_valid, reason = await verify_vp(vp_token)
    if not is_valid:
        raise ValueError(f"Unauthorized — VP verification failed: {reason}")


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------


@mcp.tool()
async def list_books(vp_token: str) -> list[dict]:
    """
    List all books available in the bookstore with their current stock levels.

    Args:
        vp_token: Verifiable Presentation token for authorization.

    Returns:
        A list of book objects with id, title, author, price, and stock.
    """
    await _require_valid_vp(vp_token)

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(f"{BOOKSTORE_API_BASE_URL}/api/books")
        response.raise_for_status()
        return response.json()


@mcp.tool()
async def get_orders(vp_token: str) -> list[dict]:
    """
    Retrieve all orders that have been placed in the bookstore.

    Args:
        vp_token: Verifiable Presentation token for authorization.

    Returns:
        A list of order objects with order_id, book_title, quantity,
        total_price, status, and created_at.
    """
    await _require_valid_vp(vp_token)

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(f"{BOOKSTORE_API_BASE_URL}/api/orders")
        response.raise_for_status()
        return response.json()


@mcp.tool()
async def place_order(vp_token: str, book_title: str, quantity: int) -> dict:
    """
    Place a new order for a book in the bookstore.

    Deducts the ordered quantity from the book's stock. Fails if the book is
    not found or if there is insufficient stock.

    Args:
        vp_token: Verifiable Presentation token for authorization.
        book_title: The exact title of the book to order.
        quantity: Number of copies to order (must be >= 1).

    Returns:
        The newly created order object with order_id, book_title, quantity,
        total_price, status, and created_at.
    """
    await _require_valid_vp(vp_token)

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(
            f"{BOOKSTORE_API_BASE_URL}/api/orders",
            json={"book_title": book_title, "quantity": quantity},
        )
        response.raise_for_status()
        return response.json()


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    from starlette.middleware.cors import CORSMiddleware

    # For SSE transport, we run the Starlette app using uvicorn
    app = mcp.sse_app()

    # Add CORS middleware to allow the MCP Inspector to connect
    app = CORSMiddleware(
        app,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
    )

    uvicorn.run(
        app,
        host=MCP_SERVER_HOST,
        port=MCP_SERVER_PORT,
    )
