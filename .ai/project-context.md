# workshop-edge project context

## Purpose

`workshop-edge` is the edge adapter repository. It holds Lambda handlers,
external contract translation, and other integration-facing components.

## Current State

- two Lambda bootstrap handlers
- tests for both handlers
- build output in `dist/`
- zip artifacts in `artifacts/`
- Terraform naming baseline

## Operating Constraint

- keep the repository focused on edge adapters and entrypoints
- treat core application logic and infrastructure provisioning as out of scope
- document only integrations and contracts defined here

## Important Workflow

- develop on `feature/*`
- merge into `stag`
- promote from `stag` to `prod`
- validate both Lambda and Terraform changes before proposing them
