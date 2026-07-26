## 1. Smoke Script

- [x] 1.1 Extend `scripts/smoke-auth-flow.ts` to parse optional `SMOKE_SERVICE_PATHS` as JSON array or comma-separated path list.
- [x] 1.2 After successful `/auth/login`, call each configured service path through `EDGE_BASE_URL` with `Authorization: Bearer <token>`.
- [x] 1.3 Fail with a clear path/status error when any configured service path returns non-2xx; avoid logging CPF or token values.
- [x] 1.4 Preserve existing `SMOKE_PROTECTED_PATH` default behavior and `SMOKE_SKIP_APP_PROXY=true` handling.

## 2. Workflow And Documentation

- [x] 2.1 Pass `SMOKE_SERVICE_PATHS` from GitHub Environment variables into the deploy workflow smoke step.
- [x] 2.2 Document `SMOKE_SERVICE_PATHS` in `README.md` and `docs/development.md`, including the empty-by-default behavior and accepted formats.
- [x] 2.3 Update architecture documentation to describe the authenticated smoke coverage for service routes.

## 3. Validation And Evidence

- [x] 3.1 Run `npx --yes @fission-ai/openspec validate f4-edge-authenticated-smoke --strict` before implementation. PASSED.
- [x] 3.2 Run relevant local validation: `bun run lint`, `bun test`, `bun run build`, and `bun run package:lambdas`. PASSED after correcting one test expectation; see evidence.
- [x] 3.3 Run Terraform validation if workflow or Terraform inputs are touched: `terraform fmt -check -recursive`, `terraform init -backend=false`, and `terraform validate` with staging example tfvars if required by variable defaults. PASSED.
- [x] 3.4 Run OpenSpec strict validation again after implementation. PASSED.
- [x] 3.5 Create `docs/evidence/fase-4/f4-edge-authenticated-smoke.md` with commands and results.
- [x] 3.6 Archive the completed OpenSpec change and validate specs. Archive command was attempted after task completion; final archive/spec validation status is recorded in evidence and handoff.
