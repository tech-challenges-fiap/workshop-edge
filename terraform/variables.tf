variable "project" {
  description = "Global challenge prefix."
  type        = string
  default     = "workshop"
}

variable "repo" {
  description = "Official repository slug."
  type        = string
  default     = "edge"
}

variable "environment" {
  description = "AWS environment suffix."
  type        = string
  default     = "stag"

  validation {
    condition     = contains(["stag", "prod"], var.environment)
    error_message = "environment must be stag or prod."
  }
}

variable "aws_region" {
  description = "AWS region used by the provider and backend."
  type        = string
  default     = "us-east-1"
}

variable "auth_resource_suffix" {
  description = "Identifier suffix for the auth CPF Lambda."
  type        = string
  default     = "auth-cpf"
}

variable "notify_resource_suffix" {
  description = "Identifier suffix for the notification Lambda."
  type        = string
  default     = "notify"
}

variable "app_base_url" {
  description = "Base URL of workshop-app ingress for this environment, without the /api prefix."
  type        = string
  default     = "https://workshop-app.example.invalid"

  validation {
    condition     = can(regex("^https?://", var.app_base_url))
    error_message = "app_base_url must start with http:// or https://."
  }
}

variable "db_host" {
  description = "PostgreSQL host exposed by workshop-db."
  type        = string
  default     = ""
}

variable "db_port" {
  description = "PostgreSQL port exposed by workshop-db."
  type        = number
  default     = 5432
}

variable "db_name" {
  description = "PostgreSQL database name exposed by workshop-db."
  type        = string
  default     = "workshop"
}

variable "db_secret_arn" {
  description = "Secrets Manager ARN containing PostgreSQL credentials from workshop-db."
  type        = string
  default     = ""
}

variable "jwt_secret_arn" {
  description = "Secrets Manager ARN containing the HS256 JWT signing secret shared with workshop-app."
  type        = string
  default     = ""
}

variable "jwt_issuer" {
  description = "Issuer claim used by auth-cpf and validated by workshop-app."
  type        = string
  default     = "workshop-edge"
}

variable "jwt_audience" {
  description = "Audience claim used by auth-cpf and validated by workshop-app."
  type        = string
  default     = "workshop-app"
}

variable "jwt_expires_seconds" {
  description = "JWT lifetime in seconds."
  type        = number
  default     = 900
}

variable "notification_webhook_url" {
  description = "Optional external notification provider URL used by notify."
  type        = string
  default     = ""
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for Lambda VPC access to RDS. Leave empty only for non-networked validation."
  type        = list(string)
  default     = []
}

variable "lambda_security_group_ids" {
  description = "Security group IDs attached to Lambdas when private_subnet_ids are set."
  type        = list(string)
  default     = []
}

variable "lambda_memory_size" {
  description = "Lambda memory in MB."
  type        = number
  default     = 256
}

variable "lambda_timeout_seconds" {
  description = "Lambda timeout in seconds."
  type        = number
  default     = 15
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days."
  type        = number
  default     = 14
}

variable "api_throttle_burst_limit" {
  description = "HTTP API default route burst throttle."
  type        = number
  default     = 100
}

variable "api_throttle_rate_limit" {
  description = "HTTP API default route steady-state requests per second."
  type        = number
  default     = 50
}

variable "cors_allow_origins" {
  description = "Origins allowed by the edge HTTP API."
  type        = list(string)
  default     = ["*"]
}

variable "extra_lambda_environment" {
  description = "Additional environment variables injected into both Lambdas."
  type        = map(string)
  default     = {}
}
