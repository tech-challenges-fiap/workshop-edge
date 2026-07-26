## MODIFIED Requirements

### Requirement: Existing routes are preserved
All pre-existing API Gateway routes and Lambda integrations SHALL remain unchanged after the service routing addition, and the authenticated smoke workflow SHALL continue to validate the legacy protected app fallback path by default.

#### Scenario: Auth login route is unaffected
- **WHEN** a client sends `POST /auth/login` after the change is applied
- **THEN** the request is handled by the `auth-cpf` Lambda exactly as before, with no behavior change

#### Scenario: Notify route is unaffected
- **WHEN** a client sends `POST /notify` after the change is applied
- **THEN** the request is handled by the `notify` Lambda exactly as before, with no behavior change

#### Scenario: Backward-compat app proxy is preserved
- **WHEN** a client sends `GET /api/some-path` after the change is applied
- **THEN** the request is forwarded to `APP_BASE_URL` with the `/api` prefix stripped, exactly as before

#### Scenario: Default authenticated smoke still checks the app fallback
- **WHEN** the deployment smoke runs without `SMOKE_SKIP_APP_PROXY=true`
- **THEN** it calls `SMOKE_PROTECTED_PATH`, defaulting to `/api/work-orders`, with the Bearer token returned by `/auth/login`

## ADDED Requirements

### Requirement: Authenticated smoke supports Phase 4 service route paths
The edge deployment smoke workflow SHALL support an optional `SMOKE_SERVICE_PATHS` input containing Phase 4 service route paths. For each configured path, the workflow SHALL first obtain a Bearer token from `/auth/login`, then call the path through `EDGE_BASE_URL` with that token in the `Authorization` header. The workflow SHALL NOT require hardcoded service URLs or built-in live route assumptions.

#### Scenario: JSON service path list is smoke-tested with a Bearer token
- **GIVEN** `SMOKE_SERVICE_PATHS` is `["/os/work-orders","/billing/invoices"]`
- **WHEN** the smoke workflow receives a Bearer token from `/auth/login`
- **THEN** it calls `/os/work-orders` and `/billing/invoices` through `EDGE_BASE_URL` with `Authorization: Bearer <token>`

#### Scenario: Comma-separated service path list is smoke-tested with a Bearer token
- **GIVEN** `SMOKE_SERVICE_PATHS` is `/os/work-orders,/execution/jobs`
- **WHEN** the smoke workflow receives a Bearer token from `/auth/login`
- **THEN** it calls `/os/work-orders` and `/execution/jobs` through `EDGE_BASE_URL` with `Authorization: Bearer <token>`

#### Scenario: Empty service path list skips service route checks
- **GIVEN** `SMOKE_SERVICE_PATHS` is unset or empty
- **WHEN** the smoke workflow completes the `/auth/login` step
- **THEN** it does not invent or call any Phase 4 service route path

#### Scenario: Service path failure fails the smoke workflow without leaking credentials
- **GIVEN** `SMOKE_SERVICE_PATHS` contains `/os/work-orders`
- **WHEN** the `/os/work-orders` smoke call returns a non-2xx HTTP status
- **THEN** the smoke workflow fails with the path and HTTP status
- **AND** it does not log the CPF or Bearer token value
