#!/usr/bin/env python3
"""
Scan cvs/ and customerFeedback/, renumber media files to 1.ext, 2.ext, ...
(oldest file = 1, newest = highest number), then update data.js counts.
Feedback folder supports images and .mp4 videos.
"""

from __future__ import annotations

import re
from collections import Counter
from pathlib import Path

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"}
VIDEO_EXTENSIONS = {".mp4"}
FEEDBACK_EXTENSIONS = IMAGE_EXTENSIONS | VIDEO_EXTENSIONS

ROOT = Path(__file__).resolve().parent
CVS_DIR = ROOT / "cvs"
FEEDBACK_DIR = ROOT / "customerFeedback"
DATA_JS = ROOT / "data.js"


def normalize_ext(ext: str) -> str:
    ext = ext.lower()
    return ".jpg" if ext == ".jpeg" else ext


def is_cv_image(path: Path) -> bool:
    return path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS


def is_feedback_media(path: Path) -> bool:
    return path.is_file() and path.suffix.lower() in FEEDBACK_EXTENSIONS


def predominant_ext(files: list[Path]) -> str:
    if not files:
        return ".jpg"
    counts = Counter(normalize_ext(f.suffix) for f in files)
    return counts.most_common(1)[0][0]


def collect_files(folder: Path, matcher) -> list[Path]:
    if not folder.is_dir():
        folder.mkdir(parents=True, exist_ok=True)
        return []

    files = [f for f in folder.iterdir() if matcher(f)]
    files.sort(key=lambda p: (p.stat().st_mtime, p.name.lower()))
    return files


def renumber_folder(folder: Path, label: str, matcher) -> tuple[int, str]:
    files = collect_files(folder, matcher)
    if not files:
        print(f"[{label}] No media found in {folder.name}/")
        return 0, ".jpg"

    ext = predominant_ext(files)
    print(f"[{label}] Renumbering {len(files)} file(s) in {folder.name}/")

    original_names = [media.name for media in files]
    temp_paths: list[Path] = []

    for index, media in enumerate(files):
        temp_path = folder / f"__renumber_temp_{index:04d}{media.suffix.lower()}"
        media.rename(temp_path)
        temp_paths.append(temp_path)

    for index, temp_path in enumerate(temp_paths, start=1):
        final_ext = normalize_ext(temp_path.suffix)
        final_path = folder / f"{index}{final_ext}"
        temp_path.rename(final_path)
        print(f"  {final_path.name}  <-  {original_names[index - 1]}")

    return len(files), ext


def feedback_files_newest_first(count: int) -> list[str]:
    files: list[str] = []
    for index in range(count, 0, -1):
        for candidate in FEEDBACK_DIR.iterdir():
            if candidate.is_file() and candidate.stem == str(index) and is_feedback_media(candidate):
                files.append(candidate.name)
                break
    return files


def format_feedback_files(files: list[str]) -> str:
    if not files:
        return "feedbackFiles: [],"
    quoted = ", ".join(f"'{name}'" for name in files)
    return f"feedbackFiles: [{quoted}],"


def update_data_js(total_cvs: int, cv_ext: str, total_feedbacks: int, feedback_ext: str, feedback_files: list[str]) -> None:
    if not DATA_JS.is_file():
        raise FileNotFoundError(f"Missing {DATA_JS}")

    content = DATA_JS.read_text(encoding="utf-8")

    replacements = [
        (r"totalCVs:\s*\d+", f"totalCVs: {total_cvs}"),
        (r"cvExt:\s*'[^']*'", f"cvExt: '{cv_ext}'"),
        (r"totalFeedbacks:\s*\d+", f"totalFeedbacks: {total_feedbacks}"),
        (r"feedbackExt:\s*'[^']*'", f"feedbackExt: '{feedback_ext}'"),
        (r"feedbackFiles:\s*\[[^\]]*\],?", format_feedback_files(feedback_files)),
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
    print(f"  feedbackFiles: {feedback_files}")


def main() -> None:
    print("CV Factory.LK — media renumbering\n")

    cv_count, cv_ext = renumber_folder(CVS_DIR, "CVs", is_cv_image)
    feedback_count, feedback_ext = renumber_folder(FEEDBACK_DIR, "Feedback", is_feedback_media)
    feedback_files = feedback_files_newest_first(feedback_count)

    update_data_js(cv_count, cv_ext, feedback_count, feedback_ext, feedback_files)
    print("\nDone.")


if __name__ == "__main__":
    main()
