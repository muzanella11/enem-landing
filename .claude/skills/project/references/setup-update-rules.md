# Update Mode Rules

Use these rules when `SETUP_GUIDE.md` already exists. Do NOT load the full documentation-structure.md template.

## Rules

1. Read the existing file in full before making any changes.
2. Compare detected state (dependencies, scripts, env vars, infra) against existing content.
3. Update only sections that are stale or missing information.
4. Preserve all manually written notes and custom sections.
5. Do not reformat or reorganise sections that are already correct.
6. Add a `Last Updated` line at the very top: `> Last Updated: {date} · Changes: {one-line summary}`.

## What counts as stale

- A dependency version in the Tech Stack table no longer matches `package.json`
- An env variable in `.env.example` is missing from the Environment Configuration section
- A script in `package.json` is referenced in Setup Steps but the command has changed
- A new required service (database, cache, etc.) was added but Prerequisites doesn't mention it
- A troubleshooting entry references an error that no longer applies

## What to leave alone

- Prose descriptions that are still accurate
- Manually added notes or warnings (marked with `<!-- manual -->` or unlabelled)
- Section ordering and formatting choices already in the file
