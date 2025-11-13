# -------------------------------
# Stage 1: Build & Install Puppeteer
# -------------------------------
FROM node:18-alpine AS builder

# Install system dependencies for Chromium
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    udev \
    wget \
    dumb-init

# Set environment variables for Puppeteer
# These tell Puppeteer to use the system-installed Chromium
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Set working directory
WORKDIR /app

# Copy package files first for caching
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy application source
COPY . .

# -------------------------------
# Stage 2: Runtime
# -------------------------------
FROM node:18-alpine

# Install only what’s needed to run Chromium
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    dumb-init

# Set Puppeteer environment
ENV NODE_ENV=production
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_DOWNLOAD=true

WORKDIR /app

# Copy compiled app and node_modules from builder
COPY --from=builder /app /app

# Expose your server port (if using Express)
EXPOSE 80

# Use dumb-init to handle signals properly
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Run your Node.js application
CMD ["node", "index.js"]
