## Context

`workshop-edge` already has `scripts/smoke-auth-flow.ts`, invoked by `deploy.yml` after Terraform apply. The current script posts `SMOKE_CPF` to `/auth/login`, asserts that a Bearer JWT is returned, and optionally calls one protected path (default `/api/work-orders`) with the returned `Authorization` header. Phase 4 routing added `/os/{proxy+}`, `/billing/{proxy+}`, and `/execution/{proxy+}` as HTTP_PROXY integrations, but the edge repository does not own downstream service URLs or stable live health endpoints.

## Goals / Non-Goals

**Goals:**
- Reuse `/auth/login` as the authentication source of truth for smoke validation.
- Allow environments to configure service smoke paths through GitHub Environment variables.
- Call configured service paths through the deployed edge URL with the same Bearer token.
- Fail the deployment smoke when any configured service path returns a non-2xx status.
- Avoid logging the CPF or token value.
- Preserve existing `/api/*` fallback smoke behavior and skip flag.

**Non-Goals:**
- Do not implement a Lambda authorizer or gateway-level JWT verification.
- Do not create or change Phase 4 service routes; that scope belongs to `f4-edge-service-routing`.
- Do not hardcode live OS/Billing/Execution service paths or base URLs.
- Do not change JWT claim semantics or downstream authorization rules.

## Design

The existing smoke script gains an optional `SMOKE_SERVICE_PATHS` input. It accepts either:

1. a JSON string array such as `["/os/work-orders","/billing/invoices"]`; or
2. a comma-separated list such as `/os/work-orders,/billing/invoices`.

Empty or unset values mean no service-route smoke calls are attempted. Each non-empty path is normalized to a leading slash and requested relative to `EDGE_BASE_URL` with `Authorization: Bearer <token>`. The script reports only path and status information, never token or CPF values.

`SMOKE_PROTECTED_PATH` remains the single legacy app-fallback smoke path. `SMOKE_SKIP_APP_PROXY=true` still skips only that fallback check. It does not skip `SMOKE_SERVICE_PATHS`, because those service checks are intentionally explicit and empty by default.

## Risks / Trade-offs

- A configured service path may fail due to downstream service authorization or availability rather than edge routing. The evidence should make clear that this smoke proves end-to-end authenticated reachability for configured paths, not service business correctness.
- Leaving `SMOKE_SERVICE_PATHS` empty means the service-route portion is skipped. This is intentional until each environment has stable service endpoints/paths.
