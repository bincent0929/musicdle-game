FROM caddy:2.11

WORKDIR /app

RUN apt update && apt install -y \
    curl \
    git \
    tmux \
    npm \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g typescript
RUN curl -fsSL https://tailwindcss.com/install.sh | sh

RUN git clone https://github.com/bincent0929/musicdle-game.git \
    && mv musicdle-game /app/musicdle \
    && cd /app/musicdle \
    && npm install \
    && tsc

...