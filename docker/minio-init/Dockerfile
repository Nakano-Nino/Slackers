FROM cgr.dev/chainguard/minio-client:latest AS mc-bin

FROM alpine:3.20
COPY --from=mc-bin /usr/bin/mc /usr/bin/mc
RUN apk add --no-cache ca-certificates
