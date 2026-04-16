# AGENTS.md

## Mission

Work in `workshop-edge` as an edge and serverless integration repository. Keep
this repo focused on external adapters, Lambda handlers, and
packaging/deployment contracts for edge workloads.

## Scope Boundaries

In scope:

- Lambda code in `src/functions/`
- tests in `test/`
- artifact packaging in `scripts/` and `artifacts/`
- edge-focused Terraform in `terraform/`
- edge-focused documentation

Out of scope:

- core application business logic
- database provisioning
- shared cluster, ingress, or networking infrastructure

## Read First

- `README.md`
- `docs/architecture.md`
- `docs/development.md`
- `src/functions/auth-cpf.ts`
- `src/functions/notify.ts`
- `scripts/package-lambdas.sh`

## Validation Commands

```bash
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

Run all relevant validation for any handler or Terraform change. For
documentation-only changes, still verify that documented commands and paths are
correct.

## Writing Rules

- Write docs and AI guidance in English
- Do not invent integrations or API Gateway resources that are not defined
- Keep edge responsibilities separate from core application and infrastructure concerns
- Keep placeholder behavior clearly labeled as placeholder behavior

## Documentation Expectations

Update `README.md`, `docs/`, and `.ai/` when you change:

- handler contracts
- artifact packaging
- Terraform interfaces
- delivery workflow behavior
- repository boundaries
