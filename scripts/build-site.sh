#!/usr/bin/env bash
# The public site, and nothing else. ONE copy of the build, because two copies drift.
#
# These six lines used to live inline in .github/workflows/pages.yml, and when R10 was added to
# ci.yml on 2026-09-10 they were pasted a second time. Two hand-maintained copies of "what the
# public build contains" is the same shape as the fault that put El Changarrito on the internet:
# the thing that decides is somewhere nobody looks, and there is more than one of it.
#
# This file can never ship. `scripts/` is on test/public.js's NEVER list, and it is not on the
# allowlist below, so it cannot copy itself.
#
# Adding to this list is a decision, not a chore: anything named here becomes public the next time
# main is pushed. test/public.js (R10) checks the result, not this script — check the box, never the
# recipe for packing it.
set -euo pipefail
OUT="${1:-_site}"
rm -rf "$OUT"; mkdir -p "$OUT/content"
cp index.html shell.css sw.js sw-register.js frame-guard.js qr.js manifest.webmanifest icon-192.png icon-512.png "$OUT/"
cp -r engine vendor "$OUT/"
cp -r content/meridian "$OUT/content/"

# EL HORNO goes out too, at the owner's word on 2026-09-22 ("lets build/ship it"). It is its own
# world -- one room, one tray, one verb -- and it shares the engine and nothing else: it has no
# service worker, no manifest, and it never touches content/meridian.
#
# ITS SHELL IS GENERATED AND IS NOT IN GIT (.gitignore, content/horno/index.html), because a
# hand-made copy of index.html is a second thing to keep in step and this repo has a scar from
# exactly that. So the generator runs HERE, before the copy, and it asserts every edit matched --
# a String.replace that stops matching returns the input unchanged, and a shell built from a
# changed index.html by a generator nobody checked is a page that quietly stops being the game.
node test/horno.js --build-only
cp -r content/horno "$OUT/content/"
[ -f "$OUT/content/horno/index.html" ] || { echo "el horno has no shell in the build -- the generator did not write one, and shipping the pack without it publishes a folder nobody can open" >&2; exit 1; }

echo "built $OUT: $(find "$OUT" -type f | wc -l) files"
