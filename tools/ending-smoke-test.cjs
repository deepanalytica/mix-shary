const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

const app = fs.readFileSync(path.join(__dirname, "..", "ui", "app.js"), "utf8");
const start = app.indexOf("function lastMixSegment()");
const end = app.indexOf("function selectedEvent()", start);
assert.ok(start >= 0 && end > start, "ending functions must be present");

const sourceSegment = {
  id: "last", name: "Last song", start: 12, end: 20,
  sourceIn: 30, sourceOut: 38, fadeOut: 0.8, bpm: 120,
};
const session = { id: "test", duration: 24, events: [], segments: [sourceSegment] };
const state = { selectedEventId: null };
const context = {
  session, state, Math, Date,
  currentSession: () => session,
  selectedSegment: () => sourceSegment,
  beatSeconds: () => 0.5,
  roundTime: (value) => Math.round(value * 100) / 100,
  defaultEventParams: (type) => type === "echo" ? { feedback: 0.42 } : {},
  showToast: () => {},
  saveDraft: () => {},
  renderWorkspace: () => {},
  seekTo: () => {},
  saveWorkspaceView: () => {},
  audio: { pause: () => {} },
};
vm.runInNewContext(`${app.slice(start, end)}\nthis.ending = { applyMixEnding, clearMixEnding, getEndingMarker, restoreEndingPreview };`, context);

const cut = { mode: "cut", beats: 4, filter: "none", division: 1, tail: 1.5 };
assert.equal(context.ending.applyMixEnding(cut, { persist: false }), true);
assert.equal(session.duration, 20, "dry cut should remove trailing silence");
assert.equal(sourceSegment.fadeOut, 0.035, "dry cut should de-click the final edge");
assert.equal(session.events.length, 1, "dry cut should create only its ending marker");
assert.equal(sourceSegment.sourceIn, 30, "original audio must remain untouched");

const echo = { mode: "echo", beats: 8, filter: "lowpass", division: 0.5, tail: 1.5 };
assert.equal(context.ending.applyMixEnding(echo, { persist: false }), true);
assert.equal(session.duration, 21.5, "echo tail should extend the render");
assert.equal(session.events.length, 3, "reapply should replace, not stack, ending events");
assert.equal(session.events.filter((event) => event.type === "echo").length, 1);
assert.equal(session.events.filter((event) => event.type === "filter").length, 1);

assert.equal(context.ending.clearMixEnding({ persist: false }), true);
assert.equal(session.duration, 24, "removal should restore the previous duration");
assert.equal(sourceSegment.fadeOut, 0.8, "removal should restore the original fade");
assert.equal(session.events.length, 0, "removal should clear all generated ending events");

context.endingPreviewSnapshot = {
  sessionId: "test", cursor: 9, duration: 24, events: [],
  fades: new Map([["last", 0.8]]), selectedEventId: null,
};
context.ending.applyMixEnding(echo, { persist: false });
context.ending.restoreEndingPreview();
assert.equal(session.duration, 24, "temporary audition should not alter the stored timeline");
assert.equal(session.events.length, 0, "temporary audition should remove temporary FX");
assert.equal(sourceSegment.fadeOut, 0.8, "temporary audition should restore the fade");
console.log("Ending builder smoke test passed");
