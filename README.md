# workshop-edge

Edge layer and serverless integrations for the `workshop` project.

## Purpose

This repository owns the `API Gateway`, Lambdas, and external HTTP contracts.
It does not contain migrations, evolutionary schema, or application business logic.

## Main stack

- Bun
- TypeScript
- Terraform
- AWS Lambda

## Deployment strategy

- `feature/* -> stag`: Pull Request with Terraform, tests, build, and Lambda packaging
- `stag -> prod`: promotion Pull Request into `production`
- pipeline-based deployment with AWS OIDC

## Local documentation

- [docs/README.md](docs/README.md)
