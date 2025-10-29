#TSC = tsc scripts/script.ts --lib ES2015,DOM
TSC2 = tsc scripts/game.ts --lib ES2015,DOM
CADDY = caddy
PYTHON = python3
BACKEND_FILE = music_file_backend_webserver.py
TAILWIND = tailwindcss -o styles/compiled-styles.css


run:
	@echo "convert ts"
	$(TSC2)
	@echo "tailwind"
	$(TAILWIND)
	@echo "backend"
	$(PYTHON) $(BACKEND_FILE) &
	@echo "Caddy"
	$(CADDY) run


stop:
	@echo "kill"
	@pkill -f "$(PYTHON) $(BACKEND_FILE)" || true
	@pkill -f "$(CADDY)" || true