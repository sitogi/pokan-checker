# おくちポカンチェッカー

Cloudflare Workers で配信する, ブラウザだけで動くおくちポカン検知ツールです. MediaPipe Face Landmarker を使い, jawOpen と mouthClose をもとに判定します.

## 特徴

- カメラ映像をローカルで推論します.
- おくちポカンと顔未検出で別音声を鳴らします.
- 設定を localStorage に保存します.

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

