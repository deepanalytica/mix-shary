"""Print timing, energy landmarks and rough lyric timestamps for source audio."""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from faster_whisper import WhisperModel


def energy_landmarks(path: Path) -> None:
    audio, sr = sf.read(path, dtype="float32", always_2d=True)
    mono = audio.mean(axis=1)
    hop = max(1, int(sr * 0.05))
    usable = len(mono) // hop * hop
    rms = np.sqrt(np.mean(mono[:usable].reshape(-1, hop) ** 2, axis=1) + 1e-12)
    db = 20 * np.log10(rms + 1e-12)
    active = np.flatnonzero(db > max(-42.0, float(np.percentile(db, 75) - 22.0)))
    first = float(active[0] * hop / sr) if len(active) else 0.0
    print(f"duration={len(audio)/sr:.3f}s first_active={first:.2f}s peak={np.max(np.abs(audio)):.4f}")


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    roots = Path(__file__).resolve().parents[1] / "fuentes"
    args = list(sys.argv[1:])
    clip_start = 0.0
    seconds = 90.0
    if args and ":" in args[0]:
        clip_start, clip_end = (float(v) for v in args.pop(0).split(":", 1))
        seconds = clip_end - clip_start
    elif args and args[0].replace(".", "", 1).isdigit():
        seconds = float(args.pop(0))
    wanted = " ".join(args).lower()
    files = sorted(roots.glob("*.mp3"))
    if wanted:
        files = [p for p in files if all(word in p.name.lower() for word in wanted.split())]
    model = WhisperModel("Systran/faster-whisper-tiny", device="cpu", compute_type="int8", local_files_only=True)
    for path in files:
        print(f"\n=== {path.name} ===")
        energy_landmarks(path)
        segments, info = model.transcribe(
            str(path),
            beam_size=2,
            vad_filter=False,
            word_timestamps=False,
            clip_timestamps=f"{clip_start},{clip_start + seconds}",
        )
        for segment in segments:
            text = segment.text.strip()
            if text:
                print(f"{segment.start:7.2f}-{segment.end:7.2f}  {text}")


if __name__ == "__main__":
    main()
