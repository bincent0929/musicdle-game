API_TSC = tsc scripts/game-logic.ts --outDir scripts --target ES2017 --lib ES2017,DOM
# not needed yet
TSC_STATS = tsc scripts/stats.ts --lib ES2015,DOM
CADDY = caddy run --config local.caddyfile
TAILWIND = tailwindcss -o styles/compiled-styles.css
TAILWIND_WATCH = tailwindcss -o styles/compiled-styles.css --watch

# New: Python backend
BACKEND = python3 backend.py

# Use `make` and then run, start, etc. based on what you want to be running/ran

run:
	@echo "convert ts"
	$(API_TSC)
	$(TSC_STATS)
	@echo "tailwind to css"
	$(TAILWIND)
	@echo "start caddy"
	$(CADDY)

start:
	@echo "Converting TypeScript..."
	$(API_TSC)
	$(TSC_STATS)
	@echo "Starting caddy in tmux session 'caddy'..."
	tmux new-session -d -s caddy '$(CADDY)'
	@echo "Starting tailwind watch in tmux session 'tailwind'..."
	tmux new-session -d -s tailwind '$(TAILWIND_WATCH)'
	@echo "Starting backend in tmux session 'backend'..."
	tmux new-session -d -s backend '$(BACKEND)'
	@echo "Services started! Use 'tmux attach -t caddy', 'tmux attach -t tailwind', or 'tmux attach -t backend' to view logs"
	@echo "Use 'make stop' to stop all services"

# New: Start only backend
start-backend:
	@echo "Starting backend in tmux session 'backend'..."
	tmux new-session -d -s backend '$(BACKEND)'
	@echo "Backend started! Use 'tmux attach -t backend' to view logs"

start-caddy:
	@echo "Starting caddy in tmux session 'caddy'..."
	tmux new-session -d -s caddy '$(CADDY)'
	@echo "Caddy started! Use 'tmux attach -t caddy' to view logs"

start-tailwind:
	@echo "Starting tailwind watch in tmux session 'tailwind'..."
	tmux new-session -d -s tailwind '$(TAILWIND_WATCH)'
	@echo "Tailwind watch started! Use 'tmux attach -t tailwind' to view logs"

stop:
	@echo "Stopping caddy tmux session..."
	tmux kill-session -t caddy 2>/dev/null || echo "Caddy session not running"
	@echo "Stopping tailwind tmux session..."
	tmux kill-session -t tailwind 2>/dev/null || echo "Tailwind session not running"
	@echo "Stopping backend tmux session..."
	@echo "removed the compiled-styles"
	rm ./styles/compiled-styles.css
	tmux kill-session -t backend 2>/dev/null || echo "Backend session not running"
	@echo "Removing the transpiled scripts"
	rm ./scripts/*.js

# New: Stop backend only
stop-backend:
	@echo "Stopping backend tmux session..."
	tmux kill-session -t backend 2>/dev/null || echo "Backend session not running"

stop-caddy:
	@echo "Stopping caddy tmux session..."
	tmux kill-session -t caddy 2>/dev/null || echo "Caddy session not running"

stop-tailwind:
	@echo "Stopping tailwind tmux session..."
	tmux kill-session -t tailwind 2>/dev/null || echo "Tailwind session not running"

status:
	@echo "Checking tmux sessions..."
	@tmux list-sessions 2>/dev/null | grep -E '(caddy|tailwind|backend)' || echo "No caddy, tailwind, or backend sessions running"