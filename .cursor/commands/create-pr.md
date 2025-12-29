# Create Pull Request

This command helps you create a GitHub Pull Request by first showing you the current git status, diff, and log, and then prompting you for a PR title and body.

## 1. Review current changes

Here's an overview of your current changes, staged and unstaged files, and recent commit history. Please review this information to help you draft your pull request title and description.

```bash
git status
git diff
git log --oneline -5
```

## 2. Enter Pull Request Details

Please provide a title and body for your pull request.

```
{{CURSOR_INPUT_PR_TITLE}}
```

```
{{CURSOR_INPUT_PR_BODY}}
```

## 3. Creating the Pull Request

Once you've reviewed the changes and provided the PR details, the following command will be executed to create your pull request.

```bash
PR_TITLE="{{CURSOR_INPUT_PR_TITLE}}"
PR_BODY="$(cat <<'EOF'
{{CURSOR_INPUT_PR_BODY}}
EOF
)"

# Check if the current branch tracks a remote branch and is up to date with the remote
# This is a prerequisite for pushing and creating a PR
git rev-parse --abbrev-ref --symbolic-full-name @{u} > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "Current branch does not track a remote branch. Please push your branch first: git push -u origin <branch-name>"
    exit 1
fi

# Push to remote if there are local commits not yet on remote
# Note: gh pr create will also push if necessary, but explicitly pushing first can be clearer.
# For simplicity, we'll let gh handle the push in this script.
# If you want to explicitly push, uncomment the following line and handle potential merge conflicts:
# git push origin $(git rev-parse --abbrev-ref HEAD)

gh pr create --title "$PR_TITLE" --body "$PR_BODY" --fill
```
