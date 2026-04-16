# Developing In workshop-edge

## Prerequisites

- Bun `>= 1.3.6`
- Python 3 for the zip-based packaging script
- Terraform `>= 1.14.0`

## Local Workflow

Install dependencies:

```bash
bun install
```

Validate the Lambda code:

```bash
bun run lint
bun test
bun run build
bun run package:lambdas
```

Validate the Terraform baseline:

```bash
cd terraform
terraform fmt -check -recursive
terraform init -backend=false
terraform validate
terraform plan -var="environment=stag" -var="repo=edge"
```

## What The Commands Do

- `bun run lint` runs the repository whitespace and formatting guard in `scripts/lint.ts`
- `bun test` executes the handler tests in `test/`
- `bun run build` compiles the Lambda entrypoints into `dist/`
- `bun run package:lambdas` creates zip artifacts in `artifacts/`
- Terraform commands validate the edge infrastructure contract used by CI

## Branching and Delivery Expectations

- Build features from `feature/*` branches
- Open Pull Requests into `stag` for normal integration
- Promote to `prod` only from `stag`
- Expect `pr-validation.yml` to run Terraform checks plus Lambda lint, tests, build, and packaging
- Expect `deploy.yml` to build/package Lambdas and plan Terraform with AWS OIDC
- Expect `promotion-source.yml` and `drift-report.yml` to protect production promotions

## Documentation Rules

- Write all documentation in English
- Keep docs faithful to the current edge scaffold
- When handlers, artifacts, commands, or workflows change, update the docs in the same change
- Do not describe API Gateway or integration behavior as implemented unless it exists in code or Terraform

## When To Update Documentation

Update documentation when you change:

- Lambda handler contracts or packaging behavior
- Terraform variables, outputs, or naming rules
- validation commands
- CI or deployment workflow behavior
- AI contributor guidance in `AGENTS.md` or `.ai/`
