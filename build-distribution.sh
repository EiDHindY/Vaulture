#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================="
echo "    Vaulture Production Build & Pack      "
echo "=========================================="

RELEASE_DIR="$SCRIPT_DIR/release"
rm -rf "$RELEASE_DIR"
mkdir -p "$RELEASE_DIR"

echo "[1/4] Building React Production Frontend Bundle..."
cd "$SCRIPT_DIR/Vaulture.Photino/ui"
npm run build
cd "$SCRIPT_DIR"

echo "[2/4] Publishing Linux x64 Self-Contained Binary..."
dotnet publish "$SCRIPT_DIR/Vaulture.Photino/Vaulture.Photino.csproj" \
    -c Release \
    -r linux-x64 \
    --self-contained \
    -p:PublishSingleFile=true \
    -o "$RELEASE_DIR/linux-x64"

rm -f "$RELEASE_DIR/linux-x64"/*.pdb

echo "Creating Vaulture-linux-x64.tar.gz..."
tar -czf "$RELEASE_DIR/Vaulture-linux-x64.tar.gz" -C "$RELEASE_DIR/linux-x64" .

echo "[3/4] Publishing Windows x64 Self-Contained Executable..."
dotnet publish "$SCRIPT_DIR/Vaulture.Photino/Vaulture.Photino.csproj" \
    -c Release \
    -r win-x64 \
    --self-contained \
    -p:PublishSingleFile=true \
    -o "$RELEASE_DIR/win-x64"

rm -f "$RELEASE_DIR/win-x64"/*.pdb

echo "Creating Vaulture-win-x64.zip..."
cd "$RELEASE_DIR/win-x64"
zip -r "$RELEASE_DIR/Vaulture-win-x64.zip" .
cd "$SCRIPT_DIR"

echo "[4/4] Generating SHA256 Checksums..."
cd "$RELEASE_DIR"
sha256sum Vaulture-linux-x64.tar.gz Vaulture-win-x64.zip > SHA256SUMS.txt
cd "$SCRIPT_DIR"

echo "=========================================="
echo "Build complete! Release artifacts ready in:"
echo "$RELEASE_DIR"
echo "=========================================="
ls -lh "$RELEASE_DIR"/*.tar.gz "$RELEASE_DIR"/*.zip "$RELEASE_DIR"/SHA256SUMS.txt
