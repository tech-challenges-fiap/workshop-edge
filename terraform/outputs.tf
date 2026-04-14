output "name_prefix" {
  description = "Default prefix for edge resources."
  value       = local.name_prefix
}

output "auth_lambda_name" {
  description = "Canonical name for the auth-cpf Lambda."
  value       = local.auth_lambda_name
}
