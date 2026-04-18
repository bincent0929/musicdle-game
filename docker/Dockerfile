FROM node:22-slim AS builder

RUN corepack enable pnpm

WORKDIR /build

# Install Tailwind CSS separately (not a project dependency)
RUN pnpm add --global tailwindcss @tailwindcss/cli

# Install dependencies before copying source for better layer caching
COPY scripts/package.json ./scripts/
RUN pnpm -C scripts install

COPY scripts/server/package.json ./scripts/server/
RUN pnpm -C scripts/server install

COPY . .

RUN pnpm -C scripts run build:frontend
RUN pnpm -C scripts/server run build

# Generate Tailwind CSS by scanning HTML files
RUN mkdir -p styles \
    && printf '@import "tailwindcss";' > /tmp/tw-input.css \
    && tailwindcss -i /tmp/tw-input.css -o styles/compiled-styles.css


FROM caddy:2-alpine

RUN apk add --no-cache nodejs

WORKDIR /game-website

COPY --from=builder /build/index.html ./
COPY --from=builder /build/game.html ./
COPY --from=builder /build/game-completed.html ./
COPY --from=builder /build/assets ./assets
COPY --from=builder /build/styles ./styles
COPY --from=builder /build/scripts/dist ./scripts/dist

COPY --from=builder /build/scripts/server/dist ./scripts/server/dist
COPY --from=builder /build/scripts/server/node_modules ./scripts/server/node_modules

COPY --from=builder /build/Caddyfiles ./Caddyfiles

COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80
EXPOSE 443

ENTRYPOINT ["/entrypoint.sh"]
