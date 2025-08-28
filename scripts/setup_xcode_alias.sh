#!/usr/bin/env bash

# Setup script to create a simple 'tapfit-xcode' command
SCRIPT_DIR="$(cd "$(dirname "$0")"; pwd)"
BULLETPROOF_SCRIPT="$SCRIPT_DIR/bulletproof_xcode_sync.sh"

echo "🔧 Setting up TapFit Xcode sync alias..."

# Make bulletproof script executable
chmod +x "$BULLETPROOF_SCRIPT"

# Determine shell config file
if [[ "$SHELL" == */zsh ]]; then
  SHELL_CONFIG="$HOME/.zshrc"
elif [[ "$SHELL" == */bash ]]; then
  SHELL_CONFIG="$HOME/.bash_profile"
else
  SHELL_CONFIG="$HOME/.profile"
fi

# Create alias
ALIAS_LINE="alias tapfit-xcode='bash $BULLETPROOF_SCRIPT'"

# Remove existing alias if present
grep -v "alias tapfit-xcode=" "$SHELL_CONFIG" > "${SHELL_CONFIG}.tmp" 2>/dev/null || touch "${SHELL_CONFIG}.tmp"
mv "${SHELL_CONFIG}.tmp" "$SHELL_CONFIG"

# Add new alias
echo "" >> "$SHELL_CONFIG"
echo "# TapFit Xcode sync alias" >> "$SHELL_CONFIG"
echo "$ALIAS_LINE" >> "$SHELL_CONFIG"

echo "✅ Alias created in $SHELL_CONFIG"
echo ""
echo "🚀 Usage:"
echo "   1. Restart terminal OR run: source $SHELL_CONFIG"
echo "   2. From anywhere, just type: tapfit-xcode"
echo ""
echo "That's it! 'tapfit-xcode' will always sync latest Lovable code to Xcode."