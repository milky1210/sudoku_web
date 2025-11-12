# sudoku_web
数独 x スキル利用で爽快感のあるゲームに

## セットアップ

### Dev Containersを使用する場合（推奨）

VS CodeのDev Containers拡張機能をインストールし、プロジェクトを開くと自動的に開発コンテナが構築されます。

1. VS Codeでプロジェクトを開く
2. コマンドパレット（Ctrl+Shift+P）から "Dev Containers: Reopen in Container" を選択
3. コンテナが構築され、開発環境が整います

### Dockerを使用する場合

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

## Lint（推奨: 開発環境で高速実行）

ローカルの開発コンテナが立ち上がっている場合は、コンテナ内で直接 linter を実行すると非常に高速です。以下は推奨の実行方法です。

- 開発コンテナが起動している場合（PowerShell）:

```powershell
# コンテナ名が `sudoku` の場合
docker compose exec sudoku sh -c "cd /app && npm run lint"
```

- 開発コンテナが起動している場合（Linux/macOS）:

```bash
docker compose exec sudoku sh -c 'cd /app && npm run lint'
```

- 開発コンテナを使わないローカル実行:

```bash
cd app
npm run lint
```

- 便利スクリプト（Windows PowerShell）: リポジトリルートにある `run-lint.ps1` を使うと、node_modules が無ければ自動インストールし、必要なリカバリも試みたうえで lint を実行します。

```powershell
.
un-lint.ps1
```

注: CI では `lint` ジョブが追加されており、依存関係をインストールしてから linter を実行します。開発環境で早くチェックしたい場合は上記のコンテナ内実行が最速です。

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
├── .devcontainer/          # Dev Containers設定
│   └── devcontainer.json
├── app/                    # Vue.jsアプリケーション
│   ├── src/
│   │   ├── components/     # Vueコンポーネント
│   │   ├── services/       # サービス層（パズル読み込み等）
│   │   ├── stores/         # Pinia状態管理
│   │   ├── types/          # TypeScript型定義
│   │   └── assets/         # 静的アセット
│   ├── public/
│   │   └── puzzles/        # 生成済みパズルデータ
│   ├── tests/              # E2Eテスト
│   └── package.json
├── puzzle_generator/       # Pythonパズル生成器
│   ├── Dockerfile
│   ├── generate_fast.py    # 高速パズル生成スクリプト
│   ├── generate_puzzles.py # 完全版パズル生成スクリプト
│   ├── requirements.txt
│   └── README.md
├── docker/                 # Docker設定
│   ├── Dockerfile          # 開発用Dockerfile
│   └── Dockerfile.ci       # CI用Dockerfile
├── docker-compose.yaml     # Docker Compose設定
├── docker-install-lock.ps1 # npm installスクリプト
├── run-ci.ps1              # CI実行スクリプト
├── run-lint.ps1            # Lint実行スクリプト
└── .github/workflows/      # GitHub Actionsワークフロー
```

## パズル生成

新しいパズルを生成する場合:

```bash
# Dockerを使用
docker compose --profile generator up puzzle-generator

# ローカル実行
cd puzzle_generator
pip install -r requirements.txt
python -c "from generate_fast import generate_puzzle_database; generate_puzzle_database('../app/public/puzzles')"
```

詳細は [puzzle_generator/README.md](puzzle_generator/README.md) を参照してください。
```

## 機能

- **難易度選択**: 4段階の難易度（簡単・普通・難しい・超難関）から選択可能
- **事前生成パズル**: Python生成器で作成された高品質なパズル（60問収録）
- 数独パズルの生成と解決
- **スキルシステム**: コストを消費して使用できる便利機能
  - 残り1マス埋め
  - 候補1つの自動入力
  - 候補nメモ
- メモ機能
- 解答チェック
- Undo/Redo機能
- レスポンシブデザイン（モバイル対応）
- 新規ゲーム生成
- ゲームリセット
- 難易度変更

## 技術スタック

- **Frontend**: Vue 3 + TypeScript
- **Build Tool**: Vite
- **Puzzle Generator**: Python 3.11
- **Testing**: Playwright (E2E), Vitest (Unit)
- **Linting**: ESLint, Oxlint
- **Container**: Docker, Dev Containers
- **CI/CD**: GitHub Actions
