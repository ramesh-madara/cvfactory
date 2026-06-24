#!/usr/bin/env python3
"""Generate circular PWA icons from favicon.png (requires Pillow)."""

from pathlib import Path

try:
    from PIL import Image, ImageDraw
except ImportError:
    raise SystemExit('Install Pillow first: pip install pillow')

ROOT = Path(__file__).resolve().parent
ICONS = ROOT / 'icons'
FAVICON = ROOT / 'favicon.png'


def circular_icon(size: int) -> Image.Image:
    if not FAVICON.is_file():
        raise FileNotFoundError(f'Missing {FAVICON}')

    favicon = Image.open(FAVICON).convert('RGBA')
    favicon = favicon.resize((size, size), Image.Resampling.LANCZOS)

    mask = Image.new('L', (size, size), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, size - 1, size - 1), fill=255)

    output = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    output.paste(favicon, (0, 0), mask)
    return output


def main() -> None:
    ICONS.mkdir(parents=True, exist_ok=True)
    for size in (192, 512):
        path = ICONS / f'icon-{size}.png'
        circular_icon(size).save(path, 'PNG')
        print(f'Wrote {path.name}')


if __name__ == '__main__':
    main()
