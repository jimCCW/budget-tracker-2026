#!/bin/bash
PRETTIER_BIN="./frontend/node_modules/.bin/prettier"
if [ ! -x "$PRETTIER_BIN" ]; then
  PRETTIER_BIN=$(which prettier 2>/dev/null || true)
fi
if [ -z "$PRETTIER_BIN" ]; then
  exit 0
fi

find frontend backend -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.css" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/.next/*" \
  -not -path "*/dist/*" \
  -not -path "*/build/*" \
  | xargs "$PRETTIER_BIN" --write > /dev/null 2>&1 || true
exit 0
