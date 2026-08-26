#!/usr/bin/env bash
# Denny Love Money — cleanup checklist (Josh Comeau / CSS for JS Devs)
# Docs: CLEANUP.md + https://docs.thatdeveloper.dev/share/dgnghfh526/p/css-for-js-devs-mMY456mIPs
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "== Denny Love Money cleanup =="
echo "CSS notes: https://docs.thatdeveloper.dev/share/dgnghfh526/p/css-for-js-devs-mMY456mIPs"
echo

fail=0

echo "-- Typecheck"
if npx tsc --noEmit; then
  echo "   ok"
else
  echo "   FAILED"
  fail=1
fi
echo

echo "-- Temporary / redundant files"
if [[ -f server/seed_hsa_now.ts ]]; then
  echo "   found server/seed_hsa_now.ts (safe to delete — covered by server/seed.ts)"
else
  echo "   no seed_hsa_now.ts"
fi
echo

echo "-- Layout anti-patterns in client/src (heuristic)"
# Flag flex/grid rows that pair truncate with a notes-under-amount pattern in the same file recently
# (informational — not always wrong)
hits=$(rg -n --glob '*.tsx' 'max-w-\[[0-9]+px\] truncate' client/src || true)
if [[ -n "$hits" ]]; then
  echo "   truncated notes present (ensure they sit under titles, not under currency):"
  echo "$hits" | sed 's/^/   /'
else
  echo "   no max-w-[…] truncate notes found"
fi

# Cards / list rows that use justify-between but never set min-w-0 (common overflow source)
miss=$(rg -l --glob '*-card.tsx' --glob '*-list.tsx' 'justify-between' client/src/components 2>/dev/null | while read -r f; do
  if ! rg -q 'min-w-0' "$f"; then
    echo "$f"
  fi
done || true)
if [[ -n "${miss:-}" ]]; then
  echo "   card/list files with justify-between but no min-w-0 (review for truncate/overflow):"
  echo "$miss" | sed 's/^/   /'
else
  echo "   card/list justify-between rows look OK for min-w-0"
fi
echo

echo "-- Git hygiene"
if git status --porcelain | rg -q '^\?\?|\sM|\sA|\sD'; then
  echo "   working tree has changes — review before commit"
  git status -sb
else
  echo "   clean working tree"
fi
echo

if [[ "$fail" -ne 0 ]]; then
  echo "Cleanup finished with failures."
  exit 1
fi
echo "Cleanup check finished."
