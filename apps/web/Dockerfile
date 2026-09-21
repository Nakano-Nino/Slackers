# Multi-stage Dockerfile for Slackers Web (Next.js 16 App Router)
FROM node:20-slim AS builder

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/

# Install dependencies and ensure Linux native binary for Tailwind v4 oxide is installed
RUN npm install && \
    cd apps/web && \
    npm install --no-save @tailwindcss/oxide

# Copy web source files
COPY apps/web ./apps/web

WORKDIR /app/apps/web

# Build arguments for inlining at compile-time (defaults to same-origin empty string for Nginx proxy)
ARG NEXT_PUBLIC_API_URL=""
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NODE_ENV=production

# Compile Next.js production build
RUN npm run build

# ==========================================
# Stage 2: Production Runner
# ==========================================
FROM node:20-slim AS runner

WORKDIR /app/apps/web

RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=3000

# Copy node_modules
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/apps/web/node_modules ./node_modules

# Copy built application and assets
COPY --from=builder /app/apps/web/.next ./.next
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/apps/web/package.json ./package.json
COPY --from=builder /app/apps/web/next.config.ts ./next.config.ts

# Non-root user configuration
USER node

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

CMD ["npm", "run", "start"]
