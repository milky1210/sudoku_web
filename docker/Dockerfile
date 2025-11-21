FROM node:20.18.1-bookworm-slim

# Install git and other necessary tools
RUN apt-get update && apt-get install -y \
    git \
    sudo \
    && rm -rf /var/lib/apt/lists/*

# Create vscode user with same UID/GID as host user (1000:1000)
RUN groupadd -g 1000 vscode \
    && useradd -m -u 1000 -g vscode -s /bin/bash vscode \
    && echo "vscode ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# 作業ディレクトリを設定
WORKDIR /app

# Change ownership of app directory to vscode user
RUN chown -R vscode:vscode /app

# Switch to vscode user
USER vscode

# ソースコードをコピー
COPY --chown=vscode:vscode app .
