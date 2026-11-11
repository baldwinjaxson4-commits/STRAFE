# STRAFE

This folder is a complete source package for publishing STRAFE on Vercel.

## Publish with VS Code and GitHub

1. In VS Code, choose **File → Open Folder…** and open this `STRAFE-Vercel-Upload` folder.
2. Open **Source Control** in the left sidebar and choose **Initialize Repository** if prompted.
3. Enter a commit message such as `Prepare STRAFE for launch`, select **Commit**, then choose **Publish to GitHub**. Create a new repository for the game. Do not publish `node_modules` or `dist`; `.gitignore` already excludes them.
4. On Vercel, choose **Add New → Project**, connect GitHub, and import the new STRAFE repository.
5. Keep the Root Directory at the repository root. Vercel is configured to run the build and publish `dist`; click **Deploy**.
6. Open the Vercel URL and test the live game. Browser saves are tied to the site origin, so local records do not automatically transfer.

## Project files

- `src/`, `public/`, and `index.html`: game code and assets
- `tests/`: automated checks
- `package.json` and `pnpm-lock.yaml`: scripts and locked dependencies
- `vite.config.js` and `vercel.json`: build and deployment settings
- `ART.md`: art and asset notes

If you later change the game, commit and push the changes to GitHub; Vercel will redeploy automatically.
