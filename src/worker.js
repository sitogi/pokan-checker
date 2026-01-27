const HTML = `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>おくちポカンチェッカー</title>
  <style>
    :root {
      color-scheme: light;
    }
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      margin: 16px;
      line-height: 1.5;
    }
    #wrap {
      max-width: 560px;
      margin: 0 auto;
    }
    h1 {
      font-size: 20px;
      margin-bottom: 12px;
    }
    video {
      width: 100%;
      background: #000;
      border-radius: 12px;
      transform: scaleX(-1);
    }
    button {
      padding: 12px 16px;
      font-size: 16px;
      border-radius: 10px;
      border: 1px solid #ccc;
      background: #fff;
      cursor: pointer;
    }
    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .row {
      margin: 10px 0;
      display: grid;
      gap: 8px;
    }
    label {
      display: block;
      margin: 6px 0;
    }
    input[type="range"] {
      width: 100%;
    }
    input[type="number"] {
      width: 100%;
      padding: 8px;
      font-size: 16px;
      border-radius: 8px;
      border: 1px solid #ccc;
      box-sizing: border-box;
    }
    select {
      width: 100%;
      padding: 8px;
      font-size: 16px;
      border-radius: 8px;
      border: 1px solid #ccc;
      box-sizing: border-box;
      background: #fff;
    }
    #status {
      margin-top: 8px;
      padding: 10px 12px;
      border-radius: 10px;
      background: #f6f7f8;
      white-space: pre-wrap;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 13px;
    }
    .hint {
      color: #444;
      font-size: 13px;
      margin-top: 6px;
    }
  </style>
</head>
<body>
<div id="wrap">
  <h1>おくちポカンチェッカー</h1>

  <video id="cam" autoplay playsinline></video>

  <div class="row" style="grid-template-columns: 1fr 1fr; gap: 10px;">
    <button id="start">監視開始</button>
    <button id="stop" disabled>停止</button>
  </div>

  <div class="row">
    <label>
      カメラ:
      <select id="camera">
        <option value="user">フロント</option>
        <option value="environment">リア</option>
      </select>
    </label>

    <label>
      口開き閾値 (jawOpen):
      <input id="thr" type="range" min="0" max="1" step="0.01" value="0.08" />
      <span id="thrVal">0.08</span>
    </label>

    <label>
      継続判定 (ms):
      <input id="hold" type="number" value="5000" min="0" step="100" />
    </label>

    <label>
      クールダウン (ms):
      <input id="cool" type="number" value="3000" min="0" step="500" />
    </label>

    <label>
      顔未検出アラート (ms):
      <input id="missing" type="number" value="3000" min="0" step="500" />
    </label>

    <div class="hint">
      監視開始ボタンを押してから, カメラ許可を行ってください。
    </div>
  </div>

  <div id="status">停止中</div>
</div>

<script type="module">
  // tasks-vision (0.10.32) は named export を使います。
  import {
    FaceLandmarker,
    FilesetResolver,
  } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/vision_bundle.mjs";

  const video = document.getElementById("cam");
  const startBtn = document.getElementById("start");
  const stopBtn = document.getElementById("stop");
  const statusEl = document.getElementById("status");

  const thr = document.getElementById("thr");
  const thrVal = document.getElementById("thrVal");
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
    holdMs: 5000,
    coolMs: 3000,
    missingMs: 3000,
  };

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

  function applySettings(settings) {
    cameraSelect.value = settings.camera || defaultSettings.camera;
    thr.value = String(safeNumber(settings.threshold, defaultSettings.threshold));
    holdInput.value = String(safeNumber(settings.holdMs, defaultSettings.holdMs));
    coolInput.value = String(safeNumber(settings.coolMs, defaultSettings.coolMs));
    missingInput.value = String(safeNumber(settings.missingMs, defaultSettings.missingMs));
    thrVal.textContent = safeNumber(thr.value, defaultSettings.threshold).toFixed(2);
    updateVideoMirror();
  }

  applySettings(readSettings());

  thr.addEventListener("input", () => {
    thrVal.textContent = Number(thr.value).toFixed(2);
    persistSettings();
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

  let stream = null;
  let faceLandmarker = null;
  let running = false;
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

  function setStatus(msg) {
    statusEl.textContent = msg;
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
  }

  async function restartStream() {
    if (!running) return;
    setStatus("カメラ切替中...");
    const previousStream = stream;
    stream = null;
    stopStreamTracks(previousStream);
    try {
      await startStream();
      setStatus("監視中 (カメラ切替完了)");
    } catch (e) {
      console.error(e);
      setStatus("カメラ切替に失敗: " + (e?.message || e));
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
    if (running) return;
    running = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;

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

    setStatus("監視中");
    loop();
  }

  function stop() {
    running = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;

    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }

    stopStreamTracks(stream);
    stream = null;
    video.srcObject = null;

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
          if (faceMissingSince === null) {
            faceMissingSince = nowMs;
          }
          const missingFor = nowMs - faceMissingSince;
          if (missingFor >= missingMs && nowMs - lastAlertAt >= coolMs) {
            lastAlertAt = nowMs;
            playAlert("noFace");
            setStatus(
              "顔が検出できません\\n" +
                "missingFor=" +
                Math.round(missingFor) +
                "ms"
            );
          } else {
            setStatus(
              "顔が検出できません (監視中)\\n" +
                "missingFor=" +
                Math.round(missingFor) +
                "ms"
            );
          }
        } else {
          faceMissingSince = null;

          const jawOpen = getBlendshapeScore(result, "jawOpen");
          const mouthClose = getBlendshapeScore(result, "mouthClose");

          // 口が開いている判定をシンプルに行います。
          const isOpen = jawOpen >= openThr && mouthClose < 0.5;

          if (isOpen) {
            if (mouthOpenSince === null) {
              mouthOpenSince = nowMs;
            }

            const openFor = nowMs - mouthOpenSince;
            if (openFor >= holdMs && nowMs - lastAlertAt >= coolMs) {
              lastAlertAt = nowMs;
              playAlert("mouth");
              setStatus(
                "口が開いています\\n" +
                  "jawOpen=" +
                  jawOpen.toFixed(2) +
                  " mouthClose=" +
                  mouthClose.toFixed(2)
              );
            } else {
              setStatus(
                "監視中 (開き気味)\\n" +
                  "jawOpen=" +
                  jawOpen.toFixed(2) +
                  " mouthClose=" +
                  mouthClose.toFixed(2)
              );
            }
          } else {
            mouthOpenSince = null;
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
    start().catch((e) => {
      console.error(e);
      setStatus("開始に失敗: " + (e?.message || e));
      stop();
    });
  });
  stopBtn.addEventListener("click", stop);
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
