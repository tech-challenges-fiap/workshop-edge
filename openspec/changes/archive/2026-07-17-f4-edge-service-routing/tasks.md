## 1. Terraform Variables

- [x] 1.1 Add `os_base_url` variable to `terraform/variables.tf` with description, type string, validation requiring `https?://` prefix, and a default of `""` (empty makes apply-time error explicit via a separate validation or null_resource).
- [x] 1.2 Add `billing_base_url` variable to `terraform/variables.tf` with same shape as `os_base_url`.
- [x] 1.3 Add `execution_base_url` variable to `terraform/variables.tf` with same shape as `os_base_url`.
- [x] 1.4 Add the three new locals to `terraform/main.tf` (`os_origin`, `billing_origin`, `execution_origin`) using `trimsuffix(..., "/")`, matching the pattern of `app_origin`.
- [x] 1.5 Update `terraform/environments/stag/terraform.tfvars.example` with placeholder values for the three new variables.
- [x] 1.6 Update `terraform/environments/prod/terraform.tfvars.example` with placeholder values for the three new variables.

## 2. API Gateway Integrations

- [x] 2.1 Add `aws_apigatewayv2_integration.os_proxy` to `terraform/main.tf` (`HTTP_PROXY`, `ANY`, `os_origin`) with `append:header.x-request-id = "$context.requestId"` and `overwrite:path = "/$request.path.proxy"`.
- [x] 2.2 Add `aws_apigatewayv2_integration.billing_proxy` to `terraform/main.tf` with the same structure targeting `billing_origin`.
- [x] 2.3 Add `aws_apigatewayv2_integration.execution_proxy` to `terraform/main.tf` with the same structure targeting `execution_origin`.

## 3. API Gateway Routes

- [x] 3.1 Add `aws_apigatewayv2_route.os_proxy` with route key `ANY /os/{proxy+}` targeting the OS integration.
- [x] 3.2 Add `aws_apigatewayv2_route.billing_proxy` with route key `ANY /billing/{proxy+}` targeting the Billing integration.
- [x] 3.3 Add `aws_apigatewayv2_route.execution_proxy` with route key `ANY /execution/{proxy+}` targeting the Execution integration.

## 4. Documentation

- [x] 4.1 Update `README.md` Environment Inputs table to include `OS_BASE_URL`, `BILLING_BASE_URL`, `EXECUTION_BASE_URL` with descriptions and note that `APP_BASE_URL` is a migration fallback.
- [x] 4.2 Update `README.md` API Gateway Routes table with the three new routes.
- [x] 4.3 Update `docs/architecture.md` to reflect the per-service routing model and the Phase 4 decomposition context.

## 5. Validation

- [x] 5.1 Run `bun run lint` and confirm no whitespace errors. PASSED with Bun v1.3.14.
- [x] 5.2 Run `bun test` and confirm all Lambda handler tests pass. PASSED: 23 pass, 0 fail with Bun v1.3.14.
- [x] 5.3 Run `bun run build` and confirm `dist/` bundles are produced without errors. PASSED with Bun v1.3.14.
- [x] 5.4 Run `bun run package:lambdas` and confirm `artifacts/*.zip` are produced without errors. PASSED with Bun v1.3.14.
- [x] 5.5 Run `terraform fmt -check -recursive` from `terraform/` and confirm no formatting issues. PASSED with Terraform v1.15.8.
- [x] 5.6 Run `terraform init -backend=false` from `terraform/` and confirm provider initialization succeeds. PASSED with Terraform v1.15.8.
- [x] 5.7 Run `terraform validate` from `terraform/` and confirm the new resources pass validation. PASSED with Terraform v1.15.8 using `-var-file="environments/stag/terraform.tfvars.example"` because the service URL variables intentionally reject empty defaults.
- [x] 5.8 Run `npx --yes @fission-ai/openspec validate f4-edge-service-routing --strict` and confirm no validation errors.
- [ ] 5.9 Open a PR into `stag` referencing change id `f4-edge-service-routing` in the PR title and body.
