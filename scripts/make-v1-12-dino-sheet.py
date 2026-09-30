"""Separate the 30 painted dinosaurs and generate a visual QA contact sheet."""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

root = Path(__file__).resolve().parents[1]
atlas = np.asarray(Image.open(root / "assets/illustrations/dinosaurs-atlas.png").convert("RGB"))
foreground = np.max(255 - atlas.astype(np.int16), axis=2) > 45
labels, count = ndimage.label(foreground)
regions = ndimage.find_objects(labels)
components = [(i, region, int(np.count_nonzero(labels[region] == i)))
              for i, region in enumerate(regions, 1) if region]
components = [part for part in components if part[2] > 5000]
assert count >= 30 and len(components) == 30, f"Expected 30 dinosaurs, got {len(components)}"

out_dir = root / "assets/illustrations/dinos"
out_dir.mkdir(parents=True, exist_ok=True)
sheet = Image.new("RGB", (5 * 260, 6 * 198), "#f6f2e7")
draw = ImageDraw.Draw(sheet)
assigned = set()
col_edges = [0, 280, 560, 840, 1120, 1402]
row_edges = [0, 178, 353, 534, 708, 885, 1122]
for component_id, region, _ in components:
    y0, y1 = region[0].start, region[0].stop
    x0, x1 = region[1].start, region[1].stop
    col = int(np.searchsorted(col_edges, (x0 + x1) / 2, side="right") - 1)
    row = int(np.searchsorted(row_edges, (y0 + y1) / 2, side="right") - 1)
    index = row * 5 + col + 1
    assert 1 <= index <= 30 and index not in assigned, f"Duplicate dinosaur index {index}"
    assigned.add(index)
    padding = 5
    left, top = max(0, x0 - padding), max(0, y0 - padding)
    right, bottom = min(atlas.shape[1], x1 + padding), min(atlas.shape[0], y1 + padding)
    component = labels[top:bottom, left:right] == component_id
    alpha = ndimage.gaussian_filter(
        ndimage.binary_dilation(ndimage.binary_fill_holes(component), iterations=2).astype(float),
        sigma=0.65,
    )
    rgba = np.dstack((atlas[top:bottom, left:right], np.uint8(np.clip(alpha * 255, 0, 255))))
    animal = Image.fromarray(rgba, "RGBA")
    animal.thumbnail((300, 216), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (320, 240), (0, 0, 0, 0))
    canvas.alpha_composite(animal, ((320 - animal.width) // 2, (240 - animal.height) // 2))
    canvas.save(out_dir / f"dino_{index}.png", optimize=True)

    left, top = col * 260, row * 198
    preview = canvas.copy()
    preview.thumbnail((246, 168), Image.Resampling.LANCZOS)
    sheet.paste(preview, (left + (260 - preview.width) // 2, top + 5), preview)
    draw.rectangle((left, top, left + 259, top + 197), outline="#cdbfa7", width=2)
    draw.text((left + 9, top + 175), f"dino_{index}", fill="#334c50")

assert len(assigned) == 30
contact_sheet = root / "docs/qa/v1.12/dinosaurs-contact-sheet.png"
contact_sheet.parent.mkdir(parents=True, exist_ok=True)
sheet.save(contact_sheet, optimize=True)
print(f"Generated 30 isolated dinosaur sprites and {contact_sheet}")
