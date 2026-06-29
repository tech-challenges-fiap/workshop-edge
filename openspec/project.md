# Project Context

## Repository

`workshop-edge` is the edge delivery repository for API Gateway, Lambda handlers, external adapters, and edge-focused Terraform.

## Ownership

This repository owns: Lambda code in src/functions/, API Gateway/Lambda Terraform, packaging scripts, edge smoke tests, and edge documentation.

This repository does not own: core application business logic, database provisioning, shared cluster infrastructure, or ingress platform resources.

## OpenSpec Governance

OpenSpec is the canonical process for non-trivial changes. Product, architecture, contract, infrastructure, schema, workflow, and runtime behavior changes must start with an OpenSpec change under `openspec/changes/<change-id>/`.

Claude Code and other agents must not implement from informal intent alone. If a change is missing, ambiguous, or expands beyond the approved tasks, the agent must stop and raise the question to Hermes/Void.

## Primary Change Areas

src/functions/, test/, scripts/, terraform/, docs/, .ai/

## Validation Baseline

```bash
bun run lint && bun test && bun run build && bun run package:lambdas && (cd terraform && terraform fmt -check -recursive && terraform init -backend=false && terraform validate)
```

## Branching Baseline

Work starts from updated `origin/stag`, opens PRs into `stag`, and never pushes directly to `stag` or `prod`. Production remains promotion-only through `stag -> prod`.
