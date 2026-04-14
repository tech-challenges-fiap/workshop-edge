# workshop-edge docs

## Ownership

- escopo: API Gateway, Lambda `auth-cpf`, Lambda `notify` e integracoes externas
- fora do escopo: regra de negocio da aplicacao, schema evolutivo e migrations

## Estrutura inicial

- `src/functions/`: handlers Bun para Lambdas
- `terraform/`: baseline de infraestrutura serverless
- `scripts/`: lint leve e empacotamento das Lambdas

## Ambientes

- branch `stag` mapeada para GitHub environment `staging`
- branch `prod` mapeada para GitHub environment `production`
- naming AWS com sufixos `stag` e `prod`

## Variaveis e secrets esperados por ambiente

- `AWS_REGION`
- `AWS_ROLE_ARN`
- `EDGE_ARTIFACT_BUCKET`
- `JWT_ISSUER`
- `JWT_AUDIENCE`
- `DATADOG_API_KEY`
- `DATADOG_APP_KEY`

