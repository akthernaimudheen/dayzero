# DayZero (തണൽ) — Zero-Licence-Cost Recovery Platform

**DayZero** is an open-source, privacy-first recovery-support platform inspired by **Thanal (തണൽ)**. It assists individuals across Kerala with verified public de-addiction and mental-health service discovery, 24/7 crisis helpline routing, private wellbeing check-ins, a non-shaming 7-day consistency metric, and invitation-only moderated recovery circles.

---

## 1. Zero-Licence-Cost & Open-Source Guarantee

This project strictly adheres to a **zero-licence-cost policy**:
- **Zero Paid BaaS:** No Supabase Cloud, Firebase paid tiers, or Auth0.
- **Zero Paid Database Licenses:** Powered by self-hosted PocketBase and embedded SQLite in WAL mode.
- **Zero Paid Maps / Geocoding APIs:** Uses OpenStreetMap raster tiles with Leaflet on the web, and native Android `geo:` intent routing on mobile.
- **Zero Paid External AI APIs:** Safety and emergency triage use transparent, deterministic, clinically reviewed rules that execute offline.
- **Zero Third-Party Trackers:** Fully aligned with Indian Digital Personal Data Protection (DPDP) principles.

All software is released under permissive open-source licenses (MIT / Apache-2.0 / AGPL-v3).

---

## 2. Monorepo Architecture

```
dayzero/
├── app/                  # Expo + React Native Android Application (package: com.dayzero.app)
│   ├── android/          # Generated native Android project (AndroidManifest.xml, Gradle setup)
│   ├── assets/           # Brand asset icons & splash screens (Ivory & Deep Olive)
│   ├── eas.json          # EAS Cloud Build profiles for APK (preview) and AAB (production)
│   └── src/              # Mobile React Native screens, theme, and API client
├── web/                  # Next.js 15 + React 19 Complementary Web Experience
├── packages/
│   └── shared/           # Shared TypeScript domain models, consistency metric, i18n & transliteration
├── server/               # Self-hosted PocketBase v0.40.6 backend
│   ├── pb_hooks/         # Server-side authorization, moderation, check-in, and account erasure hooks
│   ├── pb_migrations/    # Declarative schema collections and strict API rules
│   ├── seed/             # 14 verified Kerala facilities & 5 authoritative helplines
│   └── test/             # Comprehensive 26-case backend security test suite
├── deploy/               # Caddy reverse proxy config, Systemd unit, Docker Compose
├── docs/                 # Architectural, security, privacy, and Play Store documentation
│   ├── HELPLINE_SOURCES.md # Official provenance & verification for facilities and helplines
│   ├── TEST_REPORT.md    # Comprehensive test execution & verification report
│   ├── PRODUCTION_READINESS.md # Production governance scorecard & release readiness
│   ├── RELEASE_CHECKLIST.md # Step-by-step release checklist & gate decision
│   ├── COSTS.md          # Complete zero-cost analysis and operational hosting options
│   ├── SECURITY.md       # Threat modeling, role escalation defense, and access rules
│   ├── PRIVACY.md        # DPDP compliance, data minimization, pseudonymity disclosure
│   ├── OPERATIONS.md     # Single-server SQLite ops, WAL mechanics, backup & restore drills
│   └── PLAY_STORE.md     # Google Play Health declaration, Data safety, and release guide
└── scripts/              # Hardened backup scripts (sh/ps1), restore drill, asset generation
```

---

## 3. Visual Identity

Built with a restrained, calming, accessible wellness palette:
- **Ivory (`#F6F2E9`):** Primary background
- **Sage (`#547A61`):** Primary brand accent & positive action
- **Deep Olive (`#283D30`):** Dominant contrast, headings, and structure
- **Pale Sage (`#E8EEE3`):** Card backgrounds and subtle badges
- **Terracotta (`#B87858`):** Intentional secondary actions
- **Coral (`#D98E79`):** Immediate emergency warning and SOS actions

*(No black or dark-blue primary themes).*

---

## 4. Languages & Localisation

DayZero supports 3 language modes:
1. **English (`en`)**
2. **Malayalam Script (`ml`):** മലയാളം
3. **Transliterated Malayalam / Manglish (`ml-Latn`):** Phonetic Malayalam in the English alphabet with an offline bidirectional transliteration engine covering recovery terminology and all 14 Kerala districts.

---

## 5. Verified Kerala Public Care & Helplines

The directory is seeded with authoritative, verified public resources (detailed in `docs/HELPLINE_SOURCES.md`):
- **Punarjani (പുനർജനി):** Department of Homoeopathy de-addiction scheme across Kerala District Hospitals.
- **Vimukthi Mission (വിമുക്തി):** Kerala State anti-narcotics campaign centres.
- **112 (ERSS):** Emergency Response Support System (Police, Fire, Ambulance) — 24/7, Toll-Free.
- **14416 (Tele-MANAS Kerala):** 24/7 Mental health and crisis intervention in Malayalam.
- **14446 (Vimukthi Helpline):** State substance de-addiction advisory.
- **14405 (MANAS):** Narcotics Control Bureau national toll-free helpline.
- **1056 (DISHA):** Kerala Health Department tele-advisory.

Emergency guidance is deterministically evaluated offline without requiring an account or internet connectivity.

---

## 6. Running Tests & Disaster Recovery Drills

DayZero includes 51 automated unit/integration tests and an end-to-end disaster recovery restore drill with 100% pass rate:

```bash
# Run all unit/integration tests across the monorepo
npm test

# Run individual test suites:
npm run test:server   # PocketBase security suite (26 tests)
npm run test:shared   # Domain consistency & transliteration (13 tests)
npm run test:web      # Web app integration tests (6 tests)
npm run test:app      # Mobile app configuration & manifest verification (6 tests)

# Run automated disaster recovery restore drill
node scripts/restore_drill.mjs
```

---

## 7. Local Development

### 1. Start the PocketBase Backend
```bash
cd server
./pocketbase serve --dir=pb_data --hooksDir=pb_hooks --migrationsDir=pb_migrations --http=127.0.0.1:8090
```

### 2. Start the Next.js Web Experience
```bash
cd web
npm run dev
# Open http://localhost:3000
```

### 3. Start the Android Expo Application
```bash
cd app
npx expo start
```

---

## 8. Android Build (APK & AAB)

```bash
cd app

# Build standalone installable APK for device testing (via EAS Cloud):
npx eas-cli build -p android --profile preview

# Build signed production Android App Bundle (.aab) for Google Play:
npx eas-cli build -p android --profile production
```
See `docs/PLAY_STORE.md` for full Google Play Console compliance, Health App policy, and Data Safety form answers.
