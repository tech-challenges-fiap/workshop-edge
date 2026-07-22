## Why

Phase 4 of the FIAP Tech Challenge decomposes the `workshop-app` monolith into three independent services — Order (OS), Billing, and Execution — each with its own base URL. The edge layer currently proxies all `/api/{proxy+}` traffic to a single `APP_BASE_URL`; routing must be split per service so that each microservice can be deployed, scaled, and replaced independently.

## What Changes

- Add three new HTTP_PROXY API Gateway integrations and environment variables: `OS_BASE_URL`, `BILLING_BASE_URL`, `EXECUTION_BASE_URL`.
- Add explicit API Gateway route groups for `/os/{proxy+}`, `/billing/{proxy+}`, and `/execution/{proxy+}`, each forwarding to the corresponding service base URL.
- Retain the existing `ANY /api/{proxy+}` → `APP_BASE_URL` proxy as a backward-compat fallback during migration; mark it for removal once all consumers have moved to the service-specific paths.
- Retain all `/auth/*` and `/notify/*` Lambda routes unchanged.
- Add Terraform variables, locals, and `aws_apigatewayv2_integration` / `aws_apigatewayv2_route` resources for the three new services.
- Document the new environment inputs in `README.md` and `docs/architecture.md`.

## Capabilities

### New Capabilities
- `service-routing`: HTTP_PROXY routing from the edge API Gateway to OS, Billing, and Execution service base URLs, with per-service path-prefix routing and `x-request-id` forwarding.

### Modified Capabilities
- None.

## Impact

- `terraform/main.tf`, `terraform/variables.tf`, `terraform/outputs.tf`: new variables, integrations, and routes.
- `terraform/environments/stag/terraform.tfvars.example`, `terraform/environments/prod/terraform.tfvars.example`: new example values.
- `README.md`, `docs/architecture.md`: updated environment inputs table and runtime contract section.
- No Lambda source code changes.
- No change to authentication, JWT, or notification behavior.
- Downstream consumers must call `/os/`, `/billing/`, or `/execution/` paths once the new routes are live; the old `/api/` fallback is preserved during migration.
