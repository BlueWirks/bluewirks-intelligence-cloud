FROM node:20-slim AS builder
WORKDIR /app

# Workspace manifests (for npm ci)
COPY package.json package-lock.json ./
COPY platform-core/contracts/package.json platform-core/contracts/package.json
COPY platform-core/worker/package.json platform-core/worker/package.json

# Install deps (includes dev for build), using root lockfile
RUN npm ci

# Copy sources
COPY platform-core/contracts platform-core/contracts
COPY platform-core/worker platform-core/worker

# Build workspace deps in correct order
RUN npm run build --workspace platform-core/contracts \
 && npm run build --workspace platform-core/worker

# Prune dev deps for runtime image
RUN npm prune --omit=dev

FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

# Copy node_modules (contains workspace links)
COPY --from=builder /app/node_modules /app/node_modules

# IMPORTANT: copy full workspace dirs so workspace symlinks resolve at runtime
COPY --from=builder /app/platform-core/contracts /app/platform-core/contracts
COPY --from=builder /app/platform-core/worker /app/platform-core/worker

CMD ["node", "platform-core/worker/dist/index.js"]
