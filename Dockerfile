# Base image with Node.js
FROM node:20-bullseye-slim

# Install latest Chromium and dependencies for browser automation
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    libxss1 \
    ca-certificates \
    curl \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Tell Puppeteer to use installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Copy package files and install
COPY package*.json ./
RUN npm install --omit=dev

# Copy project files
COPY . .

# Expose Web Port
EXPOSE 3000

# Persistent data directory
VOLUME ["/app/profiles"]

# Start server
CMD ["node", "server.js"]
