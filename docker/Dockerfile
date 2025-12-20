FROM debian:stable

WORKDIR /game-website

RUN apt update -y && apt install -y git openssh-client

RUN apt install -y caddy

RUN apt install -y npm \
    && npm install typescript --save-dev \
    && npm install tailwindcss @tailwindcss/cli

COPY . .

RUN npx tsc scripts/game-logic.ts --outDir scripts --target ES2017 --lib ES2017,DOM
RUN npx tsc scripts/stats.ts --lib ES2015,DOM

RUN npx tailwindcss -o styles/compiled-styles.css

EXPOSE 80
EXPOSE 443

CMD ["caddy", "run", "--config", "Caddyfiles/deployment.caddyfile"]