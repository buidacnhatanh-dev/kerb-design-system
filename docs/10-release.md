# 10 · Release 1.0.0

How Kerb is released, and the one time setup only the owner can do in GitHub and Vercel.

**Live:** docs at [kerb-docs.vercel.app](https://kerb-docs.vercel.app) (Vercel, project `kerb-docs`) · Storybook at [buidacnhatanh-dev.github.io/kerb-design-system](https://buidacnhatanh-dev.github.io/kerb-design-system/) (GitHub Pages). Both deploy from `main`. The setup steps below are done.

**npm publishing is off for now** (the owner's decision in M8). The packages are versioned `1.0.0` and ready to publish, but CI never sends them to npm. "Turning on npm publishing" below is the checklist for when that changes.

## What the repository does

| Piece | Where | What happens |
| --- | --- | --- |
| Versions | `packages/*/package.json`, `CHANGELOG.md` | `@kerb/react` and `@kerb/tokens` are at `1.0.0`. The changesets were applied with `pnpm changeset version`, so the changelogs list every milestone |
| Changesets | `.github/workflows/ci.yml`, job `release` | On every push to `main`, after `verify` passes. With changesets waiting, it opens or updates a "Release: version packages" pull request; merging it bumps versions and changelogs. It has no `publish` step, so nothing reaches npm |
| Storybook | job `storybook` | Builds Storybook and deploys it to GitHub Pages: `https://buidacnhatanh-dev.github.io/kerb-design-system/` (linked from the docs header) |
| Docs | `apps/docs/vercel.json` | Vercel installs with pnpm and builds `docs` and the packages it needs (`pnpm --filter "docs..." build`), on Node 24 (`engines` in `apps/docs/package.json`) |
| Social card | `apps/docs/public/og-image.png` | `design/02-Social.png`, as `og:image` and `twitter:image` with alt text. The absolute address comes from Vercel's `VERCEL_PROJECT_PRODUCTION_URL` |
| Size budget | root `package.json` `size-limit` | The 1.0.0 build plus 10%: JavaScript 24.2 kB (21.93 kB), CSS 7.3 kB (6.61 kB), brotli. CI fails above it |
| Portfolio | `apps/portfolio-demo` | The portfolio's project modal with `Dialog` and `Tabs`, tested in CI (`pnpm test:portfolio`) |
| Licence | `LICENSE`, and a copy in each package | MIT |

### Checked without publishing

Both packages were packed exactly as npm would publish them (`pnpm pack`: `dist`, `README.md`, `LICENSE`, `package.json`, with `workspace:*` replaced by `1.0.0`) and installed from the tarballs into a fresh Vite app outside the repository. It built, and in a browser `KerbProvider`, `Button`, `Dialog` and `DatePicker` rendered with no console errors, the theme was applied and `@kerb/tokens` imported.

## Steps for the owner, in this order

### 1. GitHub (repository settings)

1. **Visibility.** The repository is private, and GitHub Pages for a private repository needs a paid plan. To publish Storybook for free: Settings → General → Danger Zone → Change visibility → Public. If it stays private on a free plan, the `storybook` job fails until Pages is available.
2. **Pages.** Settings → Pages → Build and deployment → Source: **GitHub Actions**.
3. **Pull requests from Actions.** Settings → Actions → General → Workflow permissions: tick "Allow GitHub Actions to create and approve pull requests". The `release` job needs it the first time a changeset is waiting on `main`.

No npm account, token or secret is needed.

### 2. Push and watch

4. Push `main`: `git push origin main`.
5. In Actions, wait for the run: `verify`, then `release` and `storybook`.
   * `release` does nothing this time (no changesets are waiting)
   * `storybook` shows the Pages address in its summary

### 3. Vercel (any time after step 4)

6. vercel.com → Add New → Project → Import Git Repository → `kerb-design-system`. Grant the Vercel GitHub app access to the repository if it asks (needed while it is private).
7. In the import screen:
   * **Root Directory: `apps/docs`**
   * Framework: Next.js (detected). Leave install and build commands as they are: `apps/docs/vercel.json` sets them
   * Keep "Include files outside the root directory in the Build Step" on: the build reads `packages/react/src` for the props tables
   * Deploy
8. Open the production address and check a page and its social card (paste the address into a link preview tool). Optionally add a custom domain under Settings → Domains, then point the package `homepage` fields and the READMEs at it.

## Turning on npm publishing later

Repository changes:

* In the `release` job: add `publish: pnpm changeset publish` to the Changesets step; `registry-url: https://registry.npmjs.org` on `setup-node`; `id-token: write` in `permissions`; a step `pnpm --filter "@kerb/*" build` before Changesets; and the env lines named in the job's comment (`NPM_TOKEN`, `NODE_AUTH_TOKEN`, `NPM_CONFIG_PROVENANCE`)
* In the READMEs, the docs site's Install page and the home page: nothing to change, they already show `npm install @kerb/react` (the READMEs note that it is not on npm yet: remove that note)

Owner steps, in this order, before pushing those changes:

1. npmjs.com: sign in and turn on two factor authentication.
2. Create the organisation **`kerb`** (free plan, public packages). Nothing is published under `@kerb` yet, but whether the organisation name is free can only be checked on npmjs.com. If it is taken, pick another scope first: package names, imports and docs need renaming.
3. Create a granular access token: read and write for the `@kerb` scope, allowed to publish without a one time password if npm offers the option, longest expiry. Copy it.
4. GitHub: Settings → Secrets and variables → Actions → New repository secret `NPM_TOKEN`.
5. Push. Versions in `package.json` that are not on npm yet (`1.0.0`) are published, with tags and GitHub releases. Provenance needs a public repository.
6. Optional: on each package's npm page → Settings → Trusted publishing, add GitHub Actions for this repository and `ci.yml`; then the token can go.

## Later releases

1. `pnpm changeset` for every change to a package, committed with the change
2. Merge to `main`: CI opens or updates "Release: version packages"
3. Merge that pull request: versions and changelogs are updated (and published, once publishing is on)
