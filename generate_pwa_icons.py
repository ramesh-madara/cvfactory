#!/usr/bin/env python3
"""Generate PNG PWA icons from icons/icon.svg (Pillow rasterizer)."""

from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    raise SystemExit('Install Pillow first: pip install pillow')

ROOT = Path(__file__).resolve().parent
ICONS = ROOT / 'icons'
SVG_SOURCE = ICONS / 'icon.svg'

TOP_COLOR = (0x2E, 0x2E, 0x2E)
BOTTOM_COLOR = (0x1A, 0x1A, 0x1A)
GOLD = (0xC8, 0xA0, 0x4D)
WHITE = (0xFF, 0xFF, 0xFF)


def lerp(a: int, b: int, t: float) -> int:
    return int(a + (b - a) * t)


def load_font(size: int, bold: bool = True) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = ['arialbd.ttf', 'Arial Bold.ttf', 'segoeuib.ttf', 'calibrib.ttf']
    if not bold:
        candidates = ['arial.ttf', 'Arial.ttf', 'segoeui.ttf']
    for name in candidates:
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def rasterize_icon(size: int) -> Image.Image:
    """Rasterize icons/icon.svg — circular gradient + CVF lettering."""
    if not SVG_SOURCE.is_file():
        raise FileNotFoundError(f'Missing {SVG_SOURCE}')

    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    pixels = img.load()
    center = size / 2
    radius_sq = center * center

    for y in range(size):
        t = y / (size - 1) if size > 1 else 0
        row = (
            lerp(TOP_COLOR[0], BOTTOM_COLOR[0], t),
            lerp(TOP_COLOR[1], BOTTOM_COLOR[1], t),
            lerp(TOP_COLOR[2], BOTTOM_COLOR[2], t),
        )
        for x in range(size):
            dx = x + 0.5 - center
            dy = y + 0.5 - center
            if dx * dx + dy * dy <= radius_sq:
                pixels[x, y] = (*row, 255)

    draw = ImageDraw.Draw(img)
    font_size = max(12, round(size * 168 / 512))
    font = load_font(font_size)

    cv_text = 'CV'
    f_text = 'F'
    cv_bbox = draw.textbbox((0, 0), cv_text, font=font)
    f_bbox = draw.textbbox((0, 0), f_text, font=font)
    cv_w = cv_bbox[2] - cv_bbox[0]
    f_w = f_bbox[2] - f_bbox[0]
    total_w = cv_w + f_w
    start_x = (size - total_w) / 2
    baseline_y = size * 300 / 512

    draw.text((start_x, baseline_y), cv_text, font=font, fill=GOLD, anchor='lm')
    draw.text((start_x + cv_w, baseline_y), f_text, font=font, fill=WHITE, anchor='lm')

    return img


def main() -> None:
    ICONS.mkdir(parents=True, exist_ok=True)
    for icon_size in (192, 512):
        path = ICONS / f'icon-{icon_size}.png'
        rasterize_icon(icon_size).save(path, 'PNG')
        print(f'Wrote {path.name} from {SVG_SOURCE.name}')


if __name__ == '__main__':
    main()
