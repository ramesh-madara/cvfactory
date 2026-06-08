#!/usr/bin/env python3
"""
Scan cvs/ and customerFeedback/, renumber image files to 1.ext, 2.ext, ...
(oldest file = 1, newest = highest number), then update data.js counts.
"""

from __future__ import annotations

import re
from collections import Counter
from pathlib import Path

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"}

ROOT = Path(__file__).resolve().parent
CVS_DIR = ROOT / "cvs"
FEEDBACK_DIR = ROOT / "customerFeedback"
DATA_JS = ROOT / "data.js"


def normalize_ext(ext: str) -> str:
    ext = ext.lower()
    return ".jpg" if ext == ".jpeg" else ext


def is_image(path: Path) -> bool:
    return path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS


def predominant_ext(files: list[Path]) -> str:
    if not files:
        return ".jpg"
    counts = Counter(normalize_ext(f.suffix) for f in files)
    return counts.most_common(1)[0][0]


def collect_images(folder: Path) -> list[Path]:
    if not folder.is_dir():
        folder.mkdir(parents=True, exist_ok=True)
        return []

    images = [f for f in folder.iterdir() if is_image(f)]
    # Oldest first -> 1.jpg; newest gets the highest number (shown first in the gallery).
    images.sort(key=lambda p: (p.stat().st_mtime, p.name.lower()))
    return images


def renumber_folder(folder: Path, label: str) -> tuple[int, str]:
    images = collect_images(folder)
    if not images:
        print(f"[{label}] No images found in {folder.name}/")
        return 0, ".jpg"

    ext = predominant_ext(images)
    print(f"[{label}] Renumbering {len(images)} file(s) in {folder.name}/ -> 1{ext} .. {len(images)}{ext}")

    original_names = [image.name for image in images]
    temp_paths: list[Path] = []

    for index, image in enumerate(images):
        temp_path = folder / f"__renumber_temp_{index:04d}{image.suffix.lower()}"
        image.rename(temp_path)
        temp_paths.append(temp_path)

    for index, temp_path in enumerate(temp_paths, start=1):
        final_ext = normalize_ext(temp_path.suffix)
        final_path = folder / f"{index}{final_ext}"
        temp_path.rename(final_path)
        print(f"  {final_path.name}  <-  {original_names[index - 1]}")

    return len(images), ext


def update_data_js(total_cvs: int, cv_ext: str, total_feedbacks: int, feedback_ext: str) -> None:
    if not DATA_JS.is_file():
        raise FileNotFoundError(f"Missing {DATA_JS}")

    content = DATA_JS.read_text(encoding="utf-8")

    replacements = [
        (r"totalCVs:\s*\d+", f"totalCVs: {total_cvs}"),
        (r"cvExt:\s*'[^']*'", f"cvExt: '{cv_ext}'"),
        (r"totalFeedbacks:\s*\d+", f"totalFeedbacks: {total_feedbacks}"),
        (r"feedbackExt:\s*'[^']*'", f"feedbackExt: '{feedback_ext}'"),
    ]

    for pattern, replacement in replacements:
        content, count = re.subn(pattern, replacement, content, count=1)
        if count == 0:
            raise ValueError(f"Could not update field matching /{pattern}/ in data.js")

    DATA_JS.write_text(content, encoding="utf-8")
    print(f"\nUpdated {DATA_JS.name}:")
    print(f"  totalCVs: {total_cvs}")
    print(f"  cvExt: '{cv_ext}'")
    print(f"  totalFeedbacks: {total_feedbacks}")
    print(f"  feedbackExt: '{feedback_ext}'")


def main() -> None:
    print("CV Factory.LK — image renumbering\n")

    cv_count, cv_ext = renumber_folder(CVS_DIR, "CVs")
    feedback_count, feedback_ext = renumber_folder(FEEDBACK_DIR, "Feedback")

    update_data_js(cv_count, cv_ext, feedback_count, feedback_ext)
    print("\nDone.")


if __name__ == "__main__":
    main()
