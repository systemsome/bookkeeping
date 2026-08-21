# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies for building
RUN npm install

# Copy source code
COPY . .

# Build frontend and bundled backend server
RUN npm run build

# ---- Production Runtime Stage ----
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV DATA_DIR=/app/data

# Copy compiled frontend and standalone backend
COPY --from=builder /app/dist ./dist

# Create persistent data directory
RUN mkdir -p /app/data

# Mountable volume for permanent data storage on NAS
VOLUME ["/app/data"]

EXPOSE 3000

# Health check using lightweight wget built into alpine
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

# Start server
CMD ["node", "dist/server.cjs"]
