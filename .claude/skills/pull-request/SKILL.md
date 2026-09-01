---
name: pull-request
description: >
  Create, update, and read pull requests (GitHub) and merge requests (GitLab). Triggers on
  requests to open or update a PR/MR, or to fetch comments and review feedback on one.
---

# Pull Request

Create, update, or read pull requests (GitHub) and merge requests (GitLab).

**Available operations:**
- `create` -- open a new PR/MR from the current branch
- `update` -- edit the title, description, or other fields of an existing PR/MR
- `comments` -- fetch and display all review comments on a PR/MR

If no operation is specified, ask: "What do you want to do? (create / update / comments)"

## Build Check (required for create and update)

Before creating or updating a PR, run `yarn build` and verify it exits with code 0. If the build fails, stop, show the error, and fix it before proceeding. Do not create or update a PR with a broken build.

## Before Creating

Check which branch is active and show which commits will be in the PR. Confirm with the user before proceeding.

Show a preview:

```
Title:     <inferred from branch name or latest commit>
From:      <current-branch>
Into:      main
Commits:   <N>
Assignee:  <current user> (you)
Reviewers: (none)
```

Ask for confirmation. Do not create until the user confirms.

Always assign the PR to the user who requested it (`gh pr edit <number> --add-assignee <username>`). Get the GitHub username via `gh api /user --jq '.login'` if not already known. Ask about reviewers only if the user brings it up.

## Updating

Find the open PR/MR for the current branch. Show the current state, then ask what the user wants to change. Apply only the requested fields.

## Comments

Fetch and display all comments on a PR or MR.

**What to fetch:**

Retrieve all three types:
- **Review summaries**: approve / request-changes decisions and their accompanying message
- **Inline comments**: line-level feedback tied to specific files and line numbers
- **General comments**: top-level conversation on the PR/MR thread

**PR/MR number:**

Take it from what the user provided: URL, number, or branch context. If unclear, list open PRs on the current branch and ask the user to pick one.

**Output:**

Group in this order: review summaries first, then inline comments, then general comments. For each item show author, relative timestamp, and body. For inline comments include the file path and line number.

If a section is empty, omit it. If there are no comments at all, say so plainly.

Comments are read-only. Never post, reply to, or edit any comment.

## Credentials

Stored in `.claude/config.local.yaml` (never committed). If credentials are missing, tell the user to add them or run `core:configure`.

## Rules

- Never create a PR from main or master
- Never expose tokens in output
- Never auto-merge
- **NEVER** add AI attribution, "Generated with Claude Code", generated-by notes, Co-Authored-By trailers, or any AI mention anywhere — not in PR titles, descriptions, commit messages, or comments. This is an absolute rule with no exceptions.
- **NEVER** include issue numbers or the word "issue" in PR titles. Use plain descriptive titles only (e.g. "feat: agency portal" not "feat: agency portal (ISSUE-001)").
