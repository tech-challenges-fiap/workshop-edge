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

## Workflow Rules

- Always run `git fetch origin --prune` before starting work.
- Always create a new branch from the updated `origin/stag`.
- Always open feature, fix, docs, and maintenance PRs into `stag`.
- Never open a direct PR to `prod`.
- Treat `prod` as promotion-only and update it only through the `stag -> prod` promotion PR.
- Before opening or updating a PR, verify that your branch is still based on current `origin/stag`.
- Stage files explicitly when the worktree contains unrelated changes.
- Never push directly to `stag` or `prod`.

## CI And Completion Rules

- Before saying the task is done, check the PR's required CI statuses.
- If CI fails, try to fix it once.
- If CI still fails after one reasonable fix attempt, stop and ask for help with the failure details.
- When reporting completion, include the branch name, PR URL, CI status, and any remaining blocker or risk.

## Promotion Rules

- Promotion PRs must always be `stag -> prod`.
- Promotion PRs must be merged with a merge commit.
- Do not use squash or rebase merges for promotions.

## Conflict Handling

- If a `stag -> prod` PR conflicts, do not create a direct branch or PR into `prod`.
- First inspect whether the conflict comes from broken promotion ancestry or from real content divergence.
- If branch protection or repository policy blocks the repair, stop and explain the exact maintainer action required.

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
