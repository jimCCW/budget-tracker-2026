#!/bin/bash
INPUT=$(cat)
FILE_PATH=$(python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('file_path',''))" 2>/dev/null <<< "$INPUT" || true)

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

if ! echo "$FILE_PATH" | grep -qE "\.(ts|tsx|js|jsx|css|json|md)$"; then
  exit 0
fi

if echo "$FILE_PATH" | grep -qE "/(node_modules|\.next|dist|build)/"; then
  exit 0
fi

PRETTIER_BIN="./frontend/node_modules/.bin/prettier"
if [ ! -x "$PRETTIER_BIN" ]; then
  PRETTIER_BIN=$(which prettier 2>/dev/null || true)
fi

if [ -z "$PRETTIER_BIN" ]; then
  exit 0
fi

"$PRETTIER_BIN" --write "$FILE_PATH" > /dev/null 2>&1 || true
exit 0
