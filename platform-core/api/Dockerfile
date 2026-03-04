FROM node:20-slim AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY platform-core/contracts/package.json platform-core/contracts/package.json
COPY platform-core/api/package.json platform-core/api/package.json

RUN npm ci

COPY platform-core/contracts platform-core/contracts
COPY platform-core/api platform-core/api

RUN npm run build --workspace platform-core/contracts \
 && npm run build --workspace platform-core/api

RUN npm prune --omit=dev

FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/platform-core/contracts/dist /app/platform-core/contracts/dist
COPY --from=builder /app/platform-core/api/dist /app/platform-core/api/dist

CMD ["node", "platform-core/api/dist/index.js"]