variable "project" {
  description = "Prefixo global do challenge."
  type        = string
  default     = "workshop"
}

variable "repo" {
  description = "Slug oficial do repositorio."
  type        = string
  default     = "edge"
}

variable "environment" {
  description = "Sufixo do ambiente AWS."
  type        = string
  default     = "stag"

  validation {
    condition     = contains(["stag", "prod"], var.environment)
    error_message = "environment deve ser stag ou prod."
  }
}

variable "resource_suffix" {
  description = "Identificador do recurso principal gerado por este modulo."
  type        = string
  default     = "auth-cpf"
}

