# Git Sync Strategy

## The Core Rule

Every branch needs to stay in sync with two things:

1. **Its own remote** — so your local work matches what is on the server
2. **The base branch** — so your feature stays up to date with the rest of the team's work

Smart sync handles both, in order, every time.

| Operation | Command | Strategy | Force Push Needed |
|-----------|---------|----------|-------------------|
| Sync with own remote | `git pull --rebase` | Rebase | No (linear, no new history) |
| Sync with base branch | `git rebase origin/main` | Rebase | Yes, on feature branch only |
| Merge PR into main | `git merge --no-ff` | Merge commit | Never |

### Why two syncs, not one

`git pull` only syncs your branch with its own remote copy (`origin/feat/my-branch`). It does not bring in changes that other developers merged into `main`. Without the second sync, your branch slowly drifts from the rest of the codebase — and the longer it drifts, the bigger the conflict when you eventually merge.

Smart sync closes both gaps in a single operation.

### What happens if you skip the base branch sync

- Conflicts accumulate silently over time
- The longer you wait, the harder they are to resolve
- PR reviewers may see outdated code that conflicts with recent changes
- CI may fail on the merge even though your branch passed all checks

### The full flow in order

```
Step 1  Check working tree — stash if dirty
Step 2  git pull --rebase         sync with own remote
Step 3  git fetch origin main      fetch latest base branch
Step 4  git rebase origin/main     replay your commits on top
Step 5  git stash pop              restore stashed changes (if any)
Step 6  git push --force-with-lease  push the rebased branch
```

Each step runs only if the previous one succeeds. If a conflict is detected, the workflow stops and asks the developer to resolve before continuing.

---

## Why Rebase for Syncing

When a feature branch falls behind `main`, there are two ways to bring it up to date.

### Merge approach

```
main:   A --- B --- C
                     \
feat:   A --- D --- E --- M (merge commit)
```

Problems:
- A merge commit (`M`) appears in the PR commit list
- Files changed in `main` can appear in the PR diff, confusing reviewers
- History becomes non-linear and harder to follow
- `git bisect` and `git log` become noisy

### Rebase approach

```
main:   A --- B --- C
                     \
feat:                 D' --- E' (commits replayed on top of C)
```

Benefits:
- PR only shows commits authored by the developer
- Files Changed tab shows only the developer's actual changes
- Linear, readable history
- Conflicts are resolved once, at the right point in time

---

## Why Force Push is Allowed on Feature Branches

Force push has two distinct contexts. The rule differs completely depending on the branch.

### Force push on main/master: NEVER

`main` is a shared branch. Everyone's work is based on it. Rewriting its history breaks every developer's local copy and can destroy work permanently.

### Force push on feature branches: SAFE

A feature branch belongs to one developer. No one else bases their work on it. After a rebase, the commit hashes change (because commits are replayed onto a new base), so a regular push is rejected by the remote. Force push is the correct and expected response.

The rule is:

> **Protect shared branches. Feature branches are yours to manage.**

---

## `--force-with-lease`: The Safer Force Push

Never use `git push --force`. Always use:

```bash
git push --force-with-lease
```

The difference:

| Command | Behavior |
|---------|----------|
| `--force` | Overwrites remote unconditionally |
| `--force-with-lease` | Aborts if someone else pushed since your last fetch |

`--force-with-lease` protects against the one real risk of force push on a feature branch: accidentally overwriting a teammate's push to the same branch.

---

## Recommended Branch Protection Policy

```
main / master       protected  no force push  no direct push
release/*           protected  no force push  no direct push
feat/* / fix/* etc  open       force push OK  direct push OK
```

This is the standard policy used across the industry, including at GitHub, GitLab, Google, and most open-source projects. It protects what needs protecting and gives developers the freedom they need to keep their branches clean.

---

## The Full Recommended Workflow

```
# 1. Fetch latest base branch
git fetch origin main

# 2. Rebase your feature branch on top of it
git rebase origin/main

# 3. Resolve any conflicts during rebase, then continue
git rebase --continue

# 4. Push with lease (safe force push)
git push --force-with-lease
```

The result: a clean PR that shows only your work, with no noise from base branch changes.

---

## Summary for Decision Makers

| Concern | Answer |
|---------|--------|
| "Force push sounds dangerous" | Only on shared branches. Feature branches are single-owner. |
| "What if someone else is on the same branch?" | `--force-with-lease` aborts automatically if that happens. |
| "Why not just merge instead?" | Merge adds noise to the PR and makes code review harder. |
| "Do serious teams use this?" | Yes. GitHub, GitLab, and most professional engineering teams do. |
| "What is actually protected?" | `main` and release branches. Those are never force pushed. |
