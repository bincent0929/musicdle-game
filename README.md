# MusicDle
## September 17th:

<<<<<<< HEAD
To run the webserver to check how the website is looking run `caddy run` in your terminal and you'll be able to open the webpage through going https://localhost:443.

If you want to have multiple terminals open, then you should use tmux. It is built into the container. Just run `tmux` and then run `caddy run` and then press `CRTL+b` then `d` and you'll have Caddy running in the background.

Here are the docs if you want to look into changing it: https://caddyserver.com/docs/quick-starts/static-files

Use the files in `/assets/music` for temporary testing of playing music and the logic before using an API.

How typescript, whenever you change the `.ts` file you want to run `tsc typescript-file.ts` and then it will spit out a javascript file that we'll use in the website.
=======
- Vincent: music
- Nathan: Basic HTML
- Jaylen: Spotify/Youtube API

# 🎶 Git Workflow Guide

This project has **6 contributors**, so we use a branch-based workflow to stay organized.  
Follow these steps when working on new features or fixes.

---

## 1. Pull the Latest Changes

Always start by syncing your local repo:

```bash
git checkout main
git pull origin main
```

---

## 2. Create a New Branch

Create a branch for your task/feature.  
Use the format: `name/feature-description`

Examples:

- `alex/add-audio-player`
- `sara/fix-style-bug`
- `nathan/setup-docker`

```bash
git checkout -b <your-branch-name>
```

---

## 3. Work on Your Feature

- Make changes in your branch
- Stage and commit regularly

```bash
git add .
git commit -m "Short description of changes"
```

---

## 4. Push Your Branch to GitHub

```bash
git push -u origin <your-branch-name>
```

---

## 5. Open a Pull Request (PR)

- Go to GitHub
- Create a PR into `main`
- Request **at least 1 reviewer** from the team
- Do **not** push directly to `main`

---

## 6. Review & Merge

- Reviewer approves PR
- Merge is done via GitHub UI
- Delete the branch after merge

---

> [!tip] Best Practices
>
> - Pull `main` often to avoid conflicts
> - Keep branches small & focused (1 feature per branch)
> - Write clear commit messages
> - Use draft PRs if work is in progress
>>>>>>> logicBranch
