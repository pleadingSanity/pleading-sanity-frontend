
#!/usr/bin/env python3
# organize.py

import argparse
import json
import logging
import shutil
import sys
from pathlib import Path

# ─── Default extension→folder mapping ─────────────────────────────────────────
DEFAULT_MAPPING = {
    ".html":  "src/pages",
    ".css":   "src/styles",
    ".js":    "src/scripts",
    ".json":  "src/data",
    ".png":   "public/images",
    ".jpg":   "public/images",
    ".jpeg":  "public/images",
    ".gif":   "public/images",
    ".mp4":   "public/videos",
    ".webm":  "public/videos",
    "__others__": "misc"
}


def load_mapping(config_path: Path):
    """Load JSON mapping from disk or fall back to DEFAULT_MAPPING."""
    if config_path and config_path.is_file():
        try:
            with config_path.open() as f:
                mapping = json.load(f)
            logging.info(f"Loaded mapping from {config_path}")
            return mapping
        except Exception as e:
            logging.error(f"Failed to parse {config_path}: {e}")
            sys.exit(1)
    return DEFAULT_MAPPING.copy()


def resolve_destination(root: Path, mapping: dict, file_path: Path) -> Path:
    """
    Given a file, pick its target based on extension and mapping.
    Creates collision-free filename if needed.
    """
    ext = file_path.suffix.lower()
    target_sub = mapping.get(ext, mapping.get("__others__"))
    dest_dir = root / target_sub
    dest_dir.mkdir(parents=True, exist_ok=True)

    # build a non-colliding destination filename
    dest = dest_dir / file_path.name
    if not dest.exists():
        return dest

    stem = file_path.stem
    suffix = file_path.suffix
    counter = 1
    while True:
        candidate = dest_dir / f"{stem}_{counter}{suffix}"
        if not candidate.exists():
            return candidate
        counter += 1


def organize(root: Path, mapping: dict, recursive: bool, dry_run: bool):
    """
    Walk either top-level (non-recursive) or entire tree (recursive),
    moving files into their resolved destinations.
    """
    iterator = root.rglob("*") if recursive else root.iterdir()
    for p in iterator:
        if p.is_file():
            dest = resolve_destination(root, mapping, p)
            logging.info(f"{p.relative_to(root)} → {dest.relative_to(root)}")
            if not dry_run:
                shutil.move(str(p), str(dest))


def main():
    p = argparse.ArgumentParser(
        description="Organize files into folders by extension."
    )
    p.add_argument("root",
                   type=Path,
                   help="Root directory to organize (e.g. `.`)")
    p.add_argument("--config",
                   type=Path,
                   help="Optional JSON file with extension→folder mapping")
    p.add_argument("--recursive",
                   action="store_true",
                   help="Recurse into subdirectories")
    p.add_argument("--dry-run",
                   action="store_true",
                   help="Show what would happen without moving anything")
    p.add_argument("--verbose",
                   action="store_true",
                   help="Enable debug logging")
    args = p.parse_args()

    level = logging.DEBUG if args.verbose else logging.INFO
    logging.basicConfig(level=level, format="%(message)s")

    if not args.root.is_dir():
        logging.error(f"Invalid directory: {args.root}")
        sys.exit(1)

    mapping = load_mapping(args.config) if args.config else DEFAULT_MAPPING.copy()
    logging.info(f"{'DRY RUN —' if args.dry_run else ''} organizing `{args.root}`")
    organize(args.root, mapping, args.recursive, args.dry_run)


if __name__ == "__main__":
    main()
