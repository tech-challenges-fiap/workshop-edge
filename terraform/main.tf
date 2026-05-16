locals {
  name_prefix          = "${var.project}-${var.repo}-${var.environment}"
  auth_lambda_name     = "${local.name_prefix}-${var.auth_resource_suffix}"
  notify_lambda_name   = "${local.name_prefix}-${var.notify_resource_suffix}"
  api_name             = "${local.name_prefix}-http-api"
  app_origin           = trimsuffix(var.app_base_url, "/")
  artifacts_dir        = abspath("${path.module}/../artifacts")
  auth_artifact_path   = "${local.artifacts_dir}/workshop-edge-auth-cpf.zip"
  notify_artifact_path = "${local.artifacts_dir}/workshop-edge-notify.zip"
  lambda_vpc_enabled   = length(var.private_subnet_ids) > 0 && length(var.lambda_security_group_ids) > 0
  secret_arns          = compact([var.db_secret_arn, var.jwt_secret_arn])

  tags = {
    Environment = var.environment
    ManagedBy   = "terraform"
    Project     = var.project
    Repository  = "workshop-${var.repo}"
  }

  common_lambda_environment = merge(
    {
      APP_ENV                             = var.environment
      AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1"
      JWT_AUDIENCE                        = var.jwt_audience
      JWT_EXPIRES_SECONDS                 = tostring(var.jwt_expires_seconds)
      JWT_ISSUER                          = var.jwt_issuer
    },
    var.extra_lambda_environment,
  )

  auth_lambda_environment = merge(
    local.common_lambda_environment,
    {
      DB_HOST        = var.db_host
      DB_NAME        = var.db_name
      DB_PORT        = tostring(var.db_port)
      DB_SECRET_ARN  = var.db_secret_arn
      DB_SSL         = "true"
      JWT_SECRET_ARN = var.jwt_secret_arn
    },
  )

  notify_lambda_environment = merge(
    local.common_lambda_environment,
    {
      NOTIFICATION_WEBHOOK_URL = var.notification_webhook_url
    },
  )
}

data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "lambda_secret_access" {
  count = length(local.secret_arns) > 0 ? 1 : 0

  statement {
    actions   = ["secretsmanager:GetSecretValue"]
    resources = local.secret_arns
  }
}

resource "aws_iam_role" "lambda" {
  name               = "${local.name_prefix}-lambda"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
  tags               = local.tags
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "lambda_vpc" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_iam_role_policy" "lambda_secret_access" {
  count  = length(local.secret_arns) > 0 ? 1 : 0
  name   = "${local.name_prefix}-secret-access"
  role   = aws_iam_role.lambda.id
  policy = data.aws_iam_policy_document.lambda_secret_access[0].json
}

resource "aws_cloudwatch_log_group" "auth_lambda" {
  name              = "/aws/lambda/${local.auth_lambda_name}"
  retention_in_days = var.log_retention_days
  tags              = local.tags
}

resource "aws_cloudwatch_log_group" "notify_lambda" {
  name              = "/aws/lambda/${local.notify_lambda_name}"
  retention_in_days = var.log_retention_days
  tags              = local.tags
}

resource "aws_cloudwatch_log_group" "api_access" {
  name              = "/aws/apigateway/${local.api_name}"
  retention_in_days = var.log_retention_days
  tags              = local.tags
}

resource "aws_lambda_function" "auth_cpf" {
  function_name    = local.auth_lambda_name
  role             = aws_iam_role.lambda.arn
  runtime          = "nodejs20.x"
  handler          = "auth-cpf.handler"
  filename         = local.auth_artifact_path
  source_code_hash = fileexists(local.auth_artifact_path) ? filebase64sha256(local.auth_artifact_path) : null
  memory_size      = var.lambda_memory_size
  timeout          = var.lambda_timeout_seconds
  tags             = local.tags

  environment {
    variables = local.auth_lambda_environment
  }

  dynamic "vpc_config" {
    for_each = local.lambda_vpc_enabled ? [1] : []

    content {
      subnet_ids         = var.private_subnet_ids
      security_group_ids = var.lambda_security_group_ids
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.auth_lambda,
    aws_iam_role_policy_attachment.lambda_basic,
    aws_iam_role_policy_attachment.lambda_vpc,
  ]
}

resource "aws_lambda_function" "notify" {
  function_name    = local.notify_lambda_name
  role             = aws_iam_role.lambda.arn
  runtime          = "nodejs20.x"
  handler          = "notify.handler"
  filename         = local.notify_artifact_path
  source_code_hash = fileexists(local.notify_artifact_path) ? filebase64sha256(local.notify_artifact_path) : null
  memory_size      = var.lambda_memory_size
  timeout          = var.lambda_timeout_seconds
  tags             = local.tags

  environment {
    variables = local.notify_lambda_environment
  }

  dynamic "vpc_config" {
    for_each = local.lambda_vpc_enabled ? [1] : []

    content {
      subnet_ids         = var.private_subnet_ids
      security_group_ids = var.lambda_security_group_ids
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.notify_lambda,
    aws_iam_role_policy_attachment.lambda_basic,
    aws_iam_role_policy_attachment.lambda_vpc,
  ]
}

resource "aws_apigatewayv2_api" "http" {
  name          = local.api_name
  protocol_type = "HTTP"
  tags          = local.tags

  cors_configuration {
    allow_headers = ["authorization", "content-type", "x-request-id"]
    allow_methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
    allow_origins = var.cors_allow_origins
    max_age       = 300
  }
}

resource "aws_apigatewayv2_integration" "auth_cpf" {
  api_id                 = aws_apigatewayv2_api.http.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.auth_cpf.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "notify" {
  api_id                 = aws_apigatewayv2_api.http.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.notify.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "app_proxy" {
  api_id             = aws_apigatewayv2_api.http.id
  integration_type   = "HTTP_PROXY"
  integration_method = "ANY"
  integration_uri    = local.app_origin

  request_parameters = {
    "append:header.x-request-id" = "$context.requestId"
    "overwrite:path"             = "/$request.path.proxy"
  }
}

resource "aws_apigatewayv2_route" "auth_login" {
  api_id    = aws_apigatewayv2_api.http.id
  route_key = "POST /auth/login"
  target    = "integrations/${aws_apigatewayv2_integration.auth_cpf.id}"
}

resource "aws_apigatewayv2_route" "auth_proxy" {
  api_id    = aws_apigatewayv2_api.http.id
  route_key = "ANY /auth/{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.auth_cpf.id}"
}

resource "aws_apigatewayv2_route" "notify" {
  api_id    = aws_apigatewayv2_api.http.id
  route_key = "POST /notify"
  target    = "integrations/${aws_apigatewayv2_integration.notify.id}"
}

resource "aws_apigatewayv2_route" "notify_proxy" {
  api_id    = aws_apigatewayv2_api.http.id
  route_key = "ANY /notify/{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.notify.id}"
}

resource "aws_apigatewayv2_route" "api_proxy" {
  api_id    = aws_apigatewayv2_api.http.id
  route_key = "ANY /api/{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.app_proxy.id}"
}

resource "aws_apigatewayv2_stage" "environment" {
  api_id      = aws_apigatewayv2_api.http.id
  name        = var.environment
  auto_deploy = true
  tags        = local.tags

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_access.arn
    format = jsonencode({
      httpMethod       = "$context.httpMethod"
      integrationError = "$context.integrationErrorMessage"
      ip               = "$context.identity.sourceIp"
      protocol         = "$context.protocol"
      requestId        = "$context.requestId"
      responseLength   = "$context.responseLength"
      routeKey         = "$context.routeKey"
      status           = "$context.status"
    })
  }

  default_route_settings {
    throttling_burst_limit = var.api_throttle_burst_limit
    throttling_rate_limit  = var.api_throttle_rate_limit
  }
}

resource "aws_lambda_permission" "allow_auth_api_gateway" {
  statement_id  = "AllowExecutionFromHttpApi"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.auth_cpf.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http.execution_arn}/*/*"
}

resource "aws_lambda_permission" "allow_notify_api_gateway" {
  statement_id  = "AllowExecutionFromHttpApi"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.notify.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http.execution_arn}/*/*"
}
