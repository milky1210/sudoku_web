FROM node:20.18.1-bookworm-slim

# 作業ディレクトリを設定
WORKDIR /app

# ソースコードをコピー
COPY . .

# デフォルトのコマンド（コンテナを停止しないように）
CMD ["tail", "-f", "/dev/null"]
