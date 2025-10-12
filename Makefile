TSC = tsc script.ts --lib ES2015,DOM

CADDY = caddy
PYTHON = python3
BACKEND_FILE = music_file_backend_webserver.py


run:
	@echo "convert ts"
	$(TSC)
	@echo "backend"
	$(PYTHON) $(BACKEND_FILE) &
	@echo "Caddy"
	$(CADDY) run


stop:
	@echo "kill"
	@pkill -f "$(PYTHON) $(BACKEND_FILE)" || true
	@pkill -f "$(CADDY)" || true