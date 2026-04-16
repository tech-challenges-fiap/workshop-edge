# workshop-edge project context

## Purpose

`workshop-edge` is the edge adapter repository for the workshop split. It
should hold Lambda handlers, external contract translation, and other
integration-facing components.

## Current State

- two Lambda bootstrap handlers
- tests for both handlers
- build output in `dist/`
- zip artifacts in `artifacts/`
- Terraform naming baseline

## Adjacent Repositories

- `workshop-app`: application logic and future domain behavior
- `workshop-db`: database provisioning
- `workshop-platform`: shared infrastructure and platform capabilities

## Important Workflow

- develop on `feature/*`
- merge into `stag`
- promote from `stag` to `prod`
- validate both Lambda and Terraform changes before proposing them
