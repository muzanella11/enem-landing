---
name: smart-git
description: >
  Guided git workflows for everyday operations: commit, push, branch, log, diff, sync,
  stash, revert, amend, blame, conflict resolution, status, tagging, releases, changelog,
  cleanup, merge, and rebase. Triggers on any git action request: commit, push, branch,
  tag, release, merge, rebase, stash, diff, blame, status, sync, clean, or gitignore.
---

# Smart Git

Safe, guided workflows for common git operations. Jump to the relevant section based on what the user wants to do.

**Available operations:**
`commit` `push` `branch` `log` `diff` `sync` `stash` `revert` `amend` `blame` `conflict` `restore` `status` `tag` `release` `changelog` `clean` `ignore` `merge` `rebase`

If no operation is specified, ask: "What do you want to do? (commit / push / branch / log / diff / sync / stash / revert / amend / blame / conflict / restore / status / tag / release / changelog / clean / ignore / merge / rebase)"

Before any operation that modifies the repo state (commit, push, merge, rebase, sync, release), show the current branch and confirm with the user before proceeding. If they say no, stop and suggest switching first.

---

## Commit

Analyze the actual diff, generate a commit message that matches the project's convention, preview it for approval, then commit.

Load `references/commit/conventional-commits.md` for type definitions, scope rules, and message examples.

### Step 1 - Check What's Staged

```bash
git status --short
```

- **Files staged** (`M`/`A`/`D` in green) -> use staged diff only
- **Nothing staged, files modified** -> ask: "Nothing's staged yet. Stage everything (`git add -A`) or specific files?"
  - "everything" -> run `git add -A`, confirm what was staged
  - User names files -> run `git add <files>`, confirm
- **Clean tree** -> respond: "Nothing to commit: working tree is clean." and stop.

### Step 2 - Analyze the Diff

```bash
git diff --staged --stat
git diff --staged
```

- Which files changed and in which module/layer?
- What was added / removed / modified?
- What is the **intent**? (new capability, bug fix, cleanup, config change, etc.)
- Is it a single cohesive change, or multiple unrelated changes mixed together?

If the diff touches clearly unrelated areas, flag it:
> "These changes look like they cover multiple concerns: consider splitting into separate commits for cleaner history. Want to proceed with one message, or split?"

### Step 3 - Check Project Convention

```bash
git log --oneline -8
```

Match style of recent commits. Note: this project uses lowercase `type: description` with no scope parentheses.

### Step 4 - Generate Commit Message

Generate a message grounded in the diff: not a generic file summary.

**Rules:**
- Subject line: max 72 chars, lowercase, no trailing period
- Format: `type: description`
- Be specific: describe the behavior/intent, not just the file name
- Add a body only for complex or multi-part changes

See `references/commit/conventional-commits.md` for the full type reference and examples.

### Step 5 - Preview and Confirm

Show the proposal clearly before doing anything:

```
+-----------------------------------------------------+
|  Proposed commit message                            |
|                                                     |
|  feat: add department and purpose CRUD with         |
|        sort order management                        |
|                                                     |
|  Staged files (2):                                  |
|    M  apps/backend/.../department.service.ts        |
|    M  apps/backend/.../purpose.service.ts           |
+-----------------------------------------------------+

Confirm? yes / edit / cancel
```

- **yes / ok / lgtm** -> proceed to Step 6
- **edit** -> ask for the corrected message, re-show preview
- **cancel / no** -> stop, leave files as-is, do not commit

### Step 6 - Pre-commit Quality Check

Run ESLint across all projects first:

```bash
yarn lint
```

- **Passes** -> proceed to format check
- **Fails** -> STOP. Show the full error output. Do not proceed. Ask: "Fix lint errors first, then retry commit."
  - To auto-fix: `yarn lint:fix` (fixes safe issues only; manual fixes may still be needed)

Then run Prettier format check:

```bash
yarn lint:format
```

- **Passes** -> proceed to Step 7
- **Fails** -> STOP. Show the files with format issues. Offer: "Run `yarn lint:format:fix` to auto-fix? yes / skip"
  - If yes: run `yarn lint:format:fix`, then re-run `yarn lint:format` to confirm it passes, re-stage any modified files, then continue to Step 7.
  - If skip: stop and do not commit.

> These scripts run all four projects (mau-account-api, mau-topup-api, mau-account-web, mau-topup-web) in sequence.
> To run a single project: `yarn nx:lint:<project>` or `yarn nx:lint:format:<project>`.

### Step 7 - Commit

```bash
git commit -m "<confirmed message>"
```

Show git's output. On success:
```
+  <short hash>  <message>
```

On failure: show the full error and stop:  do not retry automatically.

**Safety Rules:**
- Never amend published commits
- If `.env`, credential files, or private keys appear in the staged list, warn immediately and stop
- If the diff is ambiguous, ask before generating a message
- Never add Co-Authored-By, generated-by, or any AI attribution to commit messages

---

## Push

Safely push local commits to the remote repository with branch protection checks, upstream tracking, and force-push safety.

### Step 1 - Check Working Tree and Commits

```bash
git status --short
git log --oneline -5
```

- **Nothing to push (no ahead commits)** -> report: "Nothing to push: branch is up to date with remote." and stop.
- **Uncommitted changes present** -> warn: "You have uncommitted changes. These will NOT be pushed (only commits are pushed). Continue? yes / no"

### Step 2 - Check Remote Tracking

```bash
git remote -v
git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null || echo "NO_UPSTREAM"
```

- **Upstream set** -> proceed to Step 3
- **No upstream** -> show:

```
No upstream branch set for `<branch>`.

Suggested: git push -u origin <branch>

Push and set upstream to origin/<branch>? yes / cancel
```

On yes: run `git push -u origin <branch>` and skip to Step 5.

### Step 3 - Divergence Check

```bash
git fetch origin
git status -sb
```

Show ahead/behind status:

```
+----------------------------------------------+
|  Push status                                 |
|                                              |
|  Branch:   feat/ISS-42-add-login             |
|  Remote:   origin/feat/ISS-42-add-login      |
|                                              |
|  Ahead:   3 commits (will be pushed)         |
|  Behind:  0 commits                          |
+----------------------------------------------+
```

Cases:
- **Ahead only** -> safe, proceed to Step 4
- **Behind only** -> STOP: "Branch is behind remote. Run sync first to avoid overwriting upstream changes."
- **Ahead and behind** -> WARN: "Branch has diverged from remote (ahead X, behind Y). A regular push will be rejected. Options below." -> go to Diverged Flow

**Diverged Flow:**

```
Branch has diverged. Choose how to proceed:

  [1] Rebase first (recommended): sync, then re-push
  [2] Force push with lease (safer --force):  only if you own this branch
  [3] Cancel

Choice:
```

- **1** -> stop. Suggest running sync first.
- **2** -> go to Force Push Flow
- **3** -> stop

**Force Push Flow:**

```
Force push will overwrite remote history for `<branch>`.
   This is safe only if no one else is working on this branch.

   Using --force-with-lease (safer than --force):
   Will abort if someone else has pushed since your last fetch.

Confirm force push? yes (risky) / cancel
```

On yes: run `git push --force-with-lease origin <branch>` -> go to Step 5.
On cancel: stop.

### Step 4 - Protected Branch Warning

If branch matches `main`, `master`, `develop`, `release/*`, or `hotfix/*`:

```
You are pushing directly to `<branch>`: a protected branch.
   Usually changes should go through a pull request.

   Continue with direct push? yes / cancel
```

- **yes** -> proceed
- **cancel** -> stop. Suggest: "Create a feature branch or use the pull-request skill to open a PR."

### Step 5 - Execute Push

```bash
git push origin <branch>
```

Show full push output.

On success:
```
+--------------------------------------------------+
|  Push complete                                   |
|                                                  |
|  Branch:   feat/ISS-42-add-login                 |
|  Remote:   origin/feat/ISS-42-add-login          |
|  Commits:  3 pushed                              |
|                                                  |
|  Next: open a pull request? -> invoke pull-request |
+--------------------------------------------------+
```

On failure: show the full git error and stop. Do not retry automatically.

**Safety Rules:**
- Never use `--force`:  always use `--force-with-lease` if force is needed
- Never push to main/master/develop without explicit user confirmation
- Never push if behind remote without sync first

---

## Branch

Create, switch, and manage git branches with consistent naming conventions and stash safety.

If the user's intent is ambiguous, ask: "Create a new branch, switch to an existing one, or list branches?"

### Create Mode

**Step 1 - Gather Branch Info**

If user provided a ticket/issue ID (e.g. `ISS-123`, `#42`):
- Prompt: "Branch name or ticket title?" (to generate the slug)

If user provided a description directly, use it.

**Step 2 - Generate Branch Name**

Apply this naming convention:
```
<type>/<ticket-id>-<slug>
```

Examples:
- `feat/ISS-123-add-login-page`
- `fix/42-null-pointer-on-checkout`
- `chore/update-dependencies`

Use the standard type prefix (feat, fix, hotfix, refactor, docs, chore, release) based on the intent.

Rules for the slug:
- Lowercase only
- Replace spaces and special chars with `-`
- Max 40 chars for the slug part
- No trailing dashes

**Step 3 - Preview and Confirm**

```
+-----------------------------------------+
|  New branch                             |
|                                         |
|  feat/ISS-123-add-login-page            |
|                                         |
|  Base: main (up to date)                |
+-----------------------------------------+

Confirm? yes / edit / cancel
```

- **yes** -> proceed to Step 4
- **edit** -> ask for corrected name
- **cancel** -> stop

**Step 4 - Create and Checkout**

```bash
git checkout -b <branch-name>
```

Show result. Confirm the new branch is active with `git branch --show-current`.

### Switch Mode

**Step 1 - Check for Uncommitted Changes**

```bash
git status --short
```

If dirty: "You have uncommitted changes. Stash them before switching? yes / no"
- **yes** -> `git stash push -m "auto-stash before switch"`
- **no** -> proceed (git will warn if switch is blocked)

**Step 2 - List and Select Branch**

```bash
git branch -a --sort=-committerdate
```

Display a numbered list of local branches (skip remote-only unless user asks). User picks by number or name.

**Step 3 - Switch**

```bash
git checkout <branch>
```

If stashed in Step 1, offer: "Restore stashed changes? yes / no"

### List Mode

```bash
git branch -a --sort=-committerdate --format="%(refname:short) | %(committerdate:relative) | %(subject)"
```

Display as a formatted table with local branches first, then remotes. Highlight current branch.

**Safety Rules:**
- Never delete or force-switch without explicit user confirmation
- Always check for dirty state before switching
- Never create a branch that already exists:  check first with `git branch --list <name>`

---

## Log

Display git commit history as a readable, grouped summary: not a raw commit list.

Default to last 20 commits if no scope is specified.

### Step 1 - Determine Range



```bash
# Last N commits
git log --oneline -20

# Since last tag
git log $(git describe --tags --abbrev=0)..HEAD --oneline

# Current branch vs main
git log main..HEAD --oneline

# Date range
git log --since="1 week ago" --oneline
```

### Step 2 - Group by Type

Read all commits. Group them by conventional commit type:

```
FEATURES
  feat: add department CRUD with sort order management
  feat: add email template plugin with CRUD routes

BUG FIXES
  fix: null pointer on checkout page
  fix: use generic "others" label for other department

MAINTENANCE
  chore: update dependencies
  refactor: extract shared auth middleware
  docs: update API reference
```

If no conventional commit format detected, group by date (today / this week / older).

### Step 3 - Show Summary Panel

```
+------------------------------------------------------+
|  Commit history  .  main  .  last 20 commits         |
|                                                      |
|  FEATURES (2)                                        |
|    + add department CRUD           86e0ce0  2d ago   |
|    + add email template plugin     f42168e  3d ago   |
|                                                      |
|  BUG FIXES (2)                                       |
|    * null pointer on checkout      908e8ad  5d ago   |
|    * wrong label for departments   2ee5ace  1w ago   |
|                                                      |
|  MAINTENANCE (3)                                     |
|    ~ update dependencies           1b0b9f4  1w ago   |
|    ~ extract auth middleware       6ee43d1  1w ago   |
|    ~ update API reference          33cbe0c  2w ago   |
+------------------------------------------------------+
```

Legend: `+` feat, `*` fix/hotfix, `~` chore/refactor/docs, `!` breaking

### Step 4 - Offer Drill-down

```
Actions: [d] drill into a commit  [f] filter by type  [r] show raw log  [q] quit
```

- **d** -> ask which commit hash, then show `git show <hash> --stat`
- **f** -> ask which type to filter, re-render grouped view
- **r** -> run `git log --oneline` raw for the same range
- **q** -> stop

**Safety Rules:** Read-only:  no modifications to history.

---

## Diff

Compare two branches, commits, or tags and present a functional summary of what changed.

### Step 1 - Identify Targets

Determine the two refs to compare from context. If unclear, ask: "Compare which two branches/commits?"

### Step 2 - Get Stats


```bash
git diff <base>..<target> --stat
git diff <base>..<target> --shortstat
```

Show a summary: X files changed, Y insertions, Z deletions.

### Step 3 - Analyze Changes Functionally

```bash
git diff <base>..<target> --name-only
git diff <base>..<target>
```

Read the full diff. Group changes by area/module, not just by file. For each group, describe what functionally changed:

```
ADDED
  + Department CRUD endpoints (3 files in apps/backend/src/department/)
  + Email template management (5 files in apps/backend/src/email-template/)

MODIFIED
  ~ Auth service: added JWT refresh token support
  ~ User model: added department_id foreign key

REMOVED
  - Legacy sync endpoint (apps/backend/src/sync/sync.controller.ts)

CONFIG / INFRA
  ~ package.json: bumped 3 dependencies
  ~ docker-compose.yml: added redis service
```

### Step 4 - Risk Assessment

Flag any high-risk changes:
- Database schema changes (migrations)
- Auth/security-related files
- Shared utilities/base classes with wide usage
- Breaking API changes (endpoint removed or signature changed)

```
RISK FLAGS
  ! apps/backend/src/database/migrations/: schema changes, review migration order
  ! apps/backend/src/auth/: security-sensitive changes
```

### Step 5 - Display Summary Panel

```
+----------------------------------------------------------+
|  Diff: main..feature/add-department                      |
|                                                          |
|  12 files changed  +347 insertions  -28 deletions        |
|                                                          |
|  ADDED         Department CRUD, Email template module    |
|  MODIFIED      Auth service, User model                  |
|  REMOVED       Legacy sync endpoint                      |
|  CONFIG        3 dep bumps, docker redis                 |
|                                                          |
|  RISK FLAGS    migrations, auth changes                  |
+----------------------------------------------------------+
```

### Step 6 - Offer Drill-down

```
Actions: [f] show diff for a specific file  [r] show raw diff  [q] quit
```

- **f** -> ask which file, then show `git diff <base>..<target> -- <file>`
- **r** -> show full raw diff output
- **q** -> stop

**Safety Rules:**
- Read-only:  no modifications
- Never show the full raw diff by default for large changesets (>50 files): summarize and offer drill-down

---

## Sync

Safely update the current branch from both its remote upstream and the base branch, using rebase to keep PR history clean.

Load `references/sync/sync-strategy.md` for the rationale behind this strategy and guidance on explaining force push policy to stakeholders.

### Step 1 - Check Working Tree State

```bash
git status --short
git branch --show-current
```

- **On main/master** -> warn: "You are on the base branch. Sync will only pull from remote." Then skip to Step 3.
- **Clean tree** -> proceed directly to Step 3
- **Uncommitted changes** -> auto-stash before pulling (Step 2)

### Step 2 - Auto-Stash (if dirty)

```bash
git stash push -m "smart-sync: auto-stash before pull"
```

Confirm stash was created. If stash fails, stop and report: do not proceed.

### Step 3 - Pull Remote Upstream

Pull latest changes from the remote tracking branch:

```bash
git pull --rebase
```

Evaluate result:
- **Success** -> proceed to Step 4
- **Conflict** -> stop immediately:
  - Show conflicted files: `git diff --name-only --diff-filter=U`
  - Report: "Rebase conflict on remote pull. Resolve conflicts, then run `git rebase --continue`. Or invoke the conflict section to resolve interactively."
  - Do NOT unstash: leave state for developer to resolve
- **No upstream** -> report: "No upstream configured. Run `git push -u origin <branch>` first." Then skip to Step 4.

### Step 4 - Detect Base Branch

```bash
git remote show origin | grep "HEAD branch"
```

- Use the detected default branch (usually `main` or `master`) as the base
- If on the base branch itself, skip to Step 5

Fetch latest base branch from remote:

```bash
git fetch origin <base-branch>
```

Check if the current branch is already up to date with the base:

```bash
git log HEAD..origin/<base-branch> --oneline
```

- **No new commits** -> skip rebase, note "Already up to date with `<base-branch>`"
- **New commits exist** -> proceed to Step 4b

### Step 4b - Rebase onto Base Branch

```bash
git rebase origin/<base-branch>
```

Evaluate result:
- **Success** -> proceed to Step 5
- **Conflict** -> stop immediately:
  - Show conflicted files: `git diff --name-only --diff-filter=U`
  - Report: "Rebase conflict against `<base-branch>`. Resolve conflicts, then run `git rebase --continue`. Or invoke the conflict section to resolve interactively."
  - Do NOT unstash: leave state for developer to resolve

### Step 5 - Unstash (if stashed)

If Step 2 ran, restore stashed changes:

```bash
git stash pop
```

If pop causes conflict:
- Show conflicted files
- Report: "Stash pop conflict. Your stashed changes conflict with pulled changes. Use the conflict section to resolve."

### Step 6 - Summary

```
+-------------------------------------------------+
|  Branch synced                                  |
|                                                 |
|  Branch:   feature/my-branch                   |
|  Remote:   rebased, 3 new commits from upstream |
|  Base:     rebased onto origin/main (+2 commits)|
|  Stash:    auto-stashed and restored            |
+-------------------------------------------------+
```

Show the last 3 commits with `git log --oneline -3`.

After rebase, the local branch has diverged from remote. Inform the user:

```
Branch has been rebased. To push, run:
  git push --force-with-lease

This is safe on feature branches. See references/sync/sync-strategy.md for details.
```

**Safety Rules:**
- Rebase is used for feature branches only: never rebase main/master
- Always use `--force-with-lease`, never `--force`
- Never discard stash: always pop after successful rebase
- If any step fails, stop and report clearly: do not continue silently
- If on main/master, only pull from remote: do not rebase onto itself
- Always fetch base branch before rebasing to ensure latest state

---

## Stash

Manage git stash interactively. Always show stash contents before acting.

If the intent is ambiguous, list the stash first and then ask what to do.

**SAVE:**

Show what will be stashed:
```bash
git status --short
```
If working tree is clean -> respond: "Nothing to stash: working tree is clean." and stop.

Ask for stash message:
```
Stash message? (press Enter to use default: "WIP on <branch>")
```

Confirm:
```
Will stash:
  Modified: <files>
  Untracked: <files if -u>

Include untracked files? yes / no (default: no)
Confirm stash? yes / cancel
```

Execute:
```bash
git stash push -m "<message>"
# or with untracked:
git stash push -u -m "<message>"
```

**LIST:**

```bash
git stash list
```

If empty -> "Stash is empty." and stop.

For each entry:
```bash
git stash show -p stash@{N}
```

Display as a readable summary showing stash index, branch, message, and changed files.

**POP:**

List stashes first, then ask:
```
Which stash to pop? Enter number (0, 1, 2...) or "latest" for stash@{0}
```

Confirm and execute:
```bash
git stash pop stash@{N}
```

Show result. If conflict occurs: show the conflicted files clearly and stop:  do not auto-resolve.

**APPLY:**

Same as POP but runs:
```bash
git stash apply stash@{N}
```

**DROP:**

List stashes, ask which to drop. Warn clearly:  this is irreversible. Execute:
```bash
git stash drop stash@{N}
# or all:
git stash clear
```

**CLEAR:**

Treat as DROP with "all" selected. Always show full stash list before confirming.

**Safety Rules:**
- Never pop or apply without showing stash contents first
- Never drop or clear without an explicit confirmation: these are irreversible
- On merge conflict after pop/apply: stop immediately, show conflicted files, do not attempt auto-resolution
- Never stash in a bare repository

---

## Revert

Safely undo a commit by creating a new revert commit, with preview and confirmation.

### Step 1 - Identify Target Commit

Determine which commit to revert from user context:
- If user said "last commit" or "latest" -> use `HEAD`
- If user provided a hash or reference -> use that
- If unclear -> show recent commits and ask:

```bash
git log --oneline -10
```

### Step 2 - Preview What Will Be Undone

```bash
git show <hash> --stat
git show <hash>
```

Display a clear summary of what the revert will undo. Show a preview panel with commit hash, author, date, message, and files affected. Confirm before proceeding.

### Step 3 - Check for Conflicts

Before reverting, check if this commit's changes can be cleanly reverted:

```bash
git revert --no-commit <hash>
git diff --cached --stat
git revert --abort
```

If conflicts are detected, warn: "This revert will produce conflicts in: `<files>`. Proceed anyway and resolve manually? yes / cancel"

### Step 4 - Execute Revert

```bash
git revert <hash>
```

If conflict occurs during revert:
- Show conflicted files
- Report: "Resolve conflicts, then run `git revert --continue`. Or use the conflict section to resolve interactively."
- Stop here.

### Step 5 - Confirm Result

On success:
```
Revert commit created

  <new-hash>  Revert "feat: add department CRUD with sort order"

Push to remote? yes / no
```

**Safety Rules:**
- Never use `git reset` to undo:  always create a revert commit to preserve history
- Never revert a merge commit without warning: "This is a merge commit. Reverting requires specifying a parent (-m). Proceed? yes / cancel"
- Always show diff before reverting:  never revert blindly
- Never push without explicit user confirmation

---

## Amend

Safely modify the most recent local commit: message, staged files, or both.

### Step 1 - Safety Check: Is Commit Published?

```bash
git status
git log --oneline -3
git log origin/$(git branch --show-current)..HEAD --oneline 2>/dev/null
```

Check if HEAD is ahead of the remote tracking branch:
- **HEAD is ahead of remote** (unpublished) -> safe to amend, proceed
- **HEAD is at remote** (already pushed) -> STOP and warn about rewriting history. Default: cancel unless user explicitly confirms.

### Step 2 - Show Current Commit

```bash
git show HEAD --stat
```

Display the current last commit clearly with message, author, date, and files.

### Step 3 - Determine Amend Type

Ask: "What do you want to change? message / add files / both"

### Step 4 - Execute Amend

```bash
# Message only
git commit --amend -m "<new message>"

# Add staged files only (keep old message)
git commit --amend --no-edit

# Both
git commit --amend -m "<new message>"
```

Show result. Confirm new HEAD with `git log --oneline -3`.

**Safety Rules:**
- Never amend a commit that is already on the remote without explicit confirmation
- Always show the current commit before amending:  never modify blindly

---

## Blame

Show who last modified lines or sections of a file, enriched with commit context.

### Step 1 - Identify Target

Determine from context what to blame:
- If the user referenced a file path -> use that file
- If the user referenced a line number or function name -> use that file + range
- If unclear -> ask: "Which file (and line range if any)?"

### Step 2 - Run Blame


```bash
# Full file
git blame <file>

# Specific line range
git blame -L <start>,<end> <file>

# Ignore whitespace changes
git blame -w <file>
```

### Step 3 - Enrich with Commit Context

For each unique commit hash in the blame output, fetch commit details:

```bash
git show <hash> --no-patch --format="%H|%an|%ae|%ad|%s" --date=short
```

Build a lookup table: hash -> author, date, subject.

### Step 4 - Display Enriched Blame

Present a readable annotated view with line numbers, hash, author, date, and commit subject. Group consecutive lines from the same commit.

### Step 5 - Offer Drill-down

```
Actions: [c] show full commit  [h] blame history of a line  [q] quit
```

- **c** -> ask which hash, then show `git show <hash> --stat`
- **h** -> run `git log -p -L <line>,<line>:<file>` to show line evolution over time
- **q** -> stop

**Safety Rules:**
- Read-only:  no modifications
- If file is large (>500 lines) and no range given, ask: "Show full file blame or a specific line range?"

---

## Conflict

Detect conflicted files, explain each conflict clearly, resolve interactively, then stage and commit.

### Step 1 - Detect Conflicts

```bash
git status --short
```

Collect all files with conflict markers: they appear as `UU`, `AA`, `DD`, `AU`, `UA` in git status.

Also check for conflicts from rebase/cherry-pick:
```bash
git ls-files --unmerged | cut -f2 | sort -u
```

If no conflicts found -> respond: "No conflicts detected: working tree is clean." and stop.

Detect the operation that caused conflicts:
```bash
test -d .git/rebase-merge || test -d .git/rebase-apply && echo "REBASE" || \
test -f .git/MERGE_HEAD && echo "MERGE" || \
test -f .git/CHERRY_PICK_HEAD && echo "CHERRY-PICK" || echo "UNKNOWN"
```

Announce context: "You're mid-rebase." / "You're mid-merge." / "You're mid-cherry-pick."

### Step 2 - Analyze Each Conflicted File

For each conflicted file, run visibly:
```bash
git diff --diff-filter=U -- <file>
```

Parse each conflict block (OURS vs THEIRS). For each block, display a structured breakdown showing both sides and an explanation of what changed.

### Step 3 - Resolve Conflicts

Apply the user's choice per block:

**Option 1 - Keep OURS:** Remove conflict markers, keep only the `HEAD` section.

**Option 2 - Keep THEIRS:** Remove conflict markers, keep only the incoming section.

**Option 3 - Keep BOTH:** Remove conflict markers, keep both sections concatenated (ours first).

**Option 4 - Edit manually:** Wait for "done", then re-read the file to verify no conflict markers remain:
```bash
grep -n "<<<<<<\|=======\|>>>>>>" <file>
```
If markers still found -> show their line numbers and ask again.

After each file is fully resolved, run:
```bash
git add <file>
```

### Step 4 - Verify All Resolved

```bash
git status --short
git ls-files --unmerged
```

If all resolved, show summary of files and conflicts resolved.

### Step 5 - Complete the Operation

**Mid-merge:** Offer to run `git commit`.

**Mid-rebase:** Ask to run `git rebase --continue`.

**Mid-cherry-pick:** Ask to run `git cherry-pick --continue`.

If user says yes -> run the continue command visibly and show output.

**Safety Rules:**
- Never auto-resolve conflicts without showing both sides first
- Never choose a resolution without explicit user confirmation per block
- On "edit manually":  always re-verify the file has no remaining conflict markers before staging
- If a conflict block is inside a critical file (migration, schema, auth): call it out explicitly before presenting options
- Never run `git rebase --abort` or `git merge --abort` unless the user explicitly requests it

---

## Restore Staged

Show staged files, let the user select which to unstage, then run `git restore --staged`.

### Step 1 - Check Staged Files

```bash
git status --short
```

- **Files staged** -> collect them
- **Nothing staged** -> respond: "Nothing staged: working tree has no staged changes." and stop.

### Step 2 - Display Staged List

Show a numbered list of all staged files, grouped by status (Modified, Added, etc.).

```
Which files to unstage? Enter numbers (e.g. 1 3), "all", or "none" to cancel.
```

### Step 3 - Confirm Selection

Show a clean confirmation of files to unstage. Let user confirm or edit.

### Step 4 - Unstage

```bash
git restore --staged <file1> <file2> ...
# or for all:
git restore --staged .
```

Then confirm the result:
```bash
git status --short
```

**Safety Rules:**
- Never discard working directory changes: `git restore --staged` only moves files out of the index, it does NOT touch the actual file content
- Never run `git restore` (without `--staged`): that would overwrite uncommitted changes
- If the user says "restore" ambiguously, always clarify: unstage only, or also discard working changes?

---

## Status

Display a rich git status panel, then present a contextual action menu based on what's actually in the repository.

### Step 1 - Run the Status Script

Announce: **"Checking repo state..."**

Run:
```bash
python .claude/skills/smart-git/scripts/smart_status.py
```

Run from the repo root. Show the full output to the user exactly as printed:  do not summarize or truncate it.

The last line of output will be a `#STATE:` comment with comma-separated flags. Parse this line silently:  do not display it. Extract the flags to build the action menu in Step 2.

**Possible flags:**
- `HAS_CONFLICTS`: merge conflicts present
- `HAS_STAGED`: files staged for commit
- `HAS_UNSTAGED`: modified but unstaged files
- `HAS_UNTRACKED`: new untracked files
- `HAS_AHEAD`: local commits not yet pushed
- `HAS_BEHIND`: remote commits not yet pulled
- `HAS_STASH`: stash entries exist
- `HAS_SPECIAL_STATE`: merge/rebase/cherry-pick in progress
- `NO_REMOTE`: branch has no remote tracking

### Step 2 - Build Dynamic Action Menu

Build a contextual action menu based on the `#STATE:` flags.

**Rules:**
- Only show actions that are relevant to the current state
- If `HAS_CONFLICTS` -> **always show conflict resolution first**, de-prioritize commit
- If working tree is clean and no special state -> show a minimal menu
- Group by category, use numbered options starting from 1
- Always include `[0] Nothing: close status` as the last option

**Menu template (adapt based on active flags):**

```
+--------------------------------------------------------------------------+
|  What would you like to do?                                              |
|                                                                          |
|  [shown only if HAS_CONFLICTS]                                           |
|  -- Resolve First --------------------------------------------------------|
|  [1] Resolve conflicts                                                   |
|                                                                          |
|  [shown if HAS_STAGED or HAS_UNSTAGED or HAS_UNTRACKED]                  |
|  -- Stage & Commit --------------------------------------------------------|
|  [1] Smart commit          ->  generate message & commit staged files    |
|  [2] Restore staged        ->  unstage files interactively               |
|  [3] Smart ignore          ->  add untracked paths to .gitignore         |
|                                                                          |
|  [shown if HAS_AHEAD]                                                    |
|  -- Push ------------------------------------------------------------------|
|  [4] Smart pull request    ->  generate PR title & description           |
|  [5] Push to remote        ->  git push (confirm first)                  |
|                                                                          |
|  [shown if HAS_BEHIND]                                                   |
|  -- Pull ------------------------------------------------------------------|
|  [6] Pull latest           ->  git pull (confirm first)                  |
|                                                                          |
|  [shown if HAS_STASH]                                                    |
|  -- Stash -----------------------------------------------------------------|
|  [7] Smart stash           ->  list / pop / apply / drop stash           |
|                                                                          |
|  -- Other -----------------------------------------------------------------|
|  [8] Review my changes     ->  full code review                          |
|  [0] Nothing               ->  close                                     |
+--------------------------------------------------------------------------+
```

Re-number options sequentially after filtering:  no gaps.

### Step 3 - Handle User Choice

| Choice | Action |
|--------|--------|
| Resolve conflicts | Run the Conflict section above |
| Smart commit | Run the Commit section above |
| Restore staged | Run the Restore Staged section above |
| Smart ignore | Run the Ignore section below |
| Smart pull request | Invoke skill `pull-request` |
| Push to remote | Confirm first, then run `git push` |
| Pull latest | Confirm first, then run `git pull` |
| Smart stash | Run the Stash section above |
| Review my changes | Invoke skill `code-review` |
| Nothing / 0 | Acknowledge and stop |

After completing any action, offer to re-run status to show the updated state.

**Special State Handling:**

- `HAS_CONFLICTS`: Open with "There are merge conflicts: let's resolve those first."
- `HAS_SPECIAL_STATE`: Open with "Looks like a [merge/rebase/cherry-pick] is in progress."
- `NO_REMOTE`: Don't offer push or pull actions.
- Clean tree: Show a minimal menu.

---

## Tag

Create a semantic version tag based on commit history, preview it, then push to remote.

### Step 1 - Detect Current Version

```bash
git tag --sort=-version:refname | head -10
git describe --tags --abbrev=0 2>/dev/null || echo "no tags yet"
```

Identify the latest semantic version tag (e.g. `v1.3.3`). If none exists, start from `v0.1.0`.

### Step 2 - Analyze Commits Since Last Tag

```bash
git log <last-tag>..HEAD --oneline
```

Suggest the next version bump based on conventional commit types since the last tag.

### Step 3 - Preview and Confirm

Show the proposed version with commits since last tag. Let user confirm, edit, or cancel.

### Step 4 - Create Tag

```bash
# With message:
git tag -a <version> -m "<message>"

# Without message:
git tag <version>
```

### Step 5 - Push Tag

Ask: "Push tag to remote? yes / no"

If yes:
```bash
git push origin <version>
```

**Safety Rules:**
- Never delete or overwrite an existing tag without explicit user instruction
- Never push to remote without user confirmation
- If the current branch is not main/master, warn: "You are tagging from `<branch>`, not main. Continue?"

---

## Release

Run the full release flow: bump version, update changelog, commit, tag, and push.

### Step 1 - Pre-release Safety Check

```bash
git branch --show-current
git status --short
git log --oneline -5
```

Confirm the branch. Check:
- **Dirty working tree** -> STOP: "Uncommitted changes detected. Commit or stash before releasing."
- **Not on main/master** -> WARN: "You are on `<branch>`, not main. Releases are usually from main. Continue? yes / cancel"
- **Behind remote** -> STOP: "Branch is behind remote. Sync first."

### Step 2 - Determine Next Version

```bash
git tag --sort=-version:refname | head -5
git log $(git describe --tags --abbrev=0)..HEAD --oneline
```

Suggest version bump based on commits since last tag. Show release plan and ask user to confirm or provide custom version.

### Step 3 - Update Version in package.json (if applicable)

```bash
cat package.json | grep '"version"'
```

If found, ask: "Update package.json version? yes / skip"

### Step 4 - Generate / Update Changelog

Run the Changelog section below to append the new version section to `CHANGELOG.md`. Show the generated section for review before writing.

Ask: "Update CHANGELOG.md? yes / skip"

### Step 5 - Commit Release Changes

Stage and commit version/changelog updates:

```bash
git add package.json CHANGELOG.md
git commit -m "chore: release v1.4.0"
```

Show staged files and commit message for confirmation before committing.

### Step 6 - Create Tag

```bash
git tag -a v1.4.0 -m "Release v1.4.0"
```

### Step 7 - Push

Ask: "Push commit and tag to origin? yes / cancel"

If yes:
```bash
git push origin main
git push origin v1.4.0
```

### Step 8 - Release Summary

Show a summary panel with version, tag, branch, and changelog status.

**Safety Rules:**
- Never release from a dirty working tree
- Never release from a non-main branch without explicit confirmation
- Never push without user confirmation
- Always show the full release plan before executing any step
- Each step is individually confirmable:  never run all steps silently

---

## Changelog

Generate or update CHANGELOG.md from conventional commit history.

### Step 1 - Detect Scope

```bash
git tag --sort=-version:refname | head -5
git log --oneline -5
```

Infer the scope from context. If unclear, ask: "Generate for the next release (since last tag) or full history?"

### Step 2 - Check for Existing CHANGELOG.md

**If `CHANGELOG.md` exists -> UPDATE MODE:**
1. Read the existing file
2. Identify what the latest documented version is
3. Append a new version section at the top for commits since that version
4. Do not modify existing sections

**If it does NOT exist -> CREATE MODE:**
Generate the full file from scratch.

### Step 3 - Collect Commits

```bash
# Since last tag
git log <last-tag>..HEAD --pretty=format:"%H|%s|%an|%ad" --date=short
```

### Step 4 - Parse and Group

Group commits by type into changelog sections. Breaking changes go first. Skip merge commits and commits with no recognizable prefix.

### Step 5 - Format Output

Use Keep a Changelog format:

```markdown
## [v1.4.0] - 2026-03-10

### Breaking Changes
- Remove legacy sync endpoint from public API

### Features
- Add department CRUD with sort order management

### Bug Fixes
- Fix null pointer exception on checkout page

### Maintenance
- Bump 3 dependencies to latest patch versions
```

### Step 6 - Preview and Write

Show the generated section. Ask: "Write to CHANGELOG.md? yes / cancel"

On yes: prepend new section after the `# Changelog` heading (update mode), or write the full file with header (create mode).

**Safety Rules:**
- Never delete or overwrite existing changelog sections
- Commits without conventional prefix are silently skipped
- If no conventional commits are found in range, report: "No conventional commits found in this range. Nothing to generate."

---

## Clean

Identify and interactively delete local branches that are merged or stale.

### Step 1 - Fetch and Prune Remote Refs

```bash
git fetch --prune
```

### Step 2 - Identify Candidate Branches

**Merged branches:**
```bash
git branch --merged main | grep -v "^\*" | grep -v "main\|master\|develop"
```

**Stale branches** (no commits in 30+ days):
```bash
git branch --format="%(refname:short)|%(committerdate:relative)|%(committerdate:unix)" \
  | awk -F'|' '$3 < systime()-2592000 {print $1, $2}'
```

**Gone branches** (remote tracking branch deleted):
```bash
git branch -vv | grep ": gone]"
```

### Step 3 - Display Candidate List

Present all candidates with labels: MERGED, GONE, STALE: including last commit date.

```
Select branches to delete: (e.g. 1,2,3 / all / none)
```

### Step 4 - Confirm Before Delete

Show final confirmation with list of branches to delete.

### Step 5 - Delete Selected Branches

```bash
git branch -d <branch>
```

Use `-d` (safe delete) by default. If `-d` fails (not fully merged), warn and ask: "Force delete with `-D`? yes / skip"

### Step 6 - Summary

Show which branches were deleted and which were skipped.

**Safety Rules:**
- Never delete the current branch
- Never delete main, master, develop, staging, production without explicit user instruction
- Always use `-d` first:  never force delete without user confirmation
- Never auto-select all:  user must explicitly choose

---

## Ignore

Scan untracked files, present candidates for ignoring, and update `.gitignore` with selected entries.

### Step 1 - Scan Untracked Files

```bash
git status --short
git ls-files --others --exclude-standard
```

Categorize untracked paths: Build output, Dependencies, Environment / secrets, Editor / OS, Logs / temp, AI tooling, Packaged files, Docs / generated, Other.

### Step 2 - Check Existing .gitignore

```bash
cat .gitignore 2>/dev/null || echo "(no .gitignore found)"
```

Note which untracked paths are already covered. Mark them as `[already ignored]`:  do not offer them as candidates.

### Step 3 - Display Candidate List

Show a numbered, categorized list. Ask:
```
Which paths to add? Enter numbers (e.g. 1 3), "all", or "none" to cancel.
```

### Step 4 - Confirm Selections

Resolve any redundancies (e.g. if `*.skill` is selected, don't also add individual `.skill` files). Show what will be written and confirm.

### Step 5 - Update .gitignore

Append a new labeled section at the bottom:
```
# --- added by smart-git ---
.claude/
*.skill
documentation/
```

Do not modify any existing content. Only append.


```bash
git status --short
```

Confirm the added paths no longer appear as untracked.

**Safety Rules:**
- Never remove or modify existing `.gitignore` entries:  only append
- Never auto-ignore `.env` files without explicitly confirming with the user
- If a path contains credentials or secrets (`.pem`, `.key`, `*credentials*`), highlight it clearly before adding
- If the user selects "all" and secrets-looking paths are in the list, pause and confirm each secret path individually

---

## Merge

Safely merge another branch into the current branch with auto-stash, commit preview, conflict detection, and guided resolution.

### Step 1 - Choose Source Branch

Ask:
> "Merge from which branch? (e.g. main, version/mori-trust, feat/my-feature)"


```bash
git branch -a --sort=-committerdate | head -20
```

Validate the source branch exists:
```bash
git rev-parse --verify <source> 2>/dev/null && echo "EXISTS" || echo "NOT_FOUND"
```

### Step 2 - Check Working Tree State

- **Clean tree** -> proceed directly to Step 4
- **Uncommitted changes** -> auto-stash before merging (Step 3)

### Step 3 - Auto-Stash (if dirty)

```bash
git stash push -m "auto-stash before merge"
```

### Step 4 - Fetch and Preview

```bash
git fetch origin
git log --oneline HEAD..<source>
```

Display a merge preview panel showing current branch, source, and incoming commits. If 0 incoming commits -> "Nothing to merge." and stop.

Ask: "Proceed with merge? yes / cancel"

### Step 5 - Choose Merge Strategy

```
Merge strategy:
  1. Default (--no-ff):  always create a merge commit, keeps clear history
  2. Fast-forward (--ff-only):  only if no divergence, no merge commit
  3. Squash: combine all incoming commits into one commit

Choice: (default: 1)
```

### Step 6 - Run Merge

```bash
# Default:
git merge --no-ff <source> -m "merge: bring changes from <source> into <current>"

# Fast-forward:
git merge --ff-only <source>

# Squash:
git merge --squash <source>
```

For squash: prompt "Squash merge staged. Run commit to write the commit message."

On conflict -> go to Step 7.

### Step 7 - Conflict Handling

Show conflicted files. Offer:
1. Use conflict section to resolve interactively
2. Abort merge and restore original state
3. Pause: resolve manually, then type "continue"

For abort: run `git merge --abort`. If stash was created, run `git stash pop`.

### Step 8 - Unstash (if stashed)

```bash
git stash pop
```

### Step 9 - Summary

Show a summary panel with branch, source, strategy, commits merged, and stash status.

**When to use merge vs rebase:**

```
Merge  -> preserves history as-is, creates a merge commit.
          Safe for shared/pushed branches. No force push needed.

Rebase -> rewrites history, linear and clean.
          Best for local-only branches. Requires force push if already pushed.
```

**Safety Rules:**
- Never run `git merge --abort` without explicit user confirmation
- Never auto-squash without showing which commits will be squashed
- Always show incoming commits before merging:  never merge blindly
- Always fetch before merging to get up-to-date remote state
- If stash was created and merge is aborted, always offer to restore the stash

---

## Rebase

Safely rebase the current branch onto a target branch with auto-stash, conflict detection, and guided resolution.

### Step 1 - Choose Target Branch

Ask:
> "Rebase onto which branch? (e.g. main, develop, release/x.y.z)"

Show available branches:
```bash
git branch -a --sort=-committerdate | head -20
```

Validate the target branch exists.

### Step 2 - Check Working Tree State

- **Clean tree** -> proceed directly to Step 4
- **Uncommitted changes** -> auto-stash (Step 3)

### Step 3 - Auto-Stash (if dirty)

```bash
git stash push -m "auto-stash before rebase"
```

### Step 4 - Fetch and Preview

```bash
git fetch origin
git log --oneline <target>..HEAD
git log --oneline -3 <target>
```

Display a rebase preview panel showing commits to replay and the target branch state. Confirm before proceeding.

### Step 5 - Run Rebase

```bash
git rebase <target>
```

- **Success** -> proceed to Step 7
- **Conflict** -> proceed to Step 6

### Step 6 - Conflict Handling

Show conflicted files. Offer:
1. Use conflict section to resolve interactively
2. Abort rebase and restore original state
3. Pause: resolve manually, then type "continue"

For abort: run `git rebase --abort`. If stash was created, run `git stash pop`.

After manual resolution: verify no conflict markers remain, then run `git rebase --continue`.

### Step 7 - Unstash (if stashed)

```bash
git stash pop
```

### Step 8 - Summary

Show a summary panel with branch, target, commits replayed, and stash status. Note that force push may be needed if branch is already on remote.

**Safety Rules:**
- Never rebase published commits on shared branches (main, master, develop):  warn if target is a protected branch and current branch is already pushed
- Never use `--force` during stash pop:  show conflicts instead
- Never run `git rebase --abort` without explicit user confirmation
- Always show preview of commits to be replayed before rebasing
- Always fetch before rebasing to get up-to-date remote state
- If stash was created and rebase is aborted, always offer to restore the stash
