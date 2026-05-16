# workshop-edge project context

## Purpose

`workshop-edge` is the edge adapter repository. It holds API Gateway routes,
Lambda handlers, external contract translation, and integration-facing
components.

## Current State

- `auth-cpf` handles `POST /auth/login`, validates CPF shape, queries
  PostgreSQL `person.document`, requires `person.status = active`, and signs an
  HS256 JWT for `workshop-app`
- `notify` accepts normalized channel notifications or app email/phone payloads
- Terraform defines HTTP API Gateway, Lambda functions, IAM, log groups, routes,
  `/api/{proxy+}` app proxying, access logs, and throttling
- tests cover both handlers
- build output is generated in `dist/`
- zip artifacts are generated in `artifacts/` by `scripts/package-lambdas.sh`

## Operating Constraint

- keep the repository focused on edge adapters and entrypoints
- treat core application logic, RDS provisioning, and platform provisioning as
  out of scope
- do not log raw CPF values or bearer tokens
- document only integrations and contracts defined here

## Important Workflow

- develop on `feature/*`
- merge into `stag`
- promote from `stag` to `prod`
- validate Lambda code, packaging, and Terraform before proposing changes
- deploy workflow applies Terraform and runs the auth smoke test
