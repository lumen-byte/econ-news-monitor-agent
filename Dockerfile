# Production Node.js environment
FROM node:22-alpine

# Set default workdir
WORKDIR /usr/src/app

# Copy dependency schemas
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy source tree and configuration items
COPY src/ ./src/
COPY storage/ ./storage/

# Expose HTTP port
EXPOSE 3000

# Set environment runtime profiles
ENV NODE_ENV=production

# Start agent daemon
CMD ["node", "src/server.js"]
