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
- `/api/{proxy+}` HTTP proxy route to `workshop-app`
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

## API Proxy Flow

```text
client -> API Gateway /api/{proxy+} -> workshop-app /{proxy}
```

The API Gateway HTTP proxy strips the `/api` prefix by overwriting the upstream
path with the `{proxy}` route parameter. It also forwards `x-request-id` from the
API Gateway request context for correlation.

## Notification Flow

`notify` accepts either a normalized edge payload or the app notification payload.
It validates the request, normalizes deliveries, and optionally sends them to
`NOTIFICATION_WEBHOOK_URL`. If no provider URL is configured, the Lambda accepts
the request without external delivery so lower environments can validate the
contract without a provider.

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
