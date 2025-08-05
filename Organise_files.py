#!/usr/bin/env python3
# organize.py — move files into folders by extension, with JSON override, dry-run, recursion, and collision safety.

import argparse
import json
import logging
import shutil
import sys
from pathlib import Path

# 1) Default extension → target-folder mapping
DEFAULT_MAPPING = {
    ".html": "src/pages",
    ".css":  "src/styles",
    ".js":   "src/scripts",
    ".json": "src/data",
    ".png":  "public/images",
    ".jpg":  "public/images",
    ".jpeg": "public/images",
    ".gif":  "public/images",
    ".mp4":  "public/videos",
    ".webm": "public/videos",
    "__others__": "misc"
}


def load_mapping(config_path: Path) -> dict:
    """Load JSON mapping from disk or fall back to DEFAULT_MAPPING."""
    if config_path and config_path.is_file():
        try:
            with config_path.open() as f:
                m = json.load(f)
            logging.info(f"Loaded mapping override from {config_path}")
            return {**DEFAULT_MAPPING, **m}
        except Exception as e:
            logging.error(f"Failed to parse {config_path}: {e}")
            sys.exit(1)
    return DEFAULT_MAPPING.copy()


def resolve_destination(root: Path, mapping: dict, file_path: Path) -> Path:
    """
    Given a file, pick its target based on suffix and mapping.
    Ensures collision-free filenames by appending a counter.
    """
    ext = file_path.suffix.lower()
    subdir = mapping.get(ext, mapping["__others__"])
    dest_dir = root / subdir
    dest_dir.mkdir(parents=True, exist_ok=True)

    # initial candidate
    dest = dest_dir / file_path.name
    if not dest.exists():
        return dest

    # collision: append counter
    stem, suffix = file_path.stem, file_path.suffix
    counter = 1
    while True:
        candidate = dest_dir / f"{stem}_{counter}{suffix}"
        if not candidate.exists():
            return candidate
        counter += 1


def organize(
    root: Path,
    mapping: dict,
    recursive: bool = False,
    dry_run: bool = False
) -> None:
    """
    Walk files at `root` (recursively if requested),
    resolve their destinations, and move (or pretend to).
    """
    pattern = "**/*" if recursive else "*"
    for path in root.glob(pattern):
        if path.is_file() and path.name != Path(__file__).name:
            dest = resolve_destination(root, mapping, path)
            logging.info(f"{path.relative_to(root)} → {dest.relative_to(root)}")
            if not dry_run:
                shutil.move(str(path), str(dest))


def parse_args():
    p = argparse.ArgumentParser(
        description="Organize files into folders by extension."
    )
    p.add_argument(
        "root",
        nargs="?",
        type=Path,
        default=Path.cwd(),
        help="Root directory to organize (default: current working dir)"
    )
    p.add_argument(
        "--config", "-c",
        type=Path,
        help="Optional JSON file with {\".ext\": \"subdir\", ...}"
    )
    p.add_argument(
        "--recursive", "-r",
        action="store_true",
        help="Recurse into subdirectories"
    )
    p.add_argument(
        "--dry-run", "-n",
        action="store_true",
        help="Show what would be moved, but don’t actually move"
    )
    p.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Enable debug logging"
    )
    return p.parse_args()


def main():
    args = parse_args()
    level = logging.DEBUG if args.verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(levelname)s: %(message)s"
    )

    cfg_path = args.config or Path()
    mapping = load_mapping(cfg_path) if args.config else DEFAULT_MAPPING.copy()

    logging.debug(f"Using mapping: {mapping}")
    organize(
        root=args.root,
        mapping=mapping,
        recursive=args.recursive,
        dry_run=args.dry_run
    )


if __name__ == "__main__":
    main()
