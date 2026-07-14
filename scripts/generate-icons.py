"""App-Icons aus dem echten Markenlogo erzeugen (public/assets/af-logo.png).

Gleiche Rezeptur wie im Schwesterprojekt Muskelfinder-V2 (scripts/generate-icons.py):
dieselbe Logo-Datei, dieselbe Kachelfarbe, dieselben Radien — damit beide Apps in
der Tableiste identisch aussehen.

Vorher waren die Favicons hier ein fast weisses A auf transparentem Grund und
damit in hellen Tableisten unsichtbar.

Aufruf:  python3 scripts/generate-icons.py   (aus dem Projekt-Wurzelverzeichnis)
"""
from PIL import Image, ImageDraw

SRC = 'public/assets/af-logo.png'   # weisses A + oranger Schwung, transparent
TILE = (28, 27, 24, 255)            # #1c1b18 — warmes Anthrazit (Marken-Token)

logo = Image.open(SRC).convert('RGBA')
logo = logo.crop(logo.getchannel('A').getbbox())


def tile(size: int, radius_pct: float, logo_pct: float) -> Image.Image:
    """Quadratische Kachel mit zentriertem, proportional eingepasstem Logo."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    r = int(size * radius_pct)
    if r > 0:
        draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=r, fill=TILE)
    else:
        draw.rectangle([0, 0, size - 1, size - 1], fill=TILE)

    box = int(size * logo_pct)
    w, h = logo.size
    scale = min(box / w, box / h)
    mark = logo.resize((max(1, int(w * scale)), max(1, int(h * scale))), Image.LANCZOS)
    img.paste(mark, ((size - mark.width) // 2, (size - mark.height) // 2), mark)
    return img


def flatten(img: Image.Image) -> Image.Image:
    """Alpha auf die Kachelfarbe legen (iOS mag kein Alpha; sonst wuerden die
    runden Ecken schwarz statt anthrazit)."""
    bg = Image.new('RGBA', img.size, TILE)
    bg.alpha_composite(img)
    return bg.convert('RGB')


# Tab-Favicons: klein, daher Logo groesser im Rahmen, damit die Form bei 16px traegt.
tile(512, 0.22, 0.72).save('public/favicon.png')
for size in (16, 32, 64):
    tile(size, 0.22, 0.76).save(f'public/assets/favicon-{size}.png')

# Echte ICO mit mehreren Groessen (frueher lag hier ein PNG mit .ico-Endung).
tile(512, 0.22, 0.72).save(
    'public/favicon.ico', format='ICO', sizes=[(16, 16), (32, 32), (48, 48)]
)

flatten(tile(180, 0.22, 0.72)).save('public/assets/apple-touch-icon.png')

# Maskable: randlos (das OS schneidet selbst), Logo in der Sicherheitszone.
for size in (192, 512):
    tile(size, 0.0, 0.56).save(f'public/assets/icon-maskable-{size}.png')

print('geschrieben: favicon.png, favicon.ico, favicon-16/32/64, '
      'apple-touch-icon, icon-maskable-192/512')
