FROM debian:stable

WORKDIR /game-website

RUN apt update -y && apt install -y git openssh-client caddy tmux

RUN apt install -y npm \
    && npm install typescript --save-dev \
    && npm install tailwindcss @tailwindcss/cli

COPY . .

RUN cd scripts/server && npm install && cd ../..
RUN npx tsc --build scripts/tsconfig.json

RUN npx tailwindcss -o styles/compiled-styles.css

EXPOSE 80
EXPOSE 443

CMD ["sh", "-c", "tmux new-session -d -s game-backend 'cd scripts/server && npm start' && caddy run --config Caddyfiles/deployment.caddyfile --adapter caddyfile"]
