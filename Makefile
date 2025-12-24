# Typescript
API_TSC = tsc scripts/game-logic.ts --outDir scripts --target ES2017 --lib ES2017,DOM
TSC_STATS = tsc scripts/stats.ts --lib ES2015,DOM
# Tailwind
TAILWIND-OUTPUT-FILE = compiled-styles.css
TAILWIND = tailwindcss -o styles/$(TAILWIND-OUTPUT-FILE)
TAILWIND_WATCH = tailwindcss -o styles/$(TAILWIND-OUTPUT-FILE) --watch
# Caddy
CADDY = caddy run --config Caddyfiles/local.caddyfile

# To run the site locally.
# This will compile the Typescript and Tailwind once. Updates won't be watched for.
run:
	@echo "Starting the site..."

	@echo "Transpiling the Typescript..."
	$(API_TSC)
	$(TSC_STATS)
	@echo "Done."
	
	@echo "Compiling the classes to Tailwind"
	$(TAILWIND)
	@echo "Done."
	
	@echo "Starting Caddy in the background..."
	tmux new-session -d -s caddy '$(CADDY)'
	@echo "Done."

	@echo "The site is now running!"

stop-run:
	@echo "Stopping your site..."
	
	@echo "Stopping Caddy..."
	tmux kill-session -t caddy
	@echo "Done."

	@echo "Removing the Tailwind compiled styles..."
	rm ./styles/$(TAILWIND-OUTPUT-FILE)
	@echo "Done."
	
	@echo "Removing the transpiled scripts..."
	rm ./scripts/*.js
	@echo "Done."

	@echo "The site is down and your filesystem was cleaned."

start:
	@echo "Starting the site..."

	@echo "Transpiling the Typescript..."
	$(API_TSC)
	$(TSC_STATS)
	@echo "Done."
	
	@echo "Starting Tailwind compiler watch in the background..."
	tmux new-session -d -s tailwind '$(TAILWIND_WATCH)'
	@echo "Done."
	
	@echo "Starting Caddy in the background..."
	tmux new-session -d -s caddy '$(CADDY)'
	@echo "Done."

	@echo "The site is now running, and you can edit your styles and they'll update!"

stop-start:
	@echo "Stopping your site..."
	
	@echo "Stopping Caddy..."
	tmux kill-session -t caddy
	@echo "Done."

	@echo "Stopping the Tailwind compiler..."
	tmux kill-session -t tailwind
	@echo "Done."

	@echo "Removing the Tailwind compiled styles..."
	rm ./styles/$(TAILWIND-OUTPUT-FILE)
	@echo "Done."
	
	@echo "Removing the transpiled scripts..."
	rm ./scripts/*.js
	@echo "Done."

	@echo "The site is down and your filesystem was cleaned."