#!/bin/sh
set -e

node /game-website/scripts/server/dist/main-server.js &
NODE_PID=$!

trap 'kill "$NODE_PID"' TERM INT

caddy run --config /game-website/Caddyfiles/deployment.caddyfile --adapter caddyfile

wait "$NODE_PID"
