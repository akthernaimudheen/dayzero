# DayZero — Comprehensive Test & Verification Report

**Execution Date:** 2026-10-30 &bull; **Test Framework:** Node.js Native Test Runner (`node --test`) &bull; **Environment:** Windows (PowerShell) / Node.js v24.16.0

---

## 1. Executive Summary & Verification Matrix

| Test Suite | File Location | Tests Executed | Passed | Failed | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Server Security & Access Control** | `server/test/security.test.mjs` | 26 | 26 | 0 | **PASS** |
| **Shared Domain & Consistency Metric** | `packages/shared/test/shared.test.mjs` | 13 | 13 | 0 | **PASS** |
| **Web Platform & Integration** | `web/test/web.test.mjs` | 6 | 6 | 0 | **PASS** |
| **Android App Config & Manifest** | `app/test/app.test.mjs` | 6 | 6 | 0 | **PASS** |
| **Disaster Recovery Restore Drill** | `scripts/restore_drill.mjs` | 6 Steps | 6 | 0 | **PASS** |
| **Web Production Next.js Build** | `web/` (`next build`) | 5 Pages | 5 | 0 | **PASS** |
| **Total Automated Verification** | Monorepo root | **57 Verification Gates** | **57** | **0** | **100% PASS** |

---

## 2. Server Security & Access Control (`server/test/security.test.mjs`)

Executed against an isolated test PocketBase instance on port 8190:

1. `✔ unauthenticated access is rejected` (73.5ms)
2. `✔ alice cannot read bob checkins` (36.3ms)
3. `✔ alice cannot update bob checkins` (95.5ms)
4. `✔ alice cannot delete bob checkins` (42.4ms)
5. `✔ bob cannot read alice goals` (10.8ms)
6. `✔ alice cannot self-promote role on accounts` (90.9ms)
7. `✔ alice cannot self-promote role on memberships` (31.2ms)
8. `✔ alice cannot create membership for bob` (8.7ms)
9. `✔ alice cannot create invitation as non-moderator` (20.0ms)
10. `✔ alice cannot create invitation with forged createdBy` (14.9ms)
11. `✔ bob cannot join with a made-up code` (41.9ms)
12. `✔ bob can join the pilot circle with a valid single-use invite` (124.1ms)
13. `✔ alice cannot hide another member's post by direct PATCH` (36.0ms)
14. `✔ non-moderator cannot use the moderation route` (30.4ms)
15. `✔ same single-use invite cannot be redeemed twice` (7.6ms)
16. `✔ expired invite is rejected` (208.4ms)
17. `✔ revoked invite is rejected` (140.2ms)
18. `✔ account deletion requires the account password` (96.2ms)
19. `✔ alice can delete her own account with correct password` (91.4ms)
20. `✔ account deletion removes private records` (106.7ms)
21. `✔ auth endpoints leak no stack traces` (76.9ms)
22. `✔ forged ownership field is ignored on create` (8.6ms)
23. `✔ malformed payloads are rejected without crash` (9.0ms)
24. `✔ oversized membership pseudonym is rejected` (8.9ms)
25. `✔ rate limiter returns 429 under sustained auth pressure` (330.0ms)
26. `✔ audit log is protected from ordinary users` (12.3ms)

---

## 3. Shared Domain Engine (`packages/shared/test/shared.test.mjs`)

1. `✔ shiftDateString correctly adds and subtracts days across month and year boundaries`
2. `✔ calculateWeeklyConsistency calculates 100% for full 7-day completed check-ins`
3. `✔ calculateWeeklyConsistency handles partial weeks when user onboarded 3 days ago`
4. `✔ calculateWeeklyConsistency deduplicates multiple submissions on the same calendar day`
5. `✔ calculateWeeklyConsistency handles zero check-ins without shaming`
6. `✔ transliteration maps key recovery terms correctly`
7. `✔ transliteration maps Kerala district names accurately`
8. `✔ toManglish converts Malayalam words to readable Latin script`
9. `✔ calculateHaversineDistanceKm calculates known distance accurately`
10. `✔ filterAndSortFacilities filters by district and sorts by distance`
11. `✔ buildDirectionsUrls creates valid OSM and Android Geo intent links`
12. `✔ safety guidance includes critical red flags for severe alcohol withdrawal and overdose`
13. `✔ i18n t() interpolates parameters and supports en, ml, and ml-Latn`

---

## 4. Web Integration & Localization (`web/test/web.test.mjs`)

1. `✔ localizes keys correctly for all supported web languages (en, ml, ml-Latn)`
2. `✔ transliterates Malayalam districts and vocabulary accurately`
3. `✔ calculates Kerala distance accurately using Haversine formula`
4. `✔ supports 14 Kerala districts for the directory filter`
5. `✔ provides deterministic emergency guidance without AI dependencies`
6. `✔ computes rolling 7-day consistency metric with zero-shaming supportive status`

---

## 5. Android Configuration & Manifest Audit (`app/test/app.test.mjs`)

1. `✔ declares the correct Android application ID (com.dayzero.app) and version (1.0.0, versionCode 1)`
2. `✔ restricts Android permissions strictly to minimal requirements in app.json (INTERNET only)`
3. `✔ verifies the generated AndroidManifest.xml contains only justified permissions (no storage/alert/location/contacts)`
4. `✔ enforces exact DayZero visual identity in app.json configuration (Ivory #F6F2E9, Deep Olive #283D30)`
5. `✔ verifies all generated Android asset files exist with valid PNG signatures`
6. `✔ verifies the brand color tokens in app/src/theme.ts (Ivory, Sage, Deep Olive, Pale Sage, Terracotta, Coral)`

---

## 6. Disaster Recovery & Restore Drill (`scripts/restore_drill.mjs`)

Executed on isolated port 8199:
```
=== DayZero Disaster Recovery & Restore Drill ===
[1/6] Sourcing live data directory: C:\Users\akthe\Downloads\dayzero\server\pb_data
[2/6] Generating atomic backup archive: C:\Users\akthe\Downloads\dayzero\backups\drill_backup_2026-10-29T19-12-23-297Z.zip
[3/6] Verifying archive integrity and file size...
  Archive created successfully: 295928 bytes.
[4/6] Restoring snapshot to isolated directory: C:\Users\akthe\Downloads\dayzero\server\_restore_drill_data
[5/6] Booting PocketBase test instance on isolated port 8199...
[6/6] Verifying restored collections and record integrity...
  Health API response: { message: 'API is healthy.', code: 200, data: {} }
  Facilities collection intact: totalItems = 14
  Helplines collection intact: totalItems = 5
=== RESTORE DRILL PASSED 100% WITH ZERO ERRORS ===
```

---

## 7. Status Classification

- **PASS:** All 57 automated tests, builds, and recovery drills.
- **BLOCKED (Local Native Android Compilation):** Local machine lacks Java JDK 17 and Android SDK toolchains (`where java` -> none, `ANDROID_HOME` -> none). Compiling `.apk` / `.aab` locally requires JDK 17 & Android SDK installation or running `npx eas-cli build -p android` in the cloud.
- **NOT TESTED (Physical Device Hardware Sensor Testing):** Physical mobile touch testing on real Android hardware cannot be performed inside the headless CI/agent execution environment; tested via headless React Native configuration tests and browser UI verification.
