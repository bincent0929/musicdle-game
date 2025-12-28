FROM debian:stable

WORKDIR /game-website

RUN apt update -y && apt install -y git openssh-client

RUN apt install -y caddy

RUN apt install -y npm \
    && npm install typescript --save-dev \
    && npm install tailwindcss @tailwindcss/cli

COPY . .

RUN cd scripts/server \
    && tmux new-session -d -s game-backend 'npm start' \
    && cd ../..

RUN npx tsc --build scripts/tsconfig.json

RUN npx tailwindcss -o styles/compiled-styles.css

EXPOSE 80
EXPOSE 443

CMD ["caddy", "run", "--config", "Caddyfiles/deployment.caddyfile", "--adapter", "caddyfile"]