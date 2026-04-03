# Timeline App Runbook

Frontend timeline experience built with React + Vite. Runtime is static assets only.

## Requirements

- Node: `^20.19.0 || >=22.12.0`
- Recommended local version: `22.13.1` (matches `.nvmrc` and `.node-version`)

## Scripts

- `npm run dev` starts Vite dev server (default port `5174`)
- `npm run build` creates production assets in `dist/`
- `npm run start` serves the built app with `vite preview --host 0.0.0.0 --port 4173`
- `npm run preview` serves the built app locally with default preview settings
- `npm run lint` runs ESLint

## Environment Matrix

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `VITE_BASE_PATH` | No | `/` | Vite base path for non-root deployments |

Use `.env.example` as the template and keep real `.env` files untracked.

## Deployment

1. Install dependencies:
   - `npm ci`
2. Build:
   - `npm run build`
3. Publish:
   - Deploy the `dist/` directory to your static host.

`npm run start` is for local smoke checks of the build output, not as a long-term production process manager.

## Base Path / Subpath Deploys

- Root deploy (`https://example.com/`):
  - `VITE_BASE_PATH=/`
- Subpath deploy (`https://example.com/timeline/`):
  - `VITE_BASE_PATH=/timeline/`

The favicon and bundled asset URLs use Vite base-path resolution, so they remain valid in subpath deployments when `VITE_BASE_PATH` is set correctly.
