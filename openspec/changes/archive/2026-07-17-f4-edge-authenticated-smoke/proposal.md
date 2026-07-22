## Why

Phase 4 edge routing now exposes service-specific paths for Order Service (`/os/*`), Billing (`/billing/*`), and Execution (`/execution/*`). Deployment validation still only proves that `/auth/login` can issue a JWT and that the legacy `/api/*` fallback can be called with that token. The edge repository needs a documented, configurable authenticated smoke workflow that can validate the new service routes when environment-specific service paths are available, without hardcoding or inventing live service URLs.

## What Changes

- Extend the existing auth smoke workflow so it can call a configurable set of authenticated service paths after acquiring a Bearer token from `/auth/login`.
- Keep the existing `/api/*` protected-path smoke behavior as the default and preserve the explicit `SMOKE_SKIP_APP_PROXY=true` emergency override.
- Add a deployment variable pass-through for the service smoke path list.
- Document how staging/production operators configure service route smoke paths and what the workflow verifies.
- Add evidence for the implemented validation and command results.

## Capabilities

### Modified Capabilities
- `service-routing`: service routes have an authenticated smoke validation workflow that proves a login token is forwarded to configured Phase 4 route paths.

## Impact

- `scripts/smoke-auth-flow.ts`: configurable service path smoke calls after token issuance.
- `.github/workflows/deploy.yml`: pass optional smoke path list from GitHub Environment variables.
- `README.md`, `docs/development.md`, `docs/architecture.md`: document authenticated service smoke behavior.
- `docs/evidence/fase-4/f4-edge-authenticated-smoke.md`: capture validation evidence.
- No Terraform route changes and no new live service URLs are introduced.
