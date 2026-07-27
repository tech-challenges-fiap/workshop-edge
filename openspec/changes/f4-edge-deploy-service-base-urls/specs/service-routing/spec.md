## ADDED Requirements

### Requirement: Deploy workflow supplies service base URLs to Terraform
The `.github/workflows/deploy.yml` workflow SHALL set `TF_VAR_os_base_url`, `TF_VAR_billing_base_url`, and `TF_VAR_execution_base_url` from the GitHub Environment variables `OS_BASE_URL`, `BILLING_BASE_URL`, and `EXECUTION_BASE_URL` respectively, using the same pattern as the existing `TF_VAR_app_base_url` mapping.

#### Scenario: Deploy run populates all three service base URL variables
- **WHEN** the `Deploy` workflow runs `terraform apply` for either the `staging` or `production` environment
- **THEN** `TF_VAR_os_base_url`, `TF_VAR_billing_base_url`, and `TF_VAR_execution_base_url` are each set to a non-empty value from that environment's `OS_BASE_URL`, `BILLING_BASE_URL`, and `EXECUTION_BASE_URL` variables
- **AND** `terraform apply` does not fail with "Invalid value for variable" for any of the three
