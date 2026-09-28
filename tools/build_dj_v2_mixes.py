"""Render beat/phrase-aware V2 choreography mixes using the dj-show-mix workflow."""

from __future__ import annotations

from pathlib import Path

import numpy as np
import soundfile as sf

import build_demo_mixes as base


OUTPUT = base.OUTPUT
SR = base.SR


def echo_tail(audio: np.ndarray, duration: float = 0.36) -> np.ndarray:
    """Create a short decaying tail that masks an otherwise mid-phrase hard exit."""
    count = base.frames(duration)
    source = audio[-min(len(audio), base.frames(0.12)) :]
    out = np.zeros((count, 2), dtype=np.float32)
    for delay, level in ((0.0, 0.38), (0.11, 0.24), (0.22, 0.13)):
        start = base.frames(delay)
        part = source[: count - start]
        out[start : start + len(part)] += part * level
    out *= np.linspace(1.0, 0.0, count, dtype=np.float32)[:, None]
    return out


def add_phrase(
    mix: np.ndarray,
    destination: float,
    source: np.ndarray,
    source_start: float,
    duration: float,
    level: float,
    fade_in: float = 0.025,
    fade_out: float = 0.045,
) -> np.ndarray:
    clip = base.trim(source, source_start, duration, level, fade_in, fade_out)
    base.place(mix, destination, clip)
    return clip


def finalise(audio: np.ndarray) -> np.ndarray:
    return base.master(audio, target_peak_db=-2.0)


def rehearsal(mastered: np.ndarray, cues: np.ndarray) -> np.ndarray:
    out = mastered.copy() + cues
    target = 10 ** (-2.0 / 20.0)
    peak = float(np.max(np.abs(out)))
    if peak > target:
        out *= target / peak
    fade = base.frames(0.008)
    out[-fade:] *= np.linspace(1.0, 0.0, fade)[:, None]
    return out.astype(np.float32)


def build_group(s: dict[str, np.ndarray]) -> np.ndarray:
    mix = np.zeros((base.frames(180.0), 2), dtype=np.float32)

    # Start with the original intro of "La Voz de los 80" from 0:00.
    # Keep it unobscured so the number begins exactly as requested.
    add_phrase(mix, 0.0, s["voice"], 0.0, 15.0, -17.8, 0.012, 0.028)
    base.place(mix, 14.74, base.pan(base.impact(0.25, 0.30)))

    # Iconic guitar riff. A tiny echo tail makes the fixed 32-second exit deliberate.
    acdc = add_phrase(mix, 15.0, s["back"], 0.48, 32.0, -17.1, 0.012, 0.035)
    base.place(mix, 46.68, echo_tail(acdc, 0.31))
    base.place(mix, 46.80, base.pan(base.impact(0.20, 0.25)))

    # Two complete 16-second hook phrases (eight bars each at ~120 BPM).
    add_phrase(mix, 47.0, s["girls"], 60.8, 16.0, -17.0, 0.022, 0.055)
    add_phrase(mix, 63.0, s["girls"], 108.0, 16.0, -17.0, 0.045, 0.075)

    base.place(mix, 79.0, base.ghost_bridge())
    add_phrase(mix, 89.0, s["ghost"], 27.0, 30.0, -16.9, 0.018, 0.065)
    add_phrase(mix, 119.0, s["celebration"], 44.6, 24.0, -16.7, 0.055, 0.065)
    base.place(mix, 142.78, base.pan(base.impact(0.22, 0.23)))
    add_phrase(mix, 143.0, s["dance"], 285.0, 37.0, -16.8, 0.035, 0.11)
    base.add_final_hit(mix, 179.50)
    return finalise(mix)


def build_teachers(s: dict[str, np.ndarray]) -> np.ndarray:
    mix = np.zeros((base.frames(170.0), 2), dtype=np.float32)
    base.place(mix, 0.0, base.teacher_intro())

    # Start at the first full title-hook rather than the video's scenic introduction.
    add_phrase(mix, 8.0, s["virgin"], 56.0, 60.0, -17.2, 0.025, 0.070)
    base.place(mix, 67.80, base.pan(base.impact(0.24, 0.31)))

    # Chorus-led block; removes all spoken dialogue from the video opening.
    add_phrase(mix, 68.0, s["material"], 135.0, 50.0, -17.0, 0.025, 0.070)
    base.place(mix, 117.80, base.pan(base.impact(0.24, 0.28)))

    # Immediate title hook and a clean pre-chorus exit, followed by the show hit.
    add_phrase(mix, 118.0, s["groove"], 20.0, 52.0, -16.8, 0.025, 0.080)
    base.add_final_hit(mix, 169.50)
    return finalise(mix)


def write_all(name: str, master: np.ndarray, rehearsal_mix: np.ndarray) -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    master_wav = OUTPUT / f"{name} V2 DJ MASTER.wav"
    rehearsal_wav = OUTPUT / f"{name} V2 DJ ENSAYO.wav"
    sf.write(master_wav, master, SR, subtype="PCM_24")
    sf.write(rehearsal_wav, rehearsal_mix, SR, subtype="PCM_24")
    for wav, audio in ((master_wav, master), (rehearsal_wav, rehearsal_mix)):
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
    teachers = build_teachers(sources)
    group_rehearsal = rehearsal(
        group, base.cue_pips(180.0, (15.0, 47.0, 79.0, 89.0, 119.0, 143.0, 179.5))
    )
    teachers_rehearsal = rehearsal(
        teachers, base.cue_pips(170.0, (8.0, 68.0, 118.0, 160.0, 169.5))
    )
    write_all("Grupal 3min", group, group_rehearsal)
    write_all("Profesoras 2min50", teachers, teachers_rehearsal)
    print("V2 DJ mixes rendered in", OUTPUT)


if __name__ == "__main__":
    main()
