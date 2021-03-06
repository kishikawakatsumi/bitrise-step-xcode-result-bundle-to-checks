#!/bin/bash
set -ex

INPUT_PATH="$xcresult_path" \
INPUT_TITLE="$title" \
env "INPUT_SHOW-PASSED-TESTS=$show_passed_tests" \
env "INPUT_SHOW-CODE-COVERAGE=$show_code_coverage" \
INPUT_TITLE="$title" \
INPUT_GITHUB_OWNER="$github_owner" \
INPUT_GITHUB_REPO="$github_repo" \
INPUT_GITHUB_SHA="${head_sha:-$BITRISE_GIT_COMMIT}" \
INPUT_TOKEN="$(uuidgen)" \
node --unhandled-rejections=strict "$BITRISE_STEP_SOURCE_DIR/dist/index.js"