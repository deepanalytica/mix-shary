"""Render clean V4 mixes: only original music, short transparent crossfades."""

from __future__ import annotations

import numpy as np
import soundfile as sf

import build_demo_mixes as base
import build_dj_v3_pro as pro


OUTPUT = base.OUTPUT
SR = base.SR


def place(mix: np.ndarray, at: float, clip: np.ndarray) -> None:
    base.place(mix, at, clip)


def build_group(s: dict[str, np.ndarray]) -> np.ndarray:
    """Three minutes with a 30-second opening for La Voz de los 80."""
    mix = np.zeros((base.frames(180.0), 2), dtype=np.float32)

    # 0:00-0:30: requested original introduction, twice as long as before.
    voice = pro.prepare(s["voice"], 0.0, 30.10, -18.0, 0.010, 0.200)
    place(mix, 0.0, voice)

    # 0:30-0:57: riff -> title hook, both from the original AC/DC recording.
    back_a = pro.prepare(s["back"], 0.48, 12.18, -17.8, 0.180, 0.050)
    back_b = pro.prepare(s["back"], 52.95, 15.14, -17.8, 0.050, 0.200)
    back = pro.equal_power_join(back_a, back_b, 0.12)
    place(mix, 29.90, back)

    # 0:57-1:25: one continuous chorus, no internal jump.
    girls = pro.prepare(s["girls"], 64.5, 28.20, -17.8, 0.180, 0.200)
    place(mix, 56.90, girls)

    # 1:25-2:01: one continuous Ghostbusters passage. Keeping it as a single
    # clip removes the doubled transient that the earlier overlap produced.
    ghost = pro.prepare(s["ghost"], 20.9, 36.20, -17.8, 0.180, 0.200)
    place(mix, 84.90, ghost)

    # 2:01-2:23: chorus-led Celebration block.
    celebration = pro.prepare(s["celebration"], 64.5, 22.20, -17.8, 0.180, 0.200)
    place(mix, 120.90, celebration)

    # 2:23-3:00: unchanged large finale, ending with a clean musical release.
    dance = pro.prepare(s["dance"], 285.0, 37.10, -17.7, 0.180, 0.350)
    place(mix, 142.90, dance)
    return pro.finalise(mix)


def build_madonna(s: dict[str, np.ndarray]) -> np.ndarray:
    """Two minutes fifty using only the three original Madonna recordings."""
    mix = np.zeros((base.frames(170.0), 2), dtype=np.float32)

    # Starts with eight seconds of the real Like a Virgin lead-in, then its hook.
    virgin = pro.prepare(
        s["virgin"],
        50.0,
        68.10,
        -18.0,
        0.012,
        0.200,
        -3.0,
        compressor_threshold_db=-28.0,
        compressor_ratio=4.0,
    )
    virgin = pro.transparent_lift(virgin, 3.5)
    place(mix, 0.0, virgin)

    # Short 200 ms overlap only; no bells, impacts, sweeps, or echo effects.
    material = pro.prepare(s["material"], 135.4, 50.20, -17.8, 0.180, 0.200)
    place(mix, 67.90, material)

    groove = pro.prepare(s["groove"], 41.0, 52.10, -17.7, 0.180, 0.350)
    place(mix, 117.90, groove)
    return pro.finalise(mix)


def rehearsal(master: np.ndarray, length: float, cues: tuple[float, ...]) -> np.ndarray:
    return pro.rehearsal(master, length, cues)


def write_set(name: str, master: np.ndarray, ensayo: np.ndarray) -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for role, audio in (("MASTER", master), ("ENSAYO", ensayo)):
        wav = OUTPUT / f"{name} V4 LIMPIO {role}.wav"
        sf.write(wav, audio, SR, subtype="PCM_24")
        sf.write(
            wav.with_suffix(".mp3"),
            audio,
            SR,
            format="MP3",
            subtype="MPEG_LAYER_III",
            compression_level=0.0,
            bitrate_mode="CONSTANT",
        )


def main() -> None:
    paths = {
        "voice": base.find_source("La Voz*.mp3"),
        "back": base.find_source("AC_DC*.mp3"),
        "girls": base.find_source("Cyndi*.mp3"),
        "ghost": base.find_source("Ray Parker*.mp3"),
        "celebration": base.find_source("Kool*.mp3"),
        "dance": base.find_source("*El Baile*.mp3"),
        "virgin": base.find_source("*Like A Virgin*.mp3"),
        "material": base.find_source("*Material Girl*.mp3"),
        "groove": base.find_source("*Into The Groove*.mp3"),
    }
    sources = {name: base.read(path) for name, path in paths.items()}
    group = build_group(sources)
    madonna = build_madonna(sources)
    group_ensayo = rehearsal(
        group, 180.0, (30.0, 57.0, 85.0, 91.0, 121.0, 143.0, 179.5)
    )
    madonna_ensayo = rehearsal(madonna, 170.0, (68.0, 118.0, 169.5))
    write_set("Musica de los 80 3min", group, group_ensayo)
    write_set("Madonna 2min50", madonna, madonna_ensayo)
    print("V4 clean mixes rendered in", OUTPUT)


if __name__ == "__main__":
    main()
