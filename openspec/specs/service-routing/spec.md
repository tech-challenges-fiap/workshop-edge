# service-routing Specification

## Purpose
TBD - created by archiving change f4-edge-service-routing. Update Purpose after archive.
## Requirements
### Requirement: OS service proxy route
The edge API Gateway SHALL forward all requests matching `ANY /os/{proxy+}` to the URL constructed by appending the captured proxy path to `OS_BASE_URL`, stripping the `/os` prefix. The `x-request-id` header SHALL be set to `$context.requestId` on every forwarded request.

#### Scenario: Request reaches OS service with prefix stripped
- **WHEN** a client sends `GET /os/work-orders` to the edge API Gateway
- **THEN** the gateway forwards `GET /work-orders` to `OS_BASE_URL` with `x-request-id` set

#### Scenario: OS_BASE_URL is not configured
- **WHEN** `OS_BASE_URL` is an empty string or not set in the Terraform variable
- **THEN** `terraform validate` SHALL fail with a validation error indicating the variable is required

### Requirement: Billing service proxy route
The edge API Gateway SHALL forward all requests matching `ANY /billing/{proxy+}` to the URL constructed by appending the captured proxy path to `BILLING_BASE_URL`, stripping the `/billing` prefix. The `x-request-id` header SHALL be set to `$context.requestId` on every forwarded request.

#### Scenario: Request reaches Billing service with prefix stripped
- **WHEN** a client sends `POST /billing/invoices` to the edge API Gateway
- **THEN** the gateway forwards `POST /invoices` to `BILLING_BASE_URL` with `x-request-id` set

#### Scenario: BILLING_BASE_URL is not configured
- **WHEN** `BILLING_BASE_URL` is an empty string or not set in the Terraform variable
- **THEN** `terraform validate` SHALL fail with a validation error indicating the variable is required

### Requirement: Execution service proxy route
The edge API Gateway SHALL forward all requests matching `ANY /execution/{proxy+}` to the URL constructed by appending the captured proxy path to `EXECUTION_BASE_URL`, stripping the `/execution` prefix. The `x-request-id` header SHALL be set to `$context.requestId` on every forwarded request.

#### Scenario: Request reaches Execution service with prefix stripped
- **WHEN** a client sends `POST /execution/jobs` to the edge API Gateway
- **THEN** the gateway forwards `POST /jobs` to `EXECUTION_BASE_URL` with `x-request-id` set

#### Scenario: EXECUTION_BASE_URL is not configured
- **WHEN** `EXECUTION_BASE_URL` is an empty string or not set in the Terraform variable
- **THEN** `terraform validate` SHALL fail with a validation error indicating the variable is required

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

### Requirement: Correlation header forwarded to all service proxies
All three new HTTP_PROXY integrations SHALL append `x-request-id` from `$context.requestId` so that downstream services can correlate edge and service-level logs.

#### Scenario: Correlation header is present on forwarded OS request
- **WHEN** a request arrives at `/os/{proxy+}`
- **THEN** the forwarded request to `OS_BASE_URL` contains the `x-request-id` header with the API Gateway request ID

#### Scenario: Correlation header is present on forwarded Billing request
- **WHEN** a request arrives at `/billing/{proxy+}`
- **THEN** the forwarded request to `BILLING_BASE_URL` contains the `x-request-id` header with the API Gateway request ID

#### Scenario: Correlation header is present on forwarded Execution request
- **WHEN** a request arrives at `/execution/{proxy+}`
- **THEN** the forwarded request to `EXECUTION_BASE_URL` contains the `x-request-id` header with the API Gateway request ID

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

