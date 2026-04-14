# workshop-edge

Camada de edge e integracoes serverless do projeto `workshop`.

## Proposito

Este repositorio concentra o `API Gateway`, Lambdas e contratos HTTP externos.
Ele nao contem migrations, schema evolutivo ou regra de negocio da aplicacao.

## Stack principal

- Bun
- TypeScript
- Terraform
- AWS Lambda

## Estrategia de deploy

- `feature/* -> stag`: Pull Request com Terraform, testes, build e package das Lambdas
- `stag -> prod`: Pull Request de promocao para `production`
- deploy via pipeline com OIDC para AWS

## Documentacao local

- [docs/README.md](docs/README.md)

