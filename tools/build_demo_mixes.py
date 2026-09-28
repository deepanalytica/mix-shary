"""Build the 3:00 group and 2:50 teachers demo mixes.

Input files are user-provided personal-library MP3s in ``fuentes``. Outputs are
48 kHz, stereo, 24-bit WAV files with sample-exact durations.
"""

from __future__ import annotations

import math
from pathlib import Path

import numpy as np
import soundfile as sf


SR = 48_000
ROOT = Path(__file__).resolve().parents[1]
SOURCES = ROOT / "fuentes"
OUTPUT = ROOT / "entrega"
RNG = np.random.default_rng(20260925)


def frames(seconds: float) -> int:
    return int(round(seconds * SR))


def find_source(pattern: str) -> Path:
    matches = list(SOURCES.glob(pattern))
    if len(matches) != 1:
        raise RuntimeError(f"Expected one source for {pattern!r}, found {matches}")
    return matches[0]


def read(path: Path) -> np.ndarray:
    audio, sr = sf.read(path, dtype="float32", always_2d=True)
    if sr != SR:
        raise RuntimeError(f"{path.name}: expected {SR} Hz, got {sr}")
    if audio.shape[1] == 1:
        audio = np.repeat(audio, 2, axis=1)
    return audio[:, :2]


def active_rms(audio: np.ndarray) -> float:
    mono = audio.mean(axis=1)
    block = max(1, frames(0.05))
    usable = len(mono) // block * block
    if usable == 0:
        return 0.0
    chunks = mono[:usable].reshape(-1, block)
    rms = np.sqrt(np.mean(chunks * chunks, axis=1) + 1e-12)
    threshold = max(1e-4, float(np.percentile(rms, 70)) * 0.18)
    active = rms[rms > threshold]
    return float(np.sqrt(np.mean(active * active))) if len(active) else float(np.sqrt(np.mean(mono * mono)))


def trim(
    audio: np.ndarray,
    source_start: float,
    duration: float,
    target_db: float = -17.0,
    fade_in: float = 0.035,
    fade_out: float = 0.055,
) -> np.ndarray:
    start = frames(source_start)
    count = frames(duration)
    clip = audio[start : start + count].copy()
    if len(clip) < count:
        clip = np.pad(clip, ((0, count - len(clip)), (0, 0)))
    rms = active_rms(clip)
    if rms > 0:
        clip *= (10 ** (target_db / 20.0)) / rms
    fi = min(len(clip), frames(fade_in))
    fo = min(len(clip), frames(fade_out))
    if fi:
        clip[:fi] *= np.sin(np.linspace(0, np.pi / 2, fi, endpoint=True))[:, None]
    if fo:
        clip[-fo:] *= np.sin(np.linspace(np.pi / 2, 0, fo, endpoint=True))[:, None]
    return clip


def place(mix: np.ndarray, start: float, audio: np.ndarray, gain: float = 1.0) -> None:
    i = frames(start)
    if i >= len(mix):
        return
    part = audio[: len(mix) - i]
    mix[i : i + len(part)] += part * gain


def pan(mono: np.ndarray, position: float = 0.0) -> np.ndarray:
    angle = (max(-1.0, min(1.0, position)) + 1.0) * np.pi / 4
    return np.column_stack((mono * np.cos(angle), mono * np.sin(angle))).astype(np.float32)


def sine_sweep(duration: float, start_hz: float, end_hz: float, gain: float = 1.0) -> np.ndarray:
    n = frames(duration)
    frequency = np.geomspace(max(1.0, start_hz), max(1.0, end_hz), n)
    phase = 2 * np.pi * np.cumsum(frequency) / SR
    env = np.sin(np.linspace(0, np.pi, n)) ** 1.4
    return (np.sin(phase) * env * gain).astype(np.float32)


def noise_burst(duration: float, gain: float = 1.0, decay: float = 0.0) -> np.ndarray:
    n = frames(duration)
    signal = RNG.normal(0, 1, n).astype(np.float32)
    # Brighten the noise and remove DC/rumble.
    signal = np.concatenate(([0.0], np.diff(signal))).astype(np.float32)
    if decay:
        signal *= np.exp(-np.linspace(0, decay, n)).astype(np.float32)
    signal *= np.sin(np.linspace(0, np.pi, n)).astype(np.float32) ** 0.7
    return signal * gain


def impact(duration: float = 0.48, gain: float = 0.7) -> np.ndarray:
    n = frames(duration)
    t = np.arange(n) / SR
    freq = 125 * np.exp(-t * 22) + 43
    phase = 2 * np.pi * np.cumsum(freq) / SR
    body = np.sin(phase) * np.exp(-t * 9)
    click = RNG.normal(0, 1, n) * np.exp(-t * 70)
    return ((body + 0.23 * click) * gain).astype(np.float32)


def bell(duration: float, base: float, gain: float = 0.35) -> np.ndarray:
    n = frames(duration)
    t = np.arange(n) / SR
    signal = np.zeros(n, dtype=np.float32)
    for ratio, level, decay in ((1.0, 1.0, 2.4), (2.01, 0.52, 3.1), (2.72, 0.32, 4.2), (4.08, 0.18, 5.5)):
        signal += level * np.sin(2 * np.pi * base * ratio * t) * np.exp(-t * decay)
    return signal * gain


def cue_pips(length: float, changes: tuple[float, ...]) -> np.ndarray:
    cues = np.zeros((frames(length), 2), dtype=np.float32)
    for change in changes:
        for delay, hz in ((0.72, 1320.0), (0.48, 1320.0), (0.24, 1760.0)):
            start = change - delay
            if start < 0:
                continue
            n = frames(0.055)
            t = np.arange(n) / SR
            tone = np.sin(2 * np.pi * hz * t) * np.sin(np.linspace(0, np.pi, n)) * 0.055
            place(cues, start, pan(tone, 0.0))
    return cues


def tv_boot(duration: float = 0.85) -> np.ndarray:
    n = frames(duration)
    t = np.arange(n) / SR
    static = noise_burst(duration, 0.07, 2.0)
    scan = np.sin(2 * np.pi * (75 + 740 * t * t) * t) * np.exp(-t * 2.8) * 0.09
    return pan((static + scan).astype(np.float32))


def ghost_bridge() -> np.ndarray:
    """Ten seconds: brake, static, drone, apparition and launch riser."""
    out = np.zeros((frames(10.0), 2), dtype=np.float32)
    # 0-2 s: the previous song brakes to a low electronic stop.
    place(out, 0.0, pan(sine_sweep(1.8, 780, 55, 0.18), -0.1))
    place(out, 0.0, pan(noise_burst(0.28, 0.12, 4.0), 0.2))
    # 2-4 s: television interference.
    static = noise_burst(2.0, 0.12)
    gate = (np.sin(2 * np.pi * 13 * np.arange(len(static)) / SR) > -0.15).astype(np.float32)
    place(out, 2.0, pan(static * gate, -0.25))
    # 4-6 s: eerie low drone.
    n = frames(2.0)
    t = np.arange(n) / SR
    drone = (np.sin(2 * np.pi * 55 * t) + 0.5 * np.sin(2 * np.pi * 82.4 * t))
    drone *= np.sin(np.linspace(0, np.pi, n)) * 0.095
    place(out, 4.0, pan(drone.astype(np.float32), 0.0))
    # 6-8 s: two ghostly wails crossing the stereo image.
    place(out, 5.8, pan(sine_sweep(2.0, 190, 920, 0.11), -0.55))
    place(out, 6.2, pan(sine_sweep(1.65, 260, 1180, 0.09), 0.55))
    # 8-10 s: startled burst and upward handoff.
    place(out, 8.0, pan(noise_burst(0.32, 0.10, 4.0), 0.0))
    place(out, 8.15, pan(sine_sweep(1.82, 120, 1850, 0.13), 0.15))
    place(out, 9.62, pan(impact(0.36, 0.36)))
    return out


def teacher_intro() -> np.ndarray:
    out = np.zeros((frames(8.0), 2), dtype=np.float32)
    place(out, 0.0, pan(bell(2.8, 523.25, 0.22), -0.28))
    place(out, 1.15, pan(bell(2.7, 659.25, 0.18), 0.28))
    place(out, 2.45, pan(bell(2.4, 783.99, 0.15), 0.0))
    place(out, 3.0, pan(sine_sweep(3.0, 110, 1320, 0.10), 0.0))
    place(out, 5.1, pan(noise_burst(1.25, 0.035, 1.5), 0.0))
    place(out, 6.0, pan(impact(0.75, 0.48), 0.0))
    place(out, 7.55, pan(impact(0.42, 0.62), 0.0))
    return out


def add_final_hit(mix: np.ndarray, at: float) -> None:
    place(mix, at, pan(impact(0.49, 0.80)))
    n = frames(0.48)
    t = np.arange(n) / SR
    chord = sum(np.sin(2 * np.pi * hz * t) for hz in (130.81, 196.0, 261.63, 329.63))
    chord *= np.exp(-t * 5.0) * 0.085
    place(mix, at, pan(chord.astype(np.float32)))


def master(audio: np.ndarray, target_peak_db: float = -1.7) -> np.ndarray:
    # Smooth limiting preserves transients while catching stacked transition SFX.
    audio = np.tanh(audio * 1.08) / np.tanh(1.08)
    peak = float(np.max(np.abs(audio)))
    target = 10 ** (target_peak_db / 20.0)
    if peak:
        audio *= target / peak
    # Guarantee a digital-black last sample without changing total length.
    fade = min(len(audio), frames(0.008))
    audio[-fade:] *= np.linspace(1.0, 0.0, fade)[:, None]
    return audio.astype(np.float32)


def add_rehearsal_cues(mastered: np.ndarray, cues: np.ndarray) -> np.ndarray:
    """Add quiet markers without putting the already mastered mix through the bus twice."""
    out = mastered.copy() + cues
    target = 10 ** (-1.7 / 20.0)
    peak = float(np.max(np.abs(out)))
    if peak > target:
        out *= target / peak
    out[-frames(0.008) :] *= np.linspace(1.0, 0.0, frames(0.008))[:, None]
    return out.astype(np.float32)


def write(name: str, audio: np.ndarray) -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    sf.write(OUTPUT / name, audio, SR, subtype="PCM_24")


def build_group(s: dict[str, np.ndarray]) -> np.ndarray:
    mix = np.zeros((frames(180.0), 2), dtype=np.float32)
    # Source entries target recognizable vocals/riffs; target durations remain exact.
    place(mix, 0.0, trim(s["voice"], 10.8, 15.0, -17.2, 0.015, 0.035))
    place(mix, 0.0, tv_boot(), 0.85)
    place(mix, 14.82, pan(impact(0.22, 0.28)))
    place(mix, 15.0, trim(s["back"], 0.45, 32.0, -16.8, 0.018, 0.04))
    place(mix, 46.83, pan(impact(0.20, 0.24)))
    place(mix, 47.0, trim(s["girls"], 60.8, 32.0, -17.0, 0.028, 0.075))
    place(mix, 79.0, ghost_bridge())
    place(mix, 89.0, trim(s["ghost"], 26.7, 30.0, -16.7, 0.02, 0.07))
    place(mix, 119.0, trim(s["celebration"], 44.5, 24.0, -16.8, 0.055, 0.06))
    place(mix, 143.0, trim(s["dance"], 285.0, 37.0, -16.8, 0.045, 0.11))
    add_final_hit(mix, 179.50)
    return master(mix)


def build_teachers(s: dict[str, np.ndarray]) -> np.ndarray:
    mix = np.zeros((frames(170.0), 2), dtype=np.float32)
    place(mix, 0.0, teacher_intro())
    place(mix, 8.0, trim(s["virgin"], 29.5, 60.0, -17.0, 0.035, 0.075))
    place(mix, 67.82, pan(impact(0.25, 0.32)))
    place(mix, 68.0, trim(s["material"], 84.5, 50.0, -17.0, 0.03, 0.07))
    place(mix, 117.85, pan(impact(0.24, 0.26)))
    place(mix, 118.0, trim(s["groove"], 158.0, 52.0, -16.8, 0.035, 0.09))
    add_final_hit(mix, 169.50)
    return master(mix)


def main() -> None:
    paths = {
        "voice": find_source("La Voz*.mp3"),
        "back": find_source("AC_DC*.mp3"),
        "girls": find_source("Cyndi*.mp3"),
        "ghost": find_source("Ray Parker*.mp3"),
        "celebration": find_source("Kool*.mp3"),
        "dance": find_source("*El Baile*.mp3"),
        "virgin": find_source("*Like A Virgin*.mp3"),
        "material": find_source("*Material Girl*.mp3"),
        "groove": find_source("*Into The Groove*.mp3"),
    }
    sources = {name: read(path) for name, path in paths.items()}
    group = build_group(sources)
    teachers = build_teachers(sources)
    group_rehearsal = add_rehearsal_cues(
        group, cue_pips(180.0, (15.0, 47.0, 79.0, 89.0, 119.0, 143.0, 179.5))
    )
    teachers_rehearsal = add_rehearsal_cues(
        teachers, cue_pips(170.0, (8.0, 68.0, 118.0, 160.0, 169.5))
    )
    write("Grupal 3min DEMO.wav", group)
    write("Grupal 3min ENSAYO.wav", group_rehearsal)
    write("Profesoras 2min50 DEMO.wav", teachers)
    write("Profesoras ENSAYO.wav", teachers_rehearsal)
    print("Rendered:")
    for name in (
        "Grupal 3min DEMO.wav",
        "Grupal 3min ENSAYO.wav",
        "Profesoras 2min50 DEMO.wav",
        "Profesoras ENSAYO.wav",
    ):
        print(f"  {OUTPUT / name}")


if __name__ == "__main__":
    main()
