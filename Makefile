API_TSC = tsc scripts/api.ts --outDir scripts --target ES2017 --lib ES2017,DOM
# not needed yet
#TSC3 = tsc minor_html/stats.ts --lib ES2015,DOM
CADDY = caddy run
TAILWIND = tailwindcss -o styles/compiled-styles.css


run:
	@echo "convert ts"
	$(API_TSC)
	@echo "tailwind to css"
	$(TAILWIND)
	@echo "start caddy"
	$(CADDY)


stop:
	@echo "kill"
	@pkill -f "$(CADDY)" || true