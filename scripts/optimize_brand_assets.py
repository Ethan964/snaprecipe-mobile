from pathlib import Path

from PIL import Image

TARGETS = [
    Path("/home/ubuntu/snaprecipe-mobile/assets/images/icon.png"),
    Path("/home/ubuntu/snaprecipe-mobile/assets/images/splash-icon.png"),
    Path("/home/ubuntu/snaprecipe-mobile/assets/images/favicon.png"),
    Path("/home/ubuntu/snaprecipe-mobile/assets/images/android-icon-foreground.png"),
]

MAX_SIZE = (896, 896)

for path in TARGETS:
    image = Image.open(path).convert("RGBA")
    image.thumbnail(MAX_SIZE, Image.Resampling.LANCZOS)
    image.save(path, format="PNG", optimize=True)
    print(f"optimized {path} -> {path.stat().st_size} bytes")
