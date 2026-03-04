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

# Copy pruned node_modules + built artifacts
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/platform-core/contracts/dist /app/platform-core/contracts/dist
COPY --from=builder /app/platform-core/worker/dist /app/platform-core/worker/dist

CMD ["node", "platform-core/worker/dist/index.js"]