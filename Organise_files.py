import os
import shutil

# Define source and target directories
ROOT = os.getcwd()
TARGETS = {
    '.html': 'src/pages',
    '.css':  'src/styles',
    '.js':   'src/scripts',
    '.json': 'src/data',
    '.png':  'public/images',
    '.jpg':  'public/images',
    '.jpeg': 'public/images',
    '.gif':  'public/images',
    '.mp4':  'public/videos',
    '.webm': 'public/videos'
}

# Create target directories if they don’t exist
def ensure_dirs():
    for path in set(TARGETS.values()):
        os.makedirs(path, exist_ok=True)

# Move files based on extension
def organize_files():
    for fname in os.listdir(ROOT):
        src_path = os.path.join(ROOT, fname)
        if os.path.isfile(src_path):
            _, ext = os.path.splitext(fname)
            ext = ext.lower()
            if ext in TARGETS:
                target_dir = os.path.join(ROOT, TARGETS[ext])
                dst_path = os.path.join(target_dir, fname)
                if not os.path.exists(dst_path):
                    shutil.move(src_path, dst_path)
                    print(f"Moved {fname} → {TARGETS[ext]}")

if __name__ == '__main__':
    ensure_dirs()
    organize_files()
    print("File organization complete.")
