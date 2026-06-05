from pathlib import Path

from PIL import Image


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SOURCE_ICON = PROJECT_ROOT / "assets" / "icon.png"
ANDROID_RES = PROJECT_ROOT / "android" / "app" / "src" / "main" / "res"
ADAPTIVE_FOREGROUND_SCALE = 0.72

LEGACY_ICON_SIZES = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}

ADAPTIVE_FOREGROUND_SIZES = {
    "mipmap-mdpi": 108,
    "mipmap-hdpi": 162,
    "mipmap-xhdpi": 216,
    "mipmap-xxhdpi": 324,
    "mipmap-xxxhdpi": 432,
}


def save_webp(image: Image.Image, path: Path, preserve_alpha: bool = False) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if preserve_alpha:
        image.convert("RGBA").save(path, "WEBP", lossless=True, method=6)
        return

    image.convert("RGB").save(path, "WEBP", quality=95, method=6)


def main() -> None:
    source = Image.open(SOURCE_ICON).convert("RGBA")

    for folder, size in LEGACY_ICON_SIZES.items():
        icon = source.resize((size, size), Image.Resampling.LANCZOS)
        save_webp(icon, ANDROID_RES / folder / "ic_launcher.webp")
        save_webp(icon, ANDROID_RES / folder / "ic_launcher_round.webp")

    for folder, size in ADAPTIVE_FOREGROUND_SIZES.items():
        foreground = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        safe_size = round(size * ADAPTIVE_FOREGROUND_SCALE)
        safe_icon = source.resize((safe_size, safe_size), Image.Resampling.LANCZOS)
        offset = ((size - safe_size) // 2, (size - safe_size) // 2)
        foreground.alpha_composite(safe_icon, dest=offset)
        save_webp(foreground, ANDROID_RES / folder / "ic_launcher_foreground.webp", preserve_alpha=True)

    print(f"Generated Android launcher icons from {SOURCE_ICON}")


if __name__ == "__main__":
    main()
