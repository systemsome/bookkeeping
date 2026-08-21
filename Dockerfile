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

# Copy package files and install clean production dependencies
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

# Copy compiled frontend and bundled backend
COPY --from=builder /app/dist ./dist

# Create persistent data directory with permissive permissions
RUN mkdir -p /app/data && chmod 777 /app/data

# Mountable volume for permanent data storage on NAS
VOLUME ["/app/data"]

EXPOSE 3000

# Start server
CMD ["node", "dist/server.cjs"]
