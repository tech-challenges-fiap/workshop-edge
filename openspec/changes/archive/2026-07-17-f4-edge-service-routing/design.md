## Context

`workshop-edge` already has an `aws_apigatewayv2_integration` of type `HTTP_PROXY` that forwards `ANY /api/{proxy+}` to a single `APP_BASE_URL` (the `workshop-app` monolith). Phase 4 splits `workshop-app` into three services: Order Service (OS), Billing, and Execution. Each will expose its own base URL. The edge layer must route traffic to the correct service without changing Lambda handler code, auth behavior, or the notify path.

The Terraform resource model is flat (no modules), so new integrations and routes are added inline in `terraform/main.tf`, following the same pattern as `app_proxy`.

## Goals / Non-Goals

**Goals:**
- Add three `HTTP_PROXY` API Gateway integrations for OS, Billing, and Execution services.
- Add three route groups (`/os/{proxy+}`, `/billing/{proxy+}`, `/execution/{proxy+}`) that forward to their respective base URLs.
- Forward `x-request-id` from `$context.requestId` on all three new integrations, matching the `app_proxy` pattern.
- Strip the service prefix from the forwarded path (e.g., `/os/work-orders` → `/work-orders`).
- Add `OS_BASE_URL`, `BILLING_BASE_URL`, `EXECUTION_BASE_URL` as Terraform variables and supply example values.
- Keep `/api/{proxy+}` → `APP_BASE_URL` intact as a backward-compat fallback during migration.
- Update `README.md` and `docs/architecture.md` to reflect the new routes and environment inputs.

**Non-Goals:**
- Do not add Lambda handler code for the new services.
- Do not add JWT verification or authorization at the edge for the new routes (auth delegation to the upstream service is a separate change).
- Do not remove `/api/{proxy+}` in this change; deprecation and removal are follow-up scope.
- Do not create new IAM roles, VPC resources, or Secrets Manager entries for the new services.
- Do not change or duplicate the existing Datadog or CloudWatch observability configuration.

## Decisions

**Decision: HTTP_PROXY integration per service, not a single dispatch Lambda.**
Rationale: The existing `app_proxy` already uses `HTTP_PROXY`. Adding per-service integrations reuses the same pattern and avoids introducing new Lambda cold-start latency on the routing path. A dispatch Lambda would add complexity without benefit for simple URL-based routing.

**Decision: New path prefixes `/os/`, `/billing/`, `/execution/` rather than repurposing `/api/`.**
Rationale: Clients already call `/api/*`; introducing service-specific prefixes allows migration without breaking existing callers. The `/api/` fallback remains until all clients migrate.

**Decision: Strip prefix via `overwrite:path = "/$request.path.proxy"` (same as `app_proxy`).**
Rationale: Each service expects its own root-relative paths. Stripping `/os`, `/billing`, or `/execution` from the forwarded path avoids each upstream service needing to be aware of the gateway prefix. This matches the already-approved pattern used by `app_proxy`.

**Decision: One variable per service (`OS_BASE_URL`, `BILLING_BASE_URL`, `EXECUTION_BASE_URL`) rather than a map.**
Rationale: The existing variable style is flat scalar variables, not maps. Staying consistent avoids refactoring the `.tfvars` pattern used in the existing environment example files.

**Decision: Do not add `app_host_header`-style per-service host overrides in this change.**
Rationale: The existing `app_host_header` variable is already optional and defaults to deriving the host from the base URL. The same derivation will work for the new services. If a service needs an explicit host header override, that is follow-up scope.

## Risks / Trade-offs

- **Stale `/api/` fallback** → The backward-compat `app_proxy` integration remains until consumers migrate; a follow-up change must remove it once the Phase 4 microservices are stable. Risk of indefinite fallback: mitigated by labeling the variable `app_base_url` as `deprecated` in the variable description.
- **No edge-level auth on new routes** → OS, Billing, and Execution routes are unauthenticated at the gateway level in this change; upstream services must enforce their own auth until a JWT validation Lambda authorizer is added in a future change.
- **Terraform apply requires real URLs** → The new base URL variables have no sensible default and will need values in CI environments before the plan can succeed end-to-end. Example tfvars must document placeholder values clearly.

## Migration Plan

1. Merge this change into `stag`; CI applies Terraform with the new routes.
2. Consumers that need OS, Billing, or Execution begin calling `/os/*`, `/billing/*`, `/execution/*` on the edge URL.
3. Existing `/api/*` consumers are unaffected until they are ready to migrate.
4. A follow-up OpenSpec change removes the `/api/{proxy+}` route and the `app_base_url` variable once all consumers have migrated.

## Open Questions

- Should the new routes require a JWT Bearer token validated at the edge (Lambda authorizer), or should auth be fully delegated to the upstream services? (Out of scope for this change; needs a separate proposal.)
- Are OS, Billing, and Execution reachable via the same VPC and security groups as `workshop-app`, or do they have separate networking constraints? (Assumed same for now; VPC configuration is inherited from existing `lambda_vpc_enabled` logic, which is Lambda-scoped and does not affect HTTP_PROXY integrations.)
