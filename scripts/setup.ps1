$ErrorActionPreference = "Stop"

$go = Get-Command go -ErrorAction SilentlyContinue
if ($go) {
    go version
    exit 0
}

function Test-Command {
    param([string]$Name)
    return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

if (Test-Command "winget") {
    winget install --id GoLang.Go -e
} elseif (Test-Command "choco") {
    choco install golang -y
} elseif (Test-Command "scoop") {
    scoop install go
} else {
    Write-Error "Go is missing and no supported Windows package manager was found. Install Go manually from https://go.dev/dl/ and rerun this script."
    exit 1
}

$go = Get-Command go -ErrorAction SilentlyContinue
if ($go) {
    go version
    exit 0
}

Write-Error "Go installation command completed, but go was not found on PATH. Open a new PowerShell session or update PATH, then rerun this script."
exit 1
