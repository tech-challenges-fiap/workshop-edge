# workshop-edge

[![prod/stag](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Ftech-challenges-fiap%2Fworkshop-edge%2Fbadges%2Fbadges%2Fprod-stag-sync.json)](https://github.com/tech-challenges-fiap/workshop-edge/compare/prod...stag)

`workshop-edge` owns the edge delivery layer for the `workshop` service. It
holds Lambda entrypoints, adapter behavior, and external-facing delivery logic.

## What This Repository Owns

- edge-focused Lambda handlers
- external request/response adapter behavior
- API Gateway and edge-focused Lambda infrastructure
- Lambda packaging and edge-specific CI validation

This repository does not own core application logic, database provisioning, or
shared runtime platform infrastructure.

## Current Implementation Status

The current implementation provides the edge stack expected by
`plan/06-workshop-edge.md`:

- `POST /auth/login` handled by the `auth-cpf` Lambda
- CPF normalization and PostgreSQL lookup against `person.document`
- `person.status = active` enforcement before token issuance
- HS256 JWT signing with the issuer/audience expected by `workshop-app`
- `notify` Lambda accepting normalized channel payloads or app notification payloads
- HTTP API Gateway routes for `/auth/*`, `/notify/*`, `/os/*`, `/billing/*`, `/execution/*`, and `/api/*`
- `/os/{proxy+}` forwarding to the Order Service base URL
- `/billing/{proxy+}` forwarding to the Billing Service base URL
- `/execution/{proxy+}` forwarding to the Execution Service base URL
- `/api/{proxy+}` forwarding to the `workshop-app` base URL (migration fallback)
- CloudWatch log groups, API access logs, Lambda IAM role, and basic throttling
- Bun-based lint, test, Node.js 20 Lambda build, and Bash/Python ZIP packaging
- CI validation, Terraform apply on environment branches, and auth smoke test

The repository still relies on environment-specific values from
`workshop-db`, `workshop-platform`, and GitHub Environments before real deploys
can succeed.

## API Gateway Routes

| Route | Target |
|---|---|
| `POST /auth/login` | `auth-cpf` Lambda |
| `ANY /auth/{proxy+}` | `auth-cpf` Lambda |
| `POST /notify` | `notify` Lambda |
| `ANY /notify/{proxy+}` | `notify` Lambda |
| `ANY /os/{proxy+}` | HTTP proxy to Order Service (strips `/os` prefix) |
| `ANY /billing/{proxy+}` | HTTP proxy to Billing Service (strips `/billing` prefix) |
| `ANY /execution/{proxy+}` | HTTP proxy to Execution Service (strips `/execution` prefix) |
| `ANY /api/{proxy+}` | HTTP proxy to `workshop-app` — migration fallback (strips `/api` prefix) |

All three service proxy routes forward `x-request-id` from the API Gateway request context.

## Runtime Contract

Authentication flow:

```text
client -> API Gateway /auth/login -> Lambda auth-cpf -> PostgreSQL person lookup -> JWT -> /api/* -> workshop-app
```

`auth-cpf` expects:

- request body: `{ "cpf": "123.456.789-00" }`
- a matching `person.document` in PostgreSQL
- `person.status = active`
- a JWT secret supplied by `JWT_SECRET` or `JWT_SECRET_ARN`

Successful responses return:

```json
{
  "token_type": "Bearer",
  "access_token": "<jwt>",
  "expires_in": 900
}
```

`notify` accepts either:

- `{ "channel": "email" | "sms", "destination": "...", "message": "..." }`
- `{ "email": "...", "phone": "...", "message": "..." }`

When `NOTIFICATION_WEBHOOK_URL` is configured, `notify` POSTs each normalized
delivery to that provider and forwards `x-request-id` when present.

## Local Commands

```bash
bun install
bun run lint
bun test
bun run build
bun run package:lambdas
cd terraform
terraform fmt -check -recursive
terraform init -backend=false
terraform validate
terraform plan -refresh=false -var-file="environments/stag/terraform.tfvars.example"
```

The local Terraform plan requires AWS credentials because this repository now
uses the AWS provider. CI and deploy workflows obtain credentials through GitHub
OIDC.

## Environment Inputs

Set these GitHub Environment variables for `staging` and `production`:

- `AWS_REGION`
- `AWS_ROLE_ARN`
- `OS_BASE_URL` — base URL of the Order Service (Phase 4)
- `BILLING_BASE_URL` — base URL of the Billing Service (Phase 4)
- `EXECUTION_BASE_URL` — base URL of the Execution Service (Phase 4)
- `APP_BASE_URL` — migration fallback for `/api/{proxy+}`; retained until all consumers migrate to service-specific paths
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_SECRET_ARN`
- `JWT_SECRET_ARN`
- `PRIVATE_SUBNET_IDS_JSON`
- `LAMBDA_SECURITY_GROUP_IDS_JSON`
- `NOTIFICATION_WEBHOOK_URL` when a real notification provider is used
- `SMOKE_CPF`, which must belong to an active person with a role allowed by the
  protected smoke-test route
- `SMOKE_PROTECTED_PATH`, defaulting to `/api/work-orders`
- `SMOKE_SERVICE_PATHS`, optional Phase 4 authenticated route smoke paths as a
  JSON string array (`["/os/work-orders"]`) or comma-separated list
  (`/os/work-orders,/billing/invoices`); empty by default so environments do not
  call invented service URLs
- `SMOKE_SKIP_APP_PROXY=true` only as an explicit emergency override

`PRIVATE_SUBNET_IDS_JSON` and `LAMBDA_SECURITY_GROUP_IDS_JSON` must be JSON/HCL
list strings such as `["subnet-aaa","subnet-bbb"]`.

## Delivery Flow

- `feature/* -> stag`: Pull Request validated by Terraform checks plus Lambda lint, tests, build, and packaging
- `stag -> prod`: promotion Pull Request allowed only from `stag`
- `push` to `stag` or `prod`: deployment workflow uses AWS OIDC, builds/packages Lambdas, applies Terraform, and runs the auth smoke test. By default, smoke posts `SMOKE_CPF` to `/auth/login`, then calls `/api/work-orders` with the returned Bearer token. When `SMOKE_SERVICE_PATHS` is configured, the same token is also sent to each listed Phase 4 service route through the edge URL.
- `prod` Pull Requests: drift-report and promotion-source workflows enforce branch discipline
- `Create Promotion PR`: manual workflow that opens the `stag` to `prod` promotion PR when one does not already exist

The `Create Promotion PR` workflow requires the `PROMOTION_PR_TOKEN` repository
secret. Use a fine-grained GitHub token with access to this repository and
pull request read/write permission.

## Documentation

- [docs/README.md](docs/README.md) - docs index and reading guide
- [docs/architecture.md](docs/architecture.md) - repository boundaries and target edge role
- [docs/development.md](docs/development.md) - local workflow, validation, and documentation rules
- [AGENTS.md](AGENTS.md) - instructions for AI contributors

Transversal architecture documentation (component diagrams, sequence diagrams, ER model, RFCs, ADRs) is
maintained in [workshop-app/docs](https://github.com/tech-challenges-fiap/workshop-app/blob/stag/docs/README.md).
