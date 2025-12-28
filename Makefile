# Client Typescript
TS_COMPILE = tsc --build scripts/tsconfig.json
# Backend

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
	$(TS_COMPILE)
	@echo "Done."
	
	@echo "Compiling the classes to Tailwind"
	$(TAILWIND)
	@echo "Done."

	@echo "Starting the backend..."
	cd scripts/server && tmux new-session -d -s game-backend 'npm start'
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

	@echo "Stopping the backend..."
	tmux kill-session -t game-backend
	@echo "Done."

	@echo "Removing the Tailwind compiled styles..."
	rm ./styles/$(TAILWIND-OUTPUT-FILE)
	@echo "Done."
	
	@echo "Removing the transpiled scripts..."
	rm ./scripts/*.js
	@echo "Done."

	@echo "The site is down and your filesystem was cleaned."

# !!!!!!!!!!!!!!!!!!!! This doesn't work the backend needs to be added rq !!!!!!!!!!!!!!!!!!!!
# To run the site locally with dynamic CSS updates
# The same as `run` but you can also change the classes in your Tailwind or its input CSS file
# to have it update while your site is started.
start:
	@echo "Starting the site..."

	@echo "Transpiling the Typescript..."
	$(GAME_TSC)
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