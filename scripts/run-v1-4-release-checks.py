#!/usr/bin/env python3
from __future__ import annotations
import pathlib
import subprocess
import sys

ROOT = pathlib.Path.cwd()

VERIFIERS = [
    "scripts/verify-v1-4-ux.mjs",
    "scripts/verify-v1-3.mjs",
    "scripts/verify-p0a-rules.mjs",
    "scripts/verify-stabilization.mjs",
]

JS_SYNTAX = [
    "js/main.js",
    "js/games.js",
    "js/ui-child.js",
    "js/three/world.js",
    "js/three/factories.js",
    "js/systems/rules.js",
    "js/systems/session-state.js",
    "js/systems/typing.js",
    "js/systems/learning.js",
    "js/core/save.js",
    "js/data/catalog.js",
    "scripts/verify-v1-4-ux.mjs",
    "scripts/verify-v1-3.mjs",
    "scripts/verify-p0a-rules.mjs",
    "scripts/verify-stabilization.mjs",
]

def run(*args: str) -> None:
    print("+", " ".join(args), flush=True)
    subprocess.run(args, cwd=ROOT, check=True)

def main() -> int:
    if (ROOT / "VERSION").read_text(encoding="utf-8").strip() != "1.4.0":
        raise RuntimeError("VERSION must be 1.4.0")

    needed = sorted(set([*VERIFIERS, *JS_SYNTAX]))
    missing = [p for p in needed if not (ROOT / p).is_file()]
    if missing:
        raise RuntimeError("missing release-check files: " + ", ".join(missing))

    for verifier in VERIFIERS:
        run("node", verifier)

    for path in JS_SYNTAX:
        run("node", "--check", path)

    run("git", "diff", "--check")

    changed = subprocess.check_output(
        ["git", "diff", "--name-only"], cwd=ROOT, text=True
    ).splitlines()
    markers = ("<<<<<<<", "=======", ">>>>>>>")
    for rel in changed:
        path = ROOT / rel
        if not path.is_file():
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        if any(marker in text for marker in markers):
            raise RuntimeError(f"merge-conflict marker remains in {rel}")

    print("PASS: Obecolle2 v1.4.0 release checks")
    return 0

if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except subprocess.CalledProcessError as e:
        print(
            f"FAIL: command exited {e.returncode}: {' '.join(e.cmd)}",
            file=sys.stderr,
        )
        raise
