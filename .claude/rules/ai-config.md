# AI Configuration Convention

Skills in this project read two config files:

- `config.yaml` — shared project configuration, committed to version control
- `config.local.yaml` — per-machine credentials and secrets, never committed

These files live in the AI tool directory:

| AI tool | Directory |
|---------|-----------|
| Claude Code | `.claude/` |
| Gemini CLI | `.gemini/` |
| Codex | `.codex/` |

So for Claude Code: `.claude/config.yaml` and `.claude/config.local.yaml`.

When a skill refers to `config.yaml` or `config.local.yaml` without a directory prefix, it means the file in the AI tool directory for whichever tool you are using.

See `schemas/config.schema.yaml` in the ai-marketplace repository for the full schema.
