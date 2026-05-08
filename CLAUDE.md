@AGENTS.md

## Deployment authorization

When the user explicitly requests a deploy with phrases like "commit push", "merge to main", "push to main", "ship it", or "deploy", you are **pre-authorized** to:

- Stage and commit changes on the current branch
- Merge the current feature branch into `main` (use `git merge ... --no-ff` if fast-forward isn't possible — never `--ff-only` followed by giving up)
- Push to `origin/main`
- Switch back to the feature branch afterward

Skip the "are you sure?" confirmation for these specific actions. Still refuse / pause if:

- The commit would include obvious secrets (`.env`, credentials, API keys in a diff)
- The user asks for a **destructive** push (`--force` to main, history rewrite, branch deletion)
- A merge produces conflicts you can't safely resolve without input
- `git status` shows unrelated files staged that the user may not have meant to include

Standard sequence for "commit push" when on a feature branch:
1. `git add <specific files>` (avoid `git add -A`)
2. `git commit -m "..."`
3. `git push` (to feature branch)

For "merge to main" / "push to main":
1. `git checkout main && git pull`
2. `git merge <feature-branch> --no-ff -m "Merge <branch> into main"` (fall back to merge commit if not fast-forwardable)
3. Resolve conflicts if any (or stop and ask if non-trivial)
4. `git push`
5. `git checkout <feature-branch>`
