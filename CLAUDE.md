# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

`workshop-edge` is the external adapter layer for the `workshop` service. It owns Lambda handlers, API Gateway routes, and edge-specific Terraform. It does **not** own core application business logic, database provisioning, or shared platform infrastructure.


## OpenSpec Instructions

This repository uses OpenSpec as the mandatory governance process for product, architecture, contracts, infrastructure, and behavior changes. Read `openspec/AGENTS.md` and this repository's `AGENTS.md` before any code change.

- Do not modify implementation paths (`src/`, `terraform/`, `k8s/`, `kubernetes/`, workflows, schemas, API contracts, or runtime behavior) unless an approved change exists under `openspec/changes/<change-id>/`.
- Validate the change with `npx --yes @fission-ai/openspec validate <change-id> --strict` before implementation and before PR handoff.
- If the requested work has no change-id, or if the spec is ambiguous, stop and raise the question to Hermes/Void. Do not decide product or architecture scope silently.
- Keep implementation inside the approved `tasks.md`; update the OpenSpec change before expanding scope.
- Mention the OpenSpec change-id and validation result in the PR body.
- After merge to `stag`, archive the completed change with `npx --yes @fission-ai/openspec archive <change-id>`.

## Commands

```bash
# Install dependencies
bun install

# Validate Lambda code
bun run lint          # whitespace guard (no tabs, no trailing whitespace)
bun test              # handler tests in test/
bun run build         # bundle src/functions/*.ts -> dist/ for Node.js 20 ESM
bun run package:lambdas  # dist/ -> ZIP artifacts in artifacts/

# Run a single test file
bun test test/auth-cpf.test.ts

# Smoke test (requires live environment env vars)
bun run smoke:auth

# Validate Terraform (no credentials needed)
cd terraform
terraform fmt -check -recursive
terraform init -backend=false
terraform validate

# Local Terraform plan (requires AWS credentials)
terraform plan -refresh=false -var-file="environments/stag/terraform.tfvars.example"
```

## Architecture

### Build Pipeline

```
src/functions/*.ts  --bun build-->  dist/*.js  --package-lambdas.sh-->  artifacts/*.zip
```

`package-lambdas.sh` copies each `dist/*.js` file plus a `{"type":"module"}` package.json into a temporary directory, then creates the ZIP with Python's `zipfile`. Lambda runtime: Node.js 20, ESM format.

### Lambda Handlers

Both handlers in `src/functions/` accept either a raw API Gateway HTTP API v2 event or a direct typed input. This dual-mode design enables testing without mocking API Gateway payloads.

**`auth-cpf.ts`** — `POST /auth/login`
- Sanitizes/validates CPF shape (11 digits after stripping non-digits)
- Queries `person.document` in PostgreSQL; requires `person.status = active`
- Signs an HS256 JWT using `createHmac` from `node:crypto` (no JWT library)
- Exported pure functions (`sanitizeCpf`, `isCpfShapeValid`, `buildClaims`, `signJwt`, `authenticateCpf`) allow fine-grained unit testing
- Dependencies (personRepository, jwtSecretProvider, now) are injected via the second parameter of `authenticateCpf` for testability
- DB config resolved from env vars with fallback to Secrets Manager (`DB_SECRET_ARN`)
- JWT secret resolved from `JWT_SECRET` env var or Secrets Manager (`JWT_SECRET_ARN`)

**`notify.ts`** — `POST /notify`
- Accepts two input shapes: normalized `{channel, destination, message}` or app-style `{email?, phone?, message}`
- Normalizes to one or more `NotificationDelivery` objects
- If `NOTIFICATION_WEBHOOK_URL` is set, POSTs each delivery; otherwise accepts silently (allows lower environments to validate the contract without a provider)
- Forwards `x-request-id` header for correlation

### API Gateway Routes (HTTP API v2)

| Route | Target |
|---|---|
| `POST /auth/login` | `auth-cpf` Lambda |
| `ANY /auth/{proxy+}` | `auth-cpf` Lambda |
| `POST /notify` | `notify` Lambda |
| `ANY /notify/{proxy+}` | `notify` Lambda |
| `ANY /api/{proxy+}` | HTTP proxy to `workshop-app` (strips `/api` prefix) |

The `/api/{proxy+}` integration uses `overwrite:path = "/$request.path.proxy"` to strip the `/api` prefix and appends `x-request-id` from the request context.

### Terraform

`terraform/` is flat (no modules). Resource naming follows `${project}-${repo}-${environment}-${suffix}` (e.g. `workshop-edge-stag-auth-cpf`). Lambda VPC placement is conditional: if `private_subnet_ids` and `lambda_security_group_ids` are both non-empty, Lambdas are placed in the VPC. `create_vpc_endpoints` controls whether Secrets Manager VPC endpoints are created (disable when sharing a VPC that already has them).

## Branching and Delivery

- Develop on `feature/*`, open PRs into `stag`
- Never open a PR directly to `prod`
- Promote to `prod` only through the `stag -> prod` promotion PR (merge commit, not squash/rebase)
- `push` to `stag` or `prod` triggers `deploy.yml`: builds, packages, applies Terraform, runs the smoke test

## Constraints

- Do not log raw CPF values or bearer tokens anywhere
- Do not move application business logic into these Lambda handlers
- Do not create RDS, VPC, EKS, or ingress resources in this repo's Terraform

## Documentation

Update `README.md` and `docs/` in the same PR when handlers, artifacts, commands, or workflows change.
