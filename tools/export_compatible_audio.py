"""Export broadly compatible listening copies from the 24-bit delivery WAVs."""

from __future__ import annotations

from pathlib import Path

import numpy as np
import soundfile as sf


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "entrega"


def main() -> None:
    names = (
        "Mascota 1min.wav",
        "Mascota 1min ENSAYO.wav",
        "Grupal 3min DEMO.wav",
        "Grupal 3min ENSAYO.wav",
        "Profesoras 2min50 DEMO.wav",
        "Profesoras ENSAYO.wav",
    )
    for name in names:
        source = OUTPUT / name
        if not source.exists():
            continue
        audio, rate = sf.read(source, dtype="float32", always_2d=True)
        # 16-bit PCM is the safest WAV variant for phones and browser players.
        wav16 = source.with_name(f"{source.stem} COMPATIBLE.wav")
        sf.write(wav16, audio, rate, subtype="PCM_16")
        # Constant-bitrate, highest-quality MP3 supported by the bundled encoder.
        mp3 = source.with_suffix(".mp3")
        sf.write(
            mp3,
            np.clip(audio, -1.0, 1.0),
            rate,
            format="MP3",
            subtype="MPEG_LAYER_III",
            compression_level=0.0,
            bitrate_mode="CONSTANT",
        )
        print(f"{mp3.name} | {wav16.name}")


if __name__ == "__main__":
    main()
