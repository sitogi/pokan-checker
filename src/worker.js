const HTML = `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>口ポカン 見守り (Android / ブラウザ)</title>
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
  <h1>口ポカン 見守り (Workers 版)</h1>

  <video id="cam" autoplay playsinline></video>

  <div class="row" style="grid-template-columns: 1fr 1fr; gap: 10px;">
    <button id="start">監視 開始</button>
    <button id="stop" disabled>停止</button>
  </div>

  <div class="row">
    <label>
      口開き 閾値 (jawOpen):
      <input id="thr" type="range" min="0" max="1" step="0.01" value="0.08" />
      <span id="thrVal">0.08</span>
    </label>

    <label>
      継続 判定 (ms):
      <input id="hold" type="number" value="5000" min="0" step="100" />
    </label>

    <label>
      クールダウン (ms):
      <input id="cool" type="number" value="3000" min="0" step="500" />
    </label>

    <label>
      推論 FPS (軽量化 用, 推奨 10-15):
      <input id="fps" type="number" value="10" min="1" max="30" step="1" />
    </label>

    <div class="hint">
      監視 開始 ボタン を 押してから, カメラ 許可 を 行ってください。HTTPS 配信 が 前提です。
    </div>
  </div>

  <div id="status">停止 中</div>
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
  const fpsInput = document.getElementById("fps");
  const ALERT_AUDIO_URL = "/zundamon-alert.wav";

  thr.addEventListener("input", () => {
    thrVal.textContent = Number(thr.value).toFixed(2);
  });

  let stream = null;
  let faceLandmarker = null;
  let running = false;
  let rafId = null;

  // 音 は ユーザー 操作 内 で 解禁 します。
  let audioCtx = null;
  let alertAudioBuffer = null;

  // Wake Lock は 使える 環境 のみ 利用 します。
  let wakeLock = null;

  // 判定 用 の 状態 です。
  let mouthOpenSince = null;
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
    gain.gain.value = 0.4;
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  async function loadAlertAudio() {
    if (!audioCtx) return;
    try {
      const response = await fetch(ALERT_AUDIO_URL, { cache: "no-store" });
      if (!response.ok) {
        console.warn("音声 ファイル の 読込 に 失敗:", response.status, response.statusText);
        alertAudioBuffer = null;
        return;
      }
      const audioData = await response.arrayBuffer();
      alertAudioBuffer = await audioCtx.decodeAudioData(audioData);
    } catch (e) {
      console.warn("音声 ファイル の 読込 に 失敗:", e);
      alertAudioBuffer = null;
    }
  }

  function playAlert() {
    if (!audioCtx) return;
    if (!alertAudioBuffer) {
      // 音声 が 無い 場合 は, 既存 の ビープ に フォールバック します。
      beep();
      return;
    }
    const source = audioCtx.createBufferSource();
    const gain = audioCtx.createGain();
    source.buffer = alertAudioBuffer;
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
      console.warn("Wake Lock の 取得 に 失敗:", e);
    }
  }

  async function initLandmarker() {
    const fileset = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm"
    );

    const modelAssetPath =
      "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

    // GPU が 合わない 端末 に 備えて, CPU へ フォールバック します。
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
      console.warn("GPU に 失敗 した ため, CPU へ フォールバック:", gpuError);
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

    // 自動 再生 規制 対策 として, クリック 内 で AudioContext を 起動 します。
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    await audioCtx.resume();

    setStatus("音声 読込 中...");
    await loadAlertAudio();

    setStatus("カメラ 初期化 中...");

    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
        width: { ideal: 640 },
        height: { ideal: 480 },
      },
      audio: false,
    });

    video.srcObject = stream;
    await video.play();

    setStatus("モデル 読込 中... (初回 は 少し 時間 が かかります)");
    await initLandmarker();

    await requestWakeLock();

    mouthOpenSince = null;
    lastAlertAt = 0;
    lastInferAt = 0;

    setStatus("監視 中");
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

    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      stream = null;
    }
    video.srcObject = null;

    if (wakeLock) {
      try {
        wakeLock.release();
      } catch (e) {
        console.warn("Wake Lock の 解放 に 失敗:", e);
      }
      wakeLock = null;
    }

    if (audioCtx) {
      try {
        audioCtx.close();
      } catch (e) {
        console.warn("AudioContext の 終了 に 失敗:", e);
      }
      audioCtx = null;
    }
    alertAudioBuffer = null;

    setStatus("停止 中");
  }

  function loop() {
    if (!running) return;

    if (video.readyState >= 2 && faceLandmarker) {
      const nowMs = performance.now();
      const targetFps = Math.max(1, Math.min(30, Number(fpsInput.value || 10)));
      const interval = 1000 / targetFps;

      if (nowMs - lastInferAt >= interval) {
        lastInferAt = nowMs;

        // detectForVideo(video, timestampMs) は 同期 実行 です。
        const result = faceLandmarker.detectForVideo(video, nowMs);

        const jawOpen = getBlendshapeScore(result, "jawOpen");
        const mouthClose = getBlendshapeScore(result, "mouthClose");

        const openThr = Number(thr.value);
        const holdMs = Number(holdInput.value);
        const coolMs = Number(coolInput.value);

        // 口 が 開いている 判定 を シンプル に 行います。
        const isOpen = jawOpen >= openThr && mouthClose < 0.5;

        if (isOpen) {
          if (mouthOpenSince === null) {
            mouthOpenSince = nowMs;
          }

          const openFor = nowMs - mouthOpenSince;
          if (openFor >= holdMs && nowMs - lastAlertAt >= coolMs) {
            lastAlertAt = nowMs;
            playAlert();
            setStatus(
              "口 が 開いています\\n" +
                "jawOpen=" +
                jawOpen.toFixed(2) +
                " mouthClose=" +
                mouthClose.toFixed(2)
            );
          } else {
            setStatus(
              "監視 中 (開き 気味)\\n" +
                "jawOpen=" +
                jawOpen.toFixed(2) +
                " mouthClose=" +
                mouthClose.toFixed(2)
            );
          }
        } else {
          mouthOpenSince = null;
          setStatus(
            "監視 中\\n" +
              "jawOpen=" +
              jawOpen.toFixed(2) +
              " mouthClose=" +
              mouthClose.toFixed(2)
          );
        }
      }
    }

    rafId = requestAnimationFrame(loop);
  }

  startBtn.addEventListener("click", () => {
    start().catch((e) => {
      console.error(e);
      setStatus("開始 に 失敗: " + (e?.message || e));
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
