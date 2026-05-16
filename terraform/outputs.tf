output "name_prefix" {
  description = "Default prefix for edge resources."
  value       = local.name_prefix
}

output "api_id" {
  description = "HTTP API Gateway identifier."
  value       = aws_apigatewayv2_api.http.id
}

output "api_endpoint" {
  description = "Base HTTP API endpoint without stage suffix."
  value       = aws_apigatewayv2_api.http.api_endpoint
}

output "api_stage_url" {
  description = "HTTP API endpoint including the environment stage."
  value       = "${aws_apigatewayv2_api.http.api_endpoint}/${aws_apigatewayv2_stage.environment.name}"
}

output "auth_lambda_name" {
  description = "Canonical name for the auth-cpf Lambda."
  value       = aws_lambda_function.auth_cpf.function_name
}

output "notify_lambda_name" {
  description = "Canonical name for the notify Lambda."
  value       = aws_lambda_function.notify.function_name
}

output "api_access_log_group_name" {
  description = "CloudWatch log group used by HTTP API access logs."
  value       = aws_cloudwatch_log_group.api_access.name
}
