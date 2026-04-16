# workshop-edge docs

This directory explains how `workshop-edge` should be developed and maintained
as a standalone edge and serverless integration repository.

## Read This First

- Start with [../README.md](../README.md) for the repository purpose, commands, and delivery flow.
- Read [architecture.md](architecture.md) before deciding where edge behavior belongs.
- Read [development.md](development.md) before changing Lambda code, packaging, or Terraform.
- Read [../AGENTS.md](../AGENTS.md) if you are using an AI agent in this repository.

## Document Map

- [architecture.md](architecture.md) - current boundaries and edge architecture guidance
- [development.md](development.md) - local workflow, validation commands, and doc rules
- [../AGENTS.md](../AGENTS.md) - repo instructions for AI agents
- [../.ai/project-context.md](../.ai/project-context.md) - compact AI-readable project context
- [../.ai/contributing.md](../.ai/contributing.md) - AI-assisted change checklist
- [../.ai/task-template.md](../.ai/task-template.md) - reusable task brief template

## Who Should Read What

- Engineers new to the repo: `README.md` then `development.md`
- Engineers deciding ownership boundaries: `architecture.md`
- AI-assisted contributors: `AGENTS.md` and `.ai/project-context.md`
