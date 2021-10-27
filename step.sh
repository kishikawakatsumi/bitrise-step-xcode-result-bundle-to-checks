#!/bin/bash
set -ex

INPUT_PATH="$xcresult_path" \
INPUT_TITLE="$title" \
INPUT_GITHUB_OWNER="$github_owner" \
INPUT_GITHUB_REPO="$github_repo" \
INPUT_GITHUB_SHA="${GIT_CLONE_COMMIT_HASH:-$BITRISE_GIT_COMMIT}" \
INPUT_TOKEN="$(uuidgen)" \
 node --unhandled-rejections=strict "$BITRISE_STEP_SOURCE_DIR/dist/index.js"