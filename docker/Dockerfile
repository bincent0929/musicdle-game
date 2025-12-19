FROM debian:stable

WORKDIR /game-website

RUN apt update -y && apt install -y git openssh-client

RUN apt install -y caddy

RUN apt install -y npm \
    && npm install typescript --save-dev \
    && npm install tailwindcss

RUN mkdir -p -m 0600 ~/.ssh && ssh-keyscan github.com >> ~/.ssh/known_hosts

RUN --mount=type=ssh git clone git@github.com:bincent0929/musicdle-game.git .

RUN tsc scripts/game-logic.ts --outDir scripts --target ES2017 --lib ES2017,DOM
RUN tsc scripts/stats.ts --lib ES2015,DOM

RUN tailwindcss -o styles/compiled-styles.css

RUN caddy run deployment.caddyfile