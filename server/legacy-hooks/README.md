# Retired hook files (not loaded)

PocketBase's JSVM only loads `*.pb.js` files from `pb_hooks/`. The two files
here were the earlier, superseded implementations:

- `001_authorization.js` — used the long-removed `$app.recordBeforeCreate` API
- `002_routes.js` — same, plus a first draft of the custom routes

They were kept for reference only. The live implementations are
`pb_hooks/001_authorization.pb.js` and `pb_hooks/002_routes.pb.js`; every
security guarantee they encoded has either an API rule in
`pb_migrations/1793140000000_dayzero_collections.js` or an explicit hook in the
live files. The security suite in `server/test/security.test.mjs` verifies the
live behaviour.

Do not move these back into `pb_hooks/` — they would not load and would only
suggest that protections exist which are not actually running.
