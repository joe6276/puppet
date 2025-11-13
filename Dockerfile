# Use official Node LTS image
FROM node:18-bullseye-slim

# Install necessary dependencies for Chromium
RUN apt-get update && apt-get install -y \
    chromium \
    chromium-common \
    chromium-driver \
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
    libnss3 \
    libpango-1.0-0 \
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
    ca-certificates \
    fonts-freefont-ttf \
    wget \
    gnupg \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Set Puppeteer environment variables
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /usr/src/app

# Copy dependency files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy app code
COPY . .

# Expose port (if using Express)
EXPOSE 80

# Default command
CMD ["node", "index.js"]
