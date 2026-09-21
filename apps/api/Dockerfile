# Multi-stage Dockerfile for Slackers API (Node.js + Express + Prisma)
# Stage 1: Build & compile TypeScript
FROM node:20-alpine AS builder

WORKDIR /app

# Install system dependencies needed by Prisma engine
RUN apk add --no-cache openssl libc6-compat

# Copy monorepo dependency manifests
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN npm ci

# Copy API source and Prisma configuration
COPY apps/api ./apps/api

# Generate Prisma Client
WORKDIR /app/apps/api
RUN npx prisma generate --schema prisma/schema.prisma

# Build TypeScript to JavaScript (/app/apps/api/dist)
RUN npm run build

# ==========================================
# Stage 2: Production Runner
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app/apps/api

# Install system runtime dependencies: openssl (Prisma) and curl (Healthchecks)
RUN apk add --no-cache openssl libc6-compat curl

ENV NODE_ENV=production
ENV PORT=5001

# Create upload directory and non-root node user configuration
RUN mkdir -p /app/apps/api/uploads /app/apps/api/uploads/avatars && \
    chown -R node:node /app

# Copy node_modules from builder (includes Prisma CLI and engine binaries)
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/apps/api/node_modules ./node_modules

# Copy compiled dist, prisma schema, package manifest, and entrypoint
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/apps/api/package.json ./package.json
COPY --from=builder /app/apps/api/src ./src
COPY apps/api/entrypoint.sh ./entrypoint.sh

RUN chmod +x ./entrypoint.sh && \
    chown -R node:node /app/apps/api

# Use non-root user for security
USER node

EXPOSE 5001

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5001/api/health || exit 1

ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "dist/index.js"]
