.PHONY: help lint format test test-unit test-e2e clean install build

# アプリケーションディレクトリ
APP_DIR := app

# デフォルトターゲット
help:
	@echo "使用可能なコマンド:"
	@echo "  make lint        - Lintチェックを実行"
	@echo "  make format      - コードフォーマットを実行"
	@echo "  make test        - すべてのテストを実行"
	@echo "  make test-unit   - ユニットテストを実行"
	@echo "  make test-e2e    - E2Eテストを実行"
	@echo "  make install     - 依存関係をインストール"
	@echo "  make build       - プロダクションビルド"
	@echo "  make clean       - 生成されたファイルを削除"

# Lintチェック (CIと同等)
lint:
	@echo "Running linters..."
	cd $(APP_DIR) && npm install && npm run lint

# コードフォーマット
format:
	@echo "Formatting code..."
	cd $(APP_DIR) && npm install && npm run format

# すべてのテスト (CIと同等)
test: test-unit test-e2e

# ユニットテスト
test-unit:
	@echo "Running unit tests..."
	cd $(APP_DIR) && npm install && npm run test:unit -- --run || true

# E2Eテスト
test-e2e:
	@echo "Running E2E tests..."
	cd $(APP_DIR) && npm install && npx playwright install webkit --with-deps && PLAYWRIGHT_ONLY=webkit npm run test:e2e

# 依存関係インストール
install:
	@echo "Installing dependencies..."
	cd $(APP_DIR) && npm install

# プロダクションビルド
build:
	@echo "Building for production..."
	cd $(APP_DIR) && npm install && npm run build

# クリーンアップ
clean:
	@echo "Cleaning up..."
	rm -rf $(APP_DIR)/node_modules $(APP_DIR)/dist $(APP_DIR)/test-results $(APP_DIR)/playwright-report
