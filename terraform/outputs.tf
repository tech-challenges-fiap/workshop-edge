output "name_prefix" {
  description = "Prefixo padrao para recursos edge."
  value       = local.name_prefix
}

output "auth_lambda_name" {
  description = "Nome canonico da Lambda auth-cpf."
  value       = local.auth_lambda_name
}

