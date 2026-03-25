# Muffle Threads

Threads is the discussion prototype served by the main website at `/threads`.

## Local development

From the repo root:

```bash
npm run dev:threads:stack
```

That starts both pieces the app expects:

- The unified backend/API from the repo root on port `8080`
- The Threads Vite frontend from `apps/threads`

If you only want the frontend dev server, run:

```bash
cd apps/threads
npm run dev
```

## Build

```bash
cd apps/threads
npm run build
```

The production build is emitted to `apps/threads/dist` and is served by the root `server.js`.

## Tests

```bash
cd apps/threads
npm test
```

The parameter-thread suite is offline-safe by default. To include live URL reachability checks, run:

```bash
THREADS_TEST_NETWORK=1 npm test
```

## Runtime notes

- Shared API routes come from the root `backend/unifiedRoutes.js`.
- Shared static assets come from the repo-root `/assets` mount.
- Generated media caches now default to a runtime directory instead of writing new files into tracked app folders.
