# workshop-edge

[![prod/stag](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Ftech-challenges-fiap%2Fworkshop-edge%2Fbadges%2Fbadges%2Fprod-stag-sync.json)](https://github.com/tech-challenges-fiap/workshop-edge/compare/prod...stag)

`workshop-edge` owns the edge delivery layer for the `workshop` service. It
holds Lambda entrypoints, adapter behavior, and external-facing delivery logic.

## What This Repository Owns

- edge-focused Lambda handlers
- external request/response adapter behavior
- Terraform baseline for edge infrastructure naming
- Lambda packaging and edge-specific CI validation

This repository does not own core application logic, database provisioning, or
shared runtime platform infrastructure.

## Current Scaffold Status

The current scaffold provides a small but runnable baseline:

- Lambda source files in `src/functions/`
- an `auth-cpf` bootstrap handler
- a `notify` bootstrap handler
- Bun-based lint, test, build, and packaging commands
- Terraform naming and environment baseline for the edge stack
- generated build output in `dist/` and packaged artifacts in `artifacts/`

The repository does not yet implement a full API Gateway stack or production
integration flow. It currently defines the shape and ownership of edge concerns.

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
terraform plan -var="environment=stag" -var="repo=edge"
```

## Delivery Flow

- `feature/* -> stag`: Pull Request validated by Terraform checks plus Lambda lint, tests, build, and packaging
- `stag -> prod`: promotion Pull Request allowed only from `stag`
- `push` to `stag` or `prod`: deployment workflow uses AWS OIDC, builds/packages Lambdas, and runs Terraform planning
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
