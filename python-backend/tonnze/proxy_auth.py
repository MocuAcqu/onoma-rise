"""Shared-token guard for recognition APIs exposed through the Node gateway."""
from __future__ import annotations

import hmac

from starlette.responses import JSONResponse


PUBLIC_PATHS = {"/api/health/recognition"}


def valid_proxy_token(expected: str, provided: str | None) -> bool:
    """Allow local development when no token is configured; compare safely otherwise."""
    return not expected or (
        provided is not None and hmac.compare_digest(expected, provided)
    )


class ProxyTokenMiddleware:
    def __init__(self, app, token: str):
        self.app = app
        self.token = token

    async def __call__(self, scope, receive, send):
        path = scope.get("path", "")
        protected = scope.get("type") == "http" and path.startswith("/api/")
        if protected and path not in PUBLIC_PATHS:
            headers = dict(scope.get("headers", []))
            provided = headers.get(b"x-recognition-token")
            value = provided.decode("utf-8", errors="replace") if provided else None
            if not valid_proxy_token(self.token, value):
                response = JSONResponse(
                    {"detail": "辨識服務拒絕未授權的請求。"}, status_code=403
                )
                await response(scope, receive, send)
                return
        await self.app(scope, receive, send)
