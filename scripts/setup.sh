#!/usr/bin/env sh
set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)

if command -v node >/dev/null 2>&1; then
    node --version
else
    echo "Node.js is required to run the bundled CV application scripts." >&2
    echo "Install Node.js from https://nodejs.org/ and rerun this script." >&2
    exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
    echo "npm is required to install the bundled CV application script dependencies." >&2
    echo "Install Node.js with npm from https://nodejs.org/ and rerun this script." >&2
    exit 1
fi

if [ -f "$script_dir/package-lock.json" ]; then
    npm --prefix "$script_dir" ci --omit=dev --no-audit --fund=false
else
    npm --prefix "$script_dir" install --omit=dev --no-audit --fund=false
fi
