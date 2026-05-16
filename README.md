# workshop-edge

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
- HTTP API Gateway routes for `/auth/*`, `/notify/*`, and `/api/*`
- `/api/{proxy+}` forwarding to the `workshop-app` base URL
- CloudWatch log groups, API access logs, Lambda IAM role, and basic throttling
- Bun-based lint, test, Node.js 20 Lambda build, and Bash/Python ZIP packaging
- CI validation, Terraform apply on environment branches, and auth smoke test

The repository still relies on environment-specific values from
`workshop-db`, `workshop-platform`, and GitHub Environments before real deploys
can succeed.

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
- `APP_BASE_URL`
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

`PRIVATE_SUBNET_IDS_JSON` and `LAMBDA_SECURITY_GROUP_IDS_JSON` must be JSON/HCL
list strings such as `["subnet-aaa","subnet-bbb"]`.

## Delivery Flow

- `feature/* -> stag`: Pull Request validated by Terraform checks plus Lambda lint, tests, build, and packaging
- `stag -> prod`: promotion Pull Request allowed only from `stag`
- `push` to `stag` or `prod`: deployment workflow uses AWS OIDC, builds/packages Lambdas, applies Terraform, and runs the auth smoke test
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
