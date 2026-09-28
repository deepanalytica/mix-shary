const IS_PUBLIC_HOST = window.location.hostname.endsWith("github.io");
const PUBLIC_EMPTY_DATA = {
  project: "Mix Shary",
  generatedAt: new Date().toISOString(),
  sessions: [{
    id: "nuevo-mix",
    title: "Nuevo mix",
    subtitle: "Proyecto vacío · sube tus canciones para comenzar",
    duration: 180,
    status: "Borrador",
    version: "Sesión vacía",
    master: "local:",
    rehearsal: "local:",
    waveform: Array.from({ length: 240 }, () => 0.025),
    segments: [],
    events: [],
    changes: ["Proyecto limpio y listo para importar canciones"],
    custom: false,
  }],
  library: {},
};
const INITIAL_DATA = IS_PUBLIC_HOST ? PUBLIC_EMPTY_DATA : window.MIX_DATA;
const data = structuredClone(INITIAL_DATA);
if (data.library.voice) {
  data.library.voice.name = "La Voz de los '80 · original completa";
  data.library.voice.artist = "Los Prisioneros";
}
const audio = document.querySelector("#audio");
const sourcePreview = document.querySelector("#source-preview");
const sessionList = document.querySelector("#session-list");
const playButton = document.querySelector("#play-button");
const spectrumCanvas = document.querySelector("#spectrum-canvas");
const currentTimeLabel = document.querySelector("#current-time");
const totalTimeLabel = document.querySelector("#total-time");
const waveformCanvas = document.querySelector("#waveform");
const waveformWrap = document.querySelector("#waveform-wrap");
const waveformContent = document.querySelector("#waveform-content");
const laneStack = document.querySelector("#lane-stack");
const laneContent = document.querySelector("#lane-content");
const trackControlRail = document.querySelector("#track-control-rail");
const playhead = document.querySelector("#playhead");
const clipInspector = document.querySelector("#clip-inspector");
const changeList = document.querySelector("#change-list");
const downloadLink = document.querySelector("#download-link");
const editModeButton = document.querySelector("#edit-mode-button");
const sourceDrawer = document.querySelector("#source-drawer");
const sourceCanvas = document.querySelector("#source-waveform");
const sourceSelection = document.querySelector("#source-selection");
const sourceInInput = document.querySelector("#source-in-input");
const sourceOutInput = document.querySelector("#source-out-input");
const previewSourceButton = document.querySelector("#preview-source-button");
const libraryList = document.querySelector("#library-list");
const selectAllSourcesButton = document.querySelector("#select-all-sources");
const autoMixButton = document.querySelector("#auto-mix-button");
const autoMixCount = document.querySelector("#auto-mix-count");
const audioUpload = document.querySelector("#audio-upload");
const sessionPackageInput = document.querySelector("#session-package-input");
const toast = document.querySelector("#toast");
const beatGrid = document.querySelector("#beat-grid");
const automationEvents = document.querySelector("#automation-events");
const eventEditor = document.querySelector("#event-editor");
const zoomXInput = document.querySelector("#zoom-x");
const zoomYInput = document.querySelector("#zoom-y");
const DRAFT_KEY = IS_PUBLIC_HOST ? "mix-shary-online-clean-edits-v1" : "mix-shary-edits-v3";
const LEGACY_DRAFT_KEY = IS_PUBLIC_HOST ? "mix-shary-online-clean-edits-v0" : "mix-shary-edits-v2";
const WORKSPACE_STATE_KEY = IS_PUBLIC_HOST ? "mix-shary-online-clean-workspace-state-v1" : "mix-shary-workspace-state-v1";
const WORKSPACE_VIEWS_KEY = IS_PUBLIC_HOST ? "mix-shary-online-clean-workspace-views-v1" : "mix-shary-workspace-views-v1";
const EXACT_STATE_KEY = IS_PUBLIC_HOST ? "mix-shary-online-clean-exact-session-v1" : "mix-shary-exact-session-v1";
const CUSTOM_SESSIONS_KEY = IS_PUBLIC_HOST ? "mix-shary-online-clean-custom-sessions-v1" : "mix-shary-custom-sessions-v1";
const LIBRARY_DB = IS_PUBLIC_HOST ? "mix-shary-online-clean-audio-library" : "mix-shary-audio-library";
const PACKAGE_MAGIC = "MIXSHARY1";
const TRACK_COLORS = ["#d5ff3f", "#55d6ff", "#ff7ac8", "#ffb454", "#9f8cff", "#46e0a1", "#ff7474", "#6fa8ff", "#ffe66d", "#4dd4ac", "#ff9f68", "#d68cff"];
const SECTION_COLORS = {
  Intro: "#55d6ff",
  Estrofa: "#9f8cff",
  "Pre-coro": "#ffb454",
  Estribillo: "#ff7ac8",
  Puente: "#46e0a1",
  Outro: "#6fa8ff",
};
const EVENT_TYPES = {
  cue: { label: "Hot cue", short: "CUE", color: "#d5ff3f", duration: 0 },
  echo: { label: "Echo out", short: "ECHO", color: "#55d6ff", duration: 1.5 },
  filter: { label: "Barrido de filtro", short: "FILTER", color: "#ffb454", duration: 2 },
  dip: { label: "Golpe de silencio", short: "DIP", color: "#ff7ac8", duration: 0.35 },
  fx: { label: "Automatización FX", short: "AUTO", color: "#46e0a1", duration: 0.18 },
};
const FX_PRESETS = {
  balanced: {
    label: "Equilibrado seguro",
    help: "Controla picos con suavidad y conserva la energía de la canción.",
    fx: { highpass: 30, lowpass: 19000, compressorEnabled: true, compressorThreshold: -16, compressorRatio: 2.5, gateEnabled: false, gateThreshold: -52, delayMs: 0, delayMix: 0, sidechainDb: 0 },
  },
  voice: {
    label: "Voz clara",
    help: "Limpia graves innecesarios y mantiene la introducción hablada al frente.",
    fx: { highpass: 85, lowpass: 16500, compressorEnabled: true, compressorThreshold: -20, compressorRatio: 3.2, gateEnabled: true, gateThreshold: -48, delayMs: 0, delayMix: 0, sidechainDb: 0 },
  },
  dance: {
    label: "Baile con pegada",
    help: "Da estabilidad y cuerpo sin aplastar los golpes importantes para la coreografía.",
    fx: { highpass: 32, lowpass: 18800, compressorEnabled: true, compressorThreshold: -14, compressorRatio: 2.2, gateEnabled: false, gateThreshold: -52, delayMs: 0, delayMix: 0, sidechainDb: 0 },
  },
  transition: {
    label: "Transición DJ suave",
    help: "Prepara un eco corto y un leve duck para entregar espacio a la canción siguiente.",
    fx: { highpass: 45, lowpass: 17500, compressorEnabled: true, compressorThreshold: -17, compressorRatio: 2.4, gateEnabled: false, gateThreshold: -52, delayMs: 375, delayMix: 0.18, sidechainDb: 2.5 },
  },
};
const EFFECT_DEFS = {
  highpass: { label: "Pasa alto", short: "HPF", color: "#ffb454" },
  lowpass: { label: "Pasa bajo", short: "LPF", color: "#9f8cff" },
  compressor: { label: "Compresor", short: "COMP", color: "#55d6ff", enabledKey: "compressorEnabled" },
  gate: { label: "Noise gate", short: "GATE", color: "#ff7ac8", enabledKey: "gateEnabled" },
  delay: { label: "Delay / echo", short: "DLY", color: "#46e0a1" },
  sidechain: { label: "Sidechain", short: "DUCK", color: "#ff7474" },
};
function defaultEventParams(type) {
  if (type === "echo") return { delayBeats: 1, mix: 0.72, feedback: 0.42 };
  if (type === "filter") return { filterMode: "lowpass", startHz: 18000, endHz: 420, resonance: 1.2 };
  if (type === "fx") return { highpass: 20, lowpass: 20000, mix: 0, feedback: 0.32, delayBeats: 1 };
  return {};
}
const livePreview = {
  context: null,
  output: null,
  nodes: [],
  buffers: new Map(),
  active: false,
  fx: null,
  analyser: null,
};

let spectrumAnimation = 0;
const spectrumHistory = [];
const historyBySession = new Map();
const selectedLibrarySources = new Set();
const silentTransportUrls = new Map();
let autoMixCooking = false;
let historyApplying = false;

const state = {
  sessionId: data.sessions.find((item) => item.status === "Lista")?.id || data.sessions[0]?.id,
  mode: "master",
  selectedIndex: 0,
  editMode: true,
  sourceOpen: false,
  snapMode: true,
  snapGrid: "edges",
  uploadMode: "add",
  auditionEnd: null,
  selectedEventId: null,
  zoomX: 1,
  zoomY: 1,
  liveFx: { highpass: 20, lowpass: 20000, mix: 0, feedback: 0.32, delayBeats: 1 },
  fxRecord: false,
  lastFxRecordTime: -1,
  analyzerMode: "wave",
  productionDockBySession: {},
  laneHeight: 48,
  leftPanelOpen: true,
  rightPanelOpen: true,
  resumeTime: 0,
  resumeScrollLeft: 0,
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function roundTime(value) {
  return Math.round(value * 100) / 100;
}

function roundMillis(value) {
  return Math.round(value * 1000) / 1000;
}

function createSegmentId(session, hint = "track") {
  return `${session.id || "session"}-${hint}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function colorForSegment(segment) {
  const key = segment.sourceKey || segment.name || "track";
  const libraryIndex = Object.keys(data.library).indexOf(key);
  if (libraryIndex >= 0) return TRACK_COLORS[libraryIndex % TRACK_COLORS.length];
  let hash = 0;
  for (let index = 0; index < key.length; index += 1) hash = ((hash << 5) - hash + key.charCodeAt(index)) | 0;
  return TRACK_COLORS[Math.abs(hash) % TRACK_COLORS.length];
}

function colorForSection(label, fallback) {
  return SECTION_COLORS[label] || fallback || "#d5ff3f";
}

function applySegmentDefaults(session) {
  session.segments.forEach((segment, index) => {
    segment.id ||= `${session.id || "session"}-track-${index}-${segment.sourceKey || "audio"}`;
    const editableAudio = Boolean(segment.sourceKey);
    if (!Number.isFinite(segment.fadeIn)) segment.fadeIn = editableAudio ? (index === 0 ? 0.02 : 0.18) : 0;
    if (!Number.isFinite(segment.fadeOut)) segment.fadeOut = editableAudio ? (index === session.segments.length - 1 ? 0.35 : 0.2) : 0;
    if (!Number.isFinite(segment.gainDb)) segment.gainDb = 0;
    if (!Number.isFinite(segment.bpm)) segment.bpm = data.library[segment.sourceKey]?.bpm || 120;
    if (!Number.isFinite(segment.beatOffset)) segment.beatOffset = null;
    segment.muted = Boolean(segment.muted);
    segment.solo = Boolean(segment.solo);
    segment.color = colorForSegment(segment);
    segment.fx = {
      highpass: 20,
      lowpass: 20000,
      compressorEnabled: false,
      compressorThreshold: -18,
      compressorRatio: 4,
      gateEnabled: false,
      gateThreshold: -52,
      delayMs: 0,
      delayMix: 0,
      sidechainDb: 0,
      enabled: true,
      chain: null,
      bypass: {},
      ...(segment.fx || {}),
    };
    if (!Array.isArray(segment.fx.chain)) {
      segment.fx.chain = [
        Number(segment.fx.highpass) > 20 ? "highpass" : null,
        Number(segment.fx.lowpass) < 20000 ? "lowpass" : null,
        segment.fx.compressorEnabled ? "compressor" : null,
        segment.fx.gateEnabled ? "gate" : null,
        Number(segment.fx.delayMs) > 0 || Number(segment.fx.delayMix) > 0 ? "delay" : null,
        Number(segment.fx.sidechainDb) > 0 ? "sidechain" : null,
      ].filter(Boolean);
    }
    segment.fx.chain = [...new Set(segment.fx.chain.filter((key) => EFFECT_DEFS[key]))];
    segment.fx.bypass = { ...(segment.fx.bypass || {}) };
    segment.fadeCurve ||= "equal-power";
    normalizeFades(segment);
  });
}

function applySessionDefaults(session) {
  applySegmentDefaults(session);
  session.events ||= [];
  session.events = session.events.map((event) => ({
    id: event.id || `event-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: EVENT_TYPES[event.type] ? event.type : "cue",
    time: roundTime(clamp(Number(event.time) || 0, 0, session.duration)),
    duration: Math.max(0, roundTime(Number.isFinite(event.duration) ? event.duration : EVENT_TYPES[event.type]?.duration || 0)),
    amount: clamp(Number.isFinite(event.amount) ? event.amount : 0.78, 0, 1),
    label: event.label || EVENT_TYPES[event.type]?.label || "Evento",
    trackId: event.trackId || null,
    params: { ...defaultEventParams(event.type), ...(event.params || {}) },
  }));
}

function normalizeFades(segment) {
  const duration = Math.max(0, segment.end - segment.start);
  const maximum = duration / 2;
  segment.fadeIn = roundTime(clamp(Number(segment.fadeIn) || 0, 0, maximum));
  segment.fadeOut = roundTime(clamp(Number(segment.fadeOut) || 0, 0, maximum));
}

function hasSoloTrack() {
  return currentSession().segments.some((segment) => segment.solo);
}

function isSegmentAudible(segment) {
  return !segment.muted && (!hasSoloTrack() || segment.solo);
}

function effectIsActive(segment, key) {
  const definition = EFFECT_DEFS[key];
  return Boolean(segment?.fx?.enabled !== false
    && segment.fx.chain?.includes(key)
    && !segment.fx.bypass?.[key]
    && (!definition?.enabledKey || segment.fx[definition.enabledKey]));
}

function inferEffectChain(fx) {
  return [
    Number(fx.highpass) > 20 ? "highpass" : null,
    Number(fx.lowpass) < 20000 ? "lowpass" : null,
    fx.compressorEnabled ? "compressor" : null,
    fx.gateEnabled ? "gate" : null,
    Number(fx.delayMs) > 0 || Number(fx.delayMix) > 0 ? "delay" : null,
    Number(fx.sidechainDb) > 0 ? "sidechain" : null,
  ].filter(Boolean);
}

function effectChainMarkup(segment) {
  const chain = segment.fx.chain || [];
  const available = Object.entries(EFFECT_DEFS).filter(([key]) => !chain.includes(key));
  const rows = chain.length ? chain.map((key) => {
    const effect = EFFECT_DEFS[key];
    const active = effectIsActive(segment, key);
    return `<div class="effect-slot${active ? " active" : " bypassed"}" style="--effect-color:${effect.color}">
      <span class="effect-grip" aria-hidden="true">⋮⋮</span>
      <i class="effect-color"></i>
      <span class="effect-name"><strong>${effect.label}</strong><small>${active ? "Procesando" : "Puentado"}</small></span>
      <button type="button" data-effect-toggle="${key}" aria-pressed="${active}" title="Activar o puentear ${effect.label}">${active ? "ON" : "OFF"}</button>
      <button type="button" class="effect-remove" data-effect-remove="${key}" aria-label="Quitar ${effect.label}">×</button>
    </div>`;
  }).join("") : '<div class="effect-empty"><strong>Cadena limpia</strong><span>Agrega solo el procesamiento que necesitas.</span></div>';
  return `<div class="effect-chain-head">
      <div><strong>Cadena de esta pista</strong><span>${chain.length} ${chain.length === 1 ? "efecto" : "efectos"}</span></div>
      <button id="track-fx-toggle" type="button" aria-pressed="${segment.fx.enabled !== false}">${segment.fx.enabled === false ? "FX puenteados" : "FX activos"}</button>
    </div>
    <div class="effect-chain-list">${rows}</div>
    <div class="effect-add-row">
      <select id="effect-add-select" aria-label="Efecto para agregar"${available.length ? "" : " disabled"}>${available.length ? available.map(([key, effect]) => `<option value="${key}">${effect.label}</option>`).join("") : '<option>Cadena completa</option>'}</select>
      <button id="effect-add-button" type="button"${available.length ? "" : " disabled"}>+ Agregar efecto</button>
    </div>`;
}

function currentSession() {
  return data.sessions.find((item) => item.id === state.sessionId);
}

function selectedSegment() {
  return currentSession()?.segments[state.selectedIndex];
}

function sourceFor(segment = selectedSegment()) {
  return segment?.sourceKey ? data.library[segment.sourceKey] : null;
}

function silentTransportUrl(duration) {
  const safeDuration = Math.max(1, Math.ceil(Number(duration) || 1));
  if (silentTransportUrls.has(safeDuration)) return silentTransportUrls.get(safeDuration);
  const sampleRate = 8000;
  const dataSize = safeDuration * sampleRate;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const writeText = (offset, value) => [...value].forEach((character, index) => view.setUint8(offset + index, character.charCodeAt(0)));
  writeText(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeText(8, "WAVE");
  writeText(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate, true);
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true);
  writeText(36, "data");
  view.setUint32(40, dataSize, true);
  new Uint8Array(buffer, 44).fill(128);
  const url = URL.createObjectURL(new Blob([buffer], { type: "audio/wav" }));
  silentTransportUrls.set(safeDuration, url);
  return url;
}

function canLivePreview() {
  const session = currentSession();
  return state.editMode && state.mode === "master" && session.segments.length > 0 && session.segments.every((segment) => {
    const source = sourceFor(segment);
    return source && (!IS_PUBLIC_HOST || source.imported);
  });
}

function ensureAudioContext() {
  if (!livePreview.context) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    livePreview.context = new AudioContextClass();
    livePreview.output = livePreview.context.createGain();
    const highpass = livePreview.context.createBiquadFilter();
    const lowpass = livePreview.context.createBiquadFilter();
    const dry = livePreview.context.createGain();
    const wet = livePreview.context.createGain();
    const delay = livePreview.context.createDelay(2);
    const feedback = livePreview.context.createGain();
    const masterGlue = livePreview.context.createDynamicsCompressor();
    highpass.type = "highpass";
    lowpass.type = "lowpass";
    const analyser = livePreview.context.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.8;
    masterGlue.threshold.value = -8;
    masterGlue.knee.value = 6;
    masterGlue.ratio.value = 3;
    masterGlue.attack.value = 0.004;
    masterGlue.release.value = 0.16;
    livePreview.output.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(dry);
    dry.connect(masterGlue);
    lowpass.connect(delay);
    delay.connect(wet);
    wet.connect(masterGlue);
    delay.connect(feedback);
    feedback.connect(delay);
    masterGlue.connect(analyser);
    analyser.connect(livePreview.context.destination);
    livePreview.analyser = analyser;
    livePreview.fx = { highpass, lowpass, dry, wet, delay, feedback, masterGlue };
    applyLiveFxValues(true);
  }
  livePreview.output.gain.value = Number(document.querySelector("#volume-slider").value) * 0.82;
  return livePreview.context;
}

async function loadPreviewBuffer(source) {
  if (livePreview.buffers.has(source.file)) return livePreview.buffers.get(source.file);
  const promise = fetch(source.file)
    .then((response) => {
      if (!response.ok) throw new Error(`No se pudo cargar ${source.file}`);
      return response.arrayBuffer();
    })
    .then((buffer) => ensureAudioContext().decodeAudioData(buffer))
    .then((decoded) => {
      livePreview.buffers.set(source.file, decoded);
      return decoded;
    });
  livePreview.buffers.set(source.file, promise);
  return promise;
}

async function prepareLivePreview() {
  const sources = [...new Map(currentSession().segments.map((segment) => {
    const source = sourceFor(segment);
    return source ? [source.file, source] : null;
  }).filter(Boolean)).values()];
  await Promise.all(sources.map(loadPreviewBuffer));
}

function measureSegmentLevel(buffer, segment) {
  const startFrame = clamp(Math.floor((segment.sourceIn || 0) * buffer.sampleRate), 0, buffer.length - 1);
  const endFrame = clamp(Math.ceil((segment.sourceOut || buffer.duration) * buffer.sampleRate), startFrame + 1, buffer.length);
  const windowSize = 2048;
  const sampleStride = 4;
  const channels = Math.min(2, buffer.numberOfChannels);
  const channelData = Array.from({ length: channels }, (_, channel) => buffer.getChannelData(channel));
  let activeEnergy = 0;
  let activeSamples = 0;
  let peak = 0;
  for (let frame = startFrame; frame < endFrame; frame += windowSize) {
    const until = Math.min(endFrame, frame + windowSize);
    let energy = 0;
    let samples = 0;
    for (let sample = frame; sample < until; sample += sampleStride) {
      let channelEnergy = 0;
      for (let channel = 0; channel < channels; channel += 1) {
        const value = channelData[channel][sample] || 0;
        peak = Math.max(peak, Math.abs(value));
        channelEnergy += value * value;
      }
      energy += channelEnergy / channels;
      samples += 1;
    }
    const meanSquare = energy / Math.max(1, samples);
    if (Math.sqrt(meanSquare) >= 0.0063) {
      activeEnergy += meanSquare * samples;
      activeSamples += samples;
    }
  }
  const rms = Math.sqrt(activeEnergy / Math.max(1, activeSamples));
  return {
    rms,
    peak,
    rmsDb: 20 * Math.log10(Math.max(0.000001, rms)),
    peakDb: 20 * Math.log10(Math.max(0.000001, peak)),
  };
}

async function matchTrackLoudness() {
  const button = document.querySelector("#loudness-match-button");
  const status = document.querySelector("#loudness-status");
  const session = currentSession();
  const measurable = session.segments.filter((segment) => sourceFor(segment));
  if (!measurable.length) {
    showToast("Sube o vincula los archivos originales antes de igualar niveles");
    return;
  }
  button.disabled = true;
  button.classList.add("loading");
  status.textContent = "Analizando…";
  try {
    const measurements = [];
    for (let index = 0; index < measurable.length; index += 1) {
      const segment = measurable[index];
      status.textContent = `${index + 1}/${measurable.length}`;
      const buffer = await loadPreviewBuffer(sourceFor(segment));
      measurements.push({ segment, ...measureSegmentLevel(buffer, segment) });
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
    const validLevels = measurements.map((item) => item.rmsDb).filter(Number.isFinite).sort((a, b) => a - b);
    const median = validLevels[Math.floor(validLevels.length / 2)] ?? -17;
    const targetDb = clamp(median, -18, -15.5);
    const ceiling = 10 ** (-1.5 / 20);
    measurements.forEach((measurement) => {
      const loudnessGain = targetDb - measurement.rmsDb;
      const peakSafeGain = 20 * Math.log10(ceiling / Math.max(0.000001, measurement.peak));
      const appliedGain = Math.round(clamp(Math.min(loudnessGain, peakSafeGain), -8, 12) * 2) / 2;
      measurement.segment.gainDb = appliedGain;
      measurement.segment.loudness = {
        rmsDb: roundTime(measurement.rmsDb),
        peakDb: roundTime(measurement.peakDb),
        targetDb: roundTime(targetDb),
        gainDb: appliedGain,
        matchedAt: new Date().toISOString(),
      };
    });
    saveDraft();
    renderTimeline();
    renderInspector();
    await refreshLivePreview();
    status.textContent = `${measurements.length} pistas · ${targetDb.toFixed(1)} dB`;
    showToast(`Niveles igualados en ${measurements.length} pistas · protección anti-clipping activa`);
  } catch (error) {
    console.error("No fue posible igualar los niveles", error);
    status.textContent = "Reintentar";
    showToast("No se pudieron analizar todas las fuentes; revisa los archivos originales");
  } finally {
    button.disabled = false;
    button.classList.remove("loading");
  }
}

function gainAt(segment, localTime) {
  if (!isSegmentAudible(segment)) return 0;
  const duration = segment.end - segment.start;
  const curve = (progress) => segment.fadeCurve === "linear" ? progress : Math.sin(progress * Math.PI / 2);
  const fadeInGain = segment.fadeIn > 0 && localTime < segment.fadeIn
    ? curve(localTime / segment.fadeIn)
    : 1;
  const remaining = duration - localTime;
  const fadeOutGain = segment.fadeOut > 0 && remaining < segment.fadeOut
    ? curve(Math.max(0, remaining) / segment.fadeOut)
    : 1;
  const clipGain = 10 ** ((segment.gainDb || 0) / 20);
  const absoluteTime = segment.start + localTime;
  const isOverlapping = effectIsActive(segment, "sidechain") && (segment.fx?.sidechainDb || 0) > 0 && currentSession().segments.some((candidate) => candidate !== segment && isSegmentAudible(candidate) && absoluteTime >= candidate.start && absoluteTime < candidate.end);
  const duckGain = isOverlapping ? 10 ** (-(segment.fx.sidechainDb || 0) / 20) : 1;
  const dipGain = currentSession().events
    .filter((event) => event.type === "dip" && (!event.trackId || event.trackId === segment.id) && absoluteTime >= event.time && absoluteTime <= event.time + Math.max(0.05, event.duration))
    .reduce((gain, event) => {
      const progress = (absoluteTime - event.time) / Math.max(0.05, event.duration);
      const shape = Math.sin(progress * Math.PI);
      return gain * (1 - shape * clamp(event.amount, 0, 1) * 0.96);
    }, 1);
  return clamp(Math.min(fadeInGain, fadeOutGain) * clipGain * duckGain * dipGain, 0, 2);
}

function connectProcessingGraph(context, sourceNode, segment, envelope, output, schedule = { cursor: 0, origin: 0 }) {
  const fx = segment.fx || {};
  const timelineEvents = currentSession().events.filter((event) => (!event.trackId || event.trackId === segment.id) && event.time <= segment.end && event.time + event.duration >= segment.start);
  const scheduledTime = (eventTime) => Math.max(schedule.origin, schedule.origin + eventTime - schedule.cursor);
  const highpass = context.createBiquadFilter();
  highpass.type = "highpass";
  highpass.frequency.value = effectIsActive(segment, "highpass") ? clamp(Number(fx.highpass) || 20, 20, 18000) : 20;
  const lowpass = context.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = effectIsActive(segment, "lowpass") ? clamp(Number(fx.lowpass) || 20000, 80, 20000) : 20000;
  timelineEvents.filter((event) => event.type === "filter" && event.time + event.duration >= schedule.cursor).forEach((event) => {
    const params = { ...defaultEventParams("filter"), ...(event.params || {}) };
    const start = scheduledTime(Math.max(event.time, schedule.cursor));
    const end = scheduledTime(event.time + Math.max(0.1, event.duration));
    const target = params.filterMode === "highpass" ? highpass : lowpass;
    const startHz = clamp(Number(params.startHz) || (params.filterMode === "highpass" ? 20 : 18000), 20, 20000);
    const endHz = clamp(Number(params.endHz) || (params.filterMode === "highpass" ? 9000 : 420), 20, 20000);
    target.Q.setValueAtTime(clamp(Number(params.resonance) || 1.2, 0.1, 18), start);
    target.frequency.setValueAtTime(startHz, start);
    target.frequency.exponentialRampToValueAtTime(endHz, Math.max(start + 0.02, end));
  });
  timelineEvents.filter((event) => event.type === "fx" && event.time + event.duration >= schedule.cursor).forEach((event) => {
    const params = { ...defaultEventParams("fx"), ...(event.params || {}) };
    const start = scheduledTime(Math.max(event.time, schedule.cursor));
    const end = scheduledTime(event.time + Math.max(0.04, event.duration));
    highpass.frequency.setValueAtTime(highpass.frequency.value, start);
    highpass.frequency.exponentialRampToValueAtTime(clamp(Number(params.highpass) || 20, 20, 18000), end);
    lowpass.frequency.setValueAtTime(lowpass.frequency.value, start);
    lowpass.frequency.exponentialRampToValueAtTime(clamp(Number(params.lowpass) || 20000, 80, 20000), end);
  });
  sourceNode.connect(highpass);
  highpass.connect(lowpass);

  let processed = lowpass;
  if (effectIsActive(segment, "compressor")) {
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = clamp(Number(fx.compressorThreshold) || -18, -80, 0);
    compressor.ratio.value = clamp(Number(fx.compressorRatio) || 4, 1, 20);
    compressor.attack.value = 0.006;
    compressor.release.value = 0.18;
    processed.connect(compressor);
    processed = compressor;
  }

  const delayMix = effectIsActive(segment, "delay") ? clamp(Number(fx.delayMix) || 0, 0, 1) : 0;
  const echoEvents = timelineEvents.filter((event) => ["echo", "fx"].includes(event.type) && event.time + event.duration >= schedule.cursor);
  if (((Number(fx.delayMs) || 0) > 0 && delayMix > 0) || echoEvents.length) {
    const dry = context.createGain();
    const wet = context.createGain();
    const delay = context.createDelay(2);
    const feedback = context.createGain();
    dry.gain.value = 1 - delayMix * 0.45;
    wet.gain.value = delayMix;
    delay.delayTime.value = (Number(fx.delayMs) || 0) > 0 ? clamp(Number(fx.delayMs) / 1000, 0, 2) : clamp(beatSeconds(segment) * 0.75, 0.12, 0.75);
    feedback.gain.value = echoEvents.length ? 0.38 : 0.22;
    echoEvents.forEach((event) => {
      const params = { ...defaultEventParams(event.type), ...(event.params || {}) };
      const start = scheduledTime(Math.max(event.time, schedule.cursor));
      const end = scheduledTime(event.time + Math.max(0.2, event.duration));
      const wetTarget = clamp(Number(params.mix ?? event.amount), 0, 1);
      const feedbackTarget = clamp(Number(params.feedback) || 0.38, 0, 0.86);
      const delayTarget = clamp(beatSeconds(segment) * (Number(params.delayBeats) || 1), 0.04, 1.8);
      delay.delayTime.setValueAtTime(delayTarget, start);
      feedback.gain.setValueAtTime(feedbackTarget, start);
      wet.gain.setValueAtTime(Math.max(0.001, delayMix), start);
      wet.gain.linearRampToValueAtTime(Math.max(0.001, wetTarget), Math.min(end, start + 0.08));
      if (event.type === "echo") wet.gain.exponentialRampToValueAtTime(0.001, Math.max(start + 0.1, end));
    });
    processed.connect(dry);
    dry.connect(envelope);
    processed.connect(delay);
    delay.connect(wet);
    wet.connect(envelope);
    delay.connect(feedback);
    feedback.connect(delay);
  } else {
    processed.connect(envelope);
  }
  envelope.connect(output);
}

function stopLivePreview(restoreMaster = false) {
  livePreview.nodes.forEach((node) => {
    try { node.stop(); } catch (error) { /* already stopped */ }
    node.disconnect();
  });
  livePreview.nodes = [];
  livePreview.active = false;
  document.querySelector(".workspace").classList.remove("live-previewing");
  if (restoreMaster) audio.muted = false;
}

async function startLivePreview() {
  if (!canLivePreview()) return;
  const context = ensureAudioContext();
  await context.resume();
  stopLivePreview();
  const cursor = audio.currentTime;
  const now = context.currentTime + 0.035;
  currentSession().segments.forEach((segment) => {
    const activeStart = Math.max(cursor, segment.start);
    if (activeStart >= segment.end) return;
    const source = sourceFor(segment);
    const decoded = livePreview.buffers.get(source.file);
    if (!decoded || typeof decoded.then === "function") return;
    const localStart = activeStart - segment.start;
    const duration = segment.end - activeStart;
    const delay = activeStart - cursor;
    const offset = segment.sourceIn + localStart;
    const available = Math.max(0, Math.min(duration, decoded.duration - offset));
    if (available <= 0.01) return;

    const node = context.createBufferSource();
    const gain = context.createGain();
    const sampleCount = Math.max(16, Math.min(160, Math.ceil(available * 8)));
    const curve = new Float32Array(sampleCount);
    for (let index = 0; index < sampleCount; index += 1) {
      const progress = index / (sampleCount - 1);
      curve[index] = gainAt(segment, localStart + progress * available);
    }
    node.buffer = decoded;
    connectProcessingGraph(context, node, segment, gain, livePreview.output, { cursor, origin: now });
    gain.gain.setValueCurveAtTime(curve, now + delay, Math.max(0.02, available));
    node.start(now + delay, offset, available);
    livePreview.nodes.push(node);
  });
  livePreview.active = true;
  document.querySelector(".workspace").classList.add("live-previewing");
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function openLibraryDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(LIBRARY_DB, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains("files")) request.result.createObjectStore("files", { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function storeImportedFile(record) {
  const database = await openLibraryDatabase();
  await new Promise((resolve, reject) => {
    const transaction = database.transaction("files", "readwrite");
    transaction.objectStore("files").put(record);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

async function getImportedFiles() {
  const database = await openLibraryDatabase();
  const records = await new Promise((resolve, reject) => {
    const request = database.transaction("files", "readonly").objectStore("files").getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  database.close();
  return records;
}

function peaksFromBuffer(buffer, count = 720) {
  const channel = buffer.getChannelData(0);
  const block = Math.max(1, Math.floor(channel.length / count));
  const peaks = [];
  let maximum = 0;
  for (let index = 0; index < count; index += 1) {
    const start = index * block;
    const end = Math.min(channel.length, start + block);
    let sum = 0;
    for (let sample = start; sample < end; sample += 1) sum += channel[sample] * channel[sample];
    const rms = Math.sqrt(sum / Math.max(1, end - start));
    maximum = Math.max(maximum, rms);
    peaks.push(rms);
  }
  return peaks.map((peak) => roundTime(clamp(peak / Math.max(0.0001, maximum), 0, 1)));
}

function estimateBpm(buffer) {
  const channel = buffer.getChannelData(0);
  const hop = 2048;
  const sampleLimit = Math.min(channel.length, Math.floor(buffer.sampleRate * 90));
  const energy = [];
  for (let start = 0; start < sampleLimit; start += hop) {
    let sum = 0;
    const end = Math.min(sampleLimit, start + hop);
    for (let sample = start; sample < end; sample += 1) sum += channel[sample] * channel[sample];
    energy.push(Math.sqrt(sum / Math.max(1, end - start)));
  }
  const onset = energy.map((value, index) => Math.max(0, value - (energy[index - 1] || value)));
  let bestBpm = 120;
  let bestScore = -1;
  for (let bpm = 70; bpm <= 180; bpm += 1) {
    const lag = Math.max(1, Math.round((60 * buffer.sampleRate) / (bpm * hop)));
    let score = 0;
    for (let index = lag; index < onset.length; index += 1) score += onset[index] * onset[index - lag];
    if (score > bestScore) {
      bestScore = score;
      bestBpm = bpm;
    }
  }
  return bestBpm;
}

function beatAnchorFor(segment) {
  return Number.isFinite(segment?.beatOffset) ? segment.beatOffset : segment?.sourceIn || 0;
}

function nearestSourceBeat(segment, sourceTime) {
  const beat = beatSeconds(segment);
  const anchor = beatAnchorFor(segment);
  return roundMillis(anchor + Math.round((sourceTime - anchor) / beat) * beat);
}

function timelineBeatNear(segment, timelineTime) {
  const anchor = segment.start + beatAnchorFor(segment) - segment.sourceIn;
  const beat = beatSeconds(segment);
  return roundTime(anchor + Math.round((timelineTime - anchor) / beat) * beat);
}

async function detectBeatAnchor() {
  const segment = selectedSegment();
  const source = sourceFor(segment);
  if (!segment || !source) return;
  showToast("Analizando el golpe más cercano al corte…");
  try {
    const buffer = await loadPreviewBuffer(source);
    const channel = buffer.getChannelData(0);
    const searchRadius = Math.min(1.1, beatSeconds(segment) * 1.4);
    const from = Math.max(0, Math.floor((segment.sourceIn - searchRadius) * buffer.sampleRate));
    const to = Math.min(channel.length, Math.ceil((segment.sourceIn + searchRadius) * buffer.sampleRate));
    const windowSize = 512;
    const hop = 128;
    let previousEnergy = 0;
    let bestScore = -1;
    let bestSample = Math.floor(segment.sourceIn * buffer.sampleRate);
    for (let start = from; start + windowSize < to; start += hop) {
      let sum = 0;
      for (let sample = start; sample < start + windowSize; sample += 1) sum += channel[sample] * channel[sample];
      const energy = Math.sqrt(sum / windowSize);
      const rise = Math.max(0, energy - previousEnergy * 0.82);
      const distance = Math.abs(start / buffer.sampleRate - segment.sourceIn);
      const proximity = 1 - Math.min(0.7, distance / Math.max(0.01, searchRadius)) * 0.35;
      const score = rise * (0.45 + energy) * proximity;
      if (score > bestScore) {
        bestScore = score;
        bestSample = start;
      }
      previousEnergy = energy;
    }
    const duration = segment.sourceOut - segment.sourceIn;
    segment.beatOffset = roundMillis(bestSample / buffer.sampleRate);
    segment.sourceIn = segment.beatOffset;
    segment.sourceOut = roundTime(Math.min(source.duration, segment.sourceIn + duration));
    segment.end = roundTime(segment.start + segment.sourceOut - segment.sourceIn);
    refreshSourceText(segment);
    saveDraft();
    renderTimeline();
    renderInspector();
    updateSourceEditorUI();
    updateTransitionReadout();
    showToast(`Golpe fijado en ${formatTime(segment.beatOffset)} del original`);
  } catch (error) {
    console.warn("No se pudo detectar el golpe", error);
    showToast("No fue posible analizar esta fuente de audio");
  }
}

function snapSourceCutToBeat() {
  const segment = selectedSegment();
  const source = sourceFor(segment);
  if (!segment || !source) return;
  if (!Number.isFinite(segment.beatOffset)) {
    showToast("Primero usa Detectar golpe para calibrar esta canción");
    return;
  }
  const duration = segment.sourceOut - segment.sourceIn;
  segment.sourceIn = clamp(nearestSourceBeat(segment, segment.sourceIn), 0, Math.max(0, source.duration - 0.05));
  segment.sourceOut = roundTime(Math.min(source.duration, segment.sourceIn + duration));
  segment.end = roundTime(segment.start + segment.sourceOut - segment.sourceIn);
  refreshSourceText(segment);
  saveDraft();
  renderTimeline();
  renderInspector();
  updateSourceEditorUI();
  updateTransitionReadout();
  showToast("Corte ajustado exactamente a la cuadrícula de beats");
}

function percentileValue(values, percentile) {
  if (!values.length) return -60;
  const ordered = [...values].sort((a, b) => a - b);
  return ordered[Math.min(ordered.length - 1, Math.max(0, Math.round((ordered.length - 1) * percentile)))];
}

function describeMusicalSections(frames, duration, introEnd, scenes, chorusRanges, activeMedian) {
  const protectedBoundaries = new Set([0, roundTime(duration)]);
  if (introEnd >= 3 && introEnd <= duration - 5) protectedBoundaries.add(roundTime(introEnd));
  chorusRanges.forEach((range) => {
    protectedBoundaries.add(roundTime(range.start));
    protectedBoundaries.add(roundTime(range.end));
  });
  if (duration >= 45) protectedBoundaries.add(roundTime(duration - 9));
  const salientScenes = [];
  scenes.filter((time) => time >= 4 && time <= duration - 4).forEach((time) => {
    if (salientScenes.length < 8 && (!salientScenes.length || time - salientScenes.at(-1) >= 12)) salientScenes.push(time);
  });
  salientScenes.forEach((time) => protectedBoundaries.add(roundTime(time)));
  const rawBoundaries = [...protectedBoundaries].sort((a, b) => a - b);
  const boundaries = rawBoundaries.filter((time, index) => index === 0 || index === rawBoundaries.length - 1 || time - rawBoundaries[index - 1] >= 3);
  const sections = [];
  for (let index = 0; index < boundaries.length - 1; index += 1) {
    const start = boundaries[index];
    const end = boundaries[index + 1];
    if (end - start < 2.5) continue;
    const localFrames = frames.filter((frame) => frame.start >= start && frame.start < end);
    const meanDb = localFrames.length ? localFrames.reduce((sum, frame) => sum + frame.rmsDb, 0) / localFrames.length : activeMedian;
    const chorusOverlap = chorusRanges.reduce((largest, range) => Math.max(largest, Math.max(0, Math.min(end, range.end) - Math.max(start, range.start))), 0);
    let label = "Estrofa";
    if (start < Math.max(3, introEnd) && end <= Math.max(5, introEnd + 1)) label = "Intro";
    else if (chorusOverlap >= Math.min(5, (end - start) * 0.45)) label = "Estribillo";
    else if (duration - end < 0.8 && start >= duration - 12) label = "Outro";
    else {
      const nextChorus = chorusRanges.find((range) => range.start >= end - 0.5);
      const previousChorus = [...chorusRanges].reverse().find((range) => range.end <= start + 0.5);
      if (nextChorus && nextChorus.start - end <= 10) label = "Pre-coro";
      else if (previousChorus && chorusRanges.length > 1 && start > chorusRanges[0].end && end <= chorusRanges.at(-1).start) label = "Puente";
    }
    sections.push({
      label,
      start: roundTime(start),
      end: roundTime(end),
      intensity: roundTime(clamp((meanDb - activeMedian + 10) / 18, 0.16, 1)),
      meanDb: roundTime(meanDb),
    });
  }
  return sections.reduce((merged, section) => {
    const previous = merged.at(-1);
    if (!previous || previous.label !== section.label) {
      merged.push({ ...section });
      return merged;
    }
    const previousDuration = previous.end - previous.start;
    const sectionDuration = section.end - section.start;
    previous.intensity = roundTime((previous.intensity * previousDuration + section.intensity * sectionDuration) / Math.max(0.01, previousDuration + sectionDuration));
    previous.meanDb = roundTime((previous.meanDb * previousDuration + section.meanDb * sectionDuration) / Math.max(0.01, previousDuration + sectionDuration));
    previous.end = section.end;
    return merged;
  }, []);
}

function analyzeAudioStructure(buffer) {
  const channel = buffer.getChannelData(0);
  const frameSeconds = 0.5;
  const frameSamples = Math.max(1, Math.floor(buffer.sampleRate * frameSeconds));
  const stride = Math.max(1, Math.floor(frameSamples / 1800));
  const frames = [];
  for (let offset = 0; offset < channel.length; offset += frameSamples) {
    const end = Math.min(channel.length, offset + frameSamples);
    let sumSquares = 0;
    let crossings = 0;
    let count = 0;
    let previous = channel[offset] || 0;
    for (let sample = offset; sample < end; sample += stride) {
      const value = channel[sample];
      sumSquares += value * value;
      if ((value >= 0) !== (previous >= 0)) crossings += 1;
      previous = value;
      count += 1;
    }
    const rms = Math.sqrt(sumSquares / Math.max(1, count));
    frames.push({
      start: offset / buffer.sampleRate,
      rmsDb: 20 * Math.log10(Math.max(1e-6, rms)),
      zcr: crossings / Math.max(1, count),
    });
  }
  const levels = frames.map((frame) => frame.rmsDb);
  const activeMedian = percentileValue(levels, 0.62);
  const silenceThreshold = clamp(activeMedian - 22, -58, -38);
  const activeLevels = levels.filter((level) => level > silenceThreshold);
  const rmsDb = activeLevels.length ? activeLevels.reduce((sum, value) => sum + value, 0) / activeLevels.length : -30;
  const silences = [];
  let silenceStart = null;
  frames.forEach((frame, index) => {
    if (frame.rmsDb <= silenceThreshold && silenceStart === null) silenceStart = frame.start;
    const closes = frame.rmsDb > silenceThreshold || index === frames.length - 1;
    if (silenceStart !== null && closes) {
      const end = frame.rmsDb > silenceThreshold ? frame.start : Math.min(buffer.duration, frame.start + frameSeconds);
      if (end - silenceStart >= 1.5) silences.push({ start: roundTime(silenceStart), end: roundTime(end) });
      silenceStart = null;
    }
  });
  const scenes = [];
  let lastScene = 0;
  for (let index = 2; index < frames.length; index += 1) {
    const energyJump = Math.abs(frames[index].rmsDb - frames[index - 2].rmsDb);
    const textureJump = Math.abs(frames[index].zcr - frames[index - 2].zcr);
    if ((energyJump > 7 || textureJump > 0.085) && frames[index].start - lastScene >= 7) {
      scenes.push(roundTime(frames[index].start));
      lastScene = frames[index].start;
    }
  }
  const activeThreshold = activeMedian - 5;
  let introEnd = 0;
  for (let index = 0; index < frames.length - 3; index += 1) {
    if (frames.slice(index, index + 4).every((frame) => frame.rmsDb > activeThreshold)) {
      introEnd = frames[index].start;
      break;
    }
  }
  const windowFrames = Math.max(12, Math.round(12 / frameSeconds));
  const stepFrames = Math.max(4, Math.round(4 / frameSeconds));
  const windows = [];
  for (let index = 0; index + windowFrames <= frames.length; index += stepFrames) {
    const slice = frames.slice(index, index + windowFrames);
    const mean = slice.reduce((sum, frame) => sum + frame.rmsDb, 0) / slice.length;
    const zcr = slice.reduce((sum, frame) => sum + frame.zcr, 0) / slice.length;
    const shape = Array.from({ length: 6 }, (_, bin) => {
      const binSlice = slice.slice(bin * 4, bin * 4 + 4);
      return binSlice.reduce((sum, frame) => sum + frame.rmsDb, 0) / Math.max(1, binSlice.length);
    });
    windows.push({ start: frames[index].start, mean, zcr, shape });
  }
  let chorusCandidate = null;
  let chorusPair = null;
  let bestScore = -Infinity;
  windows.forEach((first, firstIndex) => {
    windows.slice(firstIndex + 1).forEach((second) => {
      if (second.start - first.start < 16) return;
      const shapeDifference = first.shape.reduce((sum, value, index) => sum + Math.abs(value - second.shape[index]), 0) / first.shape.length;
      const textureDifference = Math.abs(first.zcr - second.zcr) * 120;
      const similarity = clamp(1 - (shapeDifference + textureDifference) / 11, 0, 1);
      const energy = clamp((Math.max(first.mean, second.mean) - activeMedian + 8) / 14, 0, 1);
      const score = similarity * 0.7 + energy * 0.3;
      if (score > bestScore) {
        bestScore = score;
        const chosen = first.mean >= second.mean ? first : second;
        chorusCandidate = { start: roundTime(chosen.start), end: roundTime(Math.min(buffer.duration, chosen.start + 12)), confidence: score };
        chorusPair = [first, second];
      }
    });
  });
  const chorusRanges = bestScore >= 0.56 && chorusPair
    ? chorusPair.map((window) => ({ start: roundTime(window.start), end: roundTime(Math.min(buffer.duration, window.start + 12)), confidence: roundTime(bestScore) })).sort((a, b) => a.start - b.start)
    : [];
  const bestFrame = frames.reduce((best, frame) => frame.rmsDb > best.rmsDb ? frame : best, frames[0] || { start: 0, rmsDb: -60 });
  const bestStart = clamp(bestFrame.start - 6, Math.min(buffer.duration, introEnd), Math.max(0, buffer.duration - 12));
  const sections = describeMusicalSections(frames, buffer.duration, introEnd, scenes, chorusRanges, activeMedian);
  return {
    version: 1,
    rmsDb: roundTime(rmsDb),
    silenceThreshold: roundTime(silenceThreshold),
    silences: silences.slice(0, 12),
    scenes: scenes.slice(0, 16),
    introEnd: roundTime(introEnd),
    longIntro: introEnd >= 8,
    chorus: chorusCandidate && chorusCandidate.confidence >= 0.56 ? chorusCandidate : null,
    choruses: chorusRanges,
    sections,
    bestSection: { start: roundTime(bestStart), end: roundTime(Math.min(buffer.duration, bestStart + 18)) },
  };
}

async function registerImportedFile(record, addToTimeline = false) {
  const context = ensureAudioContext();
  const decoded = await context.decodeAudioData(await record.blob.arrayBuffer());
  const key = `upload:${record.id}`;
  const fileUrl = URL.createObjectURL(record.blob);
  const cleanName = record.name.replace(/\.[^.]+$/, "");
  const [artist, ...titleParts] = cleanName.split(" - ");
  data.library[key] = {
    name: titleParts.length ? titleParts.join(" - ") : cleanName,
    artist: titleParts.length ? artist : "Archivo personal",
    file: fileUrl,
    duration: decoded.duration,
    waveform: peaksFromBuffer(decoded),
    bpm: estimateBpm(decoded),
    analysis: analyzeAudioStructure(decoded),
    imported: true,
    recordId: record.id,
  };
  livePreview.buffers.set(fileUrl, decoded);
  renderLibrary();
  if (addToTimeline) addSourceToTimeline(key);
  return key;
}

async function loadImportedLibrary() {
  try {
    const records = await getImportedFiles();
    for (const record of records) await registerImportedFile(record, false);
  } catch (error) {
    console.warn("No fue posible abrir la biblioteca local", error);
  }
}

function renderLibrary() {
  const entries = Object.entries(data.library);
  document.querySelector("#library-count").textContent = `${entries.length} canciones`;
  libraryList.innerHTML = "";
  entries.forEach(([key, source]) => {
    const item = document.createElement("div");
    const selected = selectedLibrarySources.has(key);
    const sourceColor = TRACK_COLORS[entries.findIndex(([entryKey]) => entryKey === key) % TRACK_COLORS.length];
    item.className = `library-item${selected ? " selected" : ""}`;
    item.style.setProperty("--source-color", sourceColor);
    const origin = key === "voice" ? "ORIGINAL COMPLETA · " : source.imported ? "SUBIDA · " : "FUENTE · ";
    const analysisTags = [];
    if (source.analysis?.chorus) analysisTags.push("Estribillo probable");
    if (source.analysis?.longIntro) analysisTags.push(`Intro ${formatTime(source.analysis.introEnd, false)}`);
    if (source.analysis?.silences?.length) analysisTags.push(`${source.analysis.silences.length} silencio${source.analysis.silences.length === 1 ? "" : "s"}`);
    if (source.analysis?.sections?.length) analysisTags.push(`${source.analysis.sections.length} secciones`);
    if (source.imported && !source.analysis) analysisTags.push("Analizando…");
    const structureMarkup = source.analysis?.sections?.length
      ? `<span class="library-structure" aria-label="Estructura musical detectada">${source.analysis.sections.map((section) => `<b style="--section-color:${colorForSection(section.label, sourceColor)};--section-width:${Math.max(2, ((section.end - section.start) / source.duration) * 100)}%;--section-alpha:${clamp(section.intensity, 0.2, 1)}" title="${escapeMarkup(section.label)} · ${formatTime(section.start)}–${formatTime(section.end)}"></b>`).join("")}</span>`
      : "";
    item.innerHTML = `<button class="library-select" type="button" aria-pressed="${selected}" aria-label="${selected ? "Quitar" : "Seleccionar"} ${escapeMarkup(source.name)}">✓</button><button class="library-info" type="button" title="Añadir esta canción a la línea de tiempo"><strong>${escapeMarkup(source.name)}</strong><small>${origin}${formatTime(source.duration, false)}${source.bpm ? ` · ${source.bpm} BPM` : ""}</small>${structureMarkup}${analysisTags.length ? `<span class="library-analysis">${analysisTags.map((tag) => `<i>${escapeMarkup(tag)}</i>`).join("")}</span>` : ""}</button><button class="library-add" type="button" aria-label="Añadir ${escapeMarkup(source.name)} a la línea de tiempo">+</button>`;
    item.querySelector(".library-select").addEventListener("click", () => toggleLibrarySource(key));
    item.querySelector(".library-info").addEventListener("click", () => addSourceToTimeline(key));
    item.querySelector(".library-add").addEventListener("click", () => addSourceToTimeline(key));
    libraryList.appendChild(item);
  });
  updateAutoMixControls();
}

function toggleLibrarySource(key) {
  if (selectedLibrarySources.has(key)) selectedLibrarySources.delete(key);
  else selectedLibrarySources.add(key);
  renderLibrary();
}

function updateAutoMixControls() {
  const availableKeys = Object.keys(data.library);
  const selectedCount = availableKeys.filter((key) => selectedLibrarySources.has(key)).length;
  const allSelected = availableKeys.length > 0 && selectedCount === availableKeys.length;
  selectAllSourcesButton.setAttribute("aria-pressed", String(allSelected));
  selectAllSourcesButton.textContent = allSelected ? "Quitar todas" : "Seleccionar todas";
  autoMixButton.disabled = selectedCount === 0 || autoMixCooking;
  autoMixButton.classList.toggle("loading", autoMixCooking);
  autoMixButton.querySelector("span").textContent = autoMixCooking ? "Analizando" : "Cocinar radio edits";
  autoMixCount.textContent = autoMixCooking ? "Buscando secciones…" : selectedCount ? `${selectedCount} ${selectedCount === 1 ? "canción" : "canciones"}` : "Elige canciones";
}

function toggleAllLibrarySources() {
  const keys = Object.keys(data.library);
  const allSelected = keys.length > 0 && keys.every((key) => selectedLibrarySources.has(key));
  selectedLibrarySources.clear();
  if (!allSelected) keys.forEach((key) => selectedLibrarySources.add(key));
  renderLibrary();
}

function radioEditSection(source, label, duration, fallbackStart) {
  const sections = source.analysis?.sections || [];
  const candidates = sections.filter((section) => section.label === label);
  let candidate = null;
  if (label === "Intro") candidate = candidates[0];
  else if (label === "Estribillo") candidate = [...candidates].sort((a, b) => b.intensity - a.intensity)[0];
  else candidate = [...candidates].sort((a, b) => b.intensity - a.intensity)[0];
  const desiredDuration = Math.max(1.8, Math.min(duration, source.duration));
  let start = candidate?.start ?? fallbackStart;
  if (candidate && label === "Pre-coro") start = Math.max(candidate.start, candidate.end - desiredDuration);
  if (label === "Intro" && source.analysis?.longIntro) start = Math.max(start, source.analysis.introEnd);
  start = clamp(start, 0, Math.max(0, source.duration - desiredDuration));
  const silence = source.analysis?.silences?.find((range) => range.start < start + desiredDuration - 0.8 && range.end > start + 0.8);
  if (silence && label !== "Intro") start = clamp(silence.end + 0.12, 0, Math.max(0, source.duration - desiredDuration));
  return {
    label,
    start: roundTime(start),
    end: roundTime(Math.min(source.duration, start + desiredDuration)),
    intensity: candidate?.intensity ?? (label === "Estribillo" ? 0.92 : label === "Pre-coro" ? 0.72 : label === "Intro" ? 0.48 : 0.62),
  };
}

function buildRadioEditPlan(source, requestedDuration) {
  const total = Math.max(8, Math.min(requestedDuration, source.duration));
  const analysis = source.analysis || {};
  const chorusStart = analysis.chorus?.start ?? analysis.bestSection?.start ?? clamp(source.duration * 0.42, 8, Math.max(8, source.duration - 12));
  const firstChorus = analysis.choruses?.[0]?.start ?? chorusStart;
  const bridgeStart = analysis.choruses?.length > 1
    ? (analysis.choruses[0].end + analysis.choruses[1].start) / 2
    : source.duration * 0.66;
  const specs = total >= 34
    ? [
        ["Intro", 0.14, analysis.longIntro ? analysis.introEnd : 0],
        ["Estrofa", 0.22, Math.max(analysis.introEnd || 0, firstChorus - 26)],
        ["Pre-coro", 0.12, Math.max(0, firstChorus - total * 0.12)],
        ["Estribillo", 0.38, chorusStart],
        ["Puente", 0.14, bridgeStart],
      ]
    : [
        ["Intro", 0.16, analysis.longIntro ? analysis.introEnd : 0],
        ["Estrofa", 0.24, Math.max(analysis.introEnd || 0, firstChorus - 22)],
        ["Pre-coro", 0.14, Math.max(0, firstChorus - total * 0.14)],
        ["Estribillo", 0.46, chorusStart],
      ];
  return specs.map(([label, ratio, fallback]) => radioEditSection(source, label, total * ratio, fallback));
}

async function analyzeSelectedSources(keys) {
  const results = await Promise.allSettled(keys.map(async (key) => {
    const source = data.library[key];
    if (!source.analysis?.sections?.length) {
      const buffer = await loadPreviewBuffer(source);
      source.analysis = analyzeAudioStructure(buffer);
    }
  }));
  return results.filter((result) => result.status === "rejected").length;
}

async function createAutomaticMix() {
  const keys = Object.keys(data.library).filter((key) => selectedLibrarySources.has(key));
  if (!keys.length) return;
  autoMixCooking = true;
  updateAutoMixControls();
  const analysisFailures = await analyzeSelectedSources(keys);
  renderLibrary();
  saveDraft();
  audio.pause();
  stopLivePreview(true);
  closeSourceEditor();
  const previousSession = currentSession();
  const duration = Math.max(30, previousSession.duration || 180);
  const overlap = keys.length > 1 ? 0.65 : 0;
  const requestedDuration = (duration + overlap * Math.max(0, keys.length - 1)) / keys.length;
  const title = `Radio edits · ${new Date().toLocaleDateString("es-CL", { day: "2-digit", month: "short" })}`;
  const session = {
    id: uniqueSessionId(title),
    title,
    subtitle: "Radio edits asistidos · listo para revisar y ensayar",
    duration,
    status: "Borrador",
    version: "Radio Edit local",
    master: "local:",
    rehearsal: "local:",
    waveform: Array.from({ length: 240 }, () => 0.025),
    segments: [],
    events: [],
    changes: ["Cada canción se condensó como radio edit", "Intro, estrofa, pre-coro, estribillo y puente se seleccionaron cuando estaban disponibles", "Transiciones, fades y nivel estimado se aplicaron por canción"],
    custom: true,
  };
  let cursor = 0;
  let previousSongLast = null;
  keys.forEach((key, index) => {
    const source = data.library[key];
    const estimatedGain = source.analysis ? clamp(-16 - source.analysis.rmsDb, -5, 6) : 0;
    const plan = buildRadioEditPlan(source, requestedDuration);
    const songStart = roundTime(Math.max(0, cursor - (index ? overlap : 0)));
    let songCursor = songStart;
    let firstSongSegment = null;
    plan.forEach((section, sectionIndex) => {
      const internalOverlap = sectionIndex ? 0.06 : 0;
      const start = roundTime(Math.max(songStart, songCursor - internalOverlap));
      const clipDuration = section.end - section.start;
      const end = roundTime(Math.min(duration, start + clipDuration));
      if (end - start < 0.5) return;
      const id = createSegmentId(session, `radio-${index + 1}-${sectionIndex + 1}`);
      const segment = {
        id,
        name: source.name,
        artist: source.artist || "Archivo personal",
        start,
        end,
        source: `${formatTime(section.start)}–${formatTime(section.start + end - start)}`,
        sourceKey: key,
        sourceIn: section.start,
        sourceOut: roundTime(section.start + end - start),
        transition: sectionIndex ? "Corte de radio al beat" : index ? "Crossfade entre canciones" : "Entrada reconocible",
        note: `${section.label} probable · intensidad ${Math.round(section.intensity * 100)}%. Corte propuesto para conservar una frase reconocible.`,
        sectionLabel: section.label,
        sectionIntensity: section.intensity,
        color: colorForSection(section.label, colorForSegment({ sourceKey: key })),
        songGroupId: `radio-song-${index + 1}`,
        fadeIn: sectionIndex ? 0.04 : index ? overlap : 0.04,
        fadeOut: 0.04,
        fadeCurve: "equal-power",
        gainDb: roundTime(estimatedGain),
        bpm: source.bpm || 120,
      };
      session.segments.push(segment);
      firstSongSegment ||= segment;
      songCursor = segment.end;
    });
    const lastSongSegment = session.segments.at(-1);
    if (previousSongLast && firstSongSegment) {
      previousSongLast.fadeOut = overlap;
      const effectType = index % 2 === 0 ? "echo" : "filter";
      session.events.push({
        id: `event-auto-${Date.now()}-${index}`,
        type: effectType,
        label: effectType === "echo" ? "Echo entre canciones" : "Filtro entre canciones",
        time: roundTime(Math.max(previousSongLast.start, previousSongLast.end - 1.1)),
        duration: 1.1,
        amount: 0.58,
        trackId: previousSongLast.id,
        params: effectType === "echo"
          ? { ...defaultEventParams("echo"), mix: 0.42, feedback: 0.3 }
          : { ...defaultEventParams("filter"), filterMode: "lowpass", startHz: 18000, endHz: 900 },
      });
    }
    previousSongLast = lastSongSegment;
    cursor = lastSongSegment?.end || cursor;
  });
  const lastSegment = session.segments.at(-1);
  if (lastSegment) {
    session.duration = Math.max(30, lastSegment.end);
    session.events.push({
      id: `event-auto-end-${Date.now()}`,
      type: "filter",
      label: "Cierre suave",
      time: roundTime(Math.max(lastSegment.start, lastSegment.end - 1.8)),
      duration: 1.8,
      amount: 0.58,
      trackId: lastSegment.id,
      params: { ...defaultEventParams("filter"), filterMode: "lowpass", startHz: 18000, endHz: 520 },
    });
  }
  applySessionDefaults(session);
  data.sessions.push(session);
  state.sessionId = session.id;
  state.selectedIndex = 0;
  state.selectedEventId = null;
  state.resumeTime = 0;
  state.resumeScrollLeft = 0;
  audio.currentTime = 0;
  saveDraft();
  renderSessions();
  updateExactSaveUI();
  renderWorkspace();
  restoreWorkspaceViewport();
  autoMixCooking = false;
  renderLibrary();
  const warning = analysisFailures ? ` · ${analysisFailures} sin análisis completo` : "";
  showToast(`Radio edit creado con ${keys.length} ${keys.length === 1 ? "canción" : "canciones"}${warning} · el proyecto anterior quedó intacto`);
}

function addSourceToTimeline(key) {
  const source = data.library[key];
  if (!source) return;
  const session = currentSession();
  const previous = selectedSegment() || session.segments.at(-1);
  const insertAt = Math.min(session.segments.length, state.selectedIndex + 1);
  const clipDuration = Math.min(30, source.duration);
  const start = roundTime(Math.max(0, previous ? previous.end - 0.2 : audio.currentTime));
  const segment = {
    name: source.name,
    artist: source.artist || "Archivo personal",
    start,
    end: roundTime(start + clipDuration),
    source: `${formatTime(0)}–${formatTime(clipDuration)}`,
    sourceKey: key,
    sourceIn: 0,
    sourceOut: roundTime(clipDuration),
    transition: "Crossfade 200 ms",
    note: "Pista añadida desde la biblioteca; ajusta el fragmento o usa el original completo.",
    fadeIn: 0.2,
    fadeOut: 0.2,
    fadeCurve: "equal-power",
    gainDb: 0,
    bpm: source.bpm || 120,
  };
  session.segments.splice(insertAt, 0, segment);
  applySegmentDefaults(session);
  state.selectedIndex = insertAt;
  session.duration = Math.max(session.duration, segment.end);
  saveDraft();
  renderWorkspace();
  showToast(`${source.name} añadida a la línea de tiempo`);
}

function replaceSelectedSource(key) {
  const source = data.library[key];
  const segment = selectedSegment();
  if (!source || !segment) return;
  const duration = Math.min(segment.end - segment.start, source.duration);
  segment.name = source.name;
  segment.artist = source.artist || "Archivo personal";
  segment.sourceKey = key;
  segment.sourceIn = 0;
  segment.sourceOut = roundTime(duration);
  segment.beatOffset = null;
  segment.end = roundTime(segment.start + duration);
  segment.note = "Fuente reemplazada por el archivo original subido desde tu biblioteca.";
  refreshSourceText(segment);
  saveDraft();
  renderWorkspace();
  showToast("Fuente original reemplazada");
}

async function handleAudioUpload(event) {
  const files = [...event.target.files];
  if (!files.length) return;
  const mode = state.uploadMode;
  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const record = {
      id: `${Date.now()}-${index}-${file.name}`,
      name: file.name,
      type: file.type,
      blob: file,
      importedAt: new Date().toISOString(),
    };
    try {
      await storeImportedFile(record);
      const key = await registerImportedFile(record, mode === "add");
      if (mode === "replace" && index === 0) replaceSelectedSource(key);
    } catch (error) {
      console.error("No fue posible importar el audio", error);
      showToast(`No se pudo leer ${file.name}`);
    }
  }
  event.target.value = "";
  state.uploadMode = "add";
}

function formatTime(value, tenths = true) {
  const safe = Math.max(0, Number.isFinite(value) ? value : 0);
  const minutes = Math.floor(safe / 60);
  const seconds = safe - minutes * 60;
  return `${minutes}:${seconds.toFixed(tenths ? 1 : 0).padStart(tenths ? 4 : 2, "0")}`;
}

function escapeMarkup(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

function refreshSourceText(segment) {
  if (Number.isFinite(segment.sourceIn) && Number.isFinite(segment.sourceOut)) {
    segment.source = `${formatTime(segment.sourceIn)}–${formatTime(segment.sourceOut)}`;
  }
}

function portableSession(session) {
  return {
    ...serializeSession(session),
    id: session.id,
    title: session.title,
    subtitle: session.subtitle || "Proyecto personal",
    status: session.status || "Borrador",
    version: session.version || "Sesión local",
    master: session.master || "local:",
    rehearsal: session.rehearsal || "local:",
    waveform: Array.isArray(session.waveform) ? session.waveform : [],
    changes: Array.isArray(session.changes) ? session.changes : [],
    custom: true,
  };
}

function loadCustomSessions() {
  try {
    const saved = JSON.parse(localStorage.getItem(CUSTOM_SESSIONS_KEY) || "[]");
    if (!Array.isArray(saved)) return;
    saved.forEach((session) => {
      if (!session?.id || !Array.isArray(session.segments) || data.sessions.some((candidate) => candidate.id === session.id)) return;
      session.custom = true;
      session.master ||= "local:";
      session.rehearsal ||= "local:";
      data.sessions.push(session);
    });
  } catch (error) {
    console.warn("No fue posible recuperar los proyectos personales", error);
  }
}

function persistCustomSessions() {
  try {
    localStorage.setItem(CUSTOM_SESSIONS_KEY, JSON.stringify(data.sessions.filter((session) => session.custom).map(portableSession)));
  } catch (error) {
    console.warn("No fue posible guardar el catálogo de proyectos", error);
  }
}

function loadDrafts() {
  try {
    const drafts = JSON.parse(localStorage.getItem(DRAFT_KEY) || localStorage.getItem(LEGACY_DRAFT_KEY) || "{}");
    data.sessions.forEach((session) => {
      const saved = drafts[session.id];
      if (!saved?.segments) return;
      if (saved.schema >= 3) {
        session.segments = structuredClone(saved.segments);
        session.events = structuredClone(saved.events || []);
        if (Number.isFinite(saved.duration)) session.duration = saved.duration;
        applySessionDefaults(session);
        return;
      }
      saved.segments.forEach((edit, index) => {
        if (!session.segments[index]) return;
        Object.assign(session.segments[index], edit);
        refreshSourceText(session.segments[index]);
      });
    });
  } catch (error) {
    console.warn("No fue posible recuperar el borrador", error);
  }
}

function serializeSession(session) {
  return {
    schema: 5,
    duration: roundTime(session.duration),
    events: (session.events || []).map((event) => ({ ...event, time: roundTime(event.time), duration: roundTime(event.duration) })),
    segments: session.segments.map((segment) => ({
      ...segment,
      start: roundTime(segment.start),
      end: roundTime(segment.end),
      sourceIn: Number.isFinite(segment.sourceIn) ? roundMillis(segment.sourceIn) : undefined,
      sourceOut: Number.isFinite(segment.sourceOut) ? roundMillis(segment.sourceOut) : undefined,
      beatOffset: Number.isFinite(segment.beatOffset) ? roundMillis(segment.beatOffset) : null,
      fadeIn: roundTime(segment.fadeIn),
      fadeOut: roundTime(segment.fadeOut),
      gainDb: roundTime(segment.gainDb),
    })),
  };
}

function ensureHistory(session = currentSession()) {
  if (!session) return null;
  if (!historyBySession.has(session.id)) {
    historyBySession.set(session.id, { current: JSON.stringify(serializeSession(session)), undo: [], redo: [] });
  }
  return historyBySession.get(session.id);
}

function updateHistoryUI() {
  const entry = ensureHistory();
  const undoButton = document.querySelector("#undo-button");
  const redoButton = document.querySelector("#redo-button");
  if (undoButton) undoButton.disabled = !entry?.undo.length;
  if (redoButton) redoButton.disabled = !entry?.redo.length;
}

function recordHistorySnapshot() {
  if (historyApplying) return;
  const entry = ensureHistory();
  if (!entry) return;
  const next = JSON.stringify(serializeSession(currentSession()));
  if (next === entry.current) return;
  entry.undo.push(entry.current);
  if (entry.undo.length > 80) entry.undo.shift();
  entry.current = next;
  entry.redo = [];
  updateHistoryUI();
}

function applyHistorySnapshot(snapshot, message) {
  const session = currentSession();
  if (!session || !snapshot) return;
  const saved = JSON.parse(snapshot);
  session.segments = structuredClone(saved.segments || []);
  session.events = structuredClone(saved.events || []);
  session.duration = Number.isFinite(saved.duration) ? saved.duration : session.duration;
  applySessionDefaults(session);
  state.selectedIndex = clamp(state.selectedIndex, 0, Math.max(0, session.segments.length - 1));
  state.selectedEventId = session.events.some((event) => event.id === state.selectedEventId) ? state.selectedEventId : null;
  historyApplying = true;
  try { saveDraft(); } finally { historyApplying = false; }
  renderSessions();
  renderWorkspace();
  restoreWorkspaceViewport();
  updateHistoryUI();
  showToast(message);
}

function undoEdit() {
  const entry = ensureHistory();
  if (!entry?.undo.length) return;
  entry.redo.push(entry.current);
  entry.current = entry.undo.pop();
  applyHistorySnapshot(entry.current, "Cambio deshecho");
}

function redoEdit() {
  const entry = ensureHistory();
  if (!entry?.redo.length) return;
  entry.undo.push(entry.current);
  entry.current = entry.redo.pop();
  applyHistorySnapshot(entry.current, "Cambio rehecho");
}

function workspaceViewPayload() {
  return {
    schema: 1,
    savedAt: new Date().toISOString(),
    sessionId: state.sessionId,
    selectedIndex: state.selectedIndex,
    selectedEventId: state.selectedEventId,
    mode: state.mode,
    editMode: state.editMode,
    snapMode: state.snapMode,
    snapGrid: state.snapGrid,
    zoomX: state.zoomX,
    zoomY: state.zoomY,
    liveFx: { ...state.liveFx },
    analyzerMode: state.analyzerMode,
    productionDockBySession: { ...state.productionDockBySession },
    laneHeight: state.laneHeight,
    leftPanelOpen: state.leftPanelOpen,
    rightPanelOpen: state.rightPanelOpen,
    audioTime: roundMillis(audio.currentTime || state.resumeTime || 0),
    scrollLeft: roundMillis(laneStack.scrollLeft || state.resumeScrollLeft || 0),
    sourceOpen: state.sourceOpen,
  };
}

function storeWorkspaceViewPayload(payload) {
  localStorage.setItem(WORKSPACE_STATE_KEY, JSON.stringify(payload));
  const views = JSON.parse(localStorage.getItem(WORKSPACE_VIEWS_KEY) || "{}");
  views[payload.sessionId] = payload;
  localStorage.setItem(WORKSPACE_VIEWS_KEY, JSON.stringify(views));
}

function saveWorkspaceView() {
  try {
    const payload = workspaceViewPayload();
    storeWorkspaceViewPayload(payload);
  } catch (error) {
    console.warn("No fue posible guardar la vista de trabajo", error);
  }
}

function scheduleWorkspaceSave() {
  clearTimeout(scheduleWorkspaceSave.timer);
  scheduleWorkspaceSave.timer = setTimeout(saveWorkspaceView, 120);
}

function loadWorkspaceView(preferredSessionId = null) {
  try {
    const last = JSON.parse(localStorage.getItem(WORKSPACE_STATE_KEY) || "null");
    const views = JSON.parse(localStorage.getItem(WORKSPACE_VIEWS_KEY) || "{}");
    const desiredId = preferredSessionId || last?.sessionId || state.sessionId;
    const saved = views[desiredId] || (last?.sessionId === desiredId ? last : null);
    if (!saved || saved.schema !== 1) return;
    if (data.sessions.some((session) => session.id === desiredId && (session.master || session.custom))) state.sessionId = desiredId;
    state.selectedIndex = Math.max(0, Number(saved.selectedIndex) || 0);
    state.selectedEventId = saved.selectedEventId || null;
    state.mode = saved.mode === "rehearsal" ? "rehearsal" : "master";
    state.editMode = saved.editMode !== false;
    state.snapMode = saved.snapMode !== false;
    state.snapGrid = ["edges", "beat", "bar", "phrase"].includes(saved.snapGrid) ? saved.snapGrid : "edges";
    state.zoomX = clamp(Number(saved.zoomX) || 1, 1, 12);
    state.zoomY = clamp(Number(saved.zoomY) || 1, 0.75, 4);
    state.liveFx = { ...state.liveFx, ...(saved.liveFx || {}) };
    state.analyzerMode = ["wave", "compressor", "gate", "eq"].includes(saved.analyzerMode) ? saved.analyzerMode : "wave";
    state.productionDockBySession = saved.productionDockBySession && typeof saved.productionDockBySession === "object"
      ? { ...saved.productionDockBySession }
      : {};
    state.laneHeight = clamp(Number(saved.laneHeight) || 48, 40, 96);
    state.leftPanelOpen = saved.leftPanelOpen !== false;
    state.rightPanelOpen = saved.rightPanelOpen !== false;
    state.resumeTime = Math.max(0, Number(saved.audioTime) || 0);
    state.resumeScrollLeft = Math.max(0, Number(saved.scrollLeft) || 0);
    state.sourceOpen = Boolean(saved.sourceOpen);
  } catch (error) {
    console.warn("No fue posible reanudar la vista de trabajo", error);
  }
}

function saveDraft() {
  recordHistorySnapshot();
  const drafts = {};
  data.sessions.filter((session) => session.master || session.custom).forEach((session) => {
    drafts[session.id] = serializeSession(session);
  });
  localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts));
  persistCustomSessions();
  saveWorkspaceView();
  document.querySelectorAll(".draft-status").forEach((label) => label.classList.add("saved"));
}

function updateExactSaveUI() {
  const restoreButton = document.querySelector("#restore-exact-button");
  const status = document.querySelector("#exact-save-status");
  if (!restoreButton || !status) return;
  try {
    const snapshots = readExactSnapshots();
    const saved = snapshots[state.sessionId];
    restoreButton.disabled = !saved?.session;
    status.textContent = saved?.savedAt
      ? `Punto de este proyecto: ${new Date(saved.savedAt).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" })} · autosave activo`
      : "Autosave activo · todavía no hay punto manual";
  } catch (error) {
    restoreButton.disabled = true;
    status.textContent = "Autosave activo · punto manual no disponible";
  }
}

function readExactSnapshots() {
  try {
    const saved = JSON.parse(localStorage.getItem(EXACT_STATE_KEY) || "null");
    if (saved?.schema === 2 && saved.snapshots) {
      return Object.fromEntries(Object.entries(saved.snapshots).filter(([, snapshot]) => snapshot?.projectScoped === true));
    }
    if (saved?.sessions) {
      const id = saved.view?.sessionId;
      if (id && saved.sessions[id]) return { [id]: { projectScoped: true, savedAt: saved.savedAt, session: saved.sessions[id], view: saved.view } };
    }
  } catch (error) {
    console.warn("No fue posible leer los puntos exactos", error);
  }
  return {};
}

function writeExactSnapshots(snapshots) {
  localStorage.setItem(EXACT_STATE_KEY, JSON.stringify({ schema: 2, snapshots }));
}

function saveExactSession() {
  saveDraft();
  const session = currentSession();
  const snapshots = readExactSnapshots();
  snapshots[session.id] = {
    projectScoped: true,
    savedAt: new Date().toISOString(),
    session: serializeSession(session),
    view: workspaceViewPayload(),
  };
  writeExactSnapshots(snapshots);
  updateExactSaveUI();
  showToast(`Punto exacto guardado para ${session.title}`);
}

function restoreExactSession() {
  try {
    const snapshot = readExactSnapshots()[state.sessionId];
    const session = currentSession();
    if (!snapshot?.session?.segments || !session) return;
    session.segments = structuredClone(snapshot.session.segments);
    session.events = structuredClone(snapshot.session.events || []);
    session.duration = snapshot.session.duration;
    applySessionDefaults(session);
    const desiredView = { ...workspaceViewPayload(), ...(snapshot.view || {}), sessionId: session.id, schema: 1 };
    saveDraft();
    storeWorkspaceViewPayload(desiredView);
    loadWorkspaceView(session.id);
    state.selectedIndex = clamp(state.selectedIndex, 0, Math.max(0, currentSession().segments.length - 1));
    renderSessions();
    renderWorkspace();
    restoreWorkspaceViewport();
    showToast("Punto guardado restaurado exactamente");
  } catch (error) {
    console.warn("No fue posible restaurar el punto exacto", error);
    showToast("El punto guardado no pudo recuperarse");
  }
}

function sessionStem(title) {
  return String(title || "proyecto").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "proyecto";
}

function uniqueSessionId(title) {
  const stem = sessionStem(title);
  let candidate = stem;
  let suffix = 2;
  while (data.sessions.some((session) => session.id === candidate)) candidate = `${stem}-${suffix++}`;
  return candidate;
}

function toggleNewSessionForm(force) {
  const form = document.querySelector("#new-session-form");
  const button = document.querySelector("#new-session-button");
  const open = typeof force === "boolean" ? force : form.hidden;
  form.hidden = !open;
  button.setAttribute("aria-expanded", String(open));
  if (open) window.setTimeout(() => document.querySelector("#new-session-name").focus(), 0);
}

function createNewSession(event) {
  event.preventDefault();
  const nameInput = document.querySelector("#new-session-name");
  const title = nameInput.value.trim();
  if (!title) {
    nameInput.focus();
    showToast("Escribe un nombre para el proyecto");
    return;
  }
  const duration = clamp(Number(document.querySelector("#new-session-duration").value) || 180, 30, 1800);
  saveDraft();
  audio.pause();
  stopLivePreview(true);
  closeSourceEditor();
  audio.currentTime = 0;
  const placeholder = data.sessions.find((candidate) => !candidate.master && sessionStem(candidate.title) === sessionStem(title));
  const session = {
    id: placeholder?.id || uniqueSessionId(title),
    title,
    subtitle: "Proyecto personal",
    duration,
    status: "Borrador",
    version: "Sesión local",
    master: "local:",
    rehearsal: "local:",
    waveform: Array.from({ length: 240 }, () => 0.025),
    segments: [],
    events: [],
    changes: ["Proyecto creado · agrega canciones desde tu biblioteca"],
    custom: true,
  };
  applySessionDefaults(session);
  if (placeholder) Object.assign(placeholder, session);
  else data.sessions.push(session);
  state.sessionId = session.id;
  state.selectedIndex = 0;
  state.selectedEventId = null;
  state.resumeTime = 0;
  state.resumeScrollLeft = 0;
  saveDraft();
  toggleNewSessionForm(false);
  nameInput.value = "";
  renderSessions();
  updateExactSaveUI();
  renderWorkspace();
  restoreWorkspaceViewport();
  showToast(`${title} creado · el proyecto anterior sigue guardado`);
}

function packageFilename(title) {
  return `${String(title || "sesion").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "sesion"}.mixshary`;
}

async function fetchSessionSourceBlob(source) {
  if (!source?.file) throw new Error("Fuente sin archivo");
  const response = await fetch(source.file);
  if (!response.ok) throw new Error(`No se pudo leer ${source.name}`);
  return response.blob();
}

async function exportPortableSession() {
  const session = currentSession();
  const overlay = document.querySelector("#render-progress");
  const title = document.querySelector("#render-title");
  const status = document.querySelector("#render-status");
  const sourceKeys = [...new Set(session.segments.map((segment) => segment.sourceKey).filter(Boolean))];
  overlay.classList.add("show");
  title.textContent = "Empaquetando sesión completa";
  status.textContent = "Reuniendo proyecto, marcadores y audios…";
  try {
    const audioParts = [];
    const sources = [];
    let offset = 0;
    for (let index = 0; index < sourceKeys.length; index += 1) {
      const key = sourceKeys[index];
      const source = data.library[key];
      status.textContent = `Incluyendo audio ${index + 1} de ${sourceKeys.length}: ${source?.name || key}`;
      const blob = await fetchSessionSourceBlob(source);
      const extension = blob.type.includes("wav") ? "wav" : blob.type.includes("ogg") ? "ogg" : blob.type.includes("mp4") || blob.type.includes("m4a") ? "m4a" : "mp3";
      sources.push({
        key,
        offset,
        length: blob.size,
        type: blob.type || "audio/mpeg",
        filename: `${source?.artist || "Audio"} - ${source?.name || key}.${extension}`,
        metadata: { name: source?.name || key, artist: source?.artist || "Archivo personal", duration: source?.duration, waveform: source?.waveform || [], bpm: source?.bpm || 120 },
      });
      audioParts.push(blob);
      offset += blob.size;
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
    const manifest = {
      schema: 1,
      app: "Mix Shary",
      exportedAt: new Date().toISOString(),
      session: portableSession(session),
      view: workspaceViewPayload(),
      exact: readExactSnapshots()[session.id] || null,
      sources,
    };
    const encoder = new TextEncoder();
    const manifestBytes = encoder.encode(JSON.stringify(manifest));
    const header = encoder.encode(`${PACKAGE_MAGIC}\n${String(manifestBytes.byteLength).padStart(12, "0")}\n`);
    const file = new Blob([header, manifestBytes, ...audioParts], { type: "application/octet-stream" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(file);
    link.download = packageFilename(session.title);
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 3000);
    showToast(`Sesión empaquetada · ${sources.length} audios incluidos`);
  } catch (error) {
    console.error("No fue posible empaquetar la sesión", error);
    showToast(`No se pudo empaquetar: ${error.message}. Reemplaza las fuentes faltantes y reintenta`);
  } finally {
    overlay.classList.remove("show");
    title.textContent = "Creando master de alta calidad";
  }
}

function remapSessionSources(session, sourceMap) {
  session.segments?.forEach((segment) => {
    if (sourceMap[segment.sourceKey]) segment.sourceKey = sourceMap[segment.sourceKey];
  });
  return session;
}

async function importPortableSession(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  const overlay = document.querySelector("#render-progress");
  const title = document.querySelector("#render-title");
  const status = document.querySelector("#render-status");
  overlay.classList.add("show");
  title.textContent = "Abriendo paquete de sesión";
  status.textContent = "Leyendo estructura y marcadores…";
  try {
    const headerText = await file.slice(0, 23).text();
    const [magic, lengthText] = headerText.split("\n");
    const manifestLength = Number(lengthText);
    if (magic !== PACKAGE_MAGIC || !Number.isInteger(manifestLength) || manifestLength <= 0) throw new Error("El archivo no es un paquete Mix Shary válido");
    const manifestStart = 23;
    const manifest = JSON.parse(await file.slice(manifestStart, manifestStart + manifestLength).text());
    if (manifest.schema !== 1 || !manifest.session?.segments || !Array.isArray(manifest.sources)) throw new Error("La versión del paquete no es compatible");
    const payloadStart = manifestStart + manifestLength;
    const sourceMap = {};
    for (let index = 0; index < manifest.sources.length; index += 1) {
      const packed = manifest.sources[index];
      status.textContent = `Restaurando audio ${index + 1} de ${manifest.sources.length}: ${packed.metadata?.name || packed.filename}`;
      const blob = file.slice(payloadStart + packed.offset, payloadStart + packed.offset + packed.length, packed.type);
      const record = { id: `package-${Date.now()}-${index}-${packed.filename}`, name: packed.filename, type: packed.type, blob, importedAt: new Date().toISOString() };
      await storeImportedFile(record);
      sourceMap[packed.key] = await registerImportedFile(record, false);
    }
    const session = remapSessionSources(structuredClone(manifest.session), sourceMap);
    const originalId = session.id;
    session.id = uniqueSessionId(session.title);
    session.custom = true;
    session.master = "local:";
    session.rehearsal = "local:";
    session.status = "Importado";
    const trackIdMap = {};
    session.segments.forEach((segment, index) => {
      const previousId = segment.id;
      segment.id = `${session.id}-track-${index}-${Date.now()}`;
      if (previousId) trackIdMap[previousId] = segment.id;
    });
    session.events?.forEach((timelineEvent) => {
      if (trackIdMap[timelineEvent.trackId]) timelineEvent.trackId = trackIdMap[timelineEvent.trackId];
    });
    applySessionDefaults(session);
    data.sessions.push(session);
    if (manifest.exact?.session) {
      const snapshots = readExactSnapshots();
      const exactSession = remapSessionSources(structuredClone(manifest.exact.session), sourceMap);
      exactSession.id = session.id;
      exactSession.custom = true;
      exactSession.master = "local:";
      exactSession.rehearsal = "local:";
      exactSession.segments?.forEach((segment, index) => {
        const previousId = segment.id;
        segment.id = session.segments[index]?.id || segment.id;
        if (previousId) trackIdMap[previousId] = segment.id;
      });
      exactSession.events?.forEach((timelineEvent) => {
        if (trackIdMap[timelineEvent.trackId]) timelineEvent.trackId = trackIdMap[timelineEvent.trackId];
      });
      snapshots[session.id] = { ...manifest.exact, projectScoped: true, session: exactSession, view: { ...(manifest.exact.view || {}), sessionId: session.id } };
      writeExactSnapshots(snapshots);
    }
    state.sessionId = session.id;
    const importedView = { ...workspaceViewPayload(), ...(manifest.view || {}), sessionId: session.id, schema: 1 };
    storeWorkspaceViewPayload(importedView);
    loadWorkspaceView(session.id);
    state.selectedIndex = clamp(state.selectedIndex, 0, Math.max(0, session.segments.length - 1));
    saveDraft();
    renderLibrary();
    renderSessions();
    updateExactSaveUI();
    renderWorkspace();
    restoreWorkspaceViewport();
    showToast(`${session.title} restaurado con ${manifest.sources.length} audios · original ${originalId}`);
  } catch (error) {
    console.error("No fue posible abrir el paquete", error);
    showToast(error.message || "No se pudo abrir el paquete de sesión");
  } finally {
    overlay.classList.remove("show");
    title.textContent = "Creando master de alta calidad";
  }
}

function renderSessions() {
  sessionList.innerHTML = "";
  data.sessions.forEach((session, index) => {
    const button = document.createElement("button");
    button.className = `session-item${session.id === state.sessionId ? " active" : ""}`;
    button.disabled = !session.master;
    button.innerHTML = `
      <span class="session-avatar" style="--session-color:${TRACK_COLORS[index % TRACK_COLORS.length]}"><i></i></span>
      <span class="session-copy"><strong>${escapeMarkup(session.title)}</strong><small><i class="session-status"></i>${escapeMarkup(session.status)} · mezcla local</small></span>
      <span class="session-duration">${session.duration ? formatTime(session.duration, false) : "—"}</span>`;
    button.addEventListener("click", () => selectSession(session.id));
    sessionList.appendChild(button);
  });
}

function selectSession(id) {
  if (id === state.sessionId) return;
  saveDraft();
  audio.pause();
  stopLivePreview(true);
  closeSourceEditor();
  state.sessionId = id;
  state.selectedIndex = 0;
  state.selectedEventId = null;
  state.resumeTime = 0;
  state.resumeScrollLeft = 0;
  loadWorkspaceView(id);
  renderSessions();
  updateExactSaveUI();
  renderWorkspace();
  saveWorkspaceView();
}

function setMode(mode) {
  audio.pause();
  stopLivePreview(true);
  state.mode = mode;
  document.querySelectorAll(".mode").forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === mode);
  });
  loadAudio(true);
  updateEditSummary();
  saveWorkspaceView();
}

function loadAudio(reset = true) {
  const session = currentSession();
  const source = state.mode === "master" ? session.master : session.rehearsal;
  if (reset) audio.currentTime = 0;
  stopLivePreview(true);
  if (IS_PUBLIC_HOST || session.custom) audio.src = silentTransportUrl(session.duration);
  else audio.src = source;
  audio.volume = Number(document.querySelector("#volume-slider").value);
  if (IS_PUBLIC_HOST || session.custom) {
    downloadLink.removeAttribute("href");
    downloadLink.removeAttribute("download");
    downloadLink.textContent = "Audio local";
    downloadLink.title = "Las canciones privadas se cargan desde tu navegador";
  } else {
    downloadLink.href = source;
    downloadLink.download = source.split("/").pop();
  }
  playButton.classList.remove("playing");
  updatePlayhead();
}

function restoreWorkspaceViewport() {
  zoomXInput.value = String(state.zoomX);
  zoomYInput.value = String(state.zoomY);
  document.querySelector("#snap-grid-select").value = state.snapGrid;
  const snapButton = document.querySelector("#snap-button");
  snapButton.classList.toggle("active", state.snapMode);
  snapButton.setAttribute("aria-pressed", String(state.snapMode));
  snapButton.textContent = state.snapMode ? "Imán activo" : "Imán libre";
  editModeButton.classList.toggle("active", state.editMode);
  editModeButton.setAttribute("aria-pressed", String(state.editMode));
  document.querySelectorAll(".mode").forEach((button) => button.classList.toggle("active", button.dataset.mode === state.mode));
  updateLiveFxConsole();
  syncProductionDock();
  applyTimelineZoom({ preserveAnchor: false });
  const restoreTime = () => {
    audio.currentTime = clamp(state.resumeTime, 0, currentSession().duration);
    updatePlayhead();
  };
  if (audio.readyState >= 1) restoreTime();
  else audio.addEventListener("loadedmetadata", restoreTime, { once: true });
  requestAnimationFrame(() => {
    const maximum = Math.max(0, laneContent.getBoundingClientRect().width - laneStack.clientWidth);
    const left = clamp(state.resumeScrollLeft, 0, maximum);
    laneStack.scrollLeft = left;
    waveformWrap.scrollLeft = left;
    if (state.sourceOpen) openSourceEditor();
  });
  updateHistoryUI();
  updateExactSaveUI();
}

function productionDockIsOpen() {
  return state.productionDockBySession[state.sessionId] === true;
}

function syncProductionDock() {
  const dock = document.querySelector("#production-dock");
  const toggle = document.querySelector("#production-dock-toggle");
  const label = document.querySelector("#production-dock-state");
  const body = document.querySelector("#production-dock-body");
  if (!dock || !toggle || !label || !body) return;
  const open = productionDockIsOpen();
  dock.classList.toggle("collapsed", !open);
  toggle.setAttribute("aria-expanded", String(open));
  body.inert = !open;
  body.setAttribute("aria-hidden", String(!open));
  label.textContent = open ? "Ocultar" : "Abrir";
  toggle.title = `${open ? "Ocultar" : "Abrir"} consola · Atajo: Mayús + P`;
}

function toggleProductionDock(force) {
  const next = typeof force === "boolean" ? force : !productionDockIsOpen();
  state.productionDockBySession[state.sessionId] = next;
  syncProductionDock();
  saveWorkspaceView();
  window.setTimeout(() => {
    applyTimelineZoom({ preserveAnchor: true });
    drawWaveform();
  }, 240);
}

function updateEditSummary() {
  const label = state.editMode ? (canLivePreview() ? "edición directa · preescucha en vivo" : "edición directa") : "edición bloqueada";
  document.querySelector("#edit-summary").textContent = `${currentSession().segments.length} bloques · ${label}`;
  document.querySelector(".hint").textContent = state.editMode
    ? "Asa de puntos: ordena pistas · bloque: mueve en el tiempo · bordes: recortan"
    : "Edición bloqueada · usa la forma de onda para escuchar";
}

function formatZoom(value) {
  return `${Number(value).toFixed(Number(value) % 1 ? 2 : 0).replace(/0$/, "")}×`;
}

function setTimelineContentWidth() {
  const viewportWidth = Math.max(1, waveformWrap.clientWidth);
  const contentWidth = Math.max(viewportWidth, Math.round(viewportWidth * state.zoomX));
  waveformContent.style.width = `${contentWidth}px`;
  laneContent.style.width = `${contentWidth}px`;
  document.querySelector("#zoom-x-value").textContent = formatZoom(state.zoomX);
  document.querySelector("#timeline-zoom-value").textContent = formatZoom(state.zoomX);
  document.querySelector("#timeline-height-value").textContent = `${Math.round(state.laneHeight)}px`;
  document.querySelector("#zoom-y-value").textContent = formatZoom(state.zoomY);
  document.documentElement.style.setProperty("--lane-height", `${state.laneHeight}px`);
}

function setTimelineZoom(value, { preserveAnchor = true } = {}) {
  state.zoomX = clamp(Number(value) || 1, 1, 12);
  zoomXInput.value = String(state.zoomX);
  applyTimelineZoom({ preserveAnchor });
  scheduleWorkspaceSave();
}

function setLaneHeight(value) {
  state.laneHeight = clamp(Number(value) || 48, 40, 96);
  document.documentElement.style.setProperty("--lane-height", `${state.laneHeight}px`);
  document.querySelector("#timeline-height-value").textContent = `${Math.round(state.laneHeight)}px`;
  scheduleWorkspaceSave();
}

function syncSidePanels() {
  const shell = document.querySelector(".app-shell");
  const leftButton = document.querySelector("#toggle-sidebar");
  const rightButton = document.querySelector("#toggle-inspector");
  shell.classList.toggle("left-collapsed", !state.leftPanelOpen);
  shell.classList.toggle("right-collapsed", !state.rightPanelOpen);
  leftButton.setAttribute("aria-pressed", String(state.leftPanelOpen));
  rightButton.setAttribute("aria-pressed", String(state.rightPanelOpen));
  leftButton.title = `${state.leftPanelOpen ? "Ocultar" : "Mostrar"} sesiones y biblioteca`;
  rightButton.title = `${state.rightPanelOpen ? "Ocultar" : "Mostrar"} inspector`;
  requestAnimationFrame(() => applyTimelineZoom({ preserveAnchor: true }));
}

function applyTimelineZoom({ preserveAnchor = true } = {}) {
  const session = currentSession();
  const oldWidth = Math.max(1, laneContent.getBoundingClientRect().width);
  const anchorTime = audio.currentTime > 0.01 ? audio.currentTime : (selectedSegment()?.start || 0);
  const anchorRatio = clamp(anchorTime / session.duration, 0, 1);
  const anchorScreenX = anchorRatio * oldWidth - laneStack.scrollLeft;
  setTimelineContentWidth();
  requestAnimationFrame(() => {
    const newWidth = Math.max(1, laneContent.getBoundingClientRect().width);
    const targetScroll = preserveAnchor ? anchorRatio * newWidth - anchorScreenX : laneStack.scrollLeft;
    const maximum = Math.max(0, newWidth - laneStack.clientWidth);
    const scroll = clamp(targetScroll, 0, maximum);
    laneStack.scrollLeft = scroll;
    waveformWrap.scrollLeft = scroll;
    renderRuler();
    renderBeatGrid();
    renderAutomationEvents();
    drawWaveform();
    updatePlayhead();
    updateTrackNavViewport();
  });
}

function renderWorkspace() {
  const session = currentSession();
  document.querySelector("#project-name").textContent = data.project;
  document.querySelector("#session-title").textContent = session.title;
  document.querySelector("#session-subtitle").textContent = session.subtitle;
  document.querySelector("#version-badge").textContent = session.version;
  document.querySelector("#ready-state").textContent = session.status;
  totalTimeLabel.textContent = formatTime(session.duration);
  setTimelineContentWidth();
  updateEditSummary();
  renderTimeline();
  renderInspector();
  renderTrackNavigator();
  updateTransitionReadout();
  updateLiveFxConsole();
  syncSidePanels();
  renderChanges();
  loadAudio();
  requestAnimationFrame(drawWaveform);
}

let draggedTrackId = null;

function reorderTrack(trackId, targetIndex, placeAfter = false) {
  const session = currentSession();
  const fromIndex = session.segments.findIndex((segment) => segment.id === trackId);
  if (fromIndex < 0) return;
  const selectedId = selectedSegment()?.id;
  let insertionIndex = targetIndex + (placeAfter ? 1 : 0);
  const [moved] = session.segments.splice(fromIndex, 1);
  if (fromIndex < insertionIndex) insertionIndex -= 1;
  insertionIndex = clamp(insertionIndex, 0, session.segments.length);
  session.segments.splice(insertionIndex, 0, moved);
  state.selectedIndex = Math.max(0, session.segments.findIndex((segment) => segment.id === selectedId));
  saveDraft();
  renderTimeline();
  renderInspector();
  showToast(`${moved.name} ahora está en la posición ${insertionIndex + 1}`);
}

function bindTrackOrderTarget(element, index, axis = "y") {
  const isAfter = (event) => {
    const rect = element.getBoundingClientRect();
    return axis === "x" ? event.clientX > rect.left + rect.width / 2 : event.clientY > rect.top + rect.height / 2;
  };
  element.addEventListener("dragover", (event) => {
    if (!draggedTrackId) return;
    event.preventDefault();
    const after = isAfter(event);
    element.classList.toggle("drop-after", after);
    element.classList.toggle("drop-before", !after);
  });
  element.addEventListener("dragleave", () => element.classList.remove("drop-before", "drop-after"));
  element.addEventListener("drop", (event) => {
    event.preventDefault();
    const after = isAfter(event);
    element.classList.remove("drop-before", "drop-after");
    reorderTrack(draggedTrackId || event.dataTransfer.getData("text/plain"), index, after);
    draggedTrackId = null;
  });
}

function startTrackOrderDrag(event, segment, element) {
  draggedTrackId = segment.id;
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", segment.id);
  requestAnimationFrame(() => element.classList.add("dragging"));
}

function updateTrackNavViewport() {
  const viewport = document.querySelector("#track-nav-map .track-nav-viewport");
  if (!viewport) return;
  const scrollWidth = Math.max(1, laneStack.scrollWidth);
  const visibleRatio = clamp(laneStack.clientWidth / scrollWidth, 0, 1);
  const leftRatio = clamp(laneStack.scrollLeft / scrollWidth, 0, 1 - visibleRatio);
  viewport.style.width = `${visibleRatio * 100}%`;
  viewport.style.left = `${leftRatio * 100}%`;
  viewport.classList.toggle("inactive", visibleRatio > 0.995);
}

function renderTrackNavigator() {
  const session = currentSession();
  const select = document.querySelector("#track-select");
  const map = document.querySelector("#track-nav-map");
  const loudnessStatus = document.querySelector("#loudness-status");
  if (!select || !map) return;
  state.selectedIndex = clamp(state.selectedIndex, 0, Math.max(0, session.segments.length - 1));
  select.innerHTML = session.segments.map((segment, index) => `<option value="${index}"${index === state.selectedIndex ? " selected" : ""}>${index + 1}. ${segment.name}</option>`).join("");
  map.innerHTML = "";
  session.segments.forEach((segment, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = index === state.selectedIndex ? "active" : "";
    button.style.setProperty("--track-color", segment.color || colorForSegment(segment));
    button.style.flexGrow = Math.max(1, segment.end - segment.start);
    button.draggable = true;
    button.dataset.trackOrder = String(index);
    button.title = `${index + 1}. ${segment.name} · ${formatTime(segment.start)}–${formatTime(segment.end)}`;
    button.setAttribute("aria-label", `Ir a ${segment.name}`);
    button.addEventListener("click", () => selectTrackIndex(index));
    button.addEventListener("dragstart", (event) => startTrackOrderDrag(event, segment, button));
    button.addEventListener("dragend", () => {
      draggedTrackId = null;
      button.classList.remove("dragging");
      map.querySelectorAll(".drop-before, .drop-after").forEach((item) => item.classList.remove("drop-before", "drop-after"));
    });
    bindTrackOrderTarget(button, index, "x");
    map.appendChild(button);
  });
  const viewport = document.createElement("span");
  viewport.className = "track-nav-viewport";
  viewport.title = "Arrastra para navegar por la parte ampliada de la línea de tiempo";
  viewport.addEventListener("pointerdown", (event) => {
    if (viewport.classList.contains("inactive")) return;
    event.preventDefault();
    const startX = event.clientX;
    const startScroll = laneStack.scrollLeft;
    const mapWidth = Math.max(1, map.getBoundingClientRect().width);
    viewport.setPointerCapture(event.pointerId);
    const move = (moveEvent) => {
      const maximum = Math.max(0, laneStack.scrollWidth - laneStack.clientWidth);
      const next = clamp(startScroll + ((moveEvent.clientX - startX) / mapWidth) * laneStack.scrollWidth, 0, maximum);
      laneStack.scrollLeft = next;
      waveformWrap.scrollLeft = next;
      updateTrackNavViewport();
    };
    const end = () => {
      viewport.removeEventListener("pointermove", move);
      viewport.removeEventListener("pointerup", end);
      viewport.removeEventListener("pointercancel", end);
      scheduleWorkspaceSave();
    };
    viewport.addEventListener("pointermove", move);
    viewport.addEventListener("pointerup", end);
    viewport.addEventListener("pointercancel", end);
  });
  map.appendChild(viewport);
  document.querySelector("#track-nav-position").textContent = `${state.selectedIndex + 1} de ${session.segments.length}`;
  document.querySelector("#track-previous-button").disabled = state.selectedIndex <= 0;
  document.querySelector("#track-next-button").disabled = state.selectedIndex >= session.segments.length - 1;
  if (loudnessStatus) {
    const matched = session.segments.filter((segment) => segment.loudness).length;
    const target = session.segments.find((segment) => segment.loudness)?.loudness?.targetDb;
    loudnessStatus.textContent = matched && Number.isFinite(target)
      ? `${matched}/${session.segments.length} · ${target.toFixed(1)} dB`
      : "Auto Gain";
  }
  requestAnimationFrame(updateTrackNavViewport);
}

function centerSelectedTrack() {
  const segment = selectedSegment();
  if (!segment) return;
  const contentWidth = Math.max(1, laneContent.getBoundingClientRect().width);
  const target = (segment.start / currentSession().duration) * contentWidth - laneStack.clientWidth * 0.35;
  const scrollLeft = clamp(target, 0, Math.max(0, contentWidth - laneStack.clientWidth));
  laneStack.scrollTo({ left: scrollLeft, behavior: "smooth" });
  waveformWrap.scrollTo({ left: scrollLeft, behavior: "smooth" });
}

function selectTrackIndex(index, { center = true } = {}) {
  const session = currentSession();
  state.selectedIndex = clamp(Number(index) || 0, 0, Math.max(0, session.segments.length - 1));
  renderTimelineSelection();
  renderInspector();
  renderBeatGrid();
  renderTrackNavigator();
  updateTransitionReadout();
  if (state.sourceOpen) openSourceEditor();
  if (center) centerSelectedTrack();
  saveWorkspaceView();
}

function positionClip(clip, segment) {
  const session = currentSession();
  normalizeFades(segment);
  clip.style.setProperty("--track-color", segment.color || colorForSegment(segment));
  clip.style.setProperty("--section-strength", `${Math.round(16 + clamp(Number(segment.sectionIntensity) || 0.35, 0, 1) * 34)}%`);
  clip.style.left = `${(segment.start / session.duration) * 100}%`;
  clip.style.width = `${Math.max(0.15, ((segment.end - segment.start) / session.duration) * 100)}%`;
  const small = clip.querySelector("small");
  if (small) small.textContent = `${formatTime(segment.start, false)}–${formatTime(segment.end, false)} · ${segment.bpm || 120} BPM · ${segment.gainDb >= 0 ? "+" : ""}${segment.gainDb.toFixed(1)} dB`;
  const section = clip.querySelector(".clip-section");
  if (section) section.textContent = segment.sectionLabel ? `${segment.sectionLabel} · ${Math.round((segment.sectionIntensity || 0.5) * 100)}%` : "";
  const duration = Math.max(0.01, segment.end - segment.start);
  const fadeInPercent = (segment.fadeIn / duration) * 100;
  const fadeOutPercent = (segment.fadeOut / duration) * 100;
  const fadeInCurve = clip.querySelector('[data-fade-curve="in"]');
  const fadeOutCurve = clip.querySelector('[data-fade-curve="out"]');
  const fadeInHandle = clip.querySelector('[data-fade="in"]');
  const fadeOutHandle = clip.querySelector('[data-fade="out"]');
  if (fadeInCurve) fadeInCurve.style.width = `${fadeInPercent}%`;
  if (fadeOutCurve) fadeOutCurve.style.width = `${fadeOutPercent}%`;
  if (fadeInHandle) {
    fadeInHandle.style.left = `${fadeInPercent}%`;
    fadeInHandle.title = `Fade in ${segment.fadeIn.toFixed(2)} s`;
  }
  if (fadeOutHandle) {
    fadeOutHandle.style.right = `${fadeOutPercent}%`;
    fadeOutHandle.title = `Fade out ${segment.fadeOut.toFixed(2)} s`;
  }
  const fadeInLabel = clip.querySelector('[data-fade-label="in"]');
  const fadeOutLabel = clip.querySelector('[data-fade-label="out"]');
  if (fadeInLabel) fadeInLabel.textContent = `IN ${segment.fadeIn.toFixed(2)}s`;
  if (fadeOutLabel) fadeOutLabel.textContent = `OUT ${segment.fadeOut.toFixed(2)}s`;
}

function beatSeconds(segment = selectedSegment()) {
  return 60 / clamp(Number(segment?.bpm) || 120, 50, 220);
}

function renderBeatGrid() {
  const session = currentSession();
  const segment = selectedSegment();
  beatGrid.innerHTML = "";
  if (!segment || state.snapGrid === "edges") return;
  const beat = beatSeconds(segment);
  const multiplier = state.snapGrid === "phrase" ? 8 : state.snapGrid === "bar" ? 4 : 1;
  const step = beat * multiplier;
  const timelineAnchor = segment.start + beatAnchorFor(segment) - segment.sourceIn;
  const firstLine = timelineAnchor + Math.ceil((0 - timelineAnchor) / step) * step;
  const fragment = document.createDocumentFragment();
  for (let time = firstLine; time <= session.duration; time += step) {
    const line = document.createElement("i");
    const gridIndex = Math.round((time - timelineAnchor) / beat);
    line.className = `beat-line${multiplier > 1 || gridIndex % 4 === 0 ? " bar" : ""}`;
    line.style.left = `${(time / session.duration) * 100}%`;
    fragment.appendChild(line);
  }
  beatGrid.appendChild(fragment);
}

function eventTimeFromCursor() {
  const segment = selectedSegment();
  if (audio.currentTime > 0.05) return roundTime(audio.currentTime);
  return roundTime(clamp((segment?.end || 0) - 0.5, 0, currentSession().duration));
}

function addTimelineEvent(type, options = {}) {
  const definition = EVENT_TYPES[type];
  if (!definition) return;
  const session = currentSession();
  const segment = options.segment || selectedSegment();
  const duration = Number.isFinite(options.duration) ? options.duration : definition.duration;
  const time = options.atEnd && segment
    ? roundTime(clamp(segment.end - Math.max(0.05, duration), segment.start, segment.end))
    : eventTimeFromCursor();
  const event = {
    id: `event-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    label: options.label || definition.label,
    time,
    duration,
    amount: 0.78,
    trackId: segment?.id || null,
    params: { ...defaultEventParams(type), ...(options.params || {}) },
  };
  session.events.push(event);
  state.selectedEventId = event.id;
  saveDraft();
  renderAutomationEvents();
  renderEventEditor();
  showToast(`${event.label} · solo ${segment?.name || "el mix"} · ${formatTime(event.time)}`);
  return event;
}

function addEndTrackEffect(preset) {
  const segment = selectedSegment();
  if (!segment) return;
  const optionsByPreset = {
    echo: { type: "echo", duration: 1.5, label: "Echo out" },
    delay: { type: "echo", duration: 2, label: "Delay 1/4", params: { delayBeats: 1, mix: 0.48, feedback: 0.34 } },
    lowpass: { type: "filter", duration: 2, label: "Cierre LPF", params: { filterMode: "lowpass", startHz: 18000, endHz: 420, resonance: 1.2 } },
    highpass: { type: "filter", duration: 2, label: "Subida HPF", params: { filterMode: "highpass", startHz: 20, endHz: 9000, resonance: 1.4 } },
    dip: { type: "dip", duration: 0.35, label: "Cut final" },
  };
  const presetOptions = optionsByPreset[preset];
  if (!presetOptions) return;
  addTimelineEvent(presetOptions.type, { ...presetOptions, atEnd: true, segment });
  renderInspector();
}

function selectedEvent() {
  return currentSession().events.find((event) => event.id === state.selectedEventId) || null;
}

function startEventDrag(pointerEvent, event, marker) {
  if (pointerEvent.button !== 0) return;
  pointerEvent.preventDefault();
  pointerEvent.stopPropagation();
  const startX = pointerEvent.clientX;
  const initialTime = event.time;
  const width = waveformContent.getBoundingClientRect().width;
  marker.setPointerCapture(pointerEvent.pointerId);
  const move = (moveEvent) => {
    const delta = ((moveEvent.clientX - startX) / width) * currentSession().duration;
    event.time = roundTime(clamp(initialTime + delta, 0, currentSession().duration));
    marker.style.left = `${(event.time / currentSession().duration) * 100}%`;
    const owner = currentSession().segments.find((segment) => segment.id === event.trackId);
    marker.title = `${EVENT_TYPES[event.type].label} · ${owner?.name || "Mix"} · ${formatTime(event.time)}`;
    renderEventEditor();
  };
  const end = () => {
    marker.removeEventListener("pointermove", move);
    marker.removeEventListener("pointerup", end);
    marker.removeEventListener("pointercancel", end);
    saveDraft();
  };
  marker.addEventListener("pointermove", move);
  marker.addEventListener("pointerup", end);
  marker.addEventListener("pointercancel", end);
}

function renderAutomationEvents() {
  const session = currentSession();
  automationEvents.innerHTML = "";
  session.events.sort((a, b) => a.time - b.time).forEach((event) => {
    const definition = EVENT_TYPES[event.type];
    const marker = document.createElement("button");
    marker.type = "button";
    marker.className = `event-marker${event.id === state.selectedEventId ? " selected" : ""}`;
    marker.dataset.short = definition.short;
    marker.style.left = `${(event.time / session.duration) * 100}%`;
    marker.style.setProperty("--event-color", definition.color);
    const owner = session.segments.find((segment) => segment.id === event.trackId);
    marker.title = `${definition.label} · ${owner?.name || "Mix"} · ${formatTime(event.time)}`;
    marker.setAttribute("aria-label", marker.title);
    marker.addEventListener("click", (clickEvent) => {
      clickEvent.stopPropagation();
      state.selectedEventId = event.id;
      seekTo(event.time);
      renderAutomationEvents();
      renderEventEditor();
    });
    marker.addEventListener("pointerdown", (pointerEvent) => startEventDrag(pointerEvent, event, marker));
    automationEvents.appendChild(marker);
  });
  document.querySelector("#event-count").textContent = `${session.events.length} ${session.events.length === 1 ? "evento" : "eventos"}`;
}

function renderEventEditor() {
  const event = selectedEvent();
  if (!event) {
    eventEditor.innerHTML = "<p>Agrega CUE, ECHO, FILTER, DIP o graba movimientos desde la consola FX.</p>";
    return;
  }
  const definition = EVENT_TYPES[event.type];
  const owner = currentSession().segments.find((segment) => segment.id === event.trackId);
  eventEditor.innerHTML = `
    <div class="event-editor-title" style="--event-color:${definition.color}"><i></i><strong>${definition.label}</strong><span>Solo pista · ${owner?.name || "evento antiguo del mix"}</span></div>
    <div class="event-editor-fields">
      <label>Posición<input data-event-input="time" type="number" min="0" max="${currentSession().duration}" step="0.01" value="${event.time.toFixed(2)}"></label>
      <label>Duración<input data-event-input="duration" type="number" min="0" max="8" step="0.05" value="${event.duration.toFixed(2)}"${event.type === "cue" ? " disabled" : ""}></label>
      <label>Intensidad<input data-event-input="amount" type="number" min="0" max="1" step="0.05" value="${event.amount.toFixed(2)}"></label>
      <label>Atajo visual<input data-event-input="label" type="text" value="${event.label.replace(/"/g, "&quot;")}"></label>
      ${eventParameterFields(event)}
    </div>
    <button class="event-remove" type="button">Quitar este evento</button>`;
  eventEditor.querySelectorAll("[data-event-input]").forEach((input) => input.addEventListener("change", (changeEvent) => {
    const key = changeEvent.target.dataset.eventInput;
    if (key === "label") event.label = changeEvent.target.value.trim() || definition.label;
    else if (key === "time") event.time = roundTime(clamp(Number(changeEvent.target.value) || 0, 0, currentSession().duration));
    else if (key === "duration") event.duration = roundTime(clamp(Number(changeEvent.target.value) || 0, 0, 8));
    else event.amount = clamp(Number(changeEvent.target.value) || 0, 0, 1);
    saveDraft();
    renderAutomationEvents();
    renderEventEditor();
  }));
  eventEditor.querySelectorAll("[data-event-param]").forEach((input) => input.addEventListener("change", (changeEvent) => {
    const key = changeEvent.target.dataset.eventParam;
    event.params ||= defaultEventParams(event.type);
    event.params[key] = changeEvent.target.tagName === "SELECT" ? changeEvent.target.value : Number(changeEvent.target.value);
    saveDraft();
    renderEventEditor();
  }));
  eventEditor.querySelector(".event-remove").addEventListener("click", () => {
    currentSession().events = currentSession().events.filter((candidate) => candidate.id !== event.id);
    state.selectedEventId = null;
    saveDraft();
    renderAutomationEvents();
    renderEventEditor();
    renderInspector();
    showToast("Evento quitado; las pistas no fueron modificadas");
  });
}

function eventParameterFields(event) {
  const params = { ...defaultEventParams(event.type), ...(event.params || {}) };
  if (event.type === "echo") return `
    <label>División<select data-event-param="delayBeats"><option value="0.25"${params.delayBeats === 0.25 ? " selected" : ""}>1/16</option><option value="0.5"${params.delayBeats === 0.5 ? " selected" : ""}>1/8</option><option value="0.75"${params.delayBeats === 0.75 ? " selected" : ""}>1/8 puntillo</option><option value="1"${params.delayBeats === 1 ? " selected" : ""}>1/4</option><option value="2"${params.delayBeats === 2 ? " selected" : ""}>1/2</option></select></label>
    <label>Feedback<input data-event-param="feedback" type="number" min="0" max="0.86" step="0.01" value="${params.feedback}"></label>
    <label>Mezcla<input data-event-param="mix" type="number" min="0" max="1" step="0.01" value="${params.mix}"></label>`;
  if (event.type === "filter") return `
    <label>Tipo<select data-event-param="filterMode"><option value="lowpass"${params.filterMode === "lowpass" ? " selected" : ""}>Pasa bajo</option><option value="highpass"${params.filterMode === "highpass" ? " selected" : ""}>Pasa alto</option></select></label>
    <label>Inicio Hz<input data-event-param="startHz" type="number" min="20" max="20000" step="10" value="${params.startHz}"></label>
    <label>Final Hz<input data-event-param="endHz" type="number" min="20" max="20000" step="10" value="${params.endHz}"></label>
    <label>Resonancia<input data-event-param="resonance" type="number" min="0.1" max="18" step="0.1" value="${params.resonance}"></label>`;
  if (event.type === "fx") return `
    <label>HPF Hz<input data-event-param="highpass" type="number" min="20" max="18000" step="10" value="${params.highpass}"></label>
    <label>LPF Hz<input data-event-param="lowpass" type="number" min="80" max="20000" step="10" value="${params.lowpass}"></label>
    <label>Echo mix<input data-event-param="mix" type="number" min="0" max="1" step="0.01" value="${params.mix}"></label>
    <label>Feedback<input data-event-param="feedback" type="number" min="0" max="0.86" step="0.01" value="${params.feedback}"></label>`;
  return "";
}

function renderTimeline() {
  const session = currentSession();
  setTimelineContentWidth();
  laneStack.classList.toggle("editing", state.editMode);
  laneStack.querySelectorAll(".lane-row").forEach((row) => row.remove());
  const fragment = document.createDocumentFragment();
  session.segments.forEach((segment, index) => {
    const row = document.createElement("div");
    row.className = "lane-row";
    const clip = document.createElement("button");
    clip.className = `clip${index === state.selectedIndex ? " selected" : ""}${segment.muted ? " muted" : ""}${segment.solo ? " solo" : ""}${segment.fx.enabled === false ? " fx-bypassed" : ""}`;
    clip.dataset.index = index;
    clip.innerHTML = `
      <span class="trim-handle left" data-trim="left"></span>
      <span class="fade-curve fade-curve-in" data-fade-curve="in"><svg viewBox="0 0 100 30" preserveAspectRatio="none"><path d="M0 29 C18 29 52 6 100 2"/></svg></span>
      <span class="fade-curve fade-curve-out" data-fade-curve="out"><svg viewBox="0 0 100 30" preserveAspectRatio="none"><path d="M0 2 C48 6 82 29 100 29"/></svg></span>
      <span class="fade-handle fade-handle-in" data-fade="in" aria-label="Ajustar fade in"></span>
      <span class="fade-handle fade-handle-out" data-fade="out" aria-label="Ajustar fade out"></span>
      <strong>${escapeMarkup(segment.name)}</strong>
      <small></small>
      <span class="clip-section"></span>
      <span class="fade-label fade-label-in" data-fade-label="in"></span>
      <span class="fade-label fade-label-out" data-fade-label="out"></span>
      <span class="trim-handle right" data-trim="right"></span>`;
    positionClip(clip, segment);
    clip.addEventListener("click", (event) => selectClip(event, index));
    clip.addEventListener("dblclick", (event) => {
      event.stopPropagation();
      state.selectedIndex = index;
      renderTimelineSelection();
      renderInspector();
      openSourceEditor();
    });
    clip.addEventListener("pointerdown", (event) => startTimelineDrag(event, index, clip));
    row.appendChild(clip);
    fragment.appendChild(row);
  });
  laneContent.insertBefore(fragment, playhead);
  renderTrackControls();
  renderRuler();
  renderBeatGrid();
  renderAutomationEvents();
  renderEventEditor();
  renderTrackNavigator();
  requestAnimationFrame(drawWaveform);
}

function renderTrackControls() {
  const session = currentSession();
  trackControlRail.innerHTML = '<div class="track-rail-spacer"><span>PISTAS</span><small>M · S · FX · VOL</small></div>';
  const list = document.createElement("div");
  list.className = "track-control-list";
  session.segments.forEach((segment, index) => {
    const row = document.createElement("div");
    row.className = `track-control-row${index === state.selectedIndex ? " selected" : ""}${segment.muted ? " muted" : ""}${segment.solo ? " solo" : ""}${segment.loudness ? " level-matched" : ""}`;
    row.style.setProperty("--track-color", segment.color || colorForSegment(segment));
    row.dataset.trackOrder = String(index);
    row.innerHTML = `
      <button class="track-order-handle" type="button" draggable="true" aria-label="Reordenar ${segment.name}" title="Arrastra para cambiar el orden · Alt + ↑/↓"><span></span><span></span><span></span></button>
      <button class="track-identity" type="button" data-track-select="${index}" title="${segment.name}"><i></i><span>${String(index + 1).padStart(2, "0")}</span></button>
      <button class="track-switch mute" type="button" data-track-action="mute" data-track-index="${index}" aria-pressed="${segment.muted}" title="Mutear ${segment.name}">M</button>
      <button class="track-switch solo" type="button" data-track-action="solo" data-track-index="${index}" aria-pressed="${segment.solo}" title="Dejar ${segment.name} en solo">S</button>
      <button class="track-switch fx" type="button" data-track-action="fx" data-track-index="${index}" aria-pressed="${segment.fx.enabled !== false}" title="Activar o puentear efectos de ${segment.name}">FX</button>
      <label class="track-gain" title="${segment.loudness ? `Nivel medido ${segment.loudness.rmsDb.toFixed(1)} dB RMS · Auto Gain aplicado` : `Volumen independiente de ${segment.name}`}"><input data-track-gain="${index}" type="range" min="-24" max="12" step="0.5" value="${segment.gainDb}"><output>${segment.gainDb >= 0 ? "+" : ""}${segment.gainDb.toFixed(1)}</output></label>`;
    const handle = row.querySelector(".track-order-handle");
    handle.addEventListener("dragstart", (event) => startTrackOrderDrag(event, segment, row));
    handle.addEventListener("dragend", () => {
      draggedTrackId = null;
      row.classList.remove("dragging");
      list.querySelectorAll(".drop-before, .drop-after").forEach((item) => item.classList.remove("drop-before", "drop-after"));
    });
    handle.addEventListener("keydown", (event) => {
      if (!event.altKey || !["ArrowUp", "ArrowDown"].includes(event.key)) return;
      event.preventDefault();
      reorderTrack(segment.id, clamp(index + (event.key === "ArrowDown" ? 1 : -1), 0, session.segments.length - 1), event.key === "ArrowDown");
    });
    bindTrackOrderTarget(row, index);
    list.appendChild(row);
  });
  trackControlRail.appendChild(list);
  trackControlRail.scrollTop = laneStack.scrollTop;
}

async function refreshLivePreview() {
  if (!audio.paused && canLivePreview()) await startLivePreview();
}

function updateTrackMonitoring(index, action) {
  const segment = currentSession().segments[index];
  if (!segment) return;
  state.selectedIndex = index;
  if (action === "mute") segment.muted = !segment.muted;
  if (action === "solo") segment.solo = !segment.solo;
  if (action === "fx") segment.fx.enabled = segment.fx.enabled === false;
  saveDraft();
  renderTimeline();
  renderInspector();
  drawWaveform();
  refreshLivePreview();
  const label = action === "mute" ? (segment.muted ? "muteada" : "activa") : action === "solo" ? (segment.solo ? "en solo" : "fuera de solo") : (segment.fx.enabled === false ? "FX puenteados" : "FX activos");
  showToast(`${segment.name}: ${label}`);
}

function selectClip(event, index) {
  event.stopPropagation();
  if (!state.editMode) audio.currentTime = currentSession().segments[index].start;
  selectTrackIndex(index, { center: false });
}

function snapClipStart(value, index) {
  if (!state.snapMode) return value;
  const segment = currentSession().segments[index];
  if (state.snapGrid !== "edges") {
    const multiplier = state.snapGrid === "phrase" ? 8 : state.snapGrid === "bar" ? 4 : 1;
    const grid = beatSeconds(segment) * multiplier;
    return roundTime(Math.round(value / grid) * grid);
  }
  const duration = segment.end - segment.start;
  const targets = currentSession().segments
    .filter((_, candidateIndex) => candidateIndex !== index)
    .flatMap((candidate) => [candidate.start, candidate.end, candidate.start - duration, candidate.end - duration]);
  let nearest = value;
  let distance = 0.65;
  targets.forEach((target) => {
    const currentDistance = Math.abs(value - target);
    if (currentDistance < distance) {
      distance = currentDistance;
      nearest = target;
    }
  });
  return roundTime(nearest);
}

function startTimelineDrag(event, index, clip) {
  if (!state.editMode || event.button !== 0) return;
  event.preventDefault();
  event.stopPropagation();
  audio.pause();
  state.selectedIndex = index;
  renderTimelineSelection();
  renderInspector();
  const segment = currentSession().segments[index];
  const source = sourceFor(segment);
  const fadeTarget = event.target.closest("[data-fade]");
  const trimTarget = event.target.closest("[data-trim]");
  const action = fadeTarget ? `fade-${fadeTarget.dataset.fade}` : trimTarget?.dataset.trim || "move";
  const initial = { ...segment };
  const startX = event.clientX;
  const width = laneContent.getBoundingClientRect().width;
  clip.setPointerCapture(event.pointerId);

  const move = (moveEvent) => {
    const delta = ((moveEvent.clientX - startX) / width) * currentSession().duration;
    if (action === "move") {
      const limited = clamp(delta, -initial.start, currentSession().duration - initial.end);
      const nextStart = clamp(snapClipStart(roundTime(initial.start + limited), index), 0, currentSession().duration - (initial.end - initial.start));
      segment.start = nextStart;
      segment.end = roundTime(nextStart + initial.end - initial.start);
    } else if (action === "fade-in") {
      const maximum = Math.min(8, (initial.end - initial.start) / 2);
      segment.fadeIn = roundTime(clamp(initial.fadeIn + delta, 0, maximum));
    } else if (action === "fade-out") {
      const maximum = Math.min(8, (initial.end - initial.start) / 2);
      segment.fadeOut = roundTime(clamp(initial.fadeOut - delta, 0, maximum));
    } else if (action === "left") {
      let nextStart = clamp(initial.start + delta, 0, initial.end - 0.25);
      let actual = nextStart - initial.start;
      if (source) {
        const nextSourceIn = clamp(initial.sourceIn + actual, 0, initial.sourceOut - 0.25);
        actual = nextSourceIn - initial.sourceIn;
        segment.sourceIn = roundTime(nextSourceIn);
        nextStart = initial.start + actual;
      }
      segment.start = roundTime(nextStart);
    } else {
      let nextEnd = clamp(initial.end + delta, initial.start + 0.25, currentSession().duration);
      let actual = nextEnd - initial.end;
      if (source) {
        const nextSourceOut = clamp(initial.sourceOut + actual, initial.sourceIn + 0.25, source.duration);
        actual = nextSourceOut - initial.sourceOut;
        segment.sourceOut = roundTime(nextSourceOut);
        nextEnd = initial.end + actual;
      }
      segment.end = roundTime(nextEnd);
    }
    normalizeFades(segment);
    refreshSourceText(segment);
    positionClip(clip, segment);
    drawWaveform();
    updateInspectorValues();
    updateTransitionReadout();
    if (state.sourceOpen) updateSourceEditorUI();
  };

  const end = () => {
    clip.removeEventListener("pointermove", move);
    clip.removeEventListener("pointerup", end);
    clip.removeEventListener("pointercancel", end);
    saveDraft();
    renderTimeline();
    renderInspector();
    updateTransitionReadout();
  };
  clip.addEventListener("pointermove", move);
  clip.addEventListener("pointerup", end);
  clip.addEventListener("pointercancel", end);
}

function renderRuler() {
  const session = currentSession();
  const ruler = document.querySelector("#ruler");
  ruler.innerHTML = "";
  const step = state.zoomX >= 8 ? 1 : state.zoomX >= 4 ? 2 : state.zoomX >= 2 ? 5 : session.duration <= 60 ? 10 : 15;
  for (let time = 0; time <= session.duration; time += step) {
    const tick = document.createElement("div");
    tick.className = "tick";
    tick.style.left = `${(time / session.duration) * 100}%`;
    tick.innerHTML = `<span>${formatTime(time, false)}</span>`;
    ruler.appendChild(tick);
  }
}

function renderTimelineSelection() {
  laneStack.querySelectorAll(".clip").forEach((clip) => {
    clip.classList.toggle("selected", Number(clip.dataset.index) === state.selectedIndex);
  });
}

function renderInspector() {
  const segment = selectedSegment();
  const source = sourceFor(segment);
  document.querySelector("#open-source-button").disabled = !source;
  if (!segment) {
    clipInspector.innerHTML = '<div class="empty-state"><div><strong>Sin selección</strong>Elige un bloque de la línea de tiempo.</div></div>';
    return;
  }
  clipInspector.innerHTML = `
    <h2>${segment.name}</h2>
    <p>${segment.artist}</p>
    <div class="inspector-grid">
      <div class="inspector-field"><span>Destino</span><strong data-inspector="destination">${formatTime(segment.start)}–${formatTime(segment.end)}</strong></div>
      <div class="inspector-field"><span>Duración</span><strong data-inspector="duration">${formatTime(segment.end - segment.start)}</strong></div>
      <div class="inspector-field"><span>Origen</span><strong data-inspector="source">${segment.source}</strong></div>
      <div class="inspector-field"><span>Transición</span><strong>${segment.transition}</strong></div>
      ${segment.loudness ? `<div class="inspector-field loudness-readout"><span>Nivel detectado</span><strong>${segment.loudness.rmsDb.toFixed(1)} dB RMS <i>→</i> ${segment.gainDb >= 0 ? "+" : ""}${segment.gainDb.toFixed(1)} dB Auto Gain</strong></div>` : ""}
    </div>
    ${source ? `<div class="source-fact"><span>Archivo original completo</span><strong>${formatTime(source.duration)}${source.imported ? " · subido por ti" : " · fuente local"}</strong></div>` : ""}
    <div class="mix-controls">
      <label class="mix-control"><span>Posición</span><input data-mix-input="start" type="number" min="0" step="0.01" value="${segment.start.toFixed(2)}"></label>
      <label class="mix-control"><span>Ganancia</span><input data-mix-input="gain" type="number" min="-24" max="12" step="0.1" value="${segment.gainDb.toFixed(1)}"></label>
      <label class="mix-control"><span>BPM</span><input data-mix-input="bpm" type="number" min="50" max="220" step="1" value="${segment.bpm || source?.bpm || 120}"></label>
      <label class="mix-control"><span>Curva de fade</span><select data-mix-input="curve"><option value="equal-power"${segment.fadeCurve === "equal-power" ? " selected" : ""}>Equal-power</option><option value="linear"${segment.fadeCurve === "linear" ? " selected" : ""}>Lineal</option></select></label>
      ${source ? `<label class="mix-control"><span>Ancla del beat</span><input data-mix-input="beatOffset" type="number" min="0" max="${source.duration}" step="0.001" placeholder="Sin calibrar" value="${Number.isFinite(segment.beatOffset) ? segment.beatOffset.toFixed(3) : ""}"></label>` : ""}
    </div>
    <div class="fade-controls">
      <label><span>Fade in</span><span class="fade-input"><input data-fade-input="in" type="number" min="0" max="${Math.min(8, (segment.end - segment.start) / 2).toFixed(2)}" step="0.01" value="${segment.fadeIn.toFixed(2)}"><em>s</em></span></label>
      <label><span>Fade out</span><span class="fade-input"><input data-fade-input="out" type="number" min="0" max="${Math.min(8, (segment.end - segment.start) / 2).toFixed(2)}" step="0.01" value="${segment.fadeOut.toFixed(2)}"><em>s</em></span></label>
    </div>
    <div class="transition-tools" aria-label="Asistente de transición">
      <button type="button" data-transition="cut">Corte limpio</button>
      <button type="button" data-transition="short">Crossfade corto</button>
      <button type="button" data-transition="beat">Mezcla 4 tiempos</button>
      ${source ? '<button type="button" data-beat-action="detect">Detectar golpe</button><button type="button" data-beat-action="snap">Corte al beat</button>' : ""}
    </div>
    <section class="track-end-fx" aria-label="Efectos al final de esta pista">
      <header><div><strong>Efecto final</strong><small>Se aplica solo a ${segment.name}</small></div><span>${currentSession().events.filter((event) => event.trackId === segment.id).length} asignados</span></header>
      <div class="end-fx-actions">
        <button type="button" data-end-fx="echo">Echo out</button>
        <button type="button" data-end-fx="delay">Delay 1/4</button>
        <button type="button" data-end-fx="lowpass">Cierre LPF</button>
        <button type="button" data-end-fx="highpass">Subida HPF</button>
        <button type="button" data-end-fx="dip">Cut final</button>
      </div>
    </section>
    <details class="fx-rack" open>
      <summary>Procesamiento de la pista</summary>
      ${effectChainMarkup(segment)}
      <div class="preset-strip">
        <label>Preset recomendado<select id="fx-preset-select">${Object.entries(FX_PRESETS).map(([key, preset]) => `<option value="${key}">${preset.label}</option>`).join("")}</select></label>
        <button id="apply-fx-preset" type="button">Aplicar</button>
      </div>
      <p id="preset-help" class="preset-help">${FX_PRESETS.balanced.help}</p>
      <div class="fx-visualizer">
        <div class="fx-screen-tabs" role="tablist" aria-label="Pantallas del procesador">
          <button type="button" data-analyzer="wave" class="${state.analyzerMode === "wave" ? "active" : ""}">Onda</button>
          <button type="button" data-analyzer="compressor" class="${state.analyzerMode === "compressor" ? "active" : ""}">Compresor</button>
          <button type="button" data-analyzer="gate" class="${state.analyzerMode === "gate" ? "active" : ""}">Gate</button>
          <button type="button" data-analyzer="eq" class="${state.analyzerMode === "eq" ? "active" : ""}">Filtros</button>
        </div>
        <div class="fx-screen"><canvas id="fx-analyzer-canvas" aria-label="Visualización del procesamiento de audio"></canvas></div>
        <div id="fx-screen-legend" class="fx-screen-legend"></div>
      </div>
      <details class="fx-advanced">
        <summary>Ajustes avanzados</summary>
        <div class="fx-grid">
        <label class="fx-control"><span>Filtro pasa alto <b>Hz</b></span><input data-fx="highpass" type="number" min="20" max="18000" step="10" value="${segment.fx.highpass}"></label>
        <label class="fx-control"><span>Filtro pasa bajo <b>Hz</b></span><input data-fx="lowpass" type="number" min="80" max="20000" step="10" value="${segment.fx.lowpass}"></label>
        <label class="fx-control"><span class="fx-toggle"><input data-fx-toggle="compressorEnabled" type="checkbox"${segment.fx.compressorEnabled ? " checked" : ""}> Compresor</span><input data-fx="compressorThreshold" type="number" min="-80" max="0" step="1" value="${segment.fx.compressorThreshold}" title="Umbral en dB"></label>
        <label class="fx-control"><span>Ratio compresor</span><input data-fx="compressorRatio" type="number" min="1" max="20" step="0.5" value="${segment.fx.compressorRatio}"></label>
        <label class="fx-control"><span class="fx-toggle"><input data-fx-toggle="gateEnabled" type="checkbox"${segment.fx.gateEnabled ? " checked" : ""}> Noise gate</span><input data-fx="gateThreshold" type="number" min="-80" max="-6" step="1" value="${segment.fx.gateThreshold}" title="Umbral en dB"></label>
        <label class="fx-control"><span>Delay <b>ms</b></span><input data-fx="delayMs" type="number" min="0" max="2000" step="1" value="${segment.fx.delayMs}"></label>
        <label class="fx-control"><span>Mezcla delay <b>0–1</b></span><input data-fx="delayMix" type="number" min="0" max="1" step="0.05" value="${segment.fx.delayMix}"></label>
        <label class="fx-control"><span>Sidechain / duck <b>dB</b></span><input data-fx="sidechainDb" type="number" min="0" max="18" step="0.5" value="${segment.fx.sidechainDb}"></label>
        </div>
      </details>
    </details>
    <div class="edit-note">Arrastra el bloque para moverlo, los bordes para recortar y los puntos superiores para crear fades. ${segment.note}</div>`;
  clipInspector.querySelectorAll("[data-fade-input]").forEach((input) => {
    input.addEventListener("input", previewFadeInput);
    input.addEventListener("change", applyFadeInput);
  });
  clipInspector.querySelectorAll("[data-mix-input]").forEach((input) => input.addEventListener("change", applyMixControl));
  clipInspector.querySelectorAll("[data-transition]").forEach((button) => button.addEventListener("click", () => applyTransition(button.dataset.transition)));
  clipInspector.querySelectorAll("[data-end-fx]").forEach((button) => button.addEventListener("click", () => addEndTrackEffect(button.dataset.endFx)));
  clipInspector.querySelectorAll("[data-beat-action]").forEach((button) => button.addEventListener("click", () => button.dataset.beatAction === "detect" ? detectBeatAnchor() : snapSourceCutToBeat()));
  clipInspector.querySelectorAll("[data-fx], [data-fx-toggle]").forEach((input) => input.addEventListener("change", applyFxControl));
  clipInspector.querySelector("#track-fx-toggle")?.addEventListener("click", () => updateTrackMonitoring(state.selectedIndex, "fx"));
  clipInspector.querySelectorAll("[data-effect-toggle]").forEach((button) => button.addEventListener("click", () => toggleTrackEffect(button.dataset.effectToggle)));
  clipInspector.querySelectorAll("[data-effect-remove]").forEach((button) => button.addEventListener("click", () => removeTrackEffect(button.dataset.effectRemove)));
  clipInspector.querySelector("#effect-add-button")?.addEventListener("click", addTrackEffect);
  clipInspector.querySelector("#fx-preset-select")?.addEventListener("change", (event) => {
    document.querySelector("#preset-help").textContent = FX_PRESETS[event.target.value]?.help || "";
  });
  clipInspector.querySelector("#apply-fx-preset")?.addEventListener("click", applyFxPreset);
  clipInspector.querySelectorAll("[data-analyzer]").forEach((button) => button.addEventListener("click", () => {
    state.analyzerMode = button.dataset.analyzer;
    clipInspector.querySelectorAll("[data-analyzer]").forEach((candidate) => candidate.classList.toggle("active", candidate === button));
    drawFxAnalyzer();
    saveWorkspaceView();
  }));
  requestAnimationFrame(drawFxAnalyzer);
}

function applyFxControl(event) {
  const segment = selectedSegment();
  if (!segment) return;
  const key = event.target.dataset.fx || event.target.dataset.fxToggle;
  segment.fx[key] = event.target.type === "checkbox" ? event.target.checked : Number(event.target.value);
  const moduleByControl = { highpass: "highpass", lowpass: "lowpass", compressorEnabled: "compressor", compressorThreshold: "compressor", compressorRatio: "compressor", gateEnabled: "gate", gateThreshold: "gate", delayMs: "delay", delayMix: "delay", sidechainDb: "sidechain" };
  const module = moduleByControl[key];
  const addedToChain = module && !segment.fx.chain.includes(module);
  if (addedToChain) segment.fx.chain.push(module);
  segment.fx.enabled = true;
  if (module) segment.fx.bypass[module] = false;
  saveDraft();
  if (addedToChain) renderInspector(); else drawFxAnalyzer();
  showToast(`${event.target.closest(".fx-control")?.querySelector("span")?.textContent.trim() || "Efecto"} actualizado`);
}

function toggleTrackEffect(key) {
  const segment = selectedSegment();
  const definition = EFFECT_DEFS[key];
  if (!segment || !definition) return;
  if (definition.enabledKey) segment.fx[definition.enabledKey] = !segment.fx[definition.enabledKey];
  else segment.fx.bypass[key] = !segment.fx.bypass[key];
  saveDraft();
  renderInspector();
  renderTimeline();
  refreshLivePreview();
  showToast(`${definition.label}: ${effectIsActive(segment, key) ? "activo" : "puenteado"}`);
}

function removeTrackEffect(key) {
  const segment = selectedSegment();
  const definition = EFFECT_DEFS[key];
  if (!segment || !definition) return;
  segment.fx.chain = segment.fx.chain.filter((candidate) => candidate !== key);
  saveDraft();
  renderInspector();
  renderTimeline();
  refreshLivePreview();
  showToast(`${definition.label} quitado de la cadena`);
}

function addTrackEffect() {
  const segment = selectedSegment();
  const select = clipInspector.querySelector("#effect-add-select");
  const key = select?.value;
  if (!segment || !EFFECT_DEFS[key] || segment.fx.chain.includes(key)) return;
  const sensibleDefaults = {
    highpass: { highpass: 80 }, lowpass: { lowpass: 16000 },
    compressor: { compressorEnabled: true, compressorThreshold: -18, compressorRatio: 3 },
    gate: { gateEnabled: true, gateThreshold: -48 },
    delay: { delayMs: 375, delayMix: 0.18 }, sidechain: { sidechainDb: 3 },
  };
  Object.assign(segment.fx, sensibleDefaults[key]);
  segment.fx.chain.push(key);
  segment.fx.bypass[key] = false;
  segment.fx.enabled = true;
  saveDraft();
  renderInspector();
  renderTimeline();
  refreshLivePreview();
  showToast(`${EFFECT_DEFS[key].label} agregado a ${segment.name}`);
}

function applyFxPreset() {
  const segment = selectedSegment();
  const select = clipInspector.querySelector("#fx-preset-select");
  const preset = FX_PRESETS[select?.value];
  if (!segment || !preset) return;
  segment.fx = { ...segment.fx, ...preset.fx, enabled: true, bypass: {} };
  segment.fx.chain = inferEffectChain(segment.fx);
  saveDraft();
  renderInspector();
  showToast(`${preset.label} aplicado · puedes ajustar cada control después`);
}

function prepareAnalyzerCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.floor(rect.width * dpr));
  canvas.height = Math.max(1, Math.floor(rect.height * dpr));
  const context = canvas.getContext("2d");
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, rect.width, rect.height);
  context.fillStyle = "#090c0d";
  context.fillRect(0, 0, rect.width, rect.height);
  context.strokeStyle = "rgba(143,153,149,.11)";
  context.lineWidth = 1;
  for (let index = 1; index < 4; index += 1) {
    const x = (rect.width / 4) * index;
    const y = (rect.height / 4) * index;
    context.beginPath(); context.moveTo(x, 0); context.lineTo(x, rect.height); context.stroke();
    context.beginPath(); context.moveTo(0, y); context.lineTo(rect.width, y); context.stroke();
  }
  return { context, width: rect.width, height: rect.height };
}

function drawFxAnalyzer() {
  const canvas = clipInspector.querySelector("#fx-analyzer-canvas");
  const legend = clipInspector.querySelector("#fx-screen-legend");
  const segment = selectedSegment();
  if (!canvas || !legend || !segment) return;
  const { context, width, height } = prepareAnalyzerCanvas(canvas);
  const fx = segment.fx;
  context.lineCap = "round";
  context.lineJoin = "round";

  if (state.analyzerMode === "wave") {
    const source = sourceFor(segment);
    const values = source?.waveform || [];
    const center = height / 2;
    const sourceDuration = Math.max(0.01, source?.duration || segment.sourceOut || 1);
    const startRatio = clamp((segment.sourceIn || 0) / sourceDuration, 0, 1);
    const endRatio = clamp((segment.sourceOut || sourceDuration) / sourceDuration, 0, 1);
    context.fillStyle = "rgba(213,255,63,.055)";
    context.fillRect(startRatio * width, 0, Math.max(1, (endRatio - startRatio) * width), height);
    context.strokeStyle = segment.color || "#d5ff3f";
    context.lineWidth = 1;
    context.beginPath();
    const count = Math.max(1, Math.min(values.length, Math.floor(width)));
    for (let index = 0; index < count; index += 1) {
      const sourceIndex = Math.floor((index / count) * values.length);
      const peak = clamp(Number(values[sourceIndex]) || 0, 0, 1);
      const x = (index / Math.max(1, count - 1)) * width;
      context.moveTo(x, center - peak * center * 0.82);
      context.lineTo(x, center + peak * center * 0.82);
    }
    context.stroke();
    legend.innerHTML = `<span><strong>Forma de onda completa</strong><br>La franja verde es el fragmento usado.</span><span>${formatTime(segment.sourceIn || 0)}–${formatTime(segment.sourceOut || 0)}</span>`;
  } else if (state.analyzerMode === "compressor") {
    const threshold = clamp(Number(fx.compressorThreshold) || -18, -60, 0);
    const ratio = clamp(Number(fx.compressorRatio) || 4, 1, 20);
    const xForDb = (db) => ((db + 60) / 60) * width;
    const yForDb = (db) => height - ((db + 60) / 60) * height;
    context.strokeStyle = "rgba(143,153,149,.32)";
    context.setLineDash([4, 4]);
    context.beginPath(); context.moveTo(xForDb(threshold), 0); context.lineTo(xForDb(threshold), height); context.stroke();
    context.setLineDash([]);
    context.strokeStyle = fx.compressorEnabled ? "#55d6ff" : "#5f6965";
    context.lineWidth = 2;
    context.beginPath();
    for (let db = -60; db <= 0; db += 1) {
      const output = db <= threshold ? db : threshold + (db - threshold) / ratio;
      const x = xForDb(db);
      const y = yForDb(output);
      if (db === -60) context.moveTo(x, y); else context.lineTo(x, y);
    }
    context.stroke();
    legend.innerHTML = `<span><strong>${fx.compressorEnabled ? "Compresor activo" : "Compresor apagado"}</strong><br>La curva muestra cuánto se reducen los picos.</span><span>${threshold} dB · ${ratio}:1</span>`;
  } else if (state.analyzerMode === "gate") {
    const threshold = clamp(Number(fx.gateThreshold) || -52, -80, -6);
    const xThreshold = ((threshold + 80) / 74) * width;
    context.fillStyle = "rgba(255,122,200,.08)";
    context.fillRect(0, 0, xThreshold, height);
    context.strokeStyle = "#ff7ac8";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(0, height - 3);
    context.lineTo(xThreshold, height - 3);
    context.lineTo(Math.min(width, xThreshold + 13), Math.max(4, height - 22));
    context.lineTo(width, 4);
    context.stroke();
    context.strokeStyle = "rgba(255,122,200,.48)";
    context.setLineDash([4, 4]);
    context.beginPath(); context.moveTo(xThreshold, 0); context.lineTo(xThreshold, height); context.stroke();
    context.setLineDash([]);
    legend.innerHTML = `<span><strong>${fx.gateEnabled ? "Gate activo" : "Gate apagado"}</strong><br>La zona rosada se silencia cuando el audio cae bajo el umbral.</span><span>${threshold} dB</span>`;
  } else {
    const highpass = clamp(Number(fx.highpass) || 20, 20, 18000);
    const lowpass = clamp(Number(fx.lowpass) || 20000, 80, 20000);
    context.strokeStyle = "#ffb454";
    context.lineWidth = 2;
    context.beginPath();
    for (let pixel = 0; pixel <= width; pixel += 2) {
      const frequency = 20 * ((20000 / 20) ** (pixel / width));
      const hpMagnitude = frequency / Math.sqrt(frequency ** 2 + highpass ** 2);
      const lpMagnitude = lowpass / Math.sqrt(frequency ** 2 + lowpass ** 2);
      const db = clamp(20 * Math.log10(Math.max(0.0001, hpMagnitude * lpMagnitude)), -36, 0);
      const y = 6 + (-db / 36) * (height - 12);
      if (pixel === 0) context.moveTo(pixel, y); else context.lineTo(pixel, y);
    }
    context.stroke();
    legend.innerHTML = `<span><strong>Respuesta de filtros</strong><br>La curva baja donde se están retirando graves o agudos.</span><span>HPF ${highpass} Hz · LPF ${lowpass} Hz</span>`;
  }
}

function applyMixControl(event) {
  const segment = selectedSegment();
  const source = sourceFor(segment);
  if (!segment) return;
  const control = event.target.dataset.mixInput;
  if (control === "start") {
    const duration = segment.end - segment.start;
    segment.start = roundTime(Math.max(0, Number(event.target.value) || 0));
    segment.end = roundTime(segment.start + duration);
    currentSession().duration = Math.max(currentSession().duration, segment.end);
  } else if (control === "gain") {
    segment.gainDb = roundTime(clamp(Number(event.target.value) || 0, -24, 12));
  } else if (control === "bpm" && source) {
    segment.bpm = Math.round(clamp(Number(event.target.value) || 120, 50, 220));
    source.bpm = segment.bpm;
  } else if (control === "beatOffset" && source) {
    segment.beatOffset = roundMillis(clamp(Number(event.target.value) || segment.sourceIn, 0, source.duration));
  } else if (control === "curve") {
    segment.fadeCurve = event.target.value;
  }
  saveDraft();
  renderTimeline();
  renderInspector();
  updateTransitionReadout();
}

function previousSegment() {
  return state.selectedIndex > 0 ? currentSession().segments[state.selectedIndex - 1] : null;
}

function applyTransition(kind = "short") {
  const segment = selectedSegment();
  const previous = previousSegment();
  if (!segment || !previous) {
    showToast("Selecciona una pista que tenga otra antes");
    return;
  }
  const source = sourceFor(segment);
  let overlap = 0;
  if (kind === "cut") {
    overlap = 0;
    previous.fadeOut = 0.02;
    segment.fadeIn = 0.02;
    segment.transition = "Corte limpio en el límite";
  } else if (kind === "beat") {
    overlap = roundTime(clamp(240 / (segment.bpm || source?.bpm || 120), 1, 8));
    previous.fadeOut = overlap;
    segment.fadeIn = overlap;
    segment.transition = `Mezcla de 4 tiempos · ${segment.bpm || source?.bpm || 120} BPM`;
  } else {
    overlap = 0.2;
    previous.fadeOut = overlap;
    segment.fadeIn = overlap;
    segment.transition = "Crossfade equal-power 200 ms";
  }
  const duration = segment.end - segment.start;
  segment.start = roundTime(Math.max(0, previous.end - overlap));
  segment.end = roundTime(segment.start + duration);
  segment.fadeCurve = "equal-power";
  previous.fadeCurve = "equal-power";
  normalizeFades(previous);
  normalizeFades(segment);
  currentSession().duration = Math.max(currentSession().duration, segment.end);
  saveDraft();
  renderTimeline();
  renderInspector();
  updateTransitionReadout();
  showToast(kind === "beat" ? "Mezcla de 4 tiempos aplicada" : kind === "cut" ? "Corte limpio aplicado" : "Crossfade corto aplicado");
}

function updateTransitionReadout() {
  const readout = document.querySelector("#transition-readout");
  const health = document.querySelector("#transition-health");
  const advice = document.querySelector("#transition-advice");
  const healthWrap = health.closest(".transition-health");
  const segment = selectedSegment();
  const previous = previousSegment();
  if (!segment || !previous) {
    readout.textContent = "Primera pista · sin transición anterior";
    health.textContent = "Primera pista";
    advice.textContent = "Selecciona la canción que entra para analizar el empalme.";
    healthWrap.dataset.status = "safe";
    updateBeatPhaseStatus();
    return;
  }
  const difference = roundTime(segment.start - previous.end);
  if (Math.abs(difference) < 0.01) readout.textContent = `Empalme exacto en ${formatTime(segment.start)}`;
  else if (difference < 0) readout.textContent = `Solape ${Math.abs(difference).toFixed(2)} s · fades ${previous.fadeOut.toFixed(2)} / ${segment.fadeIn.toFixed(2)} s`;
  else readout.textContent = `Hueco ${difference.toFixed(2)} s antes de esta pista`;
  const previousBpm = clamp(Number(previous.bpm) || 120, 50, 220);
  const nextBpm = clamp(Number(segment.bpm) || 120, 50, 220);
  const tempoDifference = Math.abs(previousBpm - nextBpm) / previousBpm * 100;
  const overlap = Math.max(0, previous.end - segment.start);
  const overlapBeats = overlap / beatSeconds(segment);
  health.textContent = `${previousBpm} → ${nextBpm} BPM · ${tempoDifference.toFixed(1)}%`;
  if (tempoDifference <= 3.5) {
    healthWrap.dataset.status = "safe";
    advice.textContent = overlap > 0.1 ? `Blend viable · ${overlapBeats.toFixed(1)} tiempos de mezcla.` : "Tempo compatible · alinea 8 tiempos para un blend musical.";
  } else if (tempoDifference <= 7) {
    healthWrap.dataset.status = "warn";
    advice.textContent = "Diferencia moderada · usa una frase corta, filtro o echo out.";
  } else {
    healthWrap.dataset.status = "cut";
    advice.textContent = "Tempos lejanos · conviene corte limpio, DIP o echo out en el golpe.";
  }
  updateBeatPhaseStatus();
}

function alignSelectedPhrase() {
  const segment = selectedSegment();
  const previous = previousSegment();
  if (!segment || !previous) {
    showToast("Selecciona una canción con otra antes");
    return;
  }
  const beats = Number(document.querySelector("#phrase-size-select").value) || 8;
  if (!Number.isFinite(segment.beatOffset)) {
    showToast("Calibra el golpe de la pista entrante para una unión precisa");
    openSourceEditor();
    return;
  }
  const targetBeat = timelineBeatNear(previous, previous.end);
  const overlap = roundTime(beatSeconds(segment) * beats);
  const duration = segment.end - segment.start;
  segment.sourceIn = nearestSourceBeat(segment, segment.sourceIn);
  segment.start = roundTime(Math.max(0, targetBeat - overlap));
  segment.end = roundTime(segment.start + duration);
  previous.fadeOut = Math.min(overlap, (previous.end - previous.start) / 2);
  segment.fadeIn = Math.min(overlap, duration / 2);
  previous.fadeCurve = "equal-power";
  segment.fadeCurve = "equal-power";
  segment.transition = `Golpes y frase alineados · ${beats} tiempos · ${segment.bpm} BPM`;
  normalizeFades(previous);
  normalizeFades(segment);
  saveDraft();
  renderTimeline();
  renderInspector();
  updateTransitionReadout();
  showToast(`Downbeats alineados a ${beats} tiempos (${overlap.toFixed(2)} s)`);
}

function updateBeatPhaseStatus() {
  const status = document.querySelector("#beat-phase-status");
  if (!status) return;
  const segment = selectedSegment();
  const previous = previousSegment();
  if (!segment) {
    status.textContent = "Selecciona una pista para calibrar el beat.";
    return;
  }
  if (!Number.isFinite(segment.beatOffset)) {
    status.textContent = `${segment.name}: beat sin calibrar · abre el audio fuente y detecta un golpe.`;
    return;
  }
  if (!previous) {
    status.textContent = `${segment.name}: beat calibrado en ${formatTime(segment.beatOffset)} del original.`;
    return;
  }
  const nearest = timelineBeatNear(previous, segment.start);
  const errorMs = Math.round((segment.start - nearest) * 1000);
  status.textContent = Math.abs(errorMs) <= 5
    ? `${segment.name}: golpe bloqueado · fase exacta con la pista anterior.`
    : `${segment.name}: desfase ${errorMs > 0 ? "+" : ""}${errorMs} ms · pulsa Cuadrar golpes.`;
}

function liveDelaySeconds() {
  return clamp(beatSeconds(selectedSegment()) * state.liveFx.delayBeats, 0.04, 1.8);
}

function applyLiveFxValues(immediate = false) {
  if (!livePreview.fx || !livePreview.context) return;
  const now = livePreview.context.currentTime;
  const setValue = (parameter, value) => {
    parameter.cancelScheduledValues(now);
    if (immediate) parameter.setValueAtTime(value, now);
    else parameter.setTargetAtTime(value, now, 0.018);
  };
  setValue(livePreview.fx.highpass.frequency, clamp(state.liveFx.highpass, 20, 18000));
  setValue(livePreview.fx.lowpass.frequency, clamp(state.liveFx.lowpass, 80, 20000));
  setValue(livePreview.fx.dry.gain, 1 - state.liveFx.mix * 0.42);
  setValue(livePreview.fx.wet.gain, clamp(state.liveFx.mix, 0, 1));
  setValue(livePreview.fx.feedback.gain, clamp(state.liveFx.feedback, 0, 0.86));
  setValue(livePreview.fx.delay.delayTime, liveDelaySeconds());
}

function liveFxSnapshot() {
  return { ...state.liveFx };
}

function updateLiveFxConsole() {
  const definitions = {
    highpass: { min: 20, max: 18000, format: (value) => `${Math.round(value)} Hz` },
    lowpass: { min: 80, max: 20000, format: (value) => `${Math.round(value)} Hz` },
    mix: { min: 0, max: 1, format: (value) => `${Math.round(value * 100)}%` },
    feedback: { min: 0, max: 0.86, format: (value) => `${Math.round(value * 100)}%` },
  };
  document.querySelectorAll("[data-live-fx]").forEach((input) => {
    const key = input.dataset.liveFx;
    const definition = definitions[key];
    const value = state.liveFx[key];
    input.value = String(value);
    const ratio = (value - definition.min) / (definition.max - definition.min);
    input.closest(".knob-face")?.style.setProperty("--turn", `${-135 + ratio * 270}deg`);
    const outputId = { highpass: "live-hpf-value", lowpass: "live-lpf-value", mix: "live-echo-value", feedback: "live-feedback-value" }[key];
    const output = document.querySelector(`#${outputId}`);
    if (output) output.textContent = definition.format(value);
  });
  const division = document.querySelector("#live-delay-division");
  if (division) division.value = String(state.liveFx.delayBeats);
  const record = document.querySelector("#fx-record-button");
  if (record) {
    record.setAttribute("aria-pressed", String(state.fxRecord));
    record.textContent = state.fxRecord ? "Grabando movimientos" : "Grabar movimientos";
  }
}

function writeFxAutomation({ recorded = false } = {}) {
  const session = currentSession();
  const time = eventTimeFromCursor();
  let event = recorded && state.lastFxRecordTime >= 0 && Math.abs(time - state.lastFxRecordTime) < 0.14
    ? [...session.events].reverse().find((candidate) => candidate.type === "fx" && Math.abs(candidate.time - state.lastFxRecordTime) < 0.15)
    : null;
  if (event) {
    event.params = liveFxSnapshot();
    event.duration = roundTime(Math.max(0.08, time - event.time));
  } else {
    event = {
      id: `event-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: "fx",
      label: recorded ? "Movimiento FX" : "Punto FX",
      time,
      duration: 0.18,
      amount: 1,
      trackId: selectedSegment()?.id || null,
      params: liveFxSnapshot(),
    };
    session.events.push(event);
  }
  state.lastFxRecordTime = time;
  state.selectedEventId = event.id;
  saveDraft();
  renderAutomationEvents();
  renderEventEditor();
  if (!recorded) showToast(`Punto FX escrito en ${formatTime(time)}`);
}

function handleLiveFxInput(event) {
  const key = event.target.dataset.liveFx;
  state.liveFx[key] = Number(event.target.value);
  updateLiveFxConsole();
  applyLiveFxValues();
  if (state.fxRecord && !audio.paused) writeFxAutomation({ recorded: true });
}

function resetLiveFx() {
  state.liveFx = { highpass: 20, lowpass: 20000, mix: 0, feedback: 0.32, delayBeats: 1 };
  updateLiveFxConsole();
  applyLiveFxValues();
  showToast("Consola FX restablecida; las automatizaciones guardadas siguen intactas");
}

function punchLiveEffect(type) {
  let event;
  if (type === "echo") {
    event = addTimelineEvent("echo");
    event.params = { delayBeats: state.liveFx.delayBeats, mix: Math.max(0.72, state.liveFx.mix), feedback: Math.max(0.42, state.liveFx.feedback) };
  } else if (type === "dip") {
    event = addTimelineEvent("dip");
  } else {
    event = addTimelineEvent("filter");
    event.params = type === "highpass"
      ? { filterMode: "highpass", startHz: 20, endHz: 9000, resonance: 1.4 }
      : { filterMode: "lowpass", startHz: 18000, endHz: 420, resonance: 1.2 };
  }
  saveDraft();
  renderAutomationEvents();
  renderEventEditor();
}

function nudgeSelectedClip(delta) {
  const segment = selectedSegment();
  if (!segment) return;
  const duration = segment.end - segment.start;
  segment.start = roundTime(clamp(segment.start + delta, 0, currentSession().duration - duration));
  segment.end = roundTime(segment.start + duration);
  saveDraft();
  renderTimeline();
  renderInspector();
  updateTransitionReadout();
}

function auditionTransition() {
  const segment = selectedSegment();
  const previous = previousSegment();
  if (!segment || !previous) {
    showToast("No hay una transición anterior que escuchar");
    return;
  }
  state.auditionEnd = Math.min(currentSession().duration, segment.start + 4);
  seekTo(Math.max(0, previous.end - 4));
  if (audio.paused) playButton.click();
}

async function prepareSmartTransition() {
  const segment = selectedSegment();
  const previous = previousSegment();
  if (!segment || !previous) {
    showToast("Selecciona la pista que entra después de otra");
    return;
  }
  const button = document.querySelector("#smart-transition-button");
  button.disabled = true;
  button.textContent = "Analizando…";
  try {
    if (!Number.isFinite(segment.beatOffset)) await detectBeatAnchor();
    if (!Number.isFinite(segment.beatOffset)) return;
    alignSelectedPhrase();
    window.setTimeout(auditionTransition, 120);
    showToast("Empalme preparado: golpe detectado, frase alineada y preescucha activa");
  } finally {
    button.disabled = false;
    button.textContent = "Empalme inteligente";
  }
}

function useFullSource() {
  const segment = selectedSegment();
  const source = sourceFor(segment);
  if (!segment || !source) return;
  segment.sourceIn = 0;
  segment.sourceOut = roundTime(source.duration);
  segment.end = roundTime(segment.start + source.duration);
  segment.note = "Se está usando el archivo original completo, sin truncarlo.";
  refreshSourceText(segment);
  currentSession().duration = Math.max(currentSession().duration, segment.end);
  saveDraft();
  renderWorkspace();
  openSourceEditor();
  showToast(`Original completo: ${formatTime(source.duration)}`);
}

function duplicateSelectedClip() {
  const segment = selectedSegment();
  if (!segment) return;
  const copy = structuredClone(segment);
  copy.id = createSegmentId(currentSession(), "copy");
  const duration = segment.end - segment.start;
  copy.start = roundTime(segment.end - 0.2);
  copy.end = roundTime(copy.start + duration);
  copy.name = `${segment.name} · copia`;
  copy.note = "Copia independiente para probar otro fragmento de la misma canción.";
  currentSession().segments.splice(state.selectedIndex + 1, 0, copy);
  state.selectedIndex += 1;
  currentSession().duration = Math.max(currentSession().duration, copy.end);
  saveDraft();
  renderWorkspace();
  showToast("Pista duplicada");
}

function splitClipAtCursor() {
  const session = currentSession();
  const cursor = roundTime(audio.currentTime);
  let index = state.selectedIndex;
  let segment = session.segments[index];
  if (!segment || cursor <= segment.start || cursor >= segment.end) {
    index = session.segments.findIndex((candidate) => cursor > candidate.start && cursor < candidate.end);
    segment = session.segments[index];
  }
  if (!segment) {
    showToast("Pon el cursor dentro de una pista para cortarla");
    return;
  }
  if (cursor - segment.start < 0.12 || segment.end - cursor < 0.12) {
    showToast("Deja al menos 0,12 s a cada lado del corte");
    return;
  }

  audio.pause();
  const right = structuredClone(segment);
  right.id = createSegmentId(session, "split");
  const originalEnd = segment.end;
  const originalSourceOut = segment.sourceOut;
  const sourceCut = roundTime(segment.sourceIn + (cursor - segment.start));
  segment.end = cursor;
  segment.sourceOut = sourceCut;
  segment.fadeOut = Math.min(0.012, (segment.end - segment.start) / 2);
  segment.note = "Fragmento independiente. El archivo original permanece intacto.";
  right.start = cursor;
  right.end = originalEnd;
  right.sourceIn = sourceCut;
  right.sourceOut = originalSourceOut;
  right.fadeIn = Math.min(0.012, (right.end - right.start) / 2);
  right.transition = "Corte en el cursor · bordes protegidos contra clics";
  right.note = "Fragmento independiente. Muévelo, recórtalo o procésalo sin afectar el original.";
  refreshSourceText(segment);
  refreshSourceText(right);
  normalizeFades(segment);
  normalizeFades(right);
  session.segments.splice(index + 1, 0, right);
  state.selectedIndex = index + 1;
  saveDraft();
  renderWorkspace();
  seekTo(cursor);
  showToast(`Corte creado en ${formatTime(cursor)} · dos fragmentos independientes`);
}

function removeSelectedClip() {
  const session = currentSession();
  const segment = selectedSegment();
  if (!segment) return;
  if (session.segments.length <= 1) {
    showToast("La sesión necesita conservar al menos una pista");
    return;
  }
  session.events = session.events.filter((event) => event.trackId !== segment.id);
  session.segments.splice(state.selectedIndex, 1);
  state.selectedIndex = Math.min(state.selectedIndex, session.segments.length - 1);
  saveDraft();
  renderWorkspace();
  showToast("Fragmento quitado del mix · el original sigue intacto");
}

function previewFadeInput(event) {
  const segment = selectedSegment();
  if (!segment) return;
  const maximum = Math.min(8, (segment.end - segment.start) / 2);
  const value = roundTime(clamp(Number(event.target.value), 0, maximum));
  if (event.target.dataset.fadeInput === "in") segment.fadeIn = value;
  else segment.fadeOut = value;
  saveDraft();
  const clip = laneStack.querySelector(`.clip[data-index="${state.selectedIndex}"]`);
  if (clip) positionClip(clip, segment);
  drawWaveform();
}

function applyFadeInput(event) {
  previewFadeInput(event);
  renderTimeline();
  renderInspector();
}

function updateInspectorValues() {
  const segment = selectedSegment();
  const destination = clipInspector.querySelector('[data-inspector="destination"]');
  const duration = clipInspector.querySelector('[data-inspector="duration"]');
  const source = clipInspector.querySelector('[data-inspector="source"]');
  const fadeIn = clipInspector.querySelector('[data-fade-input="in"]');
  const fadeOut = clipInspector.querySelector('[data-fade-input="out"]');
  if (destination) destination.textContent = `${formatTime(segment.start)}–${formatTime(segment.end)}`;
  if (duration) duration.textContent = formatTime(segment.end - segment.start);
  if (source) source.textContent = segment.source;
  if (fadeIn) fadeIn.value = segment.fadeIn.toFixed(2);
  if (fadeOut) fadeOut.value = segment.fadeOut.toFixed(2);
}

function renderChanges() {
  changeList.innerHTML = currentSession().changes.map((change) => `<li>${change}</li>`).join("");
}

function drawBars(canvas, values, progress = -1, colors = {}) {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.floor(rect.width * dpr));
  canvas.height = Math.max(1, Math.floor(rect.height * dpr));
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  const width = rect.width;
  const height = rect.height;
  const center = height / 2;
  const amplitudeMax = Math.min(height * 0.48, height * 0.38 * state.zoomY);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = colors.background || "#0d1011";
  ctx.fillRect(0, 0, width, height);
  values.forEach((peak, index) => {
    const x = (index / values.length) * width;
    const barWidth = Math.max(1, (width / values.length) * 0.62);
    const amplitude = Math.max(1, peak * amplitudeMax);
    ctx.fillStyle = progress >= 0 && index / values.length <= progress
      ? (colors.played || "#d5ff3f")
      : (colors.base || "#394043");
    ctx.fillRect(x, center - amplitude, barWidth, amplitude * 2);
  });
}

function drawWaveform() {
  const session = currentSession();
  const rect = waveformCanvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  waveformCanvas.width = Math.max(1, Math.floor(rect.width * dpr));
  waveformCanvas.height = Math.max(1, Math.floor(rect.height * dpr));
  const ctx = waveformCanvas.getContext("2d");
  ctx.scale(dpr, dpr);
  const width = rect.width;
  const height = rect.height;
  const center = height / 2;
  ctx.fillStyle = "#0d1011";
  ctx.fillRect(0, 0, width, height);

  session.segments.forEach((segment) => {
    const source = sourceFor(segment);
    const values = source?.waveform || session.waveform;
    const left = (segment.start / session.duration) * width;
    const right = (segment.end / session.duration) * width;
    const clipWidth = Math.max(1, right - left);
    const color = segment.color || colorForSegment(segment);
    ctx.save();
    ctx.beginPath();
    ctx.rect(left, 0, clipWidth, height);
    ctx.clip();
    const audible = isSegmentAudible(segment);
    ctx.globalAlpha = audible ? (audio.currentTime >= segment.end ? 1 : 0.78) : 0.2;
    ctx.fillStyle = color;
    const steps = Math.max(2, Math.ceil(clipWidth / 2));
    const sourceIn = Number.isFinite(segment.sourceIn) ? segment.sourceIn : 0;
    const sourceOut = Number.isFinite(segment.sourceOut) ? segment.sourceOut : segment.end - segment.start;
    for (let index = 0; index < steps; index += 1) {
      const ratio = index / Math.max(1, steps - 1);
      const sourceTime = sourceIn + ratio * (sourceOut - sourceIn);
      const sourceRatio = source ? sourceTime / source.duration : ratio;
      const peak = values[Math.min(values.length - 1, Math.max(0, Math.floor(sourceRatio * values.length)))] || 0.08;
      const amplitude = Math.min(height * 0.47, Math.max(1, peak * height * 0.31 * state.zoomY));
      const x = left + ratio * clipWidth;
      ctx.fillRect(x, center - amplitude, Math.max(1, clipWidth / steps * 0.65), amplitude * 2);
    }
    ctx.globalAlpha = 1;
    ctx.fillRect(left, height - 4, clipWidth, 4);
    if (clipWidth > 54) {
      ctx.fillStyle = "rgba(8,10,11,.82)";
      ctx.fillRect(left + 4, 20, Math.min(clipWidth - 8, 126), 15);
      ctx.fillStyle = "#f4f6f2";
      ctx.font = "8px Segoe UI, sans-serif";
      ctx.fillText(segment.name.slice(0, 22), left + 8, 30, clipWidth - 15);
    }
    ctx.restore();
  });
}

function drawSpectrum() {
  if (!spectrumCanvas) return;
  const rect = spectrumCanvas.getBoundingClientRect();
  if (rect.width < 1 || rect.height < 1) return;
  const dpr = window.devicePixelRatio || 1;
  spectrumCanvas.width = Math.floor(rect.width * dpr);
  spectrumCanvas.height = Math.floor(rect.height * dpr);
  const ctx = spectrumCanvas.getContext("2d");
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, rect.width, rect.height);
  ctx.fillStyle = "#080c0d";
  ctx.fillRect(0, 0, rect.width, rect.height);

  let values = new Uint8Array(96);
  if (livePreview.analyser && livePreview.active) {
    const source = new Uint8Array(livePreview.analyser.frequencyBinCount);
    livePreview.analyser.getByteFrequencyData(source);
    values = Uint8Array.from({ length: 96 }, (_, index) => source[Math.floor((index / 95) ** 1.8 * (source.length - 1))]);
  }
  spectrumHistory.push(values);
  if (spectrumHistory.length > 16) spectrumHistory.shift();

  ctx.lineWidth = 1;
  spectrumHistory.forEach((row, rowIndex) => {
    const age = spectrumHistory.length - 1 - rowIndex;
    const inset = age * 1.7;
    const baseY = rect.height - 4 - age * 1.45;
    ctx.beginPath();
    row.forEach((value, index) => {
      const x = inset + (index / (row.length - 1)) * Math.max(1, rect.width - inset * 2);
      const y = baseY - (value / 255) * Math.max(7, rect.height * 0.62 - age * 0.8);
      if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = rowIndex === spectrumHistory.length - 1 ? "rgba(213,255,63,.95)" : `rgba(85,214,255,${Math.max(0.05, 0.32 - age * 0.016)})`;
    ctx.stroke();
  });
  const gradient = ctx.createLinearGradient(0, 0, rect.width, 0);
  gradient.addColorStop(0, "rgba(213,255,63,.08)");
  gradient.addColorStop(0.55, "rgba(85,214,255,.03)");
  gradient.addColorStop(1, "transparent");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, rect.width, rect.height);
}

function startSpectrumAnimation() {
  cancelAnimationFrame(spectrumAnimation);
  const tick = () => {
    drawSpectrum();
    if (!audio.paused) spectrumAnimation = requestAnimationFrame(tick);
  };
  tick();
}

function stopSpectrumAnimation() {
  cancelAnimationFrame(spectrumAnimation);
  spectrumAnimation = 0;
  drawSpectrum();
}

function updatePlayhead() {
  const session = currentSession();
  const progress = session.duration ? Math.min(1, audio.currentTime / session.duration) : 0;
  playhead.style.left = `${progress * 100}%`;
  currentTimeLabel.textContent = formatTime(audio.currentTime);
  const activeIndex = session.segments.findIndex((segment) => audio.currentTime >= segment.start && audio.currentTime < segment.end);
  laneStack.querySelectorAll(".clip").forEach((clip) => {
    clip.classList.toggle("now", Number(clip.dataset.index) === activeIndex && !audio.paused);
  });
  drawWaveform();
}

function seekFromEvent(event, element) {
  if (event.target.closest(".clip, .event-marker")) return;
  const rect = element.getBoundingClientRect();
  const content = element === waveformWrap ? waveformContent : laneContent;
  const localX = event.clientX - rect.left + element.scrollLeft;
  const ratio = Math.min(1, Math.max(0, localX / Math.max(1, content.getBoundingClientRect().width)));
  seekTo(ratio * currentSession().duration);
}

function seekTo(time) {
  const wasLive = livePreview.active && !audio.paused;
  audio.currentTime = clamp(time, 0, currentSession().duration);
  if (wasLive) startLivePreview();
  updatePlayhead();
}

let syncingTimelineScroll = false;
function synchronizeTimelineScroll(source, target) {
  if (syncingTimelineScroll) return;
  syncingTimelineScroll = true;
  target.scrollLeft = source.scrollLeft;
  requestAnimationFrame(() => { syncingTimelineScroll = false; });
}

function toggleEditMode() {
  audio.pause();
  stopLivePreview(true);
  state.editMode = !state.editMode;
  editModeButton.classList.toggle("active", state.editMode);
  editModeButton.lastChild.textContent = state.editMode ? " Edición activa" : " Activar edición";
  editModeButton.setAttribute("aria-pressed", String(state.editMode));
  renderTimeline();
  renderInspector();
  updateEditSummary();
}

function openSourceEditor() {
  const segment = selectedSegment();
  const source = sourceFor(segment);
  if (!source) return;
  state.sourceOpen = true;
  sourceDrawer.classList.add("open");
  sourceDrawer.setAttribute("aria-hidden", "false");
  document.querySelector(".editor").classList.add("drawer-open");
  document.querySelector("#source-title").textContent = `Original completo: ${source.name} · ${formatTime(source.duration)}`;
  sourcePreview.pause();
  sourcePreview.src = source.file;
  sourceInInput.max = source.duration;
  sourceOutInput.max = source.duration;
  requestAnimationFrame(() => {
    drawSourceWaveform();
    updateSourceEditorUI();
  });
}

function closeSourceEditor() {
  state.sourceOpen = false;
  sourcePreview.pause();
  sourceDrawer.classList.remove("open");
  sourceDrawer.setAttribute("aria-hidden", "true");
  document.querySelector(".editor")?.classList.remove("drawer-open");
  previewSourceButton.classList.remove("playing");
}

function drawSourceWaveform() {
  const source = sourceFor();
  if (!source) return;
  drawBars(sourceCanvas, source.waveform, -1, { background: "#111516", base: "#4a5356" });
}

function updateSourceEditorUI() {
  const segment = selectedSegment();
  const source = sourceFor(segment);
  if (!source) return;
  const left = (segment.sourceIn / source.duration) * 100;
  const width = ((segment.sourceOut - segment.sourceIn) / source.duration) * 100;
  sourceSelection.style.left = `${left}%`;
  sourceSelection.style.width = `${Math.max(0.15, width)}%`;
  sourceInInput.value = segment.sourceIn.toFixed(2);
  sourceOutInput.value = segment.sourceOut.toFixed(2);
  document.querySelector("#selection-label").textContent = `${formatTime(segment.sourceIn)}–${formatTime(segment.sourceOut)}`;
  document.querySelector("#source-duration-label").textContent = `Duración seleccionada ${formatTime(segment.sourceOut - segment.sourceIn)}`;
  updateInspectorValues();
  const clip = laneStack.querySelector(`.clip[data-index="${state.selectedIndex}"]`);
  if (clip) positionClip(clip, segment);
  drawWaveform();
}

function syncClipDurationToSource(segment) {
  const wanted = segment.sourceOut - segment.sourceIn;
  const available = currentSession().duration - segment.start;
  const actual = Math.min(wanted, available);
  segment.end = roundTime(segment.start + actual);
  if (actual < wanted) segment.sourceOut = roundTime(segment.sourceIn + actual);
  normalizeFades(segment);
  refreshSourceText(segment);
}

function startSourceDrag(event) {
  if (event.button !== 0) return;
  event.preventDefault();
  event.stopPropagation();
  const segment = selectedSegment();
  const source = sourceFor(segment);
  if (!source) return;
  const handle = event.target.closest("[data-source-handle]");
  const action = handle?.dataset.sourceHandle || "move";
  const initial = { ...segment };
  const startX = event.clientX;
  const rect = document.querySelector(".source-editor").getBoundingClientRect();
  sourceSelection.setPointerCapture(event.pointerId);

  const move = (moveEvent) => {
    const delta = ((moveEvent.clientX - startX) / rect.width) * source.duration;
    if (action === "left") {
      segment.sourceIn = roundTime(clamp(initial.sourceIn + delta, 0, initial.sourceOut - 0.25));
      syncClipDurationToSource(segment);
    } else if (action === "right") {
      segment.sourceOut = roundTime(clamp(initial.sourceOut + delta, initial.sourceIn + 0.25, source.duration));
      syncClipDurationToSource(segment);
    } else {
      const length = initial.sourceOut - initial.sourceIn;
      const nextIn = clamp(initial.sourceIn + delta, 0, source.duration - length);
      segment.sourceIn = roundTime(nextIn);
      segment.sourceOut = roundTime(nextIn + length);
      refreshSourceText(segment);
    }
    updateSourceEditorUI();
  };
  const end = () => {
    sourceSelection.removeEventListener("pointermove", move);
    sourceSelection.removeEventListener("pointerup", end);
    sourceSelection.removeEventListener("pointercancel", end);
    saveDraft();
    renderTimeline();
    renderInspector();
    updateSourceEditorUI();
  };
  sourceSelection.addEventListener("pointermove", move);
  sourceSelection.addEventListener("pointerup", end);
  sourceSelection.addEventListener("pointercancel", end);
}

function applySourceInputs() {
  const segment = selectedSegment();
  const source = sourceFor(segment);
  if (!source) return;
  const nextIn = clamp(Number(sourceInInput.value), 0, source.duration - 0.25);
  const nextOut = clamp(Number(sourceOutInput.value), nextIn + 0.25, source.duration);
  segment.sourceIn = roundTime(nextIn);
  segment.sourceOut = roundTime(nextOut);
  syncClipDurationToSource(segment);
  saveDraft();
  renderTimeline();
  renderInspector();
  updateSourceEditorUI();
}

async function previewSourceSelection() {
  const segment = selectedSegment();
  const source = sourceFor(segment);
  if (!source) return;
  if (!sourcePreview.paused) {
    sourcePreview.pause();
    return;
  }
  if (!sourcePreview.src.endsWith(encodeURI(source.file).replace(/^.*?\.\./, ""))) sourcePreview.src = source.file;
  sourcePreview.currentTime = segment.sourceIn;
  await sourcePreview.play();
}

function exportEdits() {
  const session = currentSession();
  const payload = {
    project: data.project,
    session: session.title,
    duration: session.duration,
    exportedAt: new Date().toISOString(),
    events: session.events.map((event) => ({ ...event, time: roundTime(event.time), duration: roundTime(event.duration) })),
    segments: session.segments.map((segment) => ({
      name: segment.name,
      artist: segment.artist,
      destinationStart: roundTime(segment.start),
      destinationEnd: roundTime(segment.end),
      sourceFile: sourceFor(segment)?.file || null,
      sourceIn: Number.isFinite(segment.sourceIn) ? roundTime(segment.sourceIn) : null,
      sourceOut: Number.isFinite(segment.sourceOut) ? roundTime(segment.sourceOut) : null,
      fadeIn: roundTime(segment.fadeIn),
      fadeOut: roundTime(segment.fadeOut),
      fadeCurve: segment.fadeCurve,
      gainDb: roundTime(segment.gainDb),
      bpm: segment.bpm,
      effects: segment.fx,
      transition: segment.transition,
    })),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${session.title.replace(/[^a-z0-9áéíóúñ]+/gi, "-").replace(/^-|-$/g, "")}-cortes.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

function createGatedBuffer(context, buffer, thresholdDb) {
  const output = context.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
  const threshold = 10 ** (thresholdDb / 20);
  const attack = Math.exp(-1 / (0.002 * buffer.sampleRate));
  const release = Math.exp(-1 / (0.08 * buffer.sampleRate));
  let envelope = 0;
  const inputs = Array.from({ length: buffer.numberOfChannels }, (_, channel) => buffer.getChannelData(channel));
  const outputs = Array.from({ length: buffer.numberOfChannels }, (_, channel) => output.getChannelData(channel));
  for (let index = 0; index < buffer.length; index += 1) {
    let detector = 0;
    for (let channel = 0; channel < inputs.length; channel += 1) detector = Math.max(detector, Math.abs(inputs[channel][index]));
    const target = detector >= threshold ? 1 : 0;
    const coefficient = target > envelope ? attack : release;
    envelope = target + coefficient * (envelope - target);
    for (let channel = 0; channel < inputs.length; channel += 1) outputs[channel][index] = inputs[channel][index] * envelope;
  }
  return output;
}

function encodeWav24(buffer) {
  const channels = buffer.numberOfChannels;
  const bytesPerSample = 3;
  const dataSize = buffer.length * channels * bytesPerSample;
  const arrayBuffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(arrayBuffer);
  const writeText = (offset, text) => [...text].forEach((character, index) => view.setUint8(offset + index, character.charCodeAt(0)));
  writeText(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeText(8, "WAVE");
  writeText(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * channels * bytesPerSample, true);
  view.setUint16(32, channels * bytesPerSample, true);
  view.setUint16(34, 24, true);
  writeText(36, "data");
  view.setUint32(40, dataSize, true);
  const channelData = Array.from({ length: channels }, (_, channel) => buffer.getChannelData(channel));
  let offset = 44;
  for (let index = 0; index < buffer.length; index += 1) {
    for (let channel = 0; channel < channels; channel += 1) {
      const sample = clamp(channelData[channel][index], -1, 1);
      let value = Math.round(sample < 0 ? sample * 8388608 : sample * 8388607);
      if (value < 0) value += 16777216;
      view.setUint8(offset, value & 255);
      view.setUint8(offset + 1, (value >> 8) & 255);
      view.setUint8(offset + 2, (value >> 16) & 255);
      offset += 3;
    }
  }
  return new Blob([arrayBuffer], { type: "audio/wav" });
}

async function renderHighQualityMix() {
  const session = currentSession();
  const missing = session.segments.filter((segment) => !sourceFor(segment));
  if (missing.length) {
    showToast("Faltan fuentes originales para renderizar esta sesión");
    return;
  }
  const overlay = document.querySelector("#render-progress");
  const status = document.querySelector("#render-status");
  overlay.classList.add("show");
  try {
    status.textContent = "Cargando y decodificando las canciones originales…";
    await prepareLivePreview();
    const sampleRate = 48000;
    const frameCount = Math.round(session.duration * sampleRate);
    const context = new OfflineAudioContext(2, frameCount, sampleRate);
    const limiter = context.createDynamicsCompressor();
    limiter.threshold.value = -1;
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.12;
    limiter.connect(context.destination);

    session.segments.forEach((segment) => {
      const source = sourceFor(segment);
      const decoded = livePreview.buffers.get(source.file);
      if (!decoded || typeof decoded.then === "function") throw new Error(`Fuente no preparada: ${source.name}`);
      const node = context.createBufferSource();
      node.buffer = effectIsActive(segment, "gate") ? createGatedBuffer(context, decoded, segment.fx.gateThreshold) : decoded;
      const envelope = context.createGain();
      const duration = Math.min(segment.end - segment.start, segment.sourceOut - segment.sourceIn, decoded.duration - segment.sourceIn);
      if (!Number.isFinite(duration) || duration <= 0.01) return;
      const sampleCount = Math.max(32, Math.min(512, Math.ceil(duration * 12)));
      const curve = new Float32Array(sampleCount);
      for (let index = 0; index < sampleCount; index += 1) curve[index] = gainAt(segment, (index / (sampleCount - 1)) * duration);
      envelope.gain.setValueCurveAtTime(curve, segment.start, Math.max(0.02, duration));
      connectProcessingGraph(context, node, segment, envelope, limiter);
      node.start(segment.start, segment.sourceIn, duration);
    });

    status.textContent = "Mezclando estéreo, automatizaciones, efectos y limitador…";
    const rendered = await context.startRendering();
    status.textContent = "Codificando WAV PCM de 24 bits…";
    const blob = encodeWav24(rendered);
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${session.title.replace(/[^a-z0-9áéíóúñ]+/gi, "-").replace(/^-|-$/g, "")}-MASTER-48kHz-24bit.wav`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 2000);
    showToast("Master WAV de alta calidad exportado");
  } catch (error) {
    console.error("No fue posible renderizar el master", error);
    showToast("No se pudo exportar: revisa las fuentes y vuelve a intentar");
  } finally {
    overlay.classList.remove("show");
  }
}

function resetDraft() {
  const original = INITIAL_DATA.sessions.find((session) => session.id === state.sessionId);
  const session = currentSession();
  session.segments = structuredClone(original.segments);
  session.events = [];
  session.duration = original.duration;
  applySessionDefaults(session);
  state.selectedIndex = 0;
  saveDraft();
  closeSourceEditor();
  renderTimeline();
  renderInspector();
}

playButton.addEventListener("click", async () => {
  if (!audio.paused) {
    audio.pause();
    return;
  }
  if ((IS_PUBLIC_HOST || currentSession().custom) && !canLivePreview()) {
    showToast("Carga tus canciones y reemplaza las fuentes de la sesión para escuchar el mix");
    return;
  }
  if (canLivePreview()) {
    playButton.classList.add("loading");
    try {
      await prepareLivePreview();
      audio.muted = true;
      await audio.play();
      await startLivePreview();
    } catch (error) {
      console.warn("La preescucha editable no pudo iniciarse; se usará el master", error);
      audio.muted = false;
      await audio.play();
    } finally {
      playButton.classList.remove("loading");
    }
  } else {
    audio.muted = false;
    await audio.play();
  }
});
document.querySelector("#previous-button").addEventListener("click", () => seekTo(audio.currentTime - 5));
document.querySelector("#next-button").addEventListener("click", () => seekTo(audio.currentTime + 5));
document.querySelector("#stop-button").addEventListener("click", () => {
  audio.pause();
  seekTo(0);
});
document.querySelector("#volume-slider").addEventListener("input", (event) => {
  audio.volume = Number(event.target.value);
  if (livePreview.output) livePreview.output.gain.value = Number(event.target.value) * 0.82;
});
document.querySelectorAll(".mode").forEach((button) => button.addEventListener("click", () => setMode(button.dataset.mode)));
editModeButton.addEventListener("click", toggleEditMode);
waveformWrap.addEventListener("click", (event) => seekFromEvent(event, waveformWrap));
laneStack.addEventListener("click", (event) => seekFromEvent(event, laneStack));
waveformWrap.addEventListener("scroll", () => {
  synchronizeTimelineScroll(waveformWrap, laneStack);
  scheduleWorkspaceSave();
});
laneStack.addEventListener("scroll", () => {
  synchronizeTimelineScroll(laneStack, waveformWrap);
  trackControlRail.scrollTop = laneStack.scrollTop;
  updateTrackNavViewport();
  scheduleWorkspaceSave();
});
trackControlRail.addEventListener("click", (event) => {
  const selector = event.target.closest("[data-track-select]");
  const action = event.target.closest("[data-track-action]");
  if (selector) selectTrackIndex(Number(selector.dataset.trackSelect), { center: false });
  if (action) updateTrackMonitoring(Number(action.dataset.trackIndex), action.dataset.trackAction);
});
trackControlRail.addEventListener("input", (event) => {
  const input = event.target.closest("[data-track-gain]");
  if (!input) return;
  const index = Number(input.dataset.trackGain);
  const segment = currentSession().segments[index];
  if (!segment) return;
  segment.gainDb = Number(input.value);
  const output = input.parentElement.querySelector("output");
  if (output) output.textContent = `${segment.gainDb >= 0 ? "+" : ""}${segment.gainDb.toFixed(1)}`;
  const clip = laneStack.querySelector(`.clip[data-index="${index}"]`);
  if (clip) positionClip(clip, segment);
  drawWaveform();
});
trackControlRail.addEventListener("change", (event) => {
  if (!event.target.closest("[data-track-gain]")) return;
  saveDraft();
  renderInspector();
  refreshLivePreview();
});
trackControlRail.addEventListener("wheel", (event) => {
  if (!event.deltaY) return;
  event.preventDefault();
  laneStack.scrollTop += event.deltaY;
}, { passive: false });
waveformWrap.addEventListener("wheel", (event) => {
  if (!event.shiftKey && Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
  event.preventDefault();
  waveformWrap.scrollLeft += event.deltaX || event.deltaY;
}, { passive: false });
zoomXInput.addEventListener("input", (event) => {
  setTimelineZoom(event.target.value);
});
zoomYInput.addEventListener("input", (event) => {
  state.zoomY = clamp(Number(event.target.value) || 1, 0.75, 4);
  document.querySelector("#zoom-y-value").textContent = formatZoom(state.zoomY);
  drawWaveform();
  if (state.sourceOpen) drawSourceWaveform();
  drawFxAnalyzer();
  scheduleWorkspaceSave();
});
document.querySelector("#zoom-reset").addEventListener("click", () => {
  state.zoomY = 1;
  zoomYInput.value = "1";
  setTimelineZoom(1, { preserveAnchor: false });
  if (state.sourceOpen) drawSourceWaveform();
});
document.querySelector("#timeline-zoom-out").addEventListener("click", () => setTimelineZoom(state.zoomX - 0.5));
document.querySelector("#timeline-zoom-in").addEventListener("click", () => setTimelineZoom(state.zoomX + 0.5));
document.querySelector("#timeline-height-out").addEventListener("click", () => setLaneHeight(state.laneHeight - 8));
document.querySelector("#timeline-height-in").addEventListener("click", () => setLaneHeight(state.laneHeight + 8));
document.querySelector("#timeline-zoom-fit").addEventListener("click", () => {
  setTimelineZoom(1, { preserveAnchor: false });
  laneStack.scrollLeft = 0;
  waveformWrap.scrollLeft = 0;
});
document.querySelector("#toggle-sidebar").addEventListener("click", () => {
  state.leftPanelOpen = !state.leftPanelOpen;
  syncSidePanels();
  saveWorkspaceView();
});
document.querySelector("#toggle-inspector").addEventListener("click", () => {
  state.rightPanelOpen = !state.rightPanelOpen;
  syncSidePanels();
  saveWorkspaceView();
});
document.querySelector("#open-source-button").addEventListener("click", openSourceEditor);
document.querySelector("#close-source-button").addEventListener("click", closeSourceEditor);
document.querySelector("#use-full-source-button").addEventListener("click", useFullSource);
document.querySelector("#fit-source-button").addEventListener("click", () => {
  syncClipDurationToSource(selectedSegment());
  saveDraft();
  renderTimeline();
  renderInspector();
  updateSourceEditorUI();
});
document.querySelector("#export-edl-button").addEventListener("click", exportEdits);
document.querySelector("#export-wav-button").addEventListener("click", renderHighQualityMix);
document.querySelector("#reset-draft-button").addEventListener("click", resetDraft);
document.querySelector("#save-exact-button").addEventListener("click", saveExactSession);
document.querySelector("#restore-exact-button").addEventListener("click", restoreExactSession);
document.querySelector("#duplicate-clip-button").addEventListener("click", duplicateSelectedClip);
document.querySelector("#remove-clip-button").addEventListener("click", removeSelectedClip);
document.querySelector("#import-button").addEventListener("click", () => {
  state.uploadMode = "add";
  audioUpload.click();
});
selectAllSourcesButton.addEventListener("click", toggleAllLibrarySources);
autoMixButton.addEventListener("click", createAutomaticMix);
document.querySelector("#replace-source-button").addEventListener("click", () => {
  state.uploadMode = "replace";
  audioUpload.click();
});
document.querySelector("#snap-button").addEventListener("click", (event) => {
  state.snapMode = !state.snapMode;
  event.currentTarget.classList.toggle("active", state.snapMode);
  event.currentTarget.setAttribute("aria-pressed", String(state.snapMode));
  event.currentTarget.textContent = state.snapMode ? "Imán activo" : "Imán libre";
});
document.querySelector("#snap-grid-select").addEventListener("change", (event) => {
  state.snapGrid = event.target.value;
  if (!state.snapMode) document.querySelector("#snap-button").click();
  renderBeatGrid();
  showToast(`Imán: ${event.target.options[event.target.selectedIndex].text}`);
});
document.querySelector("#split-button").addEventListener("click", splitClipAtCursor);
document.querySelector("#align-button").addEventListener("click", () => applyTransition("short"));
document.querySelector("#smart-transition-button").addEventListener("click", prepareSmartTransition);
document.querySelector("#audition-button").addEventListener("click", auditionTransition);
document.querySelector("#undo-button").addEventListener("click", undoEdit);
document.querySelector("#redo-button").addEventListener("click", redoEdit);
document.querySelector("#phrase-align-button").addEventListener("click", alignSelectedPhrase);
document.querySelector("#beat-lock-button").addEventListener("click", alignSelectedPhrase);
document.querySelector("#detect-beat-button").addEventListener("click", detectBeatAnchor);
document.querySelector("#snap-source-beat-button").addEventListener("click", snapSourceCutToBeat);
document.querySelectorAll("[data-nudge]").forEach((button) => button.addEventListener("click", () => nudgeSelectedClip(Number(button.dataset.nudge))));
document.querySelectorAll("[data-add-event]").forEach((button) => button.addEventListener("click", () => addTimelineEvent(button.dataset.addEvent)));
document.querySelectorAll("[data-live-fx]").forEach((input) => input.addEventListener("input", handleLiveFxInput));
document.querySelector("#live-delay-division").addEventListener("change", (event) => {
  state.liveFx.delayBeats = Number(event.target.value) || 1;
  applyLiveFxValues();
  if (state.fxRecord && !audio.paused) writeFxAutomation({ recorded: true });
});
document.querySelector("#fx-record-button").addEventListener("click", () => {
  state.fxRecord = !state.fxRecord;
  state.lastFxRecordTime = -1;
  updateLiveFxConsole();
  showToast(state.fxRecord ? "Grabación FX activa: mueve las perillas durante la reproducción" : "Grabación FX detenida");
});
document.querySelector("#fx-snapshot-button").addEventListener("click", () => writeFxAutomation());
document.querySelector("#fx-reset-button").addEventListener("click", resetLiveFx);
document.querySelectorAll("[data-fx-punch]").forEach((button) => button.addEventListener("click", () => punchLiveEffect(button.dataset.fxPunch)));
document.querySelector("#track-select").addEventListener("change", (event) => selectTrackIndex(Number(event.target.value)));
document.querySelector("#track-previous-button").addEventListener("click", () => selectTrackIndex(state.selectedIndex - 1));
document.querySelector("#track-next-button").addEventListener("click", () => selectTrackIndex(state.selectedIndex + 1));
document.querySelector("#track-center-button").addEventListener("click", centerSelectedTrack);
document.querySelector("#loudness-match-button").addEventListener("click", matchTrackLoudness);
document.querySelector("#mute-all-button").addEventListener("click", () => {
  const segments = currentSession().segments;
  const shouldMute = !segments.every((segment) => segment.muted);
  segments.forEach((segment) => { segment.muted = shouldMute; segment.solo = false; });
  saveDraft(); renderTimeline(); renderInspector(); refreshLivePreview();
  showToast(shouldMute ? "Todas las pistas están muteadas" : "Todas las pistas están activas");
});
document.querySelector("#solo-selected-button").addEventListener("click", () => {
  const selected = selectedSegment();
  currentSession().segments.forEach((segment) => { segment.solo = segment === selected; segment.muted = false; });
  saveDraft(); renderTimeline(); renderInspector(); refreshLivePreview();
  showToast(`${selected.name} queda sonando sola`);
});
document.querySelector("#clear-monitoring-button").addEventListener("click", () => {
  currentSession().segments.forEach((segment) => { segment.muted = false; segment.solo = false; });
  saveDraft(); renderTimeline(); renderInspector(); refreshLivePreview();
  showToast("Escucha normal restaurada");
});
document.querySelector("#production-dock-toggle").addEventListener("click", () => toggleProductionDock());
document.querySelector("#new-session-button").addEventListener("click", () => toggleNewSessionForm());
document.querySelector("#cancel-session-button").addEventListener("click", () => toggleNewSessionForm(false));
document.querySelector("#new-session-form").addEventListener("submit", createNewSession);
document.querySelector("#export-session-button").addEventListener("click", exportPortableSession);
document.querySelector("#import-session-button").addEventListener("click", () => sessionPackageInput.click());
sessionPackageInput.addEventListener("change", importPortableSession);
audioUpload.addEventListener("change", handleAudioUpload);
sourceSelection.addEventListener("pointerdown", startSourceDrag);
sourceInInput.addEventListener("change", applySourceInputs);
sourceOutInput.addEventListener("change", applySourceInputs);
previewSourceButton.addEventListener("click", previewSourceSelection);
sourcePreview.addEventListener("play", () => previewSourceButton.classList.add("playing"));
sourcePreview.addEventListener("pause", () => previewSourceButton.classList.remove("playing"));
sourcePreview.addEventListener("timeupdate", () => {
  const segment = selectedSegment();
  if (segment && sourcePreview.currentTime >= segment.sourceOut) sourcePreview.pause();
});
audio.addEventListener("play", () => {
  playButton.classList.add("playing");
  startSpectrumAnimation();
});
audio.addEventListener("pause", () => {
  playButton.classList.remove("playing");
  stopLivePreview();
  stopSpectrumAnimation();
  saveWorkspaceView();
});
audio.addEventListener("timeupdate", () => {
  updatePlayhead();
  if (Number.isFinite(state.auditionEnd) && audio.currentTime >= state.auditionEnd) {
    state.auditionEnd = null;
    audio.pause();
  }
});
audio.addEventListener("ended", () => {
  playButton.classList.remove("playing");
  stopLivePreview(true);
  stopSpectrumAnimation();
});
window.addEventListener("resize", () => {
  applyTimelineZoom();
  if (state.sourceOpen) drawSourceWaveform();
  drawFxAnalyzer();
  drawSpectrum();
});
window.addEventListener("beforeunload", saveWorkspaceView);
window.addEventListener("keydown", (event) => {
  const isTyping = ["INPUT", "SELECT", "TEXTAREA"].includes(event.target.tagName) || event.target.isContentEditable;
  const commandKey = event.ctrlKey || event.metaKey;
  if (commandKey && !isTyping && event.key.toLowerCase() === "z") {
    event.preventDefault();
    if (event.shiftKey) redoEdit();
    else undoEdit();
    return;
  }
  if (commandKey && !isTyping && event.key.toLowerCase() === "y") {
    event.preventDefault();
    redoEdit();
    return;
  }
  if (event.code === "Space" && !isTyping) {
    event.preventDefault();
    playButton.click();
  }
  if (event.key.toLowerCase() === "s" && !isTyping && !event.ctrlKey && !event.metaKey && !event.altKey) {
    event.preventDefault();
    splitClipAtCursor();
  }
  const eventShortcut = { c: "cue", e: "echo", f: "filter", d: "dip" }[event.key.toLowerCase()];
  if (!isTyping && !event.ctrlKey && !event.metaKey && !event.altKey && eventShortcut) {
    event.preventDefault();
    addTimelineEvent(eventShortcut);
  }
  if (event.key === "Escape" && state.sourceOpen) closeSourceEditor();
  if (event.shiftKey && event.key.toLowerCase() === "p" && !isTyping) {
    event.preventDefault();
    toggleProductionDock();
  }
});

async function bootstrap() {
  loadCustomSessions();
  data.sessions.forEach(applySessionDefaults);
  loadDrafts();
  loadWorkspaceView();
  data.sessions.forEach(applySessionDefaults);
  data.sessions.forEach((session) => ensureHistory(session));
  await loadImportedLibrary();
  document.querySelector("#sync-label").textContent = `Actualizado ${new Date(data.generatedAt).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" })}`;
  renderLibrary();
  renderSessions();
  renderWorkspace();
  updateHistoryUI();
  restoreWorkspaceViewport();
  drawSpectrum();
}

bootstrap();
