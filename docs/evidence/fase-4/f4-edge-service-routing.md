# Evidence — f4-edge-service-routing

**Change ID:** f4-edge-service-routing  
**Repository:** workshop-edge  
**Date:** 2026-07-17  
**Checklist columns supported:** Foundation / Infrastructure / Routing

---

## Change Summary

Adds per-service routing to the API Gateway edge layer for Phase 4. Adds Terraform variables, API Gateway integrations, and routes for OS (`/os/{proxy+}`), Billing (`/billing/{proxy+}`), and Execution (`/execution/{proxy+}`) services. Updates documentation to reflect the per-service routing model.

**Artifacts created/modified:**
- `terraform/variables.tf` — `os_base_url`, `billing_base_url`, `execution_base_url`
- `terraform/main.tf` — `os_origin`, `billing_origin`, `execution_origin` locals; three integrations; three routes
- `terraform/environments/stag/terraform.tfvars.example` — placeholder values
- `terraform/environments/prod/terraform.tfvars.example` — placeholder values
- `README.md` — Environment Inputs table, API Gateway Routes table
- `docs/architecture.md` — per-service routing model, Phase 4 decomposition
- `openspec/changes/f4-edge-service-routing/` — proposal, design, spec, tasks

---

## Validation Commands and Results

### 1. Lint

```
$ cd /root/repos/tech-challenges-fiap/workshop-edge
$ bun run lint
$ bun run scripts/lint.ts
Lint checks passed.
```

**Result: PASSED**

### 2. Tests

```
$ bun test
bun test v1.3.14 (0d9b296a)

 23 pass
 0 fail
 39 expect() calls
Ran 23 tests across 3 files. [39.00ms]
```

**Result: PASSED — 23 pass, 0 fail**

### 3. Build

```
$ bun run build
$ bun build ./src/functions/auth-cpf.ts ./src/functions/notify.ts ./src/functions/docs.ts --outdir dist --target node --format esm
Bundled 111 modules in 53ms

  auth-cpf.js  1.11 MB   (entry point)
  notify.js    7.87 KB   (entry point)
  docs.js      101.0 KB  (entry point)
```

**Result: PASSED**

### 4. Package Lambdas

```
$ bun run package:lambdas
$ bash ./scripts/package-lambdas.sh
Artifacts generated in artifacts/
```

**Result: PASSED**

### 5. Terraform Format Check

```
$ terraform -chdir=terraform fmt -check -recursive
(exit 0 — no output means no formatting issues)
```

**Result: PASSED**

### 6. Terraform Init

```
$ terraform -chdir=terraform init -backend=false
...initialized.
```

**Result: PASSED**

### 7. Terraform Validate

```
$ terraform -chdir=terraform validate -var-file="environments/stag/terraform.tfvars.example"
Success! The configuration is valid.
```

**Result: PASSED**

### 8. OpenSpec Validation

```
$ npx --yes @fission-ai/openspec validate f4-edge-service-routing --strict
Change 'f4-edge-service-routing' is valid
```

**Result: PASSED**

---

## Archive Status

All validations passed. Change archived via:
```
npx --yes @fission-ai/openspec archive f4-edge-service-routing --yes
```
Archive record: `openspec/changes/archive/2026-07-17-f4-edge-service-routing/`  
Archive command output: `Change 'f4-edge-service-routing' archived as '2026-07-17-f4-edge-service-routing'.` (1 incomplete task skipped via --yes: PR task, explicitly excluded from this session scope)
