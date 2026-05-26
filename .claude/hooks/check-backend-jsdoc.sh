#!/bin/bash
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('file_path',''))" 2>/dev/null || true)

if echo "$FILE_PATH" | grep -qE "backend/src/(services|controllers|middleware)/.*\.ts$"; then
  echo "JSDoc check: '$FILE_PATH' is a backend service/controller/middleware file."
  echo "Verify every function has a correct JSDoc block and add or update it before finishing."
fi
