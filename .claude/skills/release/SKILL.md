---
name: release
description: >
  Cut a new prod release: bump the version, commit, tag, and push to trigger
  enem-landing-prod.yml. Triggers on requests to bump version + tag, cut/ship a
  release, release to prod, or tag a new version.
---

# Release to Prod

Reproduces this repo's release convention, ported from mau-apps' own equivalent skill (the
version-bump/commit/tag/push mechanics below - NOT the specific commit-hash/version-number
examples further down, which are still mau-apps' own history and haven't been re-verified
against this repo's actual git log; treat those as illustrative shape, not confirmed fact, until
someone checks). Bump `package.json`'s `version`, commit `chore: release vX.X.X` on `master`, tag
that commit `vX.X.X`, push both. The tag push is what triggers
`.github/workflows/enem-landing-prod.yml` (lint → test → e2e → build-push → migrate → deploy) -
**pushing the tag is a real production deploy**, not a dry run.

**Unlike mau-apps' current setup, enem-landing-prod.yml keeps its lint/test/e2e gate active** -
a release tag must pass all three itself before build-push runs, not just assume a `develop`
push already covered the tagged commit (mau-apps disabled that gate on its own prod workflow
after establishing enough operational trust in its `develop` pipeline; enem-landing doesn't have
that track record yet - see enem-landing-prod.yml's own job comments). Still worth confirming
with the user that what's going out has been reviewed, but the pipeline itself won't skip
checking.

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
(`enem-landing-prod.yml`) - don't claim the deploy succeeded, only that it started.

## Step 7 - GitHub Release Notes

Create a GitHub Release for the tag with a "What's Changed" section (each entry attributed
`by @<github-login> in <commit-url>`, mirroring GitHub's own PR-based format) plus a "Full
Changelog" comparison link - matching the format of the `1.1.5` release (`gh release view 1.1.5`).

**Do NOT use `gh release create --generate-notes`** - confirmed broken for this repo:
`--generate-notes` builds "What's Changed" from merged PRs only, and this repo's release flow
(Step 6) pushes straight to `master`, never through a PR. It silently produces a release with
just the bare compare link and nothing else (verified on v2.0.1/v2.1.0/v2.1.1 - all had to be
regenerated after the fact, twice: once for missing entries entirely, once more for missing the
`by @user` attribution). Build the notes from commits instead, resolving each commit's GitHub
login via the API rather than guessing it from the git author name/email:

```bash
PREV_TAG=$(git describe --tags --abbrev=0 vX.X.X^)   # the tag being replaced by this release
REPO=$(gh repo view --json nameWithOwner --jq .nameWithOwner)
NOTES_FILE=/tmp/release-notes-vX.X.X.md

echo "## What's Changed" > "$NOTES_FILE"
for sha in $(git log "$PREV_TAG"..vX.X.X --pretty=format:"%h" --no-merges --reverse); do
  subject=$(git log -1 --pretty=format:"%s" "$sha")
  case "$subject" in "chore: release "*) continue ;; esac
  login=$(gh api "repos/$REPO/commits/$sha" --jq '.author.login // empty' 2>/dev/null)
  full_sha=$(git rev-parse "$sha")
  if [ -n "$login" ]; then
    echo "* $subject by @$login in https://github.com/$REPO/commit/$full_sha" >> "$NOTES_FILE"
  else
    echo "* $subject in https://github.com/$REPO/commit/$full_sha" >> "$NOTES_FILE"
  fi
done
printf '\n**Full Changelog**: https://github.com/%s/compare/%s...vX.X.X\n' "$REPO" "$PREV_TAG" >> "$NOTES_FILE"

gh release create vX.X.X --notes-file "$NOTES_FILE" --title "vX.X.X"
rm "$NOTES_FILE"
```

The `case` skips the release commit itself (`chore: release vX.X.X`) - it's not a real change,
just noise. The `login` fallback (skip `by @user` if the API lookup comes back empty) covers a
commit GitHub can't map to an account, e.g. a mismatched email - shouldn't happen for this
single-maintainer repo, but fails soft rather than breaking the whole notes generation. Run this
only after the tag has actually been pushed (Step 6) so `git log` has something to diff against.
Show the generated notes URL to the user.

## If the Release Fails

Don't immediately bump-and-retag to retry - mau-apps hit exactly this pattern (multiple tags
pushed within hours while iterating on a migration fix, each retry paying the full multi-app
build cost again; see mau-apps' own version of this skill for the specific incident this
lesson came from). If lint/test/e2e failed, fix and push to `develop` first, confirm it's green
there (same gates enem-landing-dev.yml runs on every push), before cutting another prod tag. If
the failure is at build-push/migrate/deploy (past the gate), diagnose from the Actions log before
retagging - re-running the same broken commit under a new tag doesn't fix anything.
