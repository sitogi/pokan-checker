# おくちポカンチェッカー

Cloudflare Workers で配信する, ブラウザだけで動くおくちポカン検知ツールです. MediaPipe Face Landmarker を使い, jawOpen と mouthClose をもとに判定します.

## 特徴

- カメラ映像をローカルで推論します.
- おくちポカンと顔未検出で別音声を鳴らします.
- 設定を localStorage に保存します.

## 使用技術

- Cloudflare Workers: `src/worker.js` で HTML と JS を返します. `wrangler` で開発とデプロイを行います.
- Cloudflare Workers Static Assets: `public/` の wav を `ASSETS` binding 経由で配信します.
- MediaPipe Tasks Vision: `@mediapipe/tasks-vision` の Face Landmarker を jsDelivr CDN から ES Modules で読み込みます. モデルは Google Cloud Storage の `face_landmarker.task` を利用します.
- WebAssembly (WASM): Tasks Vision の WASM ランタイムを jsDelivr から読み込みます. `delegate: "GPU"` を優先し, 失敗時は `delegate: "CPU"` にフォールバックします.
- Web API: `getUserMedia` でカメラ取得, Web Audio API で音声再生, `localStorage` で設定保存, Wake Lock API で画面スリープ抑止, `requestAnimationFrame` で推論ループを回します.

## 主要ファイル

- src/worker.js: HTML と Worker 本体です.
- public/zundamon-alert.wav: おくちポカン用の音声です.
- public/no-face-alert.wav: 顔未検出用の音声です.
- wrangler.toml: Workers 設定です.

## 開発

```bash
npm install
npx wrangler dev
```

## デプロイ

```bash
npx wrangler login
npx wrangler deploy
```

## メモ

- 初回はモデル読み込みに時間がかかります.
- カメラ許可が必要です.
- 画像や音声は送信せず, 端末内で処理します.
