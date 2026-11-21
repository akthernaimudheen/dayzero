# DayZero (തണൽ) — Android Emulation, Inspection & Further Research Prompt

> Copy this entire file as the prompt to your more powerful machine / agent. It contains the project brief, the recent fixes, a step-by-step Android APK emulation & inspection plan, and research directions to make the app excellent for addiction recovery support.

---

## 0. Project Brief (read first)

**DayZero** is an open-source, privacy-first recovery-support platform inspired by **Thanal (തണൽ)**. It helps individuals across Kerala (India) with:
- Verified public de-addiction & mental-health service discovery (14 Kerala facilities + 5 helplines).
- 24/7 crisis helpline routing (112 ERSS, Tele-MANAS 14416, Vimukthi 14446, MANAS 14405, DISHA 1056).
- Private, pseudonymous wellbeing check-ins (mood 1–5 + reflection).
- A non-shaming 7-day consistency metric.
- Invitation-only moderated recovery circles (pseudonyms, reporting).
- Offline deterministic emergency triage (severe alcohol withdrawal / delirium tremens / overdose) with prominent 112 / 14416 routing.
- 3 language modes: English, Malayalam script, Manglish (transliterated Malayalam) with offline bidirectional transliteration.

**Zero-licence-cost policy:** no paid BaaS (self-hosted PocketBase + SQLite WAL), no paid maps (OSM/Leaflet + native `geo:` intents), no paid AI (deterministic offline rules), no third-party trackers (DPDP-aligned). Licenses: MIT / Apache-2.0 / AGPL-v3.

**Monorepo layout:**
```
dayzero/
├── app/        # Expo + React Native Android (package com.dayzero.app, Expo SDK 52, RN 0.76.6)
├── web/        # Next.js 15 + React 19
├── packages/shared/  # shared TS domain models, consistency metric, i18n & transliteration
├── server/     # PocketBase v0.40.6 (pb_hooks, pb_migrations, seed, 26-case security tests)
├── deploy/     # Caddy, systemd, docker-compose
├── docs/       # architecture, security, privacy, play store, etc.
└── scripts/    # backups, restore drill
```

**Visual identity:** Ivory `#F6F2E9` bg, Sage `#547A61` accent, Deep Olive `#283D30` structure, Pale Sage `#E8EEE3` cards, Terracotta `#B87858` secondary, Coral `#D98E79` emergency. No black/dark-blue primary.

**Android app entry:** `app/App.tsx` (tab navigator: Companion, Care, Helplines, Community, Settings) + always-mounted `EmergencyModal`. API base defaults to `http://10.0.2.2:8090` (Android emulator → host localhost).

**Tests:** 51 total (server 26, shared 13, web 6, app 6). Run `npm test`.

---

## 1. Recent fixes already applied (do NOT redo blindly; verify)

1. **Blank white screen root cause:** invalid HTML tags (`<strong>`) inside React Native `<Text>` in `app/src/components/EmergencyModal.tsx` and `app/src/screens/SettingsScreen.tsx`. React Native does not support HTML elements → render crash on launch (EmergencyModal is always mounted). Replaced with nested bold `<Text>` elements.
2. **Undefined import:** `app/src/screens/CareDirectoryScreen.tsx` imported `filterFacilities` which did not exist; changed to import `filterAndSortFacilities` from `@dayzero/shared` aliased as `filterFacilities`.
3. Android build infra fixes already in git history: Kotlin 1.9.25 pin, compose compiler suppression, AGP 8 patching, expo-constants, Metro Flow parsing, react-native 0.76.6 override.

Uncommitted edits exist on the working tree (3 source files + package-lock). Inspect with `git status` / `git diff` before building.

---

## 2. Goal on this machine

1. Build a **debug APK** of the Expo/React Native Android app.
2. Run it on an **Android emulator (AVD)** and visually inspect every screen + flows.
3. Capture logs (logcat) to confirm no red-screen / crash / blank screen.
4. Verify the previous blank-screen fix actually renders all tabs.
5. Produce a short findings report + any further fixes needed.
6. (Optional) Run the full test suite and the Metro bundle export.

---

## 3. Prerequisites to install (powerful machine)

- **JDK 17** (Temurin or Oracle). Verify: `java -version` → 17.
- **Android Studio** (latest stable) with:
  - Android SDK Platform 34 (Android 14) and 35.
  - Android SDK Build-Tools 34.x.
  - Android Emulator + an AVD (Pixel 6/7, API 34, x86_64, Google APIs, with hardware acceleration).
  - Android SDK Platform-Tools (adb).
- **Node.js 20 LTS** + npm.
- **Git**.
- Optional: `watchman` (macOS/Linux) for Metro file watching.
- Ensure `ANDROID_HOME` / `ANDROID_SDK_ROOT` env vars set and `platform-tools`, `emulator`, `cmdline-tools` on PATH.

Check:
```bash
java -version
node --version
adb version
emulator -list-avds
```

---

## 4. Get the code onto this machine

```bash
git clone https://github.com/akthernaimudheen/dayzero.git
cd dayzero
git checkout freebuff/6fd46cab7d7ce23c5f8745f5   # or main
git status
git log --oneline -10
```
If you need the uncommitted fixes from the other machine, apply them manually or pull the branch that contains them. Re-check `git diff` for the 3 source files.

---

## 5. Install dependencies

```bash
# from repo root
npm install          # workspaces: packages/*, web, app
npm run build:shared # builds @dayzero/shared (needed by app)
```
If install fails, retry with `npm ci` only if lockfile is trustworthy; prefer `npm install`. Do not upgrade deps.

---

## 6. Start the backend (PocketBase) — needed for data screens

The app's API base is `http://10.0.2.2:8090` (emulator alias for host localhost). Start PocketBase on the host:

```bash
cd server
# if binary not present, download PocketBase v0.40.6 for your OS from https://github.com/pocketbase/pocketbase/releases
./pocketbase serve --dir=pb_data --hooksDir=pb_hooks --migrationsDir=pb_migrations --http=127.0.0.1:8090
```
Seed data: 14 facilities + 5 helplines load via migrations. Verify `http://127.0.0.1:8090/api/health` returns OK.

> The Care/Helplines/Community screens need the backend. Companion (home) and Emergency modal work offline.

---

## 7. Build & run the Android app on an emulator

### Option A — Expo dev client (fastest iteration, hot reload)
```bash
cd app
npx expo start --android
```
This launches Metro and installs Expo Go / dev client on the running emulator. Use for UI iteration. Note: some native modules may require a dev client; if Expo Go complains, use Option B.

### Option B — Standalone debug APK via Gradle (closest to real device)
```bash
cd app
npx expo prebuild --platform android --no-install   # generates/refreshes android/
cd android
./gradlew assembleDebug
# APK output: app/android/app/build/outputs/apk/debug/app-debug.apk
```
Install on emulator:
```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```
Launch:
```bash
adb shell am start -n com.dayzero.app/.MainActivity
```

### Option C — EAS cloud build (no local SDK)
```bash
cd app
npx eas-cli build -p android --profile preview
# download APK from EAS dashboard, then adb install
```
Use only if local SDK unavailable. Requires Expo account.

### Option D — Android Studio
Open `app/android` as a project in Android Studio → select AVD → Run. Easiest for breakpoints/logcat UI.

---

## 8. Emulator setup & AVD creation (if no AVD exists)

```bash
# List available system images
sdkmanager --list | grep system-images

# Create AVD (example)
avdmanager create avd -n DayZero_Pixel7 -k "system-images;android-34;google_apis;x86_64" -d "pixel_7"

# Launch
emulator -avd DayZero_Pixel7 -gpu host -no-snapshot-load
```
Enable hardware acceleration (HAXM on Intel / WHPX on Windows / KVM on Linux). For Linux: `sudo apt install qemu-kvm` and add user to kvm group.

---

## 9. Inspection checklist (do this on the emulator)

Launch app, then verify each:

1. **Cold launch:** app opens to Companion tab, no blank white screen, header "DayZero / തണൽ • Recovery Platform" visible, SOS 112 pill visible, bottom nav visible.
2. **All 5 tabs render:** Companion, Care, Helplines, Community, Settings — tap each, no crash.
3. **Emergency modal:** tap SOS 112 pill → modal opens with bold text rendering correctly (no red screen). Close it.
4. **Language switch:** Settings → switch to Malayalam / Manglish → UI transliterates; check Care/Helplines labels.
5. **Care directory:** opens list of 14 facilities, search/filter works, no `filterFacilities is not defined` crash.
6. **Helplines:** lists 5 helplines with call affordance (uses `tel:` intent).
7. **Companion check-in:** record a mood + note → appears in list; 7-day consistency metric updates.
8. **Community:** redeem invite code `PILOT-REVIEW-2026` with pseudonym → joins; post + report works.
9. **Account deletion:** Settings → delete account with password → cascades.
10. **Offline emergency triage:** airplane mode → emergency guidance still works (deterministic offline rules).

Capture screenshots for each (Android Studio screenshot tool or `adb exec-out screencap -p > screen.png`).

---

## 10. Logs & debugging

```bash
# Clear + watch
adb logcat -c
adb logcat | grep -iE "dayzero|ReactNative|FATAL|AndroidRuntime|expo"

# Save full log to file
adb logcat -d > logcat.txt

# Metro bundle errors
npx expo start  # watch terminal

# Red screen / JS errors
adb logcat | grep -i "ERROR\|Exception"
```
Look for: `Invariant Violation`, `undefined is not a function`, `Text strings must be rendered within a <Text>`, native crashes in `libreactnativejni`.

Also check Metro bundle export succeeds:
```bash
cd app
npx expo export --platform android --output-dir /tmp/dayzero-export
```

---

## 11. Run tests

```bash
cd /workspace/.../dayzero   # repo root
npm run test:app      # 6 tests
npm run test:shared   # 13 tests
npm run test:web      # 6 tests
npm run test:server   # 26 tests (needs node)
npm test              # all
node scripts/restore_drill.mjs   # disaster recovery drill
```

---

## 12. Further research directions to make DayZero excellent for addiction recovery

Use these to guide improvements (do not implement all at once; prioritize by user impact & safety):

**A. Clinical safety & crisis (highest priority)**
- Validate deterministic triage rules against clinician review; add references to Kerala de-addiction protocols (Vimukthi, Punarjani).
- Add "I'm in crisis" one-tap flow: auto-dial 112/14416 with confirmation, location-free (no GPS), offline-capable.
- Add safety planning (warning signs, coping steps, trusted contacts) stored locally + encrypted.
- Add relapse-response (non-shaming): "slip is data, not failure" messaging; immediate grounding exercises.
- Ensure emergency numbers are always reachable even with zero network (cache + `tel:` intents).

**B. Engagement & retention (non-shaming)**
- Refine 7-day consistency metric: handle timezones (Asia/Kolkata), missed days gracefully, celebrate streaks without guilt.
- Add gentle reminders (local notifications, no push servers) with user-controlled cadence.
- Add "urge surfing" / craving timer mini-tool (offline, no tracking).
- Add mood trends visualization (local only) with export.

**C. Accessibility & localization**
- Malayalam + Manglish quality review with native speakers; check transliteration edge cases (district names, medical terms).
- Large text / screen reader support (TalkBack), high contrast, reduced motion.
- Offline-first: cache facilities/helplines in SQLite/AsyncStorage so directory works without network.

**D. Privacy & trust (DPDP)**
- Audit data minimization: ensure no analytics SDKs slipped in; verify no third-party trackers.
- Add transparent "what we store" screen + one-tap full data export + deletion (already has deletion).
- Pseudonym enforcement in community: scan for accidental PII in posts (client + server).

**E. Community moderation**
- Moderator tooling: pin/unpin, remove post, ban pseudonym, review reports queue.
- Anti-harassment: rate limits, content filters (offline keyword lists), escalation path.
- Consent flows for joining circles; clear community rules display.

**F. Performance & reliability**
- Profile cold start on low-end Android (API 24); reduce bundle size; lazy-load screens.
- Handle flaky networks: retry with backoff, offline queue for check-ins.
- Test on Android 7–15, various screen sizes, tablets.

**G. Evidence & evaluation**
- Pilot with 20 testers for 14 days (Play Store requirement); collect qualitative feedback on transliteration & navigation.
- Define success metrics: daily check-in rate, crisis helpline tap-through, directory usage, retention — all privacy-preserving & aggregated.

**H. Quality gates**
- Add E2E tests (Maestro/Detox) for critical flows (launch, SOS modal, check-in, care directory).
- Add TypeScript strict checks between app & shared (resolve lat/lng, helpline number, post body mismatches noted).
- CI: Android build on every PR (GitHub Actions with Android SDK).

---

## 13. Known remaining type mismatches (non-crashing, type-only)

From prior analysis, app/shared API mismatches to reconcile later:
- Facility `lat`/`lng` vs shared `latitude`/`longitude`.
- Helpline `number` vs shared `phoneNumber`.
- Post `body` vs shared `content`.

These are type-only at runtime but should be aligned for correctness. Fix when doing a type-safety pass.

---

## 14. Deliverable expected from this machine

Return:
1. `git diff` summary of any new fixes.
2. APK build artifact path + size.
3. Screenshots of all 5 tabs + emergency modal + language switch.
4. logcat excerpt (no crashes).
5. Test results (`npm test` summary).
6. A short findings report: what works, what's broken, top 3 recommended next fixes.

---

## 15. Safety note

This app serves people in recovery and crisis. Any change to emergency triage, helpline numbers, or clinical messaging must be reviewed by a qualified clinician and verified against official sources (`docs/HELPLINE_SOURCES.md`). Never weaken crisis routing. Never add analytics/tracking. Keep zero-licence-cost policy.