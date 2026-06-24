#!/usr/bin/env python3
"""Generate PNG PWA icons from icons/icon.svg (requires Pillow)."""

from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    raise SystemExit('Install Pillow first: pip install pillow')

ROOT = Path(__file__).resolve().parent
ICONS = ROOT / 'icons'


def draw_icon(size: int) -> Image.Image:
    img = Image.new('RGBA', (size, size), (10, 10, 10, 255))
    draw = ImageDraw.Draw(img)
    margin = size // 10
    radius = size // 6
    draw.rounded_rectangle(
        [margin, margin, size - margin, size - margin],
        radius=radius,
        fill=(23, 23, 23, 255),
        outline=(245, 158, 11, 90),
        width=max(2, size // 64),
    )

    try:
        title_font = ImageFont.truetype('arialbd.ttf', size // 7)
        sub_font = ImageFont.truetype('arialbd.ttf', size // 12)
    except OSError:
        title_font = ImageFont.load_default()
        sub_font = ImageFont.load_default()

    draw.text((size // 2, size * 0.42), 'CV', fill=(250, 250, 250, 255), font=title_font, anchor='mm')
    dot_r = max(4, size // 36)
    draw.ellipse(
        [size * 0.58 - dot_r, size * 0.52 - dot_r, size * 0.58 + dot_r, size * 0.52 + dot_r],
        fill=(245, 158, 11, 255),
    )
    draw.text((size // 2, size * 0.62), 'FACTORY', fill=(245, 158, 11, 255), font=sub_font, anchor='mm')
    return img


def main() -> None:
    ICONS.mkdir(parents=True, exist_ok=True)
    for size in (192, 512):
        path = ICONS / f'icon-{size}.png'
        draw_icon(size).save(path, 'PNG')
        print(f'Wrote {path.name}')


if __name__ == '__main__':
    main()
