locals {
  name_prefix      = "${var.project}-${var.repo}-${var.environment}"
  auth_lambda_name = "${local.name_prefix}-${var.resource_suffix}"
}

resource "terraform_data" "baseline" {
  input = {
    name_prefix      = local.name_prefix
    auth_lambda_name = local.auth_lambda_name
  }
}

