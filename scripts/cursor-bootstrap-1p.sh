#!/usr/bin/env bash
# Cursor Cloud Agent bootstrap: optional 1Password CLI + .env inject (never fails install).
set -euo pipefail

if [ -z "${OP_SERVICE_ACCOUNT_TOKEN:-}" ]; then
  exit 0
fi

install_op_cli() {
  if command -v op >/dev/null 2>&1; then
    return 0
  fi

  if command -v apt-get >/dev/null 2>&1 && command -v sudo >/dev/null 2>&1; then
    curl -fsSL https://downloads.1password.com/linux/keys/1password.asc \
      | sudo gpg --dearmor --output /usr/share/keyrings/1password-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/1password-archive-keyring.gpg] https://downloads.1password.com/linux/debian/$(dpkg --print-architecture) stable main" \
      | sudo tee /etc/apt/sources.list.d/1password.list >/dev/null
    sudo apt-get update -qq
    sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq 1password-cli
    command -v op >/dev/null 2>&1 && return 0
  fi

  local arch raw_arch install_dir
  raw_arch="$(uname -m)"
  case "$raw_arch" in
    x86_64) arch="amd64" ;;
    aarch64 | arm64) arch="arm64" ;;
    *)
      echo "cursor-bootstrap-1p: unsupported architecture: ${raw_arch}" >&2
      return 1
      ;;
  esac

  install_dir="${HOME}/.local/bin"
  mkdir -p "${install_dir}"
  local version="2.30.3"
  local zip="/tmp/op_linux_${arch}.zip"
  curl -fsSL "https://cache.agilebits.com/dist/1P/op2/pkg/v${version}/op_linux_${arch}_v${version}.zip" -o "${zip}"
  unzip -o -q "${zip}" -d /tmp/op-extract
  chmod +x /tmp/op-extract/op
  if command -v sudo >/dev/null 2>&1 && sudo -n mv /tmp/op-extract/op /usr/local/bin/op 2>/dev/null; then
    :
  else
    mv /tmp/op-extract/op "${install_dir}/op"
    export PATH="${install_dir}:${PATH}"
  fi
  rm -rf "${zip}" /tmp/op-extract
  command -v op >/dev/null 2>&1
}

(
  install_op_cli && npm run env:1p
) || true

exit 0
