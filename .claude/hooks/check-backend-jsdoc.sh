#!/bin/bash
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('file_path',''))" 2>/dev/null || true)

if echo "$FILE_PATH" | grep -qE "backend/src/(services|controllers|middleware)/.*\.ts$"; then
  # Actually inspect the file for exported functions missing a JSDoc block, rather
  # than just reminding on every matching path. Stays non-blocking (no exit 2) —
  # a regex-based check has real false-positive risk on real TypeScript, and this
  # project's whole hook suite is non-blocking by design; the goal here is a
  # higher-value signal, not a hard gate.
  MISSING=$(python3 - "$FILE_PATH" <<'PYEOF' 2>/dev/null || true
import re
import sys

path = sys.argv[1]
try:
    with open(path, "r", encoding="utf-8") as f:
        lines = f.readlines()
except OSError:
    sys.exit(0)

# Matches `export function foo(`, `export async function foo(`, and
# `export const foo = (` / `export const foo = async (` — the two shapes used
# throughout backend/src/services, controllers, and middleware.
decl_re = re.compile(
    r"^export\s+(async\s+function|function|const)\s+([A-Za-z_$][\w$]*)"
)

missing = []
for i, line in enumerate(lines):
    m = decl_re.match(line)
    if not m:
        continue
    name = m.group(2)
    # Walk upward past any blank lines to find the line immediately before
    # this declaration's own leading comment/blank run.
    j = i - 1
    while j >= 0 and lines[j].strip() == "":
        j -= 1
    if j >= 0 and lines[j].rstrip().endswith("*/"):
        continue  # JSDoc block found directly above
    missing.append(f"{name} (line {i + 1})")

if missing:
    print(", ".join(missing))
PYEOF
)

  if [ -n "$MISSING" ]; then
    echo "JSDoc check: '$FILE_PATH' has exported function(s) with no JSDoc block directly above them: $MISSING."
    echo "Add or update JSDoc for these before finishing."
  fi
fi
