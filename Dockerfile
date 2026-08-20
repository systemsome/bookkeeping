# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
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

# Copy built artifacts and package manifest
COPY package*.json ./
COPY --from=builder /app/dist ./dist

# Install only production dependencies (express, etc.)
RUN npm install --omit=dev && npm cache clean --force

# Create persistent data directory
RUN mkdir -p /app/data

# Mountable volume for permanent data storage on NAS
VOLUME ["/app/data"]

EXPOSE 3000

# Start server
CMD ["node", "dist/server.cjs"]
