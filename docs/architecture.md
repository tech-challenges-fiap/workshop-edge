# workshop-edge Architecture

## Role

`workshop-edge` is the external adapter layer. It owns API Gateway routes,
serverless entrypoints, edge contracts, and integration-specific behavior.

## Boundaries

This repository owns:

- Lambda handlers and edge adapters
- API Gateway-facing request/response behavior
- edge-specific Terraform resources and deployment contracts
- packaging of Lambda artifacts

This repository does not own core application rules, database provisioning, or
shared cluster, ingress, or networking capabilities.

## Implementation Surface

The repository contains:

- `src/functions/auth-cpf.ts`
- `src/functions/notify.ts`
- tests for both handlers in `test/`
- artifact packaging in `scripts/package-lambdas.sh`
- auth smoke testing in `scripts/smoke-auth-flow.ts`
- AWS Terraform in `terraform/`

Terraform defines:

- Lambda execution IAM role
- `auth-cpf` and `notify` Lambda functions on Node.js 20
- Lambda CloudWatch log groups
- HTTP API Gateway
- `/auth/login` and `/auth/{proxy+}` routes to `auth-cpf`
- `/notify` and `/notify/{proxy+}` routes to `notify`
- `/os/{proxy+}`, `/billing/{proxy+}`, `/execution/{proxy+}` HTTP proxy routes to Phase 4 microservices
- `/api/{proxy+}` HTTP proxy route to `workshop-app` (migration fallback; deprecated, pending removal)
- API access logs and default throttling

## Authentication Flow

```text
client -> API Gateway /auth/login -> auth-cpf -> PostgreSQL person lookup -> JWT
```

`auth-cpf`:

- parses API Gateway HTTP API events
- accepts `POST /auth/login`
- sanitizes and validates CPF shape
- queries `person` by normalized `document`
- requires `person.status = active`
- signs an HS256 JWT with `iss`, `aud`, `exp`, `iat`, `jti`, `sub`,
  `person_id`, `cpf`, `role`, and `status`

The JWT is intended for `workshop-app`, which validates the same issuer,
audience, signing secret, expiration, and claims.

## Service Proxy Flow (Phase 4)

Phase 4 decomposes `workshop-app` into three independent services. The edge layer
routes each service prefix to its own base URL without any Lambda handler changes.

```text
client -> API Gateway /os/{proxy+}        -> Order Service /{proxy}
client -> API Gateway /billing/{proxy+}   -> Billing Service /{proxy}
client -> API Gateway /execution/{proxy+} -> Execution Service /{proxy}
```

Each integration strips its path prefix via `overwrite:path = "/$request.path.proxy"`
and forwards `x-request-id` from the API Gateway request context for correlation.
Service base URLs are supplied via `OS_BASE_URL`, `BILLING_BASE_URL`, and
`EXECUTION_BASE_URL` Terraform variables.

Deployment smoke validation authenticates through `/auth/login` before checking
protected routes. The legacy `/api/*` fallback is still checked by default via
`SMOKE_PROTECTED_PATH`; Phase 4 service routes are checked only when operators
configure `SMOKE_SERVICE_PATHS` for real environment paths. This keeps edge smoke
coverage explicit without hardcoding unavailable service URLs.

## API Proxy Flow (Migration Fallback)

```text
client -> API Gateway /api/{proxy+} -> workshop-app /{proxy}
```

The `/api/{proxy+}` → `APP_BASE_URL` route is retained as a backward-compatibility
fallback during the Phase 4 migration. It will be removed in a follow-up change
once all consumers have moved to the service-specific paths above.

## Notification Flow

`notify` accepts either a normalized edge payload or the app notification payload.
It validates the request, normalizes deliveries, and optionally sends them to
`NOTIFICATION_WEBHOOK_URL`. If no provider URL is configured, the Lambda accepts
the request without external delivery so lower environments can validate the
contract without a provider.

## Required External Contracts (Phase 4 Additions)

Phase 4 service owners provide:

- `os_base_url` — Order Service base URL
- `billing_base_url` — Billing Service base URL
- `execution_base_url` — Execution Service base URL

## Required External Contracts

`workshop-db` provides:

- `db_host`
- `db_port`
- `db_name`
- `db_secret_arn`

`workshop-platform` provides:

- app ingress hostname/base URL
- private subnet IDs
- security group IDs that can reach the database

GitHub Environment variables provide deploy-time wiring for those values and the
JWT secret ARN shared with `workshop-app`.

## Non-Goals

- Do not move application business rules into Lambda handlers.
- Do not create RDS, VPC, EKS, or ingress resources here.
- Do not log raw CPF values or bearer tokens.
