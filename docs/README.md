# workshop-edge docs

## Ownership

- scope: API Gateway, `auth-cpf` Lambda, `notify` Lambda, and external integrations
- out of scope: application business logic, evolutionary schema, and migrations

## Initial structure

- `src/functions/`: Bun handlers for Lambdas
- `terraform/`: serverless infrastructure baseline
- `scripts/`: lightweight lint and Lambda packaging

## Environments

- branch `stag` maps to GitHub environment `staging`
- branch `prod` maps to GitHub environment `production`
- AWS naming uses `stag` and `prod` suffixes

## Expected environment variables and secrets

- `AWS_REGION`
- `AWS_ROLE_ARN`
- `EDGE_ARTIFACT_BUCKET`
- `JWT_ISSUER`
- `JWT_AUDIENCE`
- `DATADOG_API_KEY`
- `DATADOG_APP_KEY`
