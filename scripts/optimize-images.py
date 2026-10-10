"""Optional offline asset preparation; Pillow with AVIF support required.
Run from any directory. Originals are preserved; no server/build is needed.
"""
from pathlib import Path
from PIL import Image
ASSETS = Path(__file__).resolve().parents[1] / 'assets'
WIDTHS = (320, 480, 640, 960, 1440)
for stem in ('statement-editorial', 'gabriel'):
    with Image.open(ASSETS / f'{stem}.png') as source:
        source = source.convert('RGB')
        for width in WIDTHS:
            image = source.resize((width, round(source.height * width / source.width)), Image.Resampling.LANCZOS)
            formats = ('avif', 'webp') if stem == 'statement-editorial' else ('webp',)
            if 'avif' in formats:
                image.save(ASSETS / f'{stem}-{width}.avif', 'AVIF', quality=55, speed=6)
            image.save(ASSETS / f'{stem}-{width}.webp', 'WEBP', quality=78, method=6)
            print(stem, width, *[f'{fmt}: {(ASSETS / f"{stem}-{width}.{fmt}").stat().st_size} B' for fmt in formats])
