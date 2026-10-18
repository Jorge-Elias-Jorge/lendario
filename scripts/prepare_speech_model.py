"""Build-time only. Bundle a pinned Portuguese model; never download at runtime."""
from pathlib import Path
import hashlib
import os
import shutil
import urllib.request
import zipfile

root = Path(__file__).resolve().parents[1]
name = "vosk-model-small-pt-0.3"
expected = "6e1ce909032e1afa7a88e68a3d628ecafff302bdf195befab308826c395e93b7"
cache = Path(os.environ.get("LEGENDARIO_MODEL_CACHE", str(root / ".model-cache")))
cache.mkdir(parents=True, exist_ok=True)
archive = cache / (name + ".zip")
if not archive.exists():
    partial = archive.with_suffix(".partial")
    try:
        with urllib.request.urlopen("https://alphacephei.com/vosk/models/" + name + ".zip", timeout=120) as response, partial.open("wb") as output:
            shutil.copyfileobj(response, output)
        partial.replace(archive)
    finally:
        partial.unlink(missing_ok=True)
if hashlib.sha256(archive.read_bytes()).hexdigest() != expected:
    raise RuntimeError("Modelo de voz com SHA-256 inesperado. Cache rejeitada.")
with zipfile.ZipFile(archive) as z:
    if name + "/final.mdl" not in z.namelist():
        raise RuntimeError("Modelo de voz incompleto.")
assets = root / "android/app/src/main/assets/speech"
assets.mkdir(parents=True, exist_ok=True)
shutil.copyfile(archive, assets / "pt.zip")
shutil.copyfile(root / "native/speech/NOTICE.txt", assets / "NOTICE.txt")
shutil.copyfile(root / "native/speech/LICENSE-APACHE-2.0.txt", assets / "LICENSE-APACHE-2.0.txt")
print("Modelo PT incluído no APK, SHA-256 verificado:", expected)
