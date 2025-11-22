FROM node:20.18.1-bookworm-slim

# Install git and other necessary tools, plus Playwright dependencies
RUN apt-get update && apt-get install -y \
    git \
    sudo \
    make \
    wget \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcairo-gobject2 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    xdg-utils \
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
