"""Generate waveform and timeline data for the local mix review UI."""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path

import numpy as np
import soundfile as sf


ROOT = Path(__file__).resolve().parents[1]
DELIVERY = ROOT / "entrega"
SOURCES = ROOT / "fuentes"
UI = ROOT / "ui"


SOURCE_FILES = {
    "voice": "La Voz de los '80 - Los Prisioneros.mp3",
    "back": "AC_DC - Back In Black (Official 4K Video) - acdcVEVO.mp3",
    "girls": "Cyndi Lauper - Girls Just Want To Have Fun (Official Video) - CyndiLauperVEVO.mp3",
    "ghost": "Ray Parker Jr. - Ghostbusters (Official HD Video) - RayParkerJuniorVEVO.mp3",
    "celebration": "Kool & The Gang - Celebration - KoolAndTheGangVEVO.mp3",
    "dance": "Los Prisioneros - El Baile De Los Que Sobran (Visualiser) - LosPrisionerosVEVO.mp3",
    "virgin": "Madonna - Like A Virgin (Official Video) - Madonna.mp3",
    "material": "Madonna - Material Girl (Official Video) [HD] - Madonna.mp3",
    "groove": "Madonna - Into The Groove (Official Video) - Madonna.mp3",
}


def peaks(path: Path, bins: int = 960) -> list[float]:
    audio, _ = sf.read(path, dtype="float32", always_2d=True)
    mono = np.mean(audio, axis=1)
    edges = np.linspace(0, len(mono), bins + 1, dtype=int)
    values = []
    for start, end in zip(edges[:-1], edges[1:]):
        block = mono[start:end]
        values.append(round(float(np.max(np.abs(block))) if len(block) else 0.0, 4))
    maximum = max(values) or 1.0
    return [round(value / maximum, 4) for value in values]


def session(
    *,
    session_id: str,
    title: str,
    subtitle: str,
    duration: int,
    master: str,
    rehearsal: str,
    wav: str,
    segments: list[dict[str, object]],
    changes: list[str],
) -> dict[str, object]:
    return {
        "id": session_id,
        "title": title,
        "subtitle": subtitle,
        "duration": duration,
        "status": "Lista",
        "version": "V4 limpia" if session_id != "tortuga" else "Master",
        "master": f"../entrega/{master}",
        "rehearsal": f"../entrega/{rehearsal}",
        "waveform": peaks(DELIVERY / wav),
        "segments": segments,
        "changes": changes,
    }


def main() -> None:
    library = {}
    for key, filename in SOURCE_FILES.items():
        path = SOURCES / filename
        info = sf.info(path)
        library[key] = {
            "name": path.stem.split(" - ")[0] if key not in {"voice", "dance"} else ("La Voz de los 80" if key == "voice" else "El baile de los que sobran"),
            "file": f"../fuentes/{filename}",
            "duration": round(info.frames / info.samplerate, 3),
            "waveform": peaks(path, 720),
        }
    sessions = [
        session(
            session_id="ochentas",
            title="Música de los 80",
            subtitle="Coreografía grupal · 3:00",
            duration=180,
            master="Musica de los 80 3min V4 LIMPIO MASTER.mp3",
            rehearsal="Musica de los 80 3min V4 LIMPIO ENSAYO.mp3",
            wav="Musica de los 80 3min V4 LIMPIO MASTER.wav",
            segments=[
                {"name": "La Voz de los 80", "artist": "Los Prisioneros", "start": 0, "end": 30, "source": "0:00–0:30", "sourceKey": "voice", "sourceIn": 0.0, "sourceOut": 30.0, "transition": "Apertura original limpia", "note": "Introducción extendida a 30 segundos."},
                {"name": "Back in Black · riff", "artist": "AC/DC", "start": 30, "end": 42, "source": "0:00.48–0:12.48", "sourceKey": "back", "sourceIn": 0.48, "sourceOut": 12.48, "transition": "Corte interno", "note": "Primera parte del bloque AC/DC."},
                {"name": "Back in Black · hook", "artist": "AC/DC", "start": 42, "end": 57, "source": "0:52.95–1:07.95", "sourceKey": "back", "sourceIn": 52.95, "sourceOut": 67.95, "transition": "Crossfade interno", "note": "Segunda parte del bloque AC/DC; puede ajustarse por separado."},
                {"name": "Girls Just Want to Have Fun", "artist": "Cyndi Lauper", "start": 57, "end": 85, "source": "1:04.5–1:32.7", "sourceKey": "girls", "sourceIn": 64.5, "sourceOut": 92.7, "transition": "Crossfade 200 ms", "note": "Estribillo continuo, sin salto entre frases."},
                {"name": "Ghostbusters · intro", "artist": "Ray Parker Jr.", "start": 85, "end": 91, "source": "0:20.9–0:26.9", "sourceKey": "ghost", "sourceIn": 20.9, "sourceOut": 26.9, "transition": "Continuación original", "note": "La transición usa la propia introducción de la canción."},
                {"name": "Ghostbusters", "artist": "Ray Parker Jr.", "start": 91, "end": 121, "source": "0:26.9–0:57.1", "sourceKey": "ghost", "sourceIn": 26.9, "sourceOut": 57.1, "transition": "Sin corte interno", "note": "Sección continua desde la introducción anterior."},
                {"name": "Celebration", "artist": "Kool & The Gang", "start": 121, "end": 143, "source": "1:04.5–1:26.7", "sourceKey": "celebration", "sourceIn": 64.5, "sourceOut": 86.7, "transition": "Crossfade 200 ms", "note": "Entrada directa al estribillo."},
                {"name": "El baile de los que sobran", "artist": "Los Prisioneros", "start": 143, "end": 180, "source": "4:45–5:22.1", "sourceKey": "dance", "sourceIn": 285.0, "sourceOut": 322.1, "transition": "Salida musical limpia", "note": "Bloque final completo, sin golpe añadido."},
            ],
            changes=[
                "La Voz de los 80 extendida de 15 a 30 segundos",
                "Puente sintético reemplazado por Ghostbusters original",
                "Efectos añadidos eliminados del master",
                "Niveles y picos revisados a 48 kHz",
            ],
        ),
        session(
            session_id="madonna",
            title="Madonna",
            subtitle="Profesoras · 2:50",
            duration=170,
            master="Madonna 2min50 V4 LIMPIO MASTER.mp3",
            rehearsal="Madonna 2min50 V4 LIMPIO ENSAYO.mp3",
            wav="Madonna 2min50 V4 LIMPIO MASTER.wav",
            segments=[
                {"name": "Like a Virgin", "artist": "Madonna", "start": 0, "end": 68, "source": "0:50–1:58.1", "sourceKey": "virgin", "sourceIn": 50.0, "sourceOut": 118.1, "transition": "Inicio directo", "note": "Audio real desde el primer segundo; sin campanas ni golpes."},
                {"name": "Material Girl", "artist": "Madonna", "start": 68, "end": 118, "source": "2:15.4–3:05.6", "sourceKey": "material", "sourceIn": 135.4, "sourceOut": 185.6, "transition": "Crossfade 200 ms", "note": "Cruce corto, sin barridos ni ecos añadidos."},
                {"name": "Into the Groove", "artist": "Madonna", "start": 118, "end": 170, "source": "0:41–1:33.1", "sourceKey": "groove", "sourceIn": 41.0, "sourceOut": 93.1, "transition": "Crossfade 200 ms", "note": "Salida original con fade breve al final."},
            ],
            changes=[
                "Campanas y subida artificial eliminadas",
                "Impactos y ecos de transición eliminados",
                "Solo se utilizan las tres grabaciones originales",
                "Volumen igualado entre las canciones",
            ],
        ),
        session(
            session_id="tortuga",
            title="Juego Tortuga",
            subtitle="Mascota · 1:00",
            duration=60,
            master="04 Juego Tortuga 1min MASTER.mp3",
            rehearsal="04 Juego Tortuga 1min ENSAYO.mp3",
            wav="04 Juego Tortuga 1min MASTER.wav",
            segments=[
                {"name": "Encendido", "artist": "Diseño original", "start": 0, "end": 2, "source": "Original", "transition": "Inicio de consola", "note": "Posición inicial."},
                {"name": "Inicio de nivel", "artist": "Diseño original", "start": 2, "end": 8, "source": "Original", "transition": "Fanfarria retro", "note": "Entrada de la tortuga."},
                {"name": "Exploración", "artist": "Diseño original", "start": 8, "end": 23, "source": "Original", "transition": "Groove arcade", "note": "Recorrido y monedas."},
                {"name": "Alarma", "artist": "Diseño original", "start": 23, "end": 25, "source": "Original", "transition": "Cambio de estado", "note": "Aparece el peligro."},
                {"name": "Peligro", "artist": "Diseño original", "start": 25, "end": 38, "source": "Original", "transition": "Música de acción", "note": "Obstáculo, caída y power-up."},
                {"name": "Desafíos", "artist": "Diseño original", "start": 38, "end": 51, "source": "Original", "transition": "Aceleración", "note": "Tres desafíos y llegada a la pizza."},
                {"name": "Victoria", "artist": "Diseño original", "start": 51, "end": 60, "source": "Original", "transition": "Fanfarria final", "note": "Pizza, celebración y pose final."},
            ],
            changes=[
                "Duración exacta de 1:00",
                "Señales coreográficas distribuidas por escena",
                "Master y guía de ensayo disponibles",
            ],
        ),
        {
            "id": "michael",
            "title": "Michael Jackson",
            "subtitle": "Duración por confirmar",
            "duration": 0,
            "status": "Faltan fuentes",
            "version": "Pendiente",
            "master": None,
            "rehearsal": None,
            "waveform": [],
            "segments": [],
            "changes": ["Agregar canciones originales a la carpeta fuentes"],
        },
    ]
    data = {
        "project": "Alianza Verde · Aniversario 2026",
        "generatedAt": datetime.now().astimezone().isoformat(timespec="minutes"),
        "sessions": sessions,
        "library": library,
    }
    UI.mkdir(parents=True, exist_ok=True)
    target = UI / "data.js"
    target.write_text(
        "window.MIX_DATA = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n",
        encoding="utf-8",
    )
    print(target)


if __name__ == "__main__":
    main()
