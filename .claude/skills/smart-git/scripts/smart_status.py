#!/usr/bin/env python3
"""Smart Status — Rich interactive git repository status."""

import subprocess
import sys
from datetime import datetime

WIDTH = 74

# Box drawing chars
TL, TR, BL, BR = "┌", "┐", "└", "┘"
ML, MR, H, V   = "├", "┤", "─", "│"


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True, shell=True)
    return r.stdout.strip(), r.returncode


def run_lines(cmd):
    out, rc = run(cmd)
    return [l for l in out.splitlines() if l], rc


# ── Box helpers ───────────────────────────────────────────────────────

def box_top(title=""):
    if title:
        t = f"  {title}  "
        pad = WIDTH - 2 - len(t)
        return TL + H * (pad // 2) + t + H * (pad - pad // 2) + TR
    return TL + H * (WIDTH - 2) + TR


def box_div(label=""):
    if label:
        t = f" {label} "
        return ML + t + H * (WIDTH - 2 - len(t)) + MR
    return ML + H * (WIDTH - 2) + MR


def box_bot():
    return BL + H * (WIDTH - 2) + BR


def box_row(left="", right="", indent=0):
    prefix = " " * (2 + indent)
    content = f"{prefix}{left}"
    if right:
        gap = WIDTH - 4 - len(content) - len(right)
        if gap < 1:
            content = content[:WIDTH - 4 - len(right) - 4] + "..."
            gap = 1
        return f"{V}{content}{' ' * gap}{right}  {V}"
    else:
        gap = WIDTH - 4 - len(content)
        if gap < 0:
            content = content[:WIDTH - 7] + "..."
            gap = 0
        return f"{V}{content}{' ' * gap}  {V}"


def box_empty():
    return f"{V}{' ' * (WIDTH - 2)}{V}"


# ── Helpers ───────────────────────────────────────────────────────────

FILE_ICONS = {
    "ts": "TS", "tsx": "TSX", "js": "JS", "jsx": "JSX",
    "vue": "VUE", "json": "{}", "md": "MD", "css": "CSS",
    "scss": "SCSS", "html": "HTML", "yml": "YML", "yaml": "YML",
    "sh": "SH", "py": "PY", "env": "ENV", "sql": "SQL",
    "prisma": "DB", "graphql": "GQL", "tf": "TF", "lock": "LOCK",
}

STATUS_LABELS = {
    "M": "modified",
    "A": "added   ",
    "D": "deleted ",
    "R": "renamed ",
    "C": "copied  ",
    "U": "conflict",
    "?": "new file",
}


def file_icon(path):
    ext = path.rsplit(".", 1)[-1].lower() if "." in path else ""
    return FILE_ICONS.get(ext, "FILE")


def status_label(char):
    return STATUS_LABELS.get(char, char + "       ")


def relative_time(iso_str):
    try:
        dt = datetime.fromisoformat(iso_str.strip())
        now = datetime.now(dt.tzinfo)
        s = int((now - dt).total_seconds())
        if s < 60:       return f"{s}s ago"
        if s < 3600:     return f"{s // 60}m ago"
        if s < 86400:    return f"{s // 3600}h ago"
        if s < 604800:   return f"{s // 86400}d ago"
        return f"{s // 604800}w ago"
    except Exception:
        return ""


def sync_bar(ahead, behind, width=12):
    """Visual push/pull bar: ◀◀◀ HEAD ▶▶▶"""
    bar_a = min(ahead, width // 2)
    bar_b = min(behind, width // 2)
    return ("▲" * bar_a).rjust(width // 2) + " " + ("▼" * bar_b).ljust(width // 2)


def parse_diff_stat(stat_raw):
    parts = stat_raw.split()
    add = f"+{parts[0]}" if parts and parts[0] not in ("-", "") else ""
    rem = f"-{parts[1]}" if len(parts) > 1 and parts[1] not in ("-", "") else ""
    return add, rem


def collect_changes(diff_cmd, stat_cmd_prefix):
    raw, _ = run(diff_cmd)
    result = []
    for line in raw.splitlines():
        if not line:
            continue
        parts = line.split("\t", 2)
        s_char = parts[0][0]
        filepath = parts[-1]
        stat_raw, _ = run(f'{stat_cmd_prefix} -- "{filepath}"')
        add, rem = parse_diff_stat(stat_raw)
        result.append((s_char, filepath, add, rem))
    return result


def print_file_rows(items):
    for s, f, add, rem in items:
        icon  = f"[{file_icon(f):4}]"
        label = status_label(s)
        stat  = f"{add} {rem}".strip()
        left  = f"  {icon}  {label}  {f}"
        print(box_row(left, stat, indent=0))


# ── Main ──────────────────────────────────────────────────────────────

def main():
    _, rc = run("git rev-parse --is-inside-work-tree")
    if rc != 0:
        print("Not a git repository.")
        sys.exit(1)

    # ── Gather data ───────────────────────────────────────────────────
    branch, _      = run("git rev-parse --abbrev-ref HEAD")
    short_hash, _  = run("git rev-parse --short HEAD")
    git_dir, _     = run("git rev-parse --git-dir")
    repo_root, _   = run("git rev-parse --show-toplevel")
    repo_name      = repo_root.rstrip("/").rsplit("/", 1)[-1]

    # Remote tracking
    remote_ref, rc_r = run(f"git rev-parse --abbrev-ref {branch}@{{upstream}}")
    if rc_r == 0:
        ahead_s,  _ = run(f"git rev-list --count {remote_ref}..HEAD")
        behind_s, _ = run(f"git rev-list --count HEAD..{remote_ref}")
        ahead  = int(ahead_s  or 0)
        behind = int(behind_s or 0)
    else:
        remote_ref = None
        ahead = behind = 0

    # Special state
    special = None
    if run(f"test -f {git_dir}/MERGE_HEAD")[1] == 0:
        special = "MERGE IN PROGRESS"
    elif run(f"test -d {git_dir}/rebase-merge")[1] == 0 \
      or run(f"test -d {git_dir}/rebase-apply")[1] == 0:
        special = "REBASE IN PROGRESS"
    elif run(f"test -f {git_dir}/CHERRY_PICK_HEAD")[1] == 0:
        special = "CHERRY-PICK IN PROGRESS"
    elif run(f"test -f {git_dir}/BISECT_LOG")[1] == 0:
        special = "BISECT IN PROGRESS"

    # Changes
    staged   = collect_changes("git diff --cached --name-status",
                                "git diff --cached --numstat")
    unstaged = collect_changes("git diff --name-status",
                                "git diff --numstat")
    untracked_raw, _ = run("git ls-files --others --exclude-standard")
    untracked = [f for f in untracked_raw.splitlines() if f]

    # Conflicts
    conflict_files, _ = run_lines("git diff --name-only --diff-filter=U")

    # Stash
    stash_list, _ = run_lines("git stash list")

    # Recent commits
    log_raw, _ = run('git log --format="%h|%s|%ci|%an" -8')
    commits = []
    for entry in log_raw.splitlines():
        if not entry:
            continue
        parts = entry.split("|", 3)
        if len(parts) == 4:
            commits.append(parts)

    # Last push time
    last_push_ts, _ = run(
        f'git log --format="%ci" -1 {remote_ref}' if remote_ref else "echo"
    )

    # ── Print ─────────────────────────────────────────────────────────

    print()
    print(box_top(f"SMART STATUS  ·  {repo_name}"))
    print(box_empty())

    # Branch row
    branch_disp = f"  {branch}"
    hash_disp   = f"@ {short_hash}"
    print(box_row(branch_disp, hash_disp))

    # Remote row
    if remote_ref:
        bar = sync_bar(ahead, behind)
        if ahead == 0 and behind == 0:
            remote_status = "✓ up to date"
        else:
            parts = []
            if ahead:  parts.append(f"↑ {ahead} to push")
            if behind: parts.append(f"↓ {behind} to pull")
            remote_status = "  " + "  ·  ".join(parts)
        print(box_row(f"  {remote_ref}", remote_status))
        print(box_row(f"  {bar}"))
    else:
        print(box_row("  no remote tracking branch"))

    # Special state
    if special:
        print(box_empty())
        print(box_row(f"  ⚠  {special}"))

    # ── Changes ───────────────────────────────────────────────────────

    if staged or unstaged or untracked or conflict_files:
        print(box_empty())
        print(box_div("CHANGES"))

        if conflict_files:
            print(box_empty())
            print(box_row(f"  ⚠  CONFLICTS ({len(conflict_files)} files)"))
            for f in conflict_files:
                print(box_row(f"    [CONF]  conflict  {f}"))

        if staged:
            print(box_empty())
            total_add = sum(
                int(a[1:]) for _, _, a, _ in staged if a.startswith("+") and a[1:].isdigit()
            )
            total_rem = sum(
                int(r[1:]) for _, _, _, r in staged if r.startswith("-") and r[1:].isdigit()
            )
            stat_summary = f"+{total_add} -{total_rem}" if (total_add or total_rem) else ""
            print(box_row(f"  Staged  ({len(staged)} files — ready to commit)", stat_summary))
            print_file_rows(staged)

        if unstaged:
            print(box_empty())
            total_add = sum(
                int(a[1:]) for _, _, a, _ in unstaged if a.startswith("+") and a[1:].isdigit()
            )
            total_rem = sum(
                int(r[1:]) for _, _, _, r in unstaged if r.startswith("-") and r[1:].isdigit()
            )
            stat_summary = f"+{total_add} -{total_rem}" if (total_add or total_rem) else ""
            print(box_row(f"  Unstaged  ({len(unstaged)} files — not staged)", stat_summary))
            print_file_rows(unstaged)

        if untracked:
            print(box_empty())
            print(box_row(f"  Untracked  ({len(untracked)} files — not tracked by git)"))
            for f in untracked[:12]:
                icon = f"[{file_icon(f):4}]"
                print(box_row(f"  {icon}  new file  {f}"))
            if len(untracked) > 12:
                print(box_row(f"  ... and {len(untracked) - 12} more"))
    else:
        print(box_empty())
        print(box_row("  ✓  Working tree clean"))

    # ── Stash ─────────────────────────────────────────────────────────

    if stash_list:
        print(box_empty())
        print(box_div(f"STASH  ({len(stash_list)})"))
        print(box_empty())
        for entry in stash_list[:5]:
            print(box_row(f"  {entry}"))
        if len(stash_list) > 5:
            print(box_row(f"  ... and {len(stash_list) - 5} more"))

    # ── Recent Commits ────────────────────────────────────────────────

    print(box_empty())
    print(box_div("RECENT COMMITS"))
    print(box_empty())
    for h, msg, ts, author in commits:
        rel  = relative_time(ts)
        meta = f"{rel}  {author}"
        max_left = WIDTH - 4 - 2 - len(meta) - 4
        left = f"  {h}  {msg}"
        if len(left) > max_left:
            left = left[:max_left - 3] + "..."
        gap = WIDTH - 4 - len(left) - len(meta)
        print(f"{V}{left}{' ' * max(1, gap)}{meta}  {V}")

    # ── Summary ───────────────────────────────────────────────────────

    print(box_empty())
    print(box_div("SUMMARY"))
    print(box_empty())

    total = len(staged) + len(unstaged) + len(untracked)
    if total == 0 and not special and not conflict_files:
        push_hint = f"  ↑ {ahead} commit(s) ready to push" if ahead else ""
        pull_hint = f"  ↓ {behind} commit(s) to pull" if behind else ""
        print(box_row("  ✓  Nothing to commit" + push_hint + pull_hint))
    else:
        parts = []
        if conflict_files: parts.append(f"{len(conflict_files)} conflict(s)")
        if staged:         parts.append(f"{len(staged)} staged")
        if unstaged:       parts.append(f"{len(unstaged)} unstaged")
        if untracked:      parts.append(f"{len(untracked)} untracked")
        if ahead:          parts.append(f"↑ {ahead} to push")
        if behind:         parts.append(f"↓ {behind} to pull")
        if stash_list:     parts.append(f"{len(stash_list)} stashed")
        print(box_row("  " + "  ·  ".join(parts)))

    print(box_empty())
    print(box_bot())
    print()

    # ── Machine-readable state (for SKILL.md action routing) ──────────
    # Output as comment block — parsed by the skill, not shown to user
    state_flags = []
    if conflict_files: state_flags.append("HAS_CONFLICTS")
    if staged:         state_flags.append("HAS_STAGED")
    if unstaged:       state_flags.append("HAS_UNSTAGED")
    if untracked:      state_flags.append("HAS_UNTRACKED")
    if ahead > 0:      state_flags.append("HAS_AHEAD")
    if behind > 0:     state_flags.append("HAS_BEHIND")
    if stash_list:     state_flags.append("HAS_STASH")
    if special:        state_flags.append("HAS_SPECIAL_STATE")
    if remote_ref is None: state_flags.append("NO_REMOTE")

    print(f"#STATE: {','.join(state_flags)}")


if __name__ == "__main__":
    main()
