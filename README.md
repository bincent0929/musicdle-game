# MusicDle

To run the webserver to check how the website is looking run `caddy run` in your terminal and you'll be able to open the webpage through going https://localhost:443.

If you want to have multiple terminals open, then you should use tmux. It is built into the container. Just run `tmux` and then run `caddy run` and then press `CRTL+b` then `d` and you'll have Caddy running in the background.

Here are the docs if you want to look into changing it: https://caddyserver.com/docs/quick-starts/static-files

Use the files in `/assets/music` for temporary testing of playing music and the logic before using an API.

How typescript, whenever you change the `.ts` file you want to run `tsc typescript-file.ts` and then it will spit out a javascript file that we'll use in the website.