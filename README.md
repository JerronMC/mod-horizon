# Official Mod Horizon (Fan Made. By Jerron.)

Static site for GitHub Pages. No build step.

## Deploy
1. Create a repo, upload everything in this folder to the root (keep `.nojekyll`).
2. Settings > Pages > Deploy from branch > `main` / root.
3. Custom domain: add a `CNAME` file containing your domain.

## Official logo
Replace `logo.svg` with the official Horizon logo (keep the same name, or edit the
`<img>` and `<link rel="icon">` in `index.html`/`404.html`). The included one is a placeholder.

## How data works
GitHub Pages has no server, so accounts, mods and uploaded files are saved in each visitor's
browser (IndexedDB). Mods posted on one device are not visible on another. For a shared
site where everyone sees every mod, connect a backend (Supabase / Firebase) and replace the
storage helpers at the top of `app.js`.
