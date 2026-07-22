# Evidence: f4-edge-authenticated-smoke

## Summary

Implemented configurable authenticated smoke validation for Phase 4 edge service routes. The existing smoke script still obtains a Bearer token from `/auth/login` and checks the legacy app fallback path by default. It now also accepts optional `SMOKE_SERVICE_PATHS` values and calls each configured service path through the deployed edge URL with `Authorization: Bearer <token>`.

No live OS/Billing/Execution service URLs or paths were invented. Service route smoke checks are skipped unless an environment explicitly sets `SMOKE_SERVICE_PATHS`.

## Changed Behavior

- `SMOKE_SERVICE_PATHS` accepts either:
  - JSON array: `["/os/work-orders","/billing/invoices"]`
  - comma-separated list: `/os/work-orders,/execution/jobs`
- Empty or unset `SMOKE_SERVICE_PATHS` means no service route checks are attempted.
- The script normalizes leading slashes, fails on non-2xx service responses, and does not log CPF or token values.
- `SMOKE_SKIP_APP_PROXY=true` still only skips the legacy `/api/*` fallback check.

## Validation Commands

| Command | Result |
|---|---|
| `git fetch origin --prune` | Passed |
| `npx --yes @fission-ai/openspec validate f4-edge-authenticated-smoke --strict` (before implementation) | Passed: change is valid |
| `bun run lint` | Passed: `Lint checks passed.` |
| `bun test` | Passed: 29 pass, 0 fail |
| `bun run build` | Passed: bundled `auth-cpf.js`, `notify.js`, `docs.js` |
| `bun run package:lambdas` | Passed: `Artifacts generated in artifacts/` |
| `terraform fmt -check -recursive` | Passed |
| `terraform init -backend=false` | Passed |
| `terraform validate -var-file="environments/stag/terraform.tfvars.example"` | Passed: configuration is valid |
| `npx --yes @fission-ai/openspec validate f4-edge-authenticated-smoke --strict` (after implementation) | Passed: change is valid |
| `npx --yes @fission-ai/openspec archive f4-edge-authenticated-smoke --yes` | Passed: archived as `2026-07-17-f4-edge-authenticated-smoke` |
| `npx --yes @fission-ai/openspec validate --specs --strict` | Passed: `spec/service-routing` and `spec/smoke-validation` valid |

## Notes

- One interim `bun test` run failed because the new JSON-object rejection test expected `SyntaxError`; the implementation correctly returned a validation `Error`. The test expectation was corrected and the full suite passed afterward.
- Terraform was not functionally changed; validation was still run because the deploy workflow was touched and existing Terraform variables require staging example tfvars for local validation.
