FROM caddy:builder AS builder
RUN xcaddy build \
    --with github.com/caddy-dns/cloudflare

FROM caddy:latest AS caddy
COPY --from=builder /usr/bin/caddy /usr/bin/caddy