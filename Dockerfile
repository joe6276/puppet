FROM node:18-bullseye
# ---------- Install system dependencies ----------
# Puppeteer/Chromium need these packages to run in headless mode
RUN apt-get update && apt-get install -y \
    chromium \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
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
    wget \
    xdg-utils \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# ---------- Environment variables ----------
# Tell Puppeteer to use the system-installed Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV NODE_ENV=production

# ---------- Set working directory ----------
WORKDIR /usr/src/app

# ---------- Copy and install dependencies ----------
COPY package*.json ./
RUN npm ci --omit=dev

# ---------- Copy source code ----------
COPY . .

# ---------- Expose app port ----------
EXPOSE 8080

# ---------- Start the app ----------
CMD ["node", "index.js"]
