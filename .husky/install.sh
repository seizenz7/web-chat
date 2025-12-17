#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Install Husky hooks
npx husky install
npx husky add .husky/pre-commit "yarn lint-staged"
npx husky add .husky/pre-push "yarn type-check"
npx husky add .husky/commit-msg 'echo "Commit message: $1"'
