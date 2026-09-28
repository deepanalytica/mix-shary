"""Generate the original 60-second arcade soundtrack for the mascot number.

The renderer is deterministic and uses only synthesized material, so the output
does not depend on any commercial recording.  It writes stereo, 48 kHz,
24-bit PCM WAV files for the clean master and the rehearsal version.
"""

from __future__ import annotations

import math
import wave
from pathlib import Path

import numpy as np


SAMPLE_RATE = 48_000
DURATION = 60.0
FRAMES = int(SAMPLE_RATE * DURATION)
RNG = np.random.default_rng(20260925)


NOTE = {
    "C2": 65.406,
    "D2": 73.416,
    "E2": 82.407,
    "F2": 87.307,
    "G2": 97.999,
    "A2": 110.000,
    "B2": 123.471,
    "C3": 130.813,
    "D3": 146.832,
    "E3": 164.814,
    "F3": 174.614,
    "G3": 195.998,
    "A3": 220.000,
    "B3": 246.942,
    "C4": 261.626,
    "D4": 293.665,
    "E4": 329.628,
    "F4": 349.228,
    "G4": 391.995,
    "A4": 440.000,
    "B4": 493.883,
    "C5": 523.251,
    "D5": 587.330,
    "E5": 659.255,
    "F5": 698.456,
    "G5": 783.991,
    "A5": 880.000,
    "B5": 987.767,
    "C6": 1046.502,
    "D6": 1174.659,
    "E6": 1318.510,
    "G6": 1567.982,
    "C7": 2093.005,
}


def sec(value: float) -> int:
    return int(round(value * SAMPLE_RATE))


def soft_clip(x: np.ndarray, drive: float = 1.25) -> np.ndarray:
    return np.tanh(x * drive) / np.tanh(drive)


def pan_gains(pan: float) -> tuple[float, float]:
    angle = (max(-1.0, min(1.0, pan)) + 1.0) * math.pi / 4.0
    return math.cos(angle), math.sin(angle)


def envelope(length: int, attack: float, release: float, sustain: float = 1.0) -> np.ndarray:
    env = np.full(length, sustain, dtype=np.float32)
    a = min(length, max(1, sec(attack)))
    r = min(length, max(1, sec(release)))
    env[:a] *= np.linspace(0.0, 1.0, a, endpoint=False, dtype=np.float32)
    env[-r:] *= np.linspace(1.0, 0.0, r, endpoint=True, dtype=np.float32)
    return env


def oscillator(freq: float | np.ndarray, length: int, kind: str = "square", phase: float = 0.0) -> np.ndarray:
    if np.isscalar(freq):
        p = phase + (2.0 * np.pi * float(freq) / SAMPLE_RATE) * np.arange(length)
    else:
        p = phase + 2.0 * np.pi * np.cumsum(np.asarray(freq, dtype=np.float64)) / SAMPLE_RATE
    if kind == "sine":
        return np.sin(p).astype(np.float32)
    if kind == "triangle":
        return (2.0 / np.pi * np.arcsin(np.sin(p))).astype(np.float32)
    if kind == "saw":
        return (2.0 * ((p / (2.0 * np.pi)) % 1.0) - 1.0).astype(np.float32)
    # A softened pulse keeps the arcade character without pathological peaks.
    return np.tanh(4.5 * np.sin(p)).astype(np.float32)


class Mix:
    def __init__(self) -> None:
        self.audio = np.zeros((FRAMES, 2), dtype=np.float32)

    def add(self, start: float, signal: np.ndarray, gain: float = 1.0, pan: float = 0.0) -> None:
        i = sec(start)
        if i >= FRAMES:
            return
        signal = np.asarray(signal, dtype=np.float32)[: FRAMES - i]
        left, right = pan_gains(pan)
        self.audio[i : i + len(signal), 0] += signal * gain * left
        self.audio[i : i + len(signal), 1] += signal * gain * right

    def tone(
        self,
        start: float,
        duration: float,
        pitch: str | float,
        gain: float = 0.15,
        pan: float = 0.0,
        kind: str = "square",
        attack: float = 0.006,
        release: float = 0.04,
    ) -> None:
        length = max(1, sec(duration))
        freq = NOTE[pitch] if isinstance(pitch, str) else pitch
        sig = oscillator(freq, length, kind) * envelope(length, attack, release)
        self.add(start, sig, gain, pan)

    def kick(self, start: float, gain: float = 0.32) -> None:
        length = sec(0.16)
        t = np.arange(length) / SAMPLE_RATE
        freq = 145.0 * np.exp(-t * 25.0) + 43.0
        sig = oscillator(freq, length, "sine") * np.exp(-t * 23.0)
        click = RNG.normal(0.0, 1.0, length).astype(np.float32) * np.exp(-t * 95.0)
        self.add(start, sig + 0.12 * click, gain)

    def snare(self, start: float, gain: float = 0.19) -> None:
        length = sec(0.12)
        t = np.arange(length) / SAMPLE_RATE
        noise = RNG.normal(0.0, 1.0, length).astype(np.float32)
        body = oscillator(185.0, length, "sine")
        sig = (0.72 * noise + 0.28 * body) * np.exp(-t * 29.0)
        self.add(start, sig, gain, 0.08)

    def hat(self, start: float, gain: float = 0.045) -> None:
        length = sec(0.045)
        t = np.arange(length) / SAMPLE_RATE
        noise = RNG.normal(0.0, 1.0, length).astype(np.float32)
        # First difference removes most low-frequency energy.
        sig = np.concatenate(([0.0], np.diff(noise))).astype(np.float32)
        sig *= np.exp(-t * 85.0)
        self.add(start, sig, gain, -0.15)


def add_drum_pattern(mix: Mix, start: float, end: float, bpm: float, intensity: float = 1.0) -> None:
    beat = 60.0 / bpm
    step = beat / 2.0
    n = 0
    t = start
    while t < end - 0.02:
        mix.hat(t, 0.035 * intensity)
        if n % 4 in (0, 3):
            mix.kick(t, 0.25 * intensity)
        if n % 4 == 2:
            mix.snare(t, 0.16 * intensity)
        n += 1
        t += step


def add_bass(mix: Mix, start: float, end: float, bpm: float, pattern: list[str], gain: float = 0.13) -> None:
    beat = 60.0 / bpm
    t = start
    i = 0
    while t < end - 0.05:
        mix.tone(t, min(beat * 0.72, end - t), pattern[i % len(pattern)], gain, -0.08, "triangle", 0.006, 0.05)
        i += 1
        t += beat


def add_arp(mix: Mix, start: float, end: float, bpm: float, pattern: list[str], gain: float = 0.07) -> None:
    step = 60.0 / bpm / 2.0
    t = start
    i = 0
    while t < end - 0.03:
        pan = -0.32 if i % 2 == 0 else 0.32
        mix.tone(t, min(step * 0.72, end - t), pattern[i % len(pattern)], gain, pan, "square", 0.004, 0.035)
        i += 1
        t += step


def add_lead_phrase(mix: Mix, start: float, notes: list[tuple[str, float]], beat: float, gain: float = 0.12) -> None:
    t = start
    for pitch, beats in notes:
        if pitch != "-":
            mix.tone(t, beat * beats * 0.88, pitch, gain, 0.12, "square", 0.008, 0.06)
            # Quiet octave shimmer for a 16-bit console color.
            if pitch in NOTE:
                mix.tone(t, beat * beats * 0.78, NOTE[pitch] * 2.0, gain * 0.16, -0.2, "sine", 0.01, 0.05)
        t += beat * beats


def sweep(mix: Mix, start: float, duration: float, f0: float, f1: float, gain: float, pan: float = 0.0, kind: str = "sine") -> None:
    length = sec(duration)
    freq = np.geomspace(max(1.0, f0), max(1.0, f1), length)
    sig = oscillator(freq, length, kind) * envelope(length, 0.005, min(0.12, duration / 2.0))
    mix.add(start, sig, gain, pan)


def coin(mix: Mix, at: float, pan: float) -> None:
    mix.tone(at, 0.075, "B5", 0.19, pan, "square", 0.002, 0.018)
    mix.tone(at + 0.075, 0.18, "E6", 0.21, pan, "square", 0.002, 0.08)


def riser(mix: Mix, at: float, pan: float = 0.0) -> None:
    for i, pitch in enumerate(("C5", "E5", "G5", "C6")):
        mix.tone(at + i * 0.085, 0.12, pitch, 0.14, pan, "square", 0.003, 0.035)


def build_master() -> Mix:
    mix = Mix()

    # 0:00-0:02 — console power-up in darkness.
    length = sec(1.55)
    t = np.arange(length) / SAMPLE_RATE
    boot_noise = RNG.normal(0.0, 1.0, length).astype(np.float32)
    boot_noise *= np.exp(-t * 2.8) * (0.6 + 0.4 * np.sin(2 * np.pi * 60 * t))
    mix.add(0.0, boot_noise, 0.035)
    sweep(mix, 0.10, 0.82, 55, 440, 0.10, -0.18, "triangle")
    sweep(mix, 0.82, 0.65, 440, 1320, 0.11, 0.18, "square")
    mix.tone(1.52, 0.18, "C6", 0.19, -0.18, "square", 0.002, 0.06)
    mix.tone(1.72, 0.22, "G6", 0.19, 0.18, "square", 0.002, 0.09)

    # 0:02-0:08 — level-start fanfare.
    fanfare = [("C5", .5), ("E5", .5), ("G5", .5), ("C6", 1.0), ("G5", .5), ("A5", .5), ("C6", 1.5), ("-", .5), ("E6", 1.0), ("C6", 1.0)]
    add_lead_phrase(mix, 2.0, fanfare, 0.5, 0.145)
    for at in np.arange(2.0, 8.0, 0.5):
        mix.hat(float(at), 0.025)
    for at in (2.0, 3.0, 4.0, 5.0, 6.0, 7.0):
        mix.kick(at, 0.18)
    add_bass(mix, 2.0, 8.0, 120, ["C2", "C2", "G2", "A2", "F2", "G2"], 0.11)

    # 0:08-0:23 — exploration groove and collectables.
    add_drum_pattern(mix, 8.0, 23.0, 120, 0.92)
    add_bass(mix, 8.0, 23.0, 120, ["C2", "C2", "A2", "F2", "G2", "G2", "A2", "G2"], 0.13)
    add_arp(mix, 8.0, 21.0, 120, ["C4", "E4", "G4", "E4", "A4", "E4", "F4", "G4"], 0.064)
    phrase = [("E5", .5), ("G5", .5), ("A5", 1), ("G5", .5), ("E5", .5), ("D5", 1), ("C5", 1), ("E5", 1), ("G5", 1), ("A5", 1), ("G5", 1)]
    add_lead_phrase(mix, 8.0, phrase, 0.5, 0.09)
    add_lead_phrase(mix, 16.0, phrase, 0.5, 0.09)
    coin(mix, 10.0, -0.42)
    coin(mix, 14.0, 0.0)
    coin(mix, 18.0, 0.42)
    # False victory, intentionally interrupted by the alarm.
    add_lead_phrase(mix, 21.0, [("C5", .5), ("E5", .5), ("G5", .5), ("C6", .5), ("E6", 1.0)], 0.5, 0.16)

    # 0:23-0:25 — alarm and sudden danger.
    for at in (23.0, 23.5, 24.0, 24.5):
        mix.tone(at, 0.22, 880.0, 0.15, -0.28, "square", 0.002, 0.035)
        mix.tone(at + 0.22, 0.22, 622.25, 0.15, 0.28, "square", 0.002, 0.035)
    length = sec(2.0)
    t = np.arange(length) / SAMPLE_RATE
    pulse = oscillator(82.4, length, "saw") * (0.65 + 0.35 * np.sin(2 * np.pi * 8 * t))
    mix.add(23.0, pulse, 0.06)

    # 0:25-0:38 — villain and obstacle.
    add_drum_pattern(mix, 25.0, 38.0, 132, 1.08)
    add_bass(mix, 25.0, 38.0, 132, ["C2", "C2", "D2", "C2", "F2", "E2", "D2", "G2"], 0.15)
    add_arp(mix, 25.0, 38.0, 132, ["C4", "D4", "E4", "D4", "F4", "E4", "D4", "B3"], 0.052)
    danger = [("C5", .5), ("D5", .5), ("E5", .5), ("D5", .5), ("C5", 1), ("G4", 1), ("C5", .5), ("D5", .5), ("F5", 1), ("E5", 1)]
    add_lead_phrase(mix, 25.0, danger, 60 / 132, 0.085)
    add_lead_phrase(mix, 29.0, danger, 60 / 132, 0.085)
    # Whoosh at 31.
    length = sec(0.55)
    t = np.arange(length) / SAMPLE_RATE
    whoosh = RNG.normal(0.0, 1.0, length).astype(np.float32)
    whoosh *= np.sin(np.pi * np.arange(length) / length) ** 2
    mix.add(30.76, whoosh, 0.095, -0.5)
    sweep(mix, 30.78, 0.5, 1200, 160, 0.10, 0.45, "sine")
    # Comic trip at 34.
    sweep(mix, 33.72, 0.28, 520, 105, 0.15, -0.2, "triangle")
    mix.kick(34.0, 0.44)
    mix.snare(34.035, 0.25)
    mix.tone(34.10, 0.26, 92.5, 0.12, 0.15, "square", 0.002, 0.14)
    # Heroic power-up at 37.
    for i, pitch in enumerate(("C4", "E4", "G4", "C5", "E5", "G5", "C6", "E6")):
        mix.tone(36.55 + i * 0.072, 0.14, pitch, 0.12 + i * 0.006, (i - 3.5) / 9, "square", 0.003, 0.045)
    sweep(mix, 36.55, 0.9, 90, 880, 0.09, 0.0, "sine")

    # 0:38-0:51 — accelerated three-stage challenge.
    add_drum_pattern(mix, 38.0, 51.0, 150, 1.12)
    add_bass(mix, 38.0, 51.0, 150, ["C2", "G2", "A2", "E2", "F2", "C2", "G2", "G2"], 0.15)
    add_arp(mix, 38.0, 51.0, 150, ["C4", "E4", "G4", "C5", "A4", "C5", "F4", "G4"], 0.07)
    fast_phrase = [("C5", .5), ("E5", .5), ("G5", .5), ("A5", .5), ("G5", .5), ("E5", .5), ("D5", .5), ("G5", .5)]
    for at in (38.0, 41.2, 44.4, 47.6):
        add_lead_phrase(mix, at, fast_phrase, 60 / 150, 0.09)
    riser(mix, 40.0, -0.38)
    riser(mix, 44.0, 0.0)
    riser(mix, 48.0, 0.38)
    # Jump and landing into the pizza.
    sweep(mix, 49.82, 0.48, 280, 1080, 0.15, -0.25, "square")
    sweep(mix, 50.30, 0.48, 1080, 160, 0.14, 0.25, "square")
    mix.kick(50.78, 0.40)
    mix.snare(50.80, 0.18)

    # 0:51-0:57 — victory fanfare.
    victory = [("C5", .5), ("E5", .5), ("G5", .5), ("C6", 1.0), ("G5", .5), ("A5", .5), ("C6", .5), ("E6", 1.0), ("D6", .5), ("E6", .5), ("G6", 1.0), ("C7", 1.0)]
    add_lead_phrase(mix, 51.0, victory, 0.48, 0.16)
    add_drum_pattern(mix, 51.0, 57.0, 125, 0.95)
    add_bass(mix, 51.0, 57.0, 125, ["C2", "C2", "F2", "G2", "C2", "A2"], 0.13)
    add_arp(mix, 51.0, 57.0, 125, ["C4", "E4", "G4", "C5"], 0.055)

    # 0:57-0:59.5 — celebration and offering the pizza.
    add_drum_pattern(mix, 57.0, 59.5, 128, 1.02)
    add_bass(mix, 57.0, 59.5, 128, ["C2", "F2", "G2", "C2"], 0.14)
    add_lead_phrase(mix, 57.0, [("E5", .5), ("G5", .5), ("A5", .5), ("C6", .5), ("G5", .5), ("C6", .5), ("E6", 1.0)], 60 / 128, 0.13)
    for at, pan in ((57.25, -0.45), (57.72, 0.45), (58.19, -0.25), (58.66, 0.25)):
        coin(mix, at, pan)

    # 0:59.5-1:00 — final hit and hard end at exactly 60 seconds.
    mix.kick(59.5, 0.55)
    mix.snare(59.51, 0.31)
    for pitch, pan in (("C3", -0.35), ("G3", -0.12), ("C4", 0.12), ("E4", 0.35)):
        mix.tone(59.5, 0.49, pitch, 0.17, pan, "square", 0.002, 0.16)
    sweep(mix, 59.5, 0.49, 110, 55, 0.12, 0.0, "sine")

    return mix


def add_rehearsal_cues(audio: np.ndarray) -> np.ndarray:
    rehearsal = audio.copy()
    cue_mix = Mix()
    # Three quiet pips before each major story change. They sit above the music
    # but remain intentionally less prominent than the choreographic SFX.
    for change in (8.0, 23.0, 25.0, 38.0, 51.0, 57.0, 59.5):
        for offset, pitch in ((-0.72, 1396.91), (-0.48, 1396.91), (-0.24, 1760.00)):
            if change + offset >= 0:
                cue_mix.tone(change + offset, 0.055, pitch, 0.055, 0.0, "sine", 0.002, 0.018)
    rehearsal += cue_mix.audio
    return rehearsal


def finalize(audio: np.ndarray) -> np.ndarray:
    # Gentle bus saturation, a short edge fade, and conservative headroom.
    out = soft_clip(audio, 1.08)
    fade = sec(0.012)
    out[:fade] *= np.linspace(0.0, 1.0, fade, endpoint=False, dtype=np.float32)[:, None]
    out[-fade:] *= np.linspace(1.0, 0.0, fade, endpoint=True, dtype=np.float32)[:, None]
    peak = float(np.max(np.abs(out)))
    target = 10 ** (-1.7 / 20.0)  # spare margin for inter-sample peaks
    if peak > 0:
        out *= target / peak
    return out


def write_pcm24(path: Path, audio: np.ndarray) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    samples = np.clip(audio, -1.0, 1.0 - 1 / 8_388_608)
    ints = np.rint(samples * 8_388_607).astype(np.int32).reshape(-1)
    raw = np.empty((ints.size, 3), dtype=np.uint8)
    raw[:, 0] = ints & 0xFF
    raw[:, 1] = (ints >> 8) & 0xFF
    raw[:, 2] = (ints >> 16) & 0xFF
    with wave.open(str(path), "wb") as wav:
        wav.setnchannels(2)
        wav.setsampwidth(3)
        wav.setframerate(SAMPLE_RATE)
        wav.writeframes(raw.tobytes())


def main() -> None:
    output = Path(__file__).resolve().parents[1] / "entrega"
    master = build_master().audio
    clean = finalize(master)
    rehearsal = finalize(add_rehearsal_cues(master))
    write_pcm24(output / "Mascota 1min.wav", clean)
    write_pcm24(output / "Mascota 1min ENSAYO.wav", rehearsal)
    print(f"Rendered {FRAMES} frames per file at {SAMPLE_RATE} Hz ({DURATION:.3f} s).")
    print(f"Output: {output}")


if __name__ == "__main__":
    main()
