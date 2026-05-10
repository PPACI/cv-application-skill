$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Error "Node.js is required to run the bundled CV application scripts. Install Node.js from https://nodejs.org/ and rerun this script."
    exit 1
}

node --version

$npm = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npm) {
    Write-Error "npm is required to install the bundled CV application script dependencies. Install Node.js with npm from https://nodejs.org/ and rerun this script."
    exit 1
}

if (Test-Path (Join-Path $scriptDir "package-lock.json")) {
    npm --prefix "$scriptDir" ci --omit=dev --no-audit --fund=false
} else {
    npm --prefix "$scriptDir" install --omit=dev --no-audit --fund=false
}
