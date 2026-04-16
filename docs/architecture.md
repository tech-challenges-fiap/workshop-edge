# workshop-edge Architecture

## Role in the Split

`workshop-edge` is the external adapter layer of the workshop split. Its
long-term role is to expose edge contracts, serverless entrypoints, and
integration-specific behavior while keeping the core domain logic in
`workshop-app`.

## Boundaries

This repository owns:

- Lambda handlers and edge adapters
- API Gateway-facing or externally triggered request/response behavior
- edge-specific Terraform naming and deployment contracts
- packaging of Lambda artifacts

This repository does not own:

- workshop domain/application rules
- PostgreSQL provisioning
- shared cluster, ingress, or networking capabilities

## Current Implementation Surface

Today the repository contains:

- `src/functions/auth-cpf.ts`
- `src/functions/notify.ts`
- tests for both handlers in `test/`
- build output in `dist/`
- packaging script `scripts/package-lambdas.sh`
- Terraform baseline in `terraform/`

The current handlers are bootstrap placeholders. They define edge-oriented
contracts without claiming production-complete behavior.

## Dependencies and Interactions

- `workshop-app` is the future application-layer target for domain and business workflows.
- `workshop-db` should own database provisioning rather than storing persistence logic here.
- `workshop-platform` should own shared runtime infrastructure used by edge deployments where appropriate.

## Current Scaffold vs Target State

Current scaffold:

- two placeholder Lambda handlers
- local packaging into zip artifacts
- Terraform naming baseline only

Target state derived from `14soat-group56`:

- dedicated home for external adapters and public/edge contracts
- integration-specific authentication or notification entrypoints
- clear separation between external protocol handling and application business logic

## Non-Goals

- Do not move application business rules into Lambda handlers by default.
- Do not document a full API Gateway deployment as implemented unless Terraform defines it.
- Do not use this repo for database or shared platform provisioning.
