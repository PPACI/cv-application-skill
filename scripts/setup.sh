#!/usr/bin/env sh
set -eu

if command -v go >/dev/null 2>&1; then
    go version
    exit 0
fi

run_as_root() {
    if [ "$(id -u)" -eq 0 ]; then
        "$@"
        return
    fi

    if command -v sudo >/dev/null 2>&1; then
        sudo "$@"
        return
    fi

    echo "Go is missing and this install step requires root privileges, but sudo is not available." >&2
    echo "Install Go manually from https://go.dev/dl/ and rerun this script." >&2
    exit 1
}

install_with_linux_package_manager() {
    if command -v apt-get >/dev/null 2>&1; then
        run_as_root apt-get update
        run_as_root apt-get install -y golang-go
        return
    fi

    if command -v dnf >/dev/null 2>&1; then
        run_as_root dnf install -y golang
        return
    fi

    if command -v yum >/dev/null 2>&1; then
        run_as_root yum install -y golang
        return
    fi

    if command -v pacman >/dev/null 2>&1; then
        run_as_root pacman -Sy --noconfirm go
        return
    fi

    if command -v zypper >/dev/null 2>&1; then
        run_as_root zypper install -y go
        return
    fi

    if command -v apk >/dev/null 2>&1; then
        run_as_root apk add go
        return
    fi

    echo "Go is missing and no supported Linux package manager was found." >&2
    echo "Install Go manually from https://go.dev/dl/ and rerun this script." >&2
    exit 1
}

case "$(uname -s)" in
    Darwin)
        if command -v brew >/dev/null 2>&1; then
            brew install go
        else
            echo "Go is missing and Homebrew is not installed." >&2
            echo "Install Go manually from https://go.dev/dl/ or install Homebrew, then rerun this script." >&2
            exit 1
        fi
        ;;
    Linux)
        install_with_linux_package_manager
        ;;
    *)
        echo "Unsupported OS for automatic Go installation: $(uname -s)" >&2
        echo "Install Go manually from https://go.dev/dl/ and rerun this script." >&2
        exit 1
        ;;
esac

if command -v go >/dev/null 2>&1; then
    go version
else
    echo "Go installation command completed, but go was not found on PATH." >&2
    echo "Open a new shell or update PATH, then rerun this script." >&2
    exit 1
fi
