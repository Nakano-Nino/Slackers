# syntax=docker/dockerfile:1

# Stage 1: Build binary
FROM golang:alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache ca-certificates git

# Cache Go modules
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Compile optimized static binary
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /app/bin/server ./cmd/server

# Stage 2: Minimal runtime image
FROM alpine:3.20

# Install runtime utilities for TLS and healthchecks
RUN apk add --no-cache ca-certificates tzdata curl

WORKDIR /app

# Create non-root user
RUN addgroup -S slackers && adduser -S slackers -G slackers

# Copy compiled binary from builder
COPY --from=builder /app/bin/server /app/server

# Set ownership and permissions
RUN chown -R slackers:slackers /app

USER slackers

EXPOSE 5001

HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5001/api/health || exit 1

ENTRYPOINT ["/app/server"]
