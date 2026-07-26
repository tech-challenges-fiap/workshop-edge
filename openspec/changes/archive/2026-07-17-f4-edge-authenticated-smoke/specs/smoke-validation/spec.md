## ADDED Requirements

### Requirement: Auth smoke token handling
The auth smoke script SHALL treat the `/auth/login` Bearer token as sensitive. It SHALL use the token only for configured smoke requests and SHALL NOT print the token value to logs.

#### Scenario: Token is received but not logged
- **WHEN** `/auth/login` returns `token_type = Bearer` and an `access_token`
- **THEN** the smoke script reports that a Bearer token was received
- **AND** the script does not print the token value

### Requirement: Configurable service path parsing
The auth smoke script SHALL accept `SMOKE_SERVICE_PATHS` as either a JSON string array or a comma-separated list. It SHALL normalize non-empty entries to leading-slash paths before issuing requests.

#### Scenario: JSON array parsing
- **GIVEN** `SMOKE_SERVICE_PATHS` is `["os/work-orders", "/billing/invoices"]`
- **WHEN** the smoke script parses the value
- **THEN** it produces `/os/work-orders` and `/billing/invoices`

#### Scenario: Comma-separated parsing
- **GIVEN** `SMOKE_SERVICE_PATHS` is `os/work-orders, /execution/jobs`
- **WHEN** the smoke script parses the value
- **THEN** it produces `/os/work-orders` and `/execution/jobs`
