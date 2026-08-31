---
name: release
description: >
  Cut a new prod release: bump the version, commit, tag, and push to trigger
  mau-apps-prod.yml. Triggers on requests to bump version + tag, cut/ship a
  release, release to prod, or tag a new version.
---

# Release to Prod

Reproduces this repo's actual release convention (confirmed from git history, not assumed):
bump `package.json`'s `version`, commit `chore: release vX.X.X` on `master`, tag that commit
`vX.X.X`, push both. The tag push is what triggers `.github/workflows/mau-apps-prod.yml`
(build-push → migrate → deploy) - **pushing the tag is a real production deploy**, not a dry
run.

**No automated lint/test/e2e gate runs before this anymore** (commented out again 2026-08-30,
explicit user decision - see `mau-apps-prod.yml`'s job comments for the full history of this
being enabled/disabled/re-enabled/disabled). The `develop` pipeline (`mau-apps-dev.yml`) is now
the *only* place those gates run. Before cutting a release, confirm with the user that what's
going out has already been validated on `develop` (or otherwise reviewed) - don't treat a green
`master` as proof of anything, since nothing runs on `master` pushes either.

Use the `smart-git` skill's commit/push flows for the actual commit and push steps below -
never run `git commit`/`git push` directly. This skill only supplies the release-specific
version-bump and tagging steps around them.

## Step 1 - Preconditions

```bash
git status --short
git branch --show-current
git fetch origin
git log HEAD..origin/master --oneline
```

- Working tree must be clean (nothing uncommitted). If dirty, stop and ask the user to
  commit/stash first - don't bundle unrelated changes into the release commit.
- Must be on `master`, up to date with `origin/master` (no commits behind). If behind, sync
  first (`smart-git` sync flow) before continuing.

## Step 2 - Determine Next Version

```bash
grep -m1 '"version"' package.json
git tag --sort=-version:refname | head -5
```

Default to a **patch** bump (`0.0.X` → `0.0.X+1`) unless the user says otherwise or the changes
since the last tag are clearly breaking/feature-level - ask if unsure:

```bash
git log v<current>..HEAD --oneline   # what's actually going out in this release
```

## Step 3 - Bump the Version

Edit `package.json`'s `"version"` field to the new version (no `v` prefix, matches existing
entries exactly - see recent commits like `d0e2027` for the exact one-line diff shape).

## Step 4 - Commit

Invoke the `smart-git` skill's **commit** flow for this. Message convention (confirmed from
`git log`, e.g. `784d64f`, `1b59a75`, `d0e2027`):

```
chore: release vX.X.X
```

Single file (`package.json`), no body needed. Let `smart-git` run its normal lint/format
pre-commit checks even though only `package.json` changed - that's the closest thing to a
correctness check this release still gets before the tag push (see the no-gates note above).

## Step 5 - Tag

Annotated tag, message convention confirmed from existing tags (`git tag -l -n1 v0.0.22` →
`Release v0.0.22`):

```bash
git tag -a vX.X.X -m "Release vX.X.X"
```

Do this only after Step 4's commit succeeds - the tag must point at the release commit, not
whatever `HEAD` was before it.

## Step 6 - Push (commit, then tag - confirm before each)

Push the commit first via `smart-git`'s **push** flow (this is a direct push to `master`, a
protected branch - `smart-git` will already ask for confirmation, don't skip it).

Then push the tag - **confirm explicitly with the user first**, separately from the commit
push, since this specific push is what actually triggers the prod deploy pipeline:

```bash
git push origin vX.X.X
```

After pushing, tell the user the run is live and point them at the Actions tab
(`mau-apps-prod.yml`) - don't claim the deploy succeeded, only that it started.

## If the Release Fails

Don't immediately bump-and-retag to retry. Root cause #3 in the 2026-08-30 GitHub Actions audit
was exactly this pattern - 8 tags pushed in ~5 hours while iterating on a migration fix, each
retry paying the full 14-app build cost again. This matters even more now that prod has no
lint/test/e2e of its own (see the no-gates note above) - a failure discovered only at
`build-push`/`migrate`/`deploy` means the bug already shipped to the tag-build stage untested.
If the fix is non-trivial, push it to `develop` first (still has lint/test/e2e - the only gate
left in this repo) and confirm it's green there before cutting another prod tag.
