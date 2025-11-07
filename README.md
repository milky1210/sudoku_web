# sudoku_web
数独 x スキル利用で爽快感のあるゲームに

## セットアップ

### Dockerを使用する場合（推奨）

1. リポジトリをクローン
```bash
git clone https://github.com/milky1210/sudoku_web.git
cd sudoku_web
```

2. Dockerコンテナをビルドして起動
```bash
docker-compose up -d --build
```

3. ブラウザでアクセス
```
http://localhost:5173
```

### ローカル開発環境

1. Node.js 20以上をインストール

2. 依存関係をインストール
```bash
cd app
npm install
```

3. 開発サーバーを起動
```bash
npm run dev
```

4. ブラウザでアクセス
```
http://localhost:5173
```

## テスト

### E2Eテスト（Playwright）

Dockerコンテナ内でテストを実行：
```bash
docker exec -it sudoku npm run test:e2e
```

ローカル環境でテストを実行：
```bash
cd app
npm run test:e2e
```

テストUIで実行：
```bash
npm run test:e2e:ui
```

### ユニットテスト（Vitest）

```bash
npm run test:unit
```

## CI/CD

このプロジェクトはGitHub Actionsを使用して継続的インテグレーションを実装しています。

- **トリガー**: mainブランチへのプッシュ、プルリクエスト
- **テスト**: Playwrightを使用したE2Eテスト
- **環境**: Dockerコンテナ内

### CIの実行方法

1. プルリクエストを作成するか、mainブランチにプッシュ
2. GitHub Actionsが自動的にテストを実行
3. テスト結果はActionsタブで確認可能

### ローカルでのCIテスト

```bash
docker build -f Dockerfile.ci -t sudoku-web:test .
docker run --rm sudoku-web:test
```

## プロジェクト構造

```
sudoku_web/
├── app/                    # Vue.jsアプリケーション
│   ├── src/
│   │   ├── components/     # Vueコンポーネント
│   │   ├── assets/         # 静的アセット
│   │   └── ...
│   ├── tests/              # E2Eテスト
│   ├── package.json
│   └── ...
├── docker-compose.yaml     # Docker Compose設定
├── Dockerfile              # 開発用Dockerfile
├── Dockerfile.ci           # CI用Dockerfile
└── .github/workflows/      # GitHub Actionsワークフロー
```

## 機能

- 数独パズルの生成と解決
- メモ機能
- 解答チェック
- レスポンシブデザイン（モバイル対応）
- 新規ゲーム生成
- ゲームリセット

## 技術スタック

- **Frontend**: Vue 3 + TypeScript
- **Build Tool**: Vite
- **Testing**: Playwright (E2E), Vitest (Unit)
- **Container**: Docker
- **CI/CD**: GitHub Actions
