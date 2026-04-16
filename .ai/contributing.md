# AI Contributing Guide

## Checklist

- confirm the requested change belongs in `workshop-edge`
- inspect `src/functions/`, `test/`, `terraform/`, and current docs before editing
- keep docs in English
- do not claim integrations or infrastructure exist unless code or Terraform defines them
- run the relevant validation commands for the touched area
- update `README.md` or `docs/` if handlers, artifacts, commands, or workflows changed

## Review Focus

- repository boundary correctness
- handler contract accuracy
- artifact packaging accuracy
- no accidental application, database, or platform responsibility creep
