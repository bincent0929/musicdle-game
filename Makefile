API_TSC = tsc scripts/api.ts --outDir scripts --target ES2017 --lib ES2017,DOM
# not needed yet
TSC_STATS = tsc minor_html/stats.ts --lib ES2015,DOM
CADDY = caddy run
TAILWIND = tailwindcss -o styles/compiled-styles.css
TAILWIND_WATCH = tailwindcss -o styles/compiled-styles.css --watch

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
	@echo "Services started! Use 'tmux attach -t caddy' or 'tmux attach -t tailwind' to view logs"
	@echo "Use 'make stop' to stop all services"

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

stop-caddy:
	@echo "Stopping caddy tmux session..."
	tmux kill-session -t caddy 2>/dev/null || echo "Caddy session not running"

stop-tailwind:
	@echo "Stopping tailwind tmux session..."
	tmux kill-session -t tailwind 2>/dev/null || echo "Tailwind session not running"

status:
	@echo "Checking tmux sessions..."
	@tmux list-sessions 2>/dev/null | grep -E '(caddy|tailwind)' || echo "No caddy or tailwind sessions running"