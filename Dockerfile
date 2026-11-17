FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies cleanly
RUN npm install --production

# Copy application files
COPY . .

# Expose web port
EXPOSE 3000

# Start server
CMD ["node", "server.js"]
