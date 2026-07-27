## 1. Deploy Workflow

- [x] 1.1 Add `TF_VAR_os_base_url: ${{ vars.OS_BASE_URL }}` to the `env:` block of `.github/workflows/deploy.yml`, placed alongside the existing `TF_VAR_app_base_url` line.
- [x] 1.2 Add `TF_VAR_billing_base_url: ${{ vars.BILLING_BASE_URL }}`.
- [x] 1.3 Add `TF_VAR_execution_base_url: ${{ vars.EXECUTION_BASE_URL }}`.

## 2. Documentation

- [x] 2.1 `README.md` Environment Inputs table already lists `OS_BASE_URL`, `BILLING_BASE_URL`, `EXECUTION_BASE_URL` next to `APP_BASE_URL` (pre-existing, no change needed).

## 3. Validation

- [x] 3.1 Run `npx --yes @fission-ai/openspec validate f4-edge-deploy-service-base-urls --strict` and confirm no validation errors. PASSED.
- [x] 3.2 Run `terraform fmt -check -recursive` and `terraform validate` from `terraform/` and confirm no regressions. PASSED with Terraform v1.15.8 (no .tf files changed).
- [x] 3.3 `bun run lint`, `bun test` (29 pass), `bun run build` all PASSED with Bun.
- [x] 3.4 Set `OS_BASE_URL`, `BILLING_BASE_URL`, `EXECUTION_BASE_URL` as GitHub Environment variables for `staging` and confirm the next `Deploy` run on `stag` passes `terraform apply`.
- [x] 3.5 Open a PR into `stag` referencing change id `f4-edge-deploy-service-base-urls` in the PR title and body.
