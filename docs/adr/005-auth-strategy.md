# ADR-005: JWT Authentication Strategy

## Status
**Accepted** — July 2026

## Context
The application requires user authentication for all API endpoints. We needed to choose between session-based auth, OAuth2 with third-party providers, and token-based auth.

## Decision
Use **JWT (JSON Web Tokens)** issued by the backend upon successful login, verified on each request via a FastAPI dependency.

### Flow
1. User submits credentials to `POST /api/v1/auth/login`
2. Backend verifies against stored credentials (hashed with bcrypt)
3. On success, backend issues a signed JWT with user ID, email, role, and expiry
4. Frontend stores the token in memory (not localStorage for XSS protection)
5. All subsequent API requests include `Authorization: Bearer <token>` header
6. FastAPI `get_current_user` dependency decodes and validates the token on every protected route

### Token Configuration
- Algorithm: HS256
- Expiry: 24 hours (configurable via `ACCESS_TOKEN_EXPIRE_MINUTES`)
- Payload: `sub` (user ID), `email`, `role`, `exp`

## Consequences
- **Positive**: Stateless — no server-side session storage; works seamlessly with horizontal scaling; easy to integrate with frontend SPA
- **Negative**: Tokens cannot be revoked before expiry without a blocklist; token refresh flow adds complexity; secret key rotation requires coordinated deployment
