#!/usr/bin/env bash
set -euo pipefail
OUT=/opt/cursor/artifacts
URL="${1:-http://127.0.0.1:4321/demo-chat-scores}"
CHROME="google-chrome"
for spec in "390:844:bp-phone-390" "768:1024:bp-tablet-768" "1024:768:bp-laptop-1024" "1440:900:bp-desktop-1440"; do
  IFS=: read -r w h name <<< "$spec"
  prof="/tmp/chrome-shot-$name-$$"
  "$CHROME" --headless=new --disable-gpu --no-sandbox --user-data-dir="$prof" \
    --window-size="$w,$h" --virtual-time-budget=5000 \
    --screenshot="$OUT/dev235-$name.png" "$URL" 2>/dev/null || true
  rm -rf "$prof"
done
ls -la "$OUT"/dev235-bp-*.png 2>/dev/null || echo "screenshots missing"
