## Why

Change `f4-edge-service-routing` added the Terraform variables `os_base_url`, `billing_base_url`, and `execution_base_url` (required, no default, must start with `http(s)://`) plus the corresponding API Gateway proxy integrations. It never updated `.github/workflows/deploy.yml` to populate `TF_VAR_os_base_url`, `TF_VAR_billing_base_url`, or `TF_VAR_execution_base_url` from environment variables, unlike the existing `TF_VAR_app_base_url: ${{ vars.APP_BASE_URL }}` mapping. As a result every `Deploy` run since that change has failed at `terraform apply` with "Invalid value for variable" for all three variables, and `stag`/`prod` have never received a working edge deployment for Phase 4 service routing.

## What Changes

- Add `TF_VAR_os_base_url`, `TF_VAR_billing_base_url`, `TF_VAR_execution_base_url` to the `env:` block of `.github/workflows/deploy.yml`, sourced from new GitHub Environment variables `OS_BASE_URL`, `BILLING_BASE_URL`, `EXECUTION_BASE_URL` — mirroring the existing `APP_BASE_URL` wiring exactly.
- Document the three new required environment variables in `README.md` alongside the existing `APP_BASE_URL` entry.
- No change to `terraform/main.tf` routing logic, host-header behavior, or the `service-routing` spec's existing requirements — those are correct as specified and out of scope here.

## Capabilities

### Modified Capabilities

- `service-routing`: adds a requirement that the deploy workflow must supply `os_base_url`, `billing_base_url`, and `execution_base_url` to Terraform, so the existing routing requirements are actually deployable in CI/CD.

## Impact

- `.github/workflows/deploy.yml`: three new `TF_VAR_*` env entries.
- `README.md`: document the three new required GitHub Environment variables.
- No Lambda source changes, no Terraform resource changes.
- Known limitation carried forward unchanged from `f4-edge-service-routing`: the `/os/`, `/billing/`, `/execution/` proxy integrations do not rewrite the `Host` header (unlike the `/api/` fallback), so end-to-end routing to in-cluster services still depends on the target base URL resolving to a host the ingress accepts. This change only makes `terraform apply` succeed in CI/CD by supplying valid, non-empty URLs; it does not add DNS or host-header rewriting.
