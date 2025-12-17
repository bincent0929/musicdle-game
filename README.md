# For Building The Website

For getting the site running, you'll want to compile the typescript to javascript `tsc scripts/game.ts` and run tailwind to output into the css `tailwindcss -o styles/compiled-styles.css` add `--watch` if you're currently working on the styling. It will update the styles as you add classes to the HTML. Then start the python backend using `python music_file_backend_webserver.py` and run `caddy run`. Now the website should be up.

# MusicDle
