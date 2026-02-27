"""
VP (Verifiable Presentation) verification.

Delegates to the Helix-ID app backend. This module is intentionally fail-closed:
if the verification service is unreachable or returns an error, the VP is treated
as invalid and the tool call is blocked.
"""

import httpx

from config import HELIX_ID_BACKEND_URL

# Endpoint on the Helix-ID backend that verifies a VP token
_VERIFY_ENDPOINT = f"{HELIX_ID_BACKEND_URL}/api/vps/verify"


async def verify_vp(vp_token: str) -> tuple[bool, str]:
    """
    Verify a Verifiable Presentation token against the Helix-ID backend.

    Args:
        vp_token: The raw VP token (JWT or JSON-LD string) to verify.

    Returns:
        A tuple of (is_valid, reason).
        - is_valid: True only if the backend confirms the VP is valid.
        - reason: Human-readable explanation; empty string on success.

    The function is fail-closed: any error (network, timeout, unexpected
    response) returns (False, <reason>) — never (True, ...).
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                _VERIFY_ENDPOINT,
                json={"vp_token": vp_token},
            )

        if response.status_code == 200:
            data = response.json()
            verified: bool = data.get("verified", False)
            reason: str = data.get("reason", "")
            return verified, reason

        # Non-200 responses from the backend count as verification failure
        return False, f"VP verification failed with HTTP {response.status_code}"

    except httpx.ConnectError:
        return False, "VP verification service unavailable (connection refused)"
    except httpx.TimeoutException:
        return False, "VP verification service timed out"
    except Exception as exc:  # noqa: BLE001
        return False, f"VP verification error: {exc}"
