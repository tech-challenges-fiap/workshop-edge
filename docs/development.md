# Developing In workshop-edge

## Prerequisites

- Bun `>= 1.3.6`
- Bash and Python 3 for Lambda ZIP packaging
- Terraform `>= 1.14.0`
- AWS credentials for Terraform plans against real AWS resources

## Local Workflow

Install dependencies:

```bash
bun install
```

Validate the Lambda code:

```bash
bun run lint
bun test
bun run build
bun run package:lambdas
```

Validate Terraform syntax and provider configuration:

```bash
cd terraform
terraform fmt -check -recursive
terraform init -backend=false
terraform validate
```

Run a local no-refresh plan when AWS credentials are available:

```bash
terraform plan -refresh=false -var-file="environments/stag/terraform.tfvars.example"
```

The example tfvars files contain placeholder values. Use real outputs from
`workshop-db` and `workshop-platform` for a deployable plan.

## What The Commands Do

- `bun run lint` runs the whitespace guard in `scripts/lint.ts`
- `bun test` executes handler tests in `test/`
- `bun run build` bundles the Lambda entrypoints for Node.js 20 into `dist/`
- `bun run package:lambdas` runs `scripts/package-lambdas.sh` and creates ZIP artifacts in `artifacts/`
- `terraform validate` checks the AWS edge infrastructure definition
- `bun run smoke:auth` authenticates by CPF and calls a protected app route

The smoke CPF must belong to an active person whose role is authorized for
`SMOKE_PROTECTED_PATH`.

## Runtime Configuration

`auth-cpf` uses:

- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_SECRET_ARN`
- `JWT_SECRET` or `JWT_SECRET_ARN`
- `JWT_ISSUER`, defaulting to `workshop-edge`
- `JWT_AUDIENCE`, defaulting to `workshop-app`
- `JWT_EXPIRES_SECONDS`, defaulting to `900`

`notify` uses:

- `NOTIFICATION_WEBHOOK_URL`, optional

Terraform wires these from variables. In GitHub Actions, set the variables on
the `staging` and `production` environments rather than hardcoding values in the
workflow.

## Branching and Delivery Expectations

- Build features from `feature/*` branches
- Open Pull Requests into `stag` for normal integration
- Promote to `prod` only from `stag`
- Expect `pr-validation.yml` to install dependencies, lint, test, build, package,
  validate Terraform, and run a staging Terraform plan
- Expect `deploy.yml` to build/package Lambdas, initialize the environment
  backend, run `terraform apply`, and execute the auth smoke test
- Expect `promotion-source.yml` and `drift-report.yml` to protect production
  promotions

## Documentation Rules

- Write all documentation in English
- Keep docs faithful to implemented code and Terraform
- When handlers, artifacts, commands, or workflows change, update the docs in the
  same change
- Do not describe integrations or infrastructure as implemented unless they exist
  in code or Terraform

## When To Update Documentation

Update documentation when you change:

- Lambda handler contracts or packaging behavior
- Terraform variables, outputs, or naming rules
- validation commands
- CI or deployment workflow behavior
- AI contributor guidance in `AGENTS.md` or `.ai/`
