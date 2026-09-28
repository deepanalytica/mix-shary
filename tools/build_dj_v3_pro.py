"""Render polished V3 show mixes from the user's supplied source recordings."""

from __future__ import annotations

from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.ndimage import uniform_filter1d
from scipy.signal import butter, sosfilt

import build_demo_mixes as base


OUTPUT = base.OUTPUT
SR = base.SR
RNG = np.random.default_rng(20260925)


def gentle_compressor(
    audio: np.ndarray, threshold_db: float = -18.0, ratio: float = 2.0
) -> np.ndarray:
    """Linked-stereo RMS compression with slow smoothing and no pumping."""
    if not len(audio):
        return audio
    power = np.mean(audio.astype(np.float64) ** 2, axis=1)
    window = max(1, base.frames(0.035))
    envelope = np.sqrt(uniform_filter1d(power, size=window, mode="nearest") + 1e-12)
    envelope_db = 20.0 * np.log10(envelope + 1e-12)
    reduction_db = np.maximum(0.0, envelope_db - threshold_db) * (1.0 - 1.0 / ratio)
    reduction_db = uniform_filter1d(
        reduction_db, size=max(1, base.frames(0.060)), mode="nearest"
    )
    gain = 10.0 ** (-reduction_db / 20.0)
    return (audio * gain[:, None]).astype(np.float32)


def prepare(
    source: np.ndarray,
    source_start: float,
    duration: float,
    target_db: float = -18.0,
    fade_in: float = 0.018,
    fade_out: float = 0.100,
    peak_cap_db: float = -3.0,
    compressor_threshold_db: float = -18.0,
    compressor_ratio: float = 2.0,
) -> np.ndarray:
    """Trim a musical phrase, gently control dynamics, and match its level."""
    start = base.frames(source_start)
    count = base.frames(duration)
    clip = source[start : start + count].copy()
    if len(clip) < count:
        clip = np.pad(clip, ((0, count - len(clip)), (0, 0)))
    clip -= np.mean(clip, axis=0, keepdims=True)
    clip = gentle_compressor(clip, compressor_threshold_db, compressor_ratio)
    rms = base.active_rms(clip)
    if rms > 0:
        clip *= (10.0 ** (target_db / 20.0)) / rms
    peak = float(np.max(np.abs(clip)))
    peak_cap = 10.0 ** (peak_cap_db / 20.0)
    if peak > peak_cap:
        clip *= peak_cap / peak
    fi = min(len(clip), base.frames(fade_in))
    fo = min(len(clip), base.frames(fade_out))
    if fi:
        clip[:fi] *= np.sin(np.linspace(0.0, np.pi / 2.0, fi))[:, None]
    if fo:
        clip[-fo:] *= np.sin(np.linspace(np.pi / 2.0, 0.0, fo))[:, None]
    return clip.astype(np.float32)


def equal_power_join(left: np.ndarray, right: np.ndarray, overlap: float) -> np.ndarray:
    """Join two phrases from the same recording with a transparent crossfade."""
    n = min(base.frames(overlap), len(left), len(right))
    out = np.zeros((len(left) + len(right) - n, 2), dtype=np.float32)
    out[: len(left) - n] = left[:-n]
    theta = np.linspace(0.0, np.pi / 2.0, n)
    out[len(left) - n : len(left)] = (
        left[-n:] * np.cos(theta)[:, None] + right[:n] * np.sin(theta)[:, None]
    )
    out[len(left) :] = right[n:]
    return out


def echo_tail(audio: np.ndarray, duration: float = 0.65) -> np.ndarray:
    """Quiet stereo echo that lets a phrase release without sounding chopped."""
    count = base.frames(duration)
    grain = audio[-min(len(audio), base.frames(0.135)) :]
    out = np.zeros((count, 2), dtype=np.float32)
    for delay, level, pan in (
        (0.00, 0.20, -0.18),
        (0.16, 0.13, 0.18),
        (0.32, 0.075, -0.10),
        (0.48, 0.040, 0.10),
    ):
        start = base.frames(delay)
        part = grain[: max(0, count - start)]
        if not len(part):
            continue
        angle = (pan + 1.0) * np.pi / 4.0
        stereo = part.copy()
        mono = part.mean(axis=1)
        stereo[:, 0] = mono * np.cos(angle)
        stereo[:, 1] = mono * np.sin(angle)
        out[start : start + len(part)] += stereo * level
    out *= np.linspace(1.0, 0.0, count)[:, None]
    return out


def reverse_swell(duration: float = 0.42, gain: float = 0.045) -> np.ndarray:
    """Subtle filtered stereo swell ending exactly on a transition."""
    n = base.frames(duration)
    noise = RNG.normal(0.0, 1.0, n).astype(np.float32)
    sos = butter(3, 1000.0, btype="highpass", fs=SR, output="sos")
    bright = sosfilt(sos, noise).astype(np.float32)
    bright /= max(float(np.max(np.abs(bright))), 1e-9)
    envelope = np.linspace(0.0, 1.0, n, dtype=np.float32) ** 2.3
    mono = bright * envelope * gain
    left = mono
    right = np.roll(mono, base.frames(0.006))
    right[: base.frames(0.006)] = 0.0
    return np.column_stack((left, right)).astype(np.float32)


def transparent_lift(
    audio: np.ndarray,
    gain_db: float,
    knee_db: float = -8.0,
    ceiling_db: float = -3.0,
) -> np.ndarray:
    """Raise a low-mastered source while smoothly controlling only its peaks."""
    boosted = audio * (10.0 ** (gain_db / 20.0))
    magnitude = np.abs(boosted)
    knee = 10.0 ** (knee_db / 20.0)
    ceiling = 10.0 ** (ceiling_db / 20.0)
    mask = magnitude > knee
    shaped = magnitude.copy()
    shaped[mask] = knee + (ceiling - knee) * (
        1.0 - np.exp(-(magnitude[mask] - knee) / (ceiling - knee))
    )
    return (np.sign(boosted) * shaped).astype(np.float32)


def place_release(mix: np.ndarray, boundary: float, outgoing: np.ndarray) -> None:
    base.place(mix, boundary - 0.08, echo_tail(outgoing))
    swell = reverse_swell(0.38, 0.032)
    base.place(mix, boundary - len(swell) / SR, swell)


def elegant_teacher_intro(virgin: np.ndarray) -> np.ndarray:
    """Eight-second reveal made from restrained bells and a Madonna pickup."""
    out = np.zeros((base.frames(8.0), 2), dtype=np.float32)
    base.place(out, 0.0, base.pan(base.bell(2.5, 523.25, 0.18), -0.25))
    base.place(out, 1.55, base.pan(base.bell(2.4, 659.25, 0.15), 0.25))
    base.place(out, 3.10, base.pan(base.bell(2.2, 783.99, 0.12), 0.0))
    pickup = prepare(virgin, 58.0, 1.25, -22.0, 0.20, 0.02, -6.0)[::-1].copy()
    pickup *= np.linspace(0.0, 1.0, len(pickup))[:, None]
    base.place(out, 6.70, pickup)
    base.place(out, 7.58, reverse_swell(0.42, 0.055))
    base.place(out, 7.86, base.pan(base.impact(0.14, 0.28)))
    return out


def cinematic_ghost_bridge(girls: np.ndarray) -> np.ndarray:
    """Ten-second narrative bridge with a musical release into the scene change."""
    bridge = base.ghost_bridge() * 1.25
    base.place(bridge, 0.0, echo_tail(girls, 0.90), 0.95)
    return bridge.astype(np.float32)


def finalise(audio: np.ndarray) -> np.ndarray:
    """Gentle bus control with headroom; avoids the V2's full-mix saturation."""
    audio = gentle_compressor(audio, threshold_db=-11.5, ratio=1.45)
    peak = float(np.max(np.abs(audio)))
    target = 10.0 ** (-2.0 / 20.0)
    if peak > 0:
        audio *= target / peak
    fade = min(len(audio), base.frames(0.010))
    audio[-fade:] *= np.linspace(1.0, 0.0, fade)[:, None]
    audio[-1] = 0.0
    return audio.astype(np.float32)


def build_group(s: dict[str, np.ndarray]) -> np.ndarray:
    mix = np.zeros((base.frames(180.0), 2), dtype=np.float32)

    # Required original intro, completely unobscured.
    voice = prepare(s["voice"], 0.0, 15.0, -18.2, 0.010, 0.090)
    base.place(mix, 0.0, voice)

    # Iconic riff followed by the title-hook, joined inside the same song.
    back_a = prepare(s["back"], 0.48, 16.06, -17.7, 0.010, 0.040)
    back_b = prepare(s["back"], 52.95, 16.06, -17.7, 0.035, 0.090)
    back = equal_power_join(back_a, back_b, 0.12)
    base.place(mix, 15.0, back)

    # One continuous chorus instead of the V2 jump between unrelated phrases.
    girls = prepare(s["girls"], 60.8, 32.0, -17.8, 0.018, 0.160)
    place_release(mix, 47.0, back)
    base.place(mix, 47.0, girls)

    base.place(mix, 79.0, cinematic_ghost_bridge(girls))

    ghost = prepare(s["ghost"], 27.0, 30.0, -17.8, 0.025, 0.180)
    base.place(mix, 89.0, ghost)

    celebration = prepare(s["celebration"], 64.5, 24.0, -17.7, 0.035, 0.200)
    place_release(mix, 119.0, ghost)
    base.place(mix, 119.0, celebration)

    dance = prepare(s["dance"], 285.0, 37.0, -17.6, 0.035, 0.520)
    place_release(mix, 143.0, celebration)
    base.place(mix, 143.0, dance)
    base.add_final_hit(mix, 179.50)
    return finalise(mix)


def build_teachers(s: dict[str, np.ndarray]) -> np.ndarray:
    mix = np.zeros((base.frames(170.0), 2), dtype=np.float32)
    base.place(mix, 0.0, elegant_teacher_intro(s["virgin"]))

    # Starts on the title hook and ends after a complete vocal line.
    virgin = prepare(
        s["virgin"],
        58.0,
        60.0,
        -18.0,
        0.020,
        0.220,
        -3.0,
        compressor_threshold_db=-28.0,
        compressor_ratio=4.0,
    )
    virgin = transparent_lift(virgin, 3.5)
    base.place(mix, 8.0, virgin)

    # Full chorus-led phrase, leaving before the next verse begins.
    material = prepare(s["material"], 135.4, 50.0, -17.8, 0.030, 0.240)
    place_release(mix, 68.0, virgin)
    base.place(mix, 68.0, material)

    # Verse-to-hook arc ending on the repeated title phrase.
    groove = prepare(s["groove"], 41.0, 52.0, -17.6, 0.030, 0.520)
    place_release(mix, 118.0, material)
    base.place(mix, 118.0, groove)
    base.add_final_hit(mix, 169.50)
    return finalise(mix)


def rehearsal(master: np.ndarray, length: float, cues: tuple[float, ...]) -> np.ndarray:
    out = master.copy() + base.cue_pips(length, cues)
    peak = float(np.max(np.abs(out)))
    target = 10.0 ** (-2.0 / 20.0)
    if peak > target:
        out *= target / peak
    out[-base.frames(0.010) :] *= np.linspace(
        1.0, 0.0, base.frames(0.010)
    )[:, None]
    out[-1] = 0.0
    return out.astype(np.float32)


def write_set(name: str, master: np.ndarray, ensayo: np.ndarray) -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for role, audio in (("MASTER", master), ("ENSAYO", ensayo)):
        wav = OUTPUT / f"{name} V3 PRO {role}.wav"
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
    teachers = build_teachers(sources)
    group_ensayo = rehearsal(
        group, 180.0, (15.0, 47.0, 79.0, 89.0, 119.0, 143.0, 179.5)
    )
    teachers_ensayo = rehearsal(
        teachers, 170.0, (8.0, 68.0, 118.0, 160.0, 169.5)
    )
    write_set("Musica de los 80 3min", group, group_ensayo)
    write_set("Madonna 2min50", teachers, teachers_ensayo)
    print("V3 PRO mixes rendered in", OUTPUT)


if __name__ == "__main__":
    main()
