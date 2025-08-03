import os
import shutil

EXTENSIONS = {
    "html": "pages",
    "htm": "pages",
    "css": "styles",
    "js": "scripts",
    "png": "assets/images",
    "jpg": "assets/images",
    "jpeg": "assets/images",
    "gif": "assets/images",
    "svg": "assets/images",
    "ttf": "assets/fonts",
    "otf": "assets/fonts",
    "woff": "assets/fonts",
    "woff2": "assets/fonts",
    "mp4": "assets/videos",
    "mp3": "assets/audio",
    "wav": "assets/audio"
}

def auto_sort_files(base_path):
    for root, _, files in os.walk(base_path):
        for file in files:
            if root.startswith(os.path.join(base_path, ".")):
                continue
            ext = file.split(".")[-1].lower()
            if ext in EXTENSIONS:
                new_folder = os.path.join(base_path, EXTENSIONS[ext])
                os.makedirs(new_folder, exist_ok=True)
                src_path = os.path.join(root, file)
                dst_path = os.path.join(new_folder, file)
                if src_path != dst_path:
                    shutil.move(src_path, dst_path)

if __name__ == "__main__":
    print("Sorting files in this folder...")
    auto_sort_files(".")
    print("Done.")
