# DayZero — Architecture and Licensing Decisions

DayZero is a privacy-first recovery-support platform inspired by Thanal (തണൽ). This document records
the architecture actually chosen, why each component was chosen, and what each choice costs.

## 1. Hard constraint

Zero licence cost. No Supabase Cloud, no paid BaaS, no paid managed database, no paid AI API, no paid
auth provider, no paid messaging, no paid analytics. No free trial or promotional credit is treated as a
sustainable free deployment solution.

Every component below is open source and self-hostable without a licence fee.

## 2. Chosen stack

| Layer | Choice | Licence | Why |
|---|---|---|---|
| Android | Expo + React Native + TypeScript | MIT (Expo tooling is open source) | Required by brief; produces a real AAB |
| Web | Next.js + TypeScript | MIT | Required by brief; independent web experience |
| Shared logic | TypeScript package `@dayzero/shared` | MIT | One implementation of check-in maths and transliteration, consumed by web + Android |
| Backend | PocketBase v0.41.0 | **MIT** | Self-hosted, single binary, no Go toolchain needed at runtime |
| Database | SQLite (PocketBase-managed, WAL mode) | Public domain (SQLite) | Zero cost, embedded, single-server |
| Reverse proxy / HTTPS | Caddy 2 | Apache-2.0 | Automatic HTTPS, minimal config |
| Object storage | **None by default** | n/a | No concrete storage requirement exists yet; PocketBase local `pb_data/storage` covers uploads |
| Map rendering | Leaflet + OpenStreetMap raster tiles (web), external navigation intents (Android) | BSD-2-Clause (Leaflet), ODbL (OSM data) | No paid map/geocoding API |
| Tests | Vitest, React Native Testing Library, Playwright, Node test runner for API tests | MIT / Apache-2.0 | All open source |
| CI | GitHub Actions | n/a (free for public repos, free tier for private) | Required by brief |
| Hosting | **Not yet provisioned** — see `COSTS.md` | n/a | No authorized zero-cost public hosting identified at time of writing |

## 3. Shape of the system

```
                    +---------------------------+
   Android (Expo) --|                           |
   Web (Next.js)  --|  PocketBase (single host) |-- pb_data/ (SQLite + file storage)
                    |  + Caddy (HTTPS, TLS)     |
                    +---------------------------+
                                ^
                                |
                     packages/shared (pure TS)
                     - weekly consistency metric
                     - Malayalam transliteration
                     - i18n message catalogues
```

Deliberately **not** microservices. PocketBase is one process serving the REST API, auth, realtime and
file storage. Caddy terminates TLS in front of it. This is the entire production topology.

## 4. Backend isolation (replaceability requirement)

The brief requires that PocketBase remain replaceable. Isolation is achieved by:

- All business rules that must be enforced (eligibility, metric calculations, moderation authorization)
  live in `packages/shared`, written as pure functions with no PocketBase imports.
- All transport through the backend goes through `src/api/*` in the web and app projects, never raw
  PocketBase calls scattered through UI code.
- Collection schemas are declared once in `server/pb_migrations/`, so a different backend would
  reproduce the same shape from a single source.
- Cross-collection authorisation is expressed in PocketBase API rules *and* re-asserted server-side in
  `server/pb_hooks/` for the operations where a rule alone is insufficient (role assignment,
  invitation redemption, moderation).

## 5. What PocketBase is trusted with, and what it is not

PocketBase is the initial backend, **not** permission to trust the client.

Trusted to PocketBase:
- Storage, indexing, and CRUD mechanics.
- Enforcing collection API rules on every request, including direct API calls that bypass the UI.
- Auth record lifecycle and session tokens.

Not trusted to the client, ever:
- Moderator or role assignment.
- Group membership decisions.
- Invitation validity, expiry, revocation.
- Consistency-metric values (recomputed server-side from stored check-ins).
- Moderation actions.

Superuser (admin) credentials exist only on the server, in `pb_data/`, and are never present in the web
or Android bundles. The admin dashboard is not exposed publicly (see `COSTS.md` and `SECURITY.md`).

## 6. Explicit non-goals at this stage

- No AI service of any kind, paid or otherwise. Emergency guidance is deterministic and reviewed text
  that ships inside the client and works offline.
- No SMS, push provider, or third-party analytics.
- No claims of high availability, horizontal scaling, or multi-server operation. PocketBase is
  single-server SQLite in WAL mode with one writer at a time.