FROM node:20.18.1-bookworm-slim

# Install git and other necessary tools
RUN apt-get update && apt-get install -y \
    git \
    sudo \
    make \
    && rm -rf /var/lib/apt/lists/*

# Create vscode user by renaming existing node user
RUN usermod -l vscode node \
    && usermod -d /home/vscode -m vscode \
    && groupmod -n vscode node \
    && echo "vscode ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# 作業ディレクトリを設定
WORKDIR /workspace

# Switch to vscode user
USER vscode
