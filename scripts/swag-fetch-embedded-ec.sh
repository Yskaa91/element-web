#!/usr/bin/env bash
# Download and extract our Element Call build into SWAG_EC_DIR.
# usage: swag-fetch-embedded-ec.sh <tag>   e.g. v0.26.1-swag.1
set -euo pipefail
TAG="${1:?usage: $0 <tag>}"
DEST="${SWAG_EC_DIR:-$(cd "$(dirname "$0")/.." && pwd)/.swag-ec}"
REPO="${SWAG_EC_REPO:-Yskaa91/element-call}"
rm -rf "$DEST" && mkdir -p "$DEST"
gh release download "$TAG" -R "$REPO" -p "element-call-${TAG}.tar.gz" --clobber -O /tmp/ec-swag.tar.gz
TMP="$(mktemp -d)"
tar -xzf /tmp/ec-swag.tar.gz -C "$TMP"
cp -a "$TMP/element-call-${TAG}/." "$DEST/"
test -f "$DEST/index.html" || { echo "no index.html in $DEST" >&2; exit 1; }
echo "Element Call $TAG extracted to $DEST"
