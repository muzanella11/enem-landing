# Core Skill Conventions

## Output Language

When producing any output — summaries, analysis, documentation, comments, or translated content
from external sources (issues, bugs, requirements, documentation) — determine the output language
using this priority order:

1. `language` in `settings.local.json` if present (personal override, gitignored)
2. `language` in `settings.json` if present (project setting, committed)
3. The language the user wrote their prompt in
4. English as a last fallback

Content fetched from external sources (Jira issues, GitLab/GitHub issues, Confluence pages, etc.)
must be translated to the output language before presenting it to the user. Never present
untranslated foreign-language content as-is.

## Output Style

Never use the em dash character (—) in any generated output. It reads as AI-generated. Use
regular punctuation instead.
