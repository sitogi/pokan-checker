const HTML = `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>おくちポカンチェッカー</title>
  <style>
    :root {
      color-scheme: light;
      --bgA: #fff4c7;
      --bgB: #ffe3f1;
      --ink: #24324a;
      --muted: #4c5a76;
      --surface: #ffffff;
      --border: #d9e0ff;
      --shadow: 0 14px 30px rgba(58, 75, 140, 0.18);
      --accentMouthA: #ffb347;
      --accentMouthB: #ff5e62;
      --accentFaceA: #74c0ff;
      --accentFaceB: #4d7cff;
      --accentGood: #4cd964;
      --accentWarn: #ff9f43;
      --accentAlert: #ff4d6d;
      --gaugeTrack: rgba(255, 255, 255, 0.75);
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      min-height: 100vh;
      font-family: "Hiragino Kaku Gothic ProN", "Hiragino Sans", "Noto Sans JP", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: var(--ink);
      background:
        radial-gradient(1200px 500px at -10% -20%, #fff7d9 20%, rgba(255, 247, 217, 0) 60%),
        radial-gradient(900px 500px at 120% -10%, #ffdff0 10%, rgba(255, 223, 240, 0) 60%),
        linear-gradient(135deg, var(--bgA), var(--bgB));
      padding: 18px 14px 40px;
    }

    #app {
      max-width: 760px;
      margin: 0 auto;
      display: grid;
      gap: 16px;
    }

    .hero {
      display: grid;
      gap: 12px;
      background: var(--surface);
      border: 2px solid var(--border);
      border-radius: 22px;
      padding: 18px;
      box-shadow: var(--shadow);
    }

    .hero h1 {
      margin: 0;
      font-size: clamp(26px, 5vw, 36px);
      letter-spacing: 0.02em;
    }

    .hero-sub {
      margin: 4px 0 0;
      color: var(--muted);
      font-size: 14px;
    }

    .hero-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .btn {
      border: none;
      border-radius: 16px;
      padding: 16px 14px;
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 0.02em;
      cursor: pointer;
      transition: transform 120ms ease, filter 120ms ease, box-shadow 120ms ease;
      box-shadow: 0 8px 18px rgba(44, 62, 130, 0.18);
    }

    .btn:active {
      transform: translateY(1px) scale(0.995);
      filter: brightness(0.98);
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
      filter: none;
      box-shadow: none;
    }

    .btn-start {
      color: #fff;
      background: linear-gradient(135deg, #ff9a5a, #ff5f7d 55%, #ff4d6d);
    }

    .btn-stop {
      color: #283655;
      background: linear-gradient(135deg, #dbe4ff, #c9d6ff);
    }

    .stage {
      display: grid;
      gap: 12px;
    }

    .stage-actions {
      display: flex;
      justify-content: center;
    }

    .video-card {
      position: relative;
      border-radius: 26px;
      overflow: hidden;
      border: 3px solid #ffffff;
      box-shadow: var(--shadow);
      background: #0f172a;
      height: clamp(380px, 62vh, 640px);
    }

    video {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      background: #0f172a;
      object-fit: cover;
      transform: scaleX(-1);
    }

    .overlay {
      position: absolute;
      inset: 0;
      display: grid;
      grid-template-rows: auto 1fr auto;
      padding: 8px;
      pointer-events: none;
      gap: 12px;
      background: rgba(15, 23, 42, 0.28);
    }

    .btn-stage {
      width: min(96%, 520px);
      padding: 18px 18px;
      font-size: clamp(24px, 6vw, 32px);
      border-radius: 28px;
      border: 3px solid #ffffff;
      box-shadow: 0 18px 36px rgba(255, 88, 128, 0.42);
    }

    .btn-stage[data-state="idle"] {
      background: linear-gradient(135deg, #ffb36b, #ff6f91 55%, #ff4d6d);
      color: #ffffff;
    }

    .btn-stage[data-state="starting"] {
      background: linear-gradient(135deg, #ffd36a, #ffb347 60%, #ff9f43);
      color: #3a2a00;
      box-shadow: 0 18px 36px rgba(255, 179, 71, 0.42);
    }

    .btn-stage[data-state="running"] {
      background: linear-gradient(135deg, #8aa4ff, #5b7cfa 55%, #4d7cff);
      color: #ffffff;
      box-shadow: 0 18px 36px rgba(77, 124, 255, 0.42);
    }

    .status-bubble {
      justify-self: center;
      width: min(100%, 520px);
      background: rgba(255, 255, 255, 0.92);
      border: 2px solid rgba(255, 255, 255, 0.9);
      border-radius: 18px;
      padding: 10px 14px;
      text-align: center;
      box-shadow: 0 10px 24px rgba(31, 45, 99, 0.22);
      transition: transform 180ms ease, background 180ms ease, border-color 180ms ease;
      pointer-events: none;
      align-self: start;
      margin-top: 0;
    }

    .status-bubble[data-kind="idle"] {
      background: rgba(255, 255, 255, 0.95);
    }

    .status-bubble[data-kind="watching"] {
      background: rgba(238, 255, 245, 0.95);
      border-color: rgba(131, 224, 162, 0.95);
    }

    .status-bubble[data-kind="mouth-warning"],
    .status-bubble[data-kind="no-face-warning"] {
      background: rgba(255, 247, 230, 0.96);
      border-color: rgba(255, 190, 102, 0.95);
      transform: translateY(-1px);
    }

    .status-bubble[data-kind="mouth-alert"],
    .status-bubble[data-kind="no-face-alert"] {
      background: rgba(255, 232, 238, 0.97);
      border-color: rgba(255, 112, 150, 0.95);
      transform: translateY(-2px) scale(1.01);
    }

    .status-title {
      font-size: clamp(20px, 4.6vw, 28px);
      font-weight: 800;
      line-height: 1.2;
    }

    .status-sub {
      margin-top: 2px;
      color: var(--muted);
      font-size: 13px;
      font-weight: 600;
    }

    .gauges {
      display: grid;
      gap: 8px;
      background: rgba(21, 28, 55, 0.45);
      border: 1px solid rgba(255, 255, 255, 0.25);
      border-radius: 16px;
      padding: 10px;
      backdrop-filter: blur(6px);
      align-self: end;
      pointer-events: none;
    }

    .gauge {
      display: grid;
      gap: 6px;
    }

    .gauge-head {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      color: #f4f7ff;
      text-shadow: 0 2px 6px rgba(14, 18, 40, 0.55);
      font-weight: 800;
      letter-spacing: 0.02em;
      font-size: 13px;
    }

    .gauge-count {
      font-size: 12px;
      opacity: 0.92;
      font-weight: 700;
    }

    .gauge-track {
      position: relative;
      height: 16px;
      border-radius: 999px;
      background: var(--gaugeTrack);
      overflow: hidden;
      border: 2px solid rgba(255, 255, 255, 0.9);
    }

    .gauge-fill {
      height: 100%;
      width: 100%;
      transform-origin: left center;
      transform: scaleX(0);
      transition: transform 120ms linear;
      border-radius: 999px;
    }

    .gauge-mouth .gauge-fill {
      background: linear-gradient(90deg, var(--accentMouthA), var(--accentMouthB));
    }

    .gauge-face .gauge-fill {
      background: linear-gradient(90deg, var(--accentFaceA), var(--accentFaceB));
    }

    .panel {
      background: var(--surface);
      border: 2px solid var(--border);
      border-radius: 20px;
      padding: 14px;
      box-shadow: var(--shadow);
      display: grid;
      gap: 10px;
    }

    .panel-title {
      font-weight: 800;
      font-size: 16px;
      letter-spacing: 0.02em;
    }

    .settings-grid {
      display: grid;
      gap: 10px;
    }

    .field {
      display: grid;
      gap: 6px;
      background: #f8f9ff;
      border: 2px solid #e2e7ff;
      border-radius: 16px;
      padding: 10px;
    }

    .field-label {
      font-size: 13px;
      font-weight: 800;
      color: #31406b;
      letter-spacing: 0.01em;
    }

    .field-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .field-note {
      font-size: 12px;
      color: var(--muted);
    }

    .field-row .value {
      min-width: 52px;
      text-align: right;
      font-weight: 800;
      color: #24324a;
      background: #ffffff;
      border: 2px solid #dfe6ff;
      border-radius: 12px;
      padding: 4px 8px;
      font-size: 13px;
    }

    input[type="range"] {
      width: 100%;
      height: 12px;
      border-radius: 999px;
      background: linear-gradient(90deg, #ffd2a8, #ffb0c6);
      outline: none;
      border: 2px solid #fff;
      box-shadow: inset 0 2px 6px rgba(64, 37, 72, 0.18);
      appearance: none;
    }

    input[type="range"]::-webkit-slider-thumb {
      appearance: none;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: #ffffff;
      border: 3px solid #ff7a9c;
      box-shadow: 0 6px 14px rgba(255, 122, 156, 0.35);
      cursor: pointer;
    }

    input[type="number"],
    select {
      width: 100%;
      padding: 10px 12px;
      font-size: 16px;
      border-radius: 14px;
      border: 2px solid #dfe6ff;
      background: #ffffff;
      color: var(--ink);
      font-weight: 700;
    }

    .debug-text {
      margin: 0;
      padding: 10px 12px;
      border-radius: 14px;
      background: #0f172a;
      color: #e5ecff;
      white-space: pre-wrap;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 12px;
      border: 2px solid #1f2a52;
      min-height: 44px;
    }

    @media (min-width: 720px) {
      .settings-grid {
        grid-template-columns: 1fr 1fr;
      }
    }
  </style>
</head>
<body>
<div id="app">
  <section class="hero">
    <div>
      <h1>おくちポカンチェッカー</h1>
      <p class="hero-sub">おくちとおかおをぴかっと見守る</p>
    </div>
  </section>

  <section class="stage">
    <div class="stage-actions">
      <button id="start" class="btn btn-stage" type="button" data-state="idle">チェック開始</button>
    </div>
    <div class="video-card">
      <video id="cam" autoplay playsinline></video>
      <div class="overlay">
        <div id="mainStatus" class="status-bubble" data-kind="idle">
          <div id="mainStatusTitle" class="status-title">🙂 待機中</div>
          <div id="mainStatusSub" class="status-sub">チェック開始を押してね</div>
        </div>

        <div class="gauges">
          <div class="gauge gauge-mouth">
            <div class="gauge-head">
              <span>おくちゲージ</span>
              <span id="mouthGaugeCount" class="gauge-count">0%</span>
            </div>
            <div class="gauge-track">
              <div id="mouthGaugeFill" class="gauge-fill"></div>
            </div>
          </div>

          <div class="gauge gauge-face">
            <div class="gauge-head">
              <span>かおなしゲージ</span>
              <span id="faceGaugeCount" class="gauge-count">0%</span>
            </div>
            <div class="gauge-track">
              <div id="faceGaugeFill" class="gauge-fill"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="panel">
    <div class="panel-title">設定</div>
    <div class="settings-grid">
      <label class="field">
        <span class="field-label">カメラ</span>
        <select id="camera">
          <option value="user">フロント</option>
          <option value="environment">リア</option>
        </select>
      </label>

      <label class="field">
        <span class="field-label">口開き閾値 (jawOpen)</span>
        <div class="field-row">
          <input id="thr" type="range" min="0" max="1" step="0.01" value="0.08" />
          <span id="thrVal" class="value">0.08</span>
        </div>
      </label>

      <label class="field">
        <span class="field-label">ズーム</span>
        <div class="field-row">
          <input id="zoom" type="range" min="1" max="1" step="0.1" value="1" />
          <span id="zoomVal" class="value">1.00x</span>
        </div>
        <span id="zoomHint" class="field-note">対応端末のみ利用できます</span>
      </label>

      <label class="field">
        <span class="field-label">継続判定 (ms)</span>
        <input id="hold" type="number" value="5000" min="0" step="100" />
      </label>

      <label class="field">
        <span class="field-label">クールダウン (ms)</span>
        <input id="cool" type="number" value="3000" min="0" step="500" />
      </label>

      <label class="field">
        <span class="field-label">顔未検出アラート (ms)</span>
        <input id="missing" type="number" value="3000" min="0" step="500" />
      </label>
    </div>
  </section>

  <section class="panel">
    <div class="panel-title">状態</div>
    <div id="status" class="debug-text">停止中</div>
  </section>
</div>

<script type="module">
  // tasks-vision (0.10.32) は named export を使います。
  import {
    FaceLandmarker,
    FilesetResolver,
  } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/vision_bundle.mjs";

  const video = document.getElementById("cam");
  const startBtn = document.getElementById("start");
  const statusEl = document.getElementById("status");
  const mainStatusEl = document.getElementById("mainStatus");
  const mainStatusTitleEl = document.getElementById("mainStatusTitle");
  const mainStatusSubEl = document.getElementById("mainStatusSub");
  const mouthGaugeFillEl = document.getElementById("mouthGaugeFill");
  const mouthGaugeCountEl = document.getElementById("mouthGaugeCount");
  const faceGaugeFillEl = document.getElementById("faceGaugeFill");
  const faceGaugeCountEl = document.getElementById("faceGaugeCount");

  const thr = document.getElementById("thr");
  const thrVal = document.getElementById("thrVal");
  const zoomInput = document.getElementById("zoom");
  const zoomVal = document.getElementById("zoomVal");
  const zoomHint = document.getElementById("zoomHint");
  const holdInput = document.getElementById("hold");
  const coolInput = document.getElementById("cool");
  const missingInput = document.getElementById("missing");
  const cameraSelect = document.getElementById("camera");
  const MOUTH_ALERT_AUDIO_URL = "/zundamon-alert.wav";
  const NO_FACE_ALERT_AUDIO_URL = "/no-face-alert.wav";
  const STORAGE_KEY = "pokanChecker.settings.v1";
  const TARGET_FPS = 10;

  const defaultSettings = {
    camera: "user",
    threshold: 0.08,
    zoom: 1,
    holdMs: 5000,
    coolMs: 3000,
    missingMs: 3000,
  };

  let stream = null;
  let zoomCapabilities = null;
  let faceLandmarker = null;
  let running = false;
  let starting = false;
  let rafId = null;

  // 音はユーザー操作内で解禁します。
  let audioCtx = null;
  let mouthAlertAudioBuffer = null;
  let noFaceAlertAudioBuffer = null;

  // Wake Lock は使える環境のみ利用します。
  let wakeLock = null;

  // 判定用の状態です。
  let mouthOpenSince = null;
  let faceMissingSince = null;
  let lastAlertAt = 0;
  let lastInferAt = 0;

  function safeNumber(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function readSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...defaultSettings };
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return { ...defaultSettings };
      return { ...defaultSettings, ...parsed };
    } catch (e) {
      console.warn("localStorage の読込に失敗:", e);
      return { ...defaultSettings };
    }
  }

  function collectSettings() {
    return {
      camera: cameraSelect.value || defaultSettings.camera,
      threshold: safeNumber(thr.value, defaultSettings.threshold),
      zoom: safeNumber(zoomInput.value, defaultSettings.zoom),
      holdMs: safeNumber(holdInput.value, defaultSettings.holdMs),
      coolMs: safeNumber(coolInput.value, defaultSettings.coolMs),
      missingMs: safeNumber(missingInput.value, defaultSettings.missingMs),
    };
  }

  function persistSettings() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(collectSettings()));
    } catch (e) {
      console.warn("localStorage への保存に失敗:", e);
    }
  }

  function updateVideoMirror() {
    const mode = cameraSelect.value || defaultSettings.camera;
    video.style.transform = mode === "user" ? "scaleX(-1)" : "none";
  }

  function syncControls() {
    const state = starting ? "starting" : running ? "running" : "idle";
    startBtn.dataset.state = state;
    startBtn.disabled = starting;
    if (state === "running") {
      startBtn.textContent = "停止";
    } else if (state === "starting") {
      startBtn.textContent = "準備中";
    } else {
      startBtn.textContent = "チェック開始";
    }
    startBtn.setAttribute("aria-label", startBtn.textContent);
  }

  function applySettings(settings) {
    cameraSelect.value = settings.camera || defaultSettings.camera;
    thr.value = String(safeNumber(settings.threshold, defaultSettings.threshold));
    zoomInput.value = String(safeNumber(settings.zoom, defaultSettings.zoom));
    holdInput.value = String(safeNumber(settings.holdMs, defaultSettings.holdMs));
    coolInput.value = String(safeNumber(settings.coolMs, defaultSettings.coolMs));
    missingInput.value = String(safeNumber(settings.missingMs, defaultSettings.missingMs));
    thrVal.textContent = safeNumber(thr.value, defaultSettings.threshold).toFixed(2);
    zoomVal.textContent = safeNumber(zoomInput.value, defaultSettings.zoom).toFixed(2) + "x";
    updateVideoMirror();
  }

  applySettings(readSettings());
  updateZoomSupport(false, "チェック開始後にズームを利用できます");
  resetGauges();
  setMainStatus("idle", "🙂 待機中", "チェック開始を押してね");
  syncControls();

  thr.addEventListener("input", () => {
    thrVal.textContent = Number(thr.value).toFixed(2);
    persistSettings();
  });

  zoomInput.addEventListener("input", () => {
    zoomVal.textContent = Number(zoomInput.value).toFixed(2) + "x";
    persistSettings();
    applyZoom(Number(zoomInput.value));
  });

  holdInput.addEventListener("input", persistSettings);
  coolInput.addEventListener("input", persistSettings);
  missingInput.addEventListener("input", persistSettings);
  cameraSelect.addEventListener("change", () => {
    updateVideoMirror();
    persistSettings();
    if (running) {
      restartStream();
    }
  });

  function setStatus(msg) {
    statusEl.textContent = msg;
  }

  function clamp01(value) {
    return Math.max(0, Math.min(1, value));
  }

  function formatPercent(value) {
    return Math.round(clamp01(value) * 100) + "%";
  }

  function progressRatio(elapsedMs, thresholdMs) {
    if (thresholdMs <= 0) {
      return elapsedMs > 0 ? 1 : 0;
    }
    return elapsedMs / thresholdMs;
  }

  function setGauge(fillEl, countEl, ratio) {
    const safeRatio = clamp01(ratio);
    fillEl.style.transform = "scaleX(" + safeRatio.toFixed(4) + ")";
    countEl.textContent = formatPercent(safeRatio);
  }

  function resetGauges() {
    setGauge(mouthGaugeFillEl, mouthGaugeCountEl, 0);
    setGauge(faceGaugeFillEl, faceGaugeCountEl, 0);
  }

  function setMainStatus(kind, title, sub) {
    mainStatusEl.dataset.kind = kind;
    mainStatusTitleEl.textContent = title;
    mainStatusSubEl.textContent = sub;
  }

  function updateZoomSupport(enabled, message) {
    zoomInput.disabled = !enabled;
    zoomHint.textContent = message;
  }

  function clampZoom(value) {
    if (!zoomCapabilities?.zoom) return value;
    const { min, max, step } = zoomCapabilities.zoom;
    const safeMin = Number.isFinite(min) ? min : 0;
    const safeMax = Number.isFinite(max) ? max : value;
    const clamped = Math.min(safeMax, Math.max(safeMin, value));
    if (!step || step <= 0 || !Number.isFinite(step)) return clamped;
    const stepped = Math.round((clamped - safeMin) / step) * step + safeMin;
    return Number(stepped.toFixed(3));
  }

  function resolveDefaultZoom() {
    const stored = safeNumber(zoomInput.value, defaultSettings.zoom);
    if (!zoomCapabilities?.zoom) return stored;
    const { min } = zoomCapabilities.zoom;
    return clampZoom(Number.isFinite(stored) ? stored : min ?? defaultSettings.zoom);
  }

  async function applyZoom(value) {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (!track?.applyConstraints) return;
    if (!zoomCapabilities?.zoom) return;
    try {
      const zoomValue = clampZoom(value);
      await track.applyConstraints({ advanced: [{ zoom: zoomValue }] });
      zoomInput.value = String(zoomValue);
      zoomVal.textContent = zoomValue.toFixed(2) + "x";
    } catch (e) {
      console.warn("ズーム適用に失敗:", e);
    }
  }

  function setupZoomControls() {
    zoomCapabilities = null;
    const track = stream?.getVideoTracks?.()[0];
    if (!track?.getCapabilities) {
      updateZoomSupport(false, "ズーム非対応の端末です");
      return;
    }
    const capabilities = track.getCapabilities();
    if (!capabilities?.zoom) {
      updateZoomSupport(false, "ズーム非対応の端末です");
      return;
    }
    zoomCapabilities = capabilities;
    const { min, max, step } = capabilities.zoom;
    zoomInput.min = String(min ?? 1);
    zoomInput.max = String(max ?? 1);
    zoomInput.step = String(step ?? 0.1);
    updateZoomSupport(true, "スライダーでズーム調整できます");
    const current = track.getSettings?.().zoom;
    const initial = clampZoom(
      Number.isFinite(current) ? current : resolveDefaultZoom()
    );
    zoomInput.value = String(initial);
    zoomVal.textContent = initial.toFixed(2) + "x";
    applyZoom(initial);
  }

  function getBlendshapeScore(result, name) {
    const shapes = result?.faceBlendshapes?.[0]?.categories;
    if (!shapes) return 0;
    const item = shapes.find((s) => s.categoryName === name || s.displayName === name);
    return item ? item.score : 0;
  }

  function beep() {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 880;
    gain.gain.value = 1.0;
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  async function loadAudioBuffer(url, label) {
    if (!audioCtx) return null;
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) {
        console.warn(label + "の読込に失敗:", response.status, response.statusText);
        return null;
      }
      const audioData = await response.arrayBuffer();
      return await audioCtx.decodeAudioData(audioData);
    } catch (e) {
      console.warn(label + "の読込に失敗:", e);
      return null;
    }
  }

  async function loadAlertAudios() {
    const results = await Promise.all([
      loadAudioBuffer(MOUTH_ALERT_AUDIO_URL, "口アラート音声"),
      loadAudioBuffer(NO_FACE_ALERT_AUDIO_URL, "顔未検出アラート音声"),
    ]);
    mouthAlertAudioBuffer = results[0];
    noFaceAlertAudioBuffer = results[1];
  }

  function playAlert(kind) {
    if (!audioCtx) return;
    let buffer = null;
    if (kind === "noFace") {
      buffer = noFaceAlertAudioBuffer || mouthAlertAudioBuffer;
    } else {
      buffer = mouthAlertAudioBuffer || noFaceAlertAudioBuffer;
    }
    if (!buffer) {
      // 音声が無い場合は, 既存のビープにフォールバックします。
      beep();
      return;
    }
    const source = audioCtx.createBufferSource();
    const gain = audioCtx.createGain();
    source.buffer = buffer;
    gain.gain.value = 1.0;
    source.connect(gain).connect(audioCtx.destination);
    source.start();
  }

  async function requestWakeLock() {
    try {
      if (!("wakeLock" in navigator)) return;
      wakeLock = await navigator.wakeLock.request("screen");
      document.addEventListener("visibilitychange", async () => {
        if (document.visibilityState === "visible" && wakeLock == null && running) {
          wakeLock = await navigator.wakeLock.request("screen");
        }
      });
    } catch (e) {
      console.warn("Wake Lock の取得に失敗:", e);
    }
  }

  function stopStreamTracks(currentStream) {
    if (!currentStream) return;
    currentStream.getTracks().forEach((t) => t.stop());
  }

  async function startStream() {
    updateVideoMirror();
    const facingMode = cameraSelect.value || defaultSettings.camera;
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode,
        width: { ideal: 640 },
        height: { ideal: 480 },
      },
      audio: false,
    });
    video.srcObject = stream;
    await video.play();
    setupZoomControls();
  }

  async function restartStream() {
    if (!running) return;
    setStatus("カメラ切替中...");
    setMainStatus("idle", "🔄 カメラ切替中", "少しまってね");
    const previousStream = stream;
    stream = null;
    stopStreamTracks(previousStream);
    try {
      await startStream();
      setStatus("監視中 (カメラ切替完了)");
      setMainStatus("watching", "✅ いい感じ", "おくちが閉じられているよ");
    } catch (e) {
      console.error(e);
      setStatus("カメラ切替に失敗: " + (e?.message || e));
      setMainStatus("mouth-alert", "⚠️ カメラ切替に失敗", "もう一度ためしてね");
    }
  }

  async function initLandmarker() {
    const fileset = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm"
    );

    const modelAssetPath =
      "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

    // GPU が合わない端末に備えて, CPU へフォールバックします。
    try {
      faceLandmarker = await FaceLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath,
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numFaces: 1,
        outputFaceBlendshapes: true,
      });
    } catch (gpuError) {
      console.warn("GPU に失敗したため, CPU へフォールバック:", gpuError);
      faceLandmarker = await FaceLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath,
          delegate: "CPU",
        },
        runningMode: "VIDEO",
        numFaces: 1,
        outputFaceBlendshapes: true,
      });
    }
  }

  async function start() {
    if (running || starting) return;
    starting = true;
    syncControls();
    running = true;
    syncControls();
    setMainStatus("idle", "⏳ 準備中", "音声とカメラを準備しています");
    resetGauges();

    try {
      // 自動再生規制対策として, クリック内で AudioContext を起動します。
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      await audioCtx.resume();

      setStatus("音声読込中...");
      await loadAlertAudios();

      setStatus("カメラ初期化中...");
      persistSettings();
      await startStream();

      setStatus("モデル読込中... (初回は少し時間がかかります)");
      await initLandmarker();

      await requestWakeLock();

      mouthOpenSince = null;
      faceMissingSince = null;
      lastAlertAt = 0;
      lastInferAt = 0;
    } catch (e) {
      running = false;
      throw e;
    } finally {
      starting = false;
      syncControls();
    }

    setStatus("監視中");
    setMainStatus("watching", "✅ いい感じ", "おくちが閉じられているよ");
    loop();
  }

  function stop() {
    starting = false;
    running = false;
    syncControls();

    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }

    stopStreamTracks(stream);
    stream = null;
    video.srcObject = null;
    zoomCapabilities = null;
    updateZoomSupport(false, "チェック開始後にズームを利用できます");

    if (wakeLock) {
      try {
        wakeLock.release();
      } catch (e) {
        console.warn("Wake Lock の解放に失敗:", e);
      }
      wakeLock = null;
    }

    if (audioCtx) {
      try {
        audioCtx.close();
      } catch (e) {
        console.warn("AudioContext の終了に失敗:", e);
      }
      audioCtx = null;
    }
    mouthAlertAudioBuffer = null;
    noFaceAlertAudioBuffer = null;
    mouthOpenSince = null;
    faceMissingSince = null;

    resetGauges();
    setMainStatus("idle", "🛑 停止中", "チェック開始を押してね");
    setStatus("停止中");
  }

  function loop() {
    if (!running) return;

    if (video.readyState >= 2 && faceLandmarker) {
      const nowMs = performance.now();
      const interval = 1000 / TARGET_FPS;

      if (nowMs - lastInferAt >= interval) {
        lastInferAt = nowMs;

        // detectForVideo(video, timestampMs) は同期実行です。
        const result = faceLandmarker.detectForVideo(video, nowMs);

        const openThr = safeNumber(thr.value, defaultSettings.threshold);
        const holdMs = Math.max(0, safeNumber(holdInput.value, defaultSettings.holdMs));
        const coolMs = Math.max(0, safeNumber(coolInput.value, defaultSettings.coolMs));
        const missingMs = Math.max(0, safeNumber(missingInput.value, defaultSettings.missingMs));

        const faceCount = result?.faceLandmarks?.length ?? 0;
        const hasFace = faceCount > 0;

        if (!hasFace) {
          mouthOpenSince = null;
          setGauge(mouthGaugeFillEl, mouthGaugeCountEl, 0);
          if (faceMissingSince === null) {
            faceMissingSince = nowMs;
          }
          const missingFor = nowMs - faceMissingSince;
          const missingRatio = progressRatio(missingFor, missingMs);
          setGauge(faceGaugeFillEl, faceGaugeCountEl, missingRatio);
          const reachedNoFaceAlert = missingFor >= missingMs;
          if (reachedNoFaceAlert && nowMs - lastAlertAt >= coolMs) {
            lastAlertAt = nowMs;
            playAlert("noFace");
          }
          if (reachedNoFaceAlert) {
            setMainStatus("no-face-alert", "🙈 おかおが見つからない", "カメラの前に戻ってね");
          } else {
            setMainStatus("no-face-warning", "👀 おかおが見えない", "ゲージがたまっています");
          }
          setStatus(
            "顔が検出できません\\n" +
              "missingFor=" +
              Math.round(missingFor) +
              "ms missingMs=" +
              Math.round(missingMs) +
              "ms"
          );
        } else {
          faceMissingSince = null;
          setGauge(faceGaugeFillEl, faceGaugeCountEl, 0);

          const jawOpen = getBlendshapeScore(result, "jawOpen");
          const mouthClose = getBlendshapeScore(result, "mouthClose");

          // 口が開いている判定をシンプルに行います。
          const isOpen = jawOpen >= openThr && mouthClose < 0.5;

          if (isOpen) {
            if (mouthOpenSince === null) {
              mouthOpenSince = nowMs;
            }

            const openFor = nowMs - mouthOpenSince;
            const openRatio = progressRatio(openFor, holdMs);
            setGauge(mouthGaugeFillEl, mouthGaugeCountEl, openRatio);
            const reachedAlert = openFor >= holdMs;
            if (reachedAlert && nowMs - lastAlertAt >= coolMs) {
              lastAlertAt = nowMs;
              playAlert("mouth");
            }
            if (reachedAlert) {
              setMainStatus("mouth-alert", "😮 おくちポカン発見", "いったんおくちを閉じよう");
              setStatus(
                "口が開いています\\n" +
                  "openFor=" +
                  Math.round(openFor) +
                  "ms holdMs=" +
                  Math.round(holdMs) +
                  "ms\\n" +
                  "jawOpen=" +
                  jawOpen.toFixed(2) +
                  " mouthClose=" +
                  mouthClose.toFixed(2)
              );
            } else {
              setMainStatus("mouth-warning", "😮 おくちが開き気味", "ゲージがたまっています");
              setStatus(
                "監視中 (開き気味)\\n" +
                  "openFor=" +
                  Math.round(openFor) +
                  "ms holdMs=" +
                  Math.round(holdMs) +
                  "ms\\n" +
                  "jawOpen=" +
                  jawOpen.toFixed(2) +
                  " mouthClose=" +
                  mouthClose.toFixed(2)
              );
            }
          } else {
            mouthOpenSince = null;
            setGauge(mouthGaugeFillEl, mouthGaugeCountEl, 0);
            setMainStatus("watching", "✅ いい感じ", "おくちが閉じられているよ");
            setStatus(
              "監視中\\n" +
                "jawOpen=" +
                jawOpen.toFixed(2) +
                " mouthClose=" +
                mouthClose.toFixed(2)
            );
          }
        }
      }
    }

    rafId = requestAnimationFrame(loop);
  }

  startBtn.addEventListener("click", () => {
    if (running && !starting) {
      stop();
      return;
    }
    start().catch((e) => {
      console.error(e);
      setStatus("開始に失敗: " + (e?.message || e));
      stop();
    });
  });
</script>
</body>
</html>
`;

function buildHeaders() {
  const csp = [
    "default-src 'self'",
    "img-src 'self' data: blob:",
    "media-src 'self' blob:",
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' https://cdn.jsdelivr.net https://storage.googleapis.com",
    "connect-src 'self' https://cdn.jsdelivr.net https://storage.googleapis.com",
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
  ].join("; ");

  return {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "no-store",
    "content-security-policy": csp,
    "permissions-policy": "camera=(self), microphone=(), geolocation=()",
    "referrer-policy": "no-referrer",
    "x-content-type-options": "nosniff",
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/healthz") {
      return new Response("ok", {
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "no-store",
        },
      });
    }

    if (url.pathname !== "/" && url.pathname !== "/index.html") {
      if (env && env.ASSETS) {
        const assetResponse = await env.ASSETS.fetch(request);
        if (assetResponse.status !== 404) {
          return assetResponse;
        }
      }

      return new Response("Not Found", {
        status: 404,
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "no-store",
        },
      });
    }

    return new Response(HTML, {
      status: 200,
      headers: buildHeaders(),
    });
  },
};
