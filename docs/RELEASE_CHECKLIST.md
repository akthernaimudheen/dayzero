# DayZero — Release Gate & Deployment Checklist

## Release Decision: **READY FOR CONTROLLED PILOT**

DayZero has completed all local engineering, security isolation, accessibility, localization, and disaster recovery verifications. Public Google Play release is gated on compiling the production bundle on a machine with Android SDK/EAS access, deploying the public backend, and completing Google's mandatory 14-day closed testing track.

---

## Phase 1: Local Engineering & Security Gate (COMPLETED)

- [x] All 50+ automated unit and integration tests passing (`npm test`).
- [x] Next.js 15 production build succeeds with zero errors (`npm run build:web`).
- [x] PocketBase security suite verified: role escalation blocked, check-ins isolated, single-use invite replay prevented.
- [x] Password-verified cascading account erasure verified.
- [x] Verified Kerala care directory (14 districts) and 5 authoritative helplines documented in `docs/HELPLINE_SOURCES.md`.
- [x] Disaster recovery restore drill executed successfully (`node scripts/restore_drill.mjs`).
- [x] Native Android project generated via `expo prebuild --platform android`.
- [x] Android manifest inspected: only `INTERNET` permission declared; all storage/alert permissions purged.
- [x] Brand asset files (icon, adaptive icon, splash) generated and verified with valid PNG signatures.
- [x] EAS build profiles configured in `app/eas.json` for preview (`.apk`) and production (`.aab`).

---

## Phase 2: Backend Infrastructure Provisioning (READY TO EXECUTE)

- [ ] Select hosting infrastructure:
  - [ ] **Option A:** Oracle Cloud Always Free ARM (0.00/mo)
  - [ ] **Option B:** Commodity Linux VPS (Hetzner CX22 ~4.00/mo)
- [ ] Configure DNS: Point `dayzero.your-domain.org` to target server IP.
- [ ] Install Caddy reverse proxy using `deploy/Caddyfile` for automatic Let's Encrypt TLS 1.3.
- [ ] Install PocketBase daemon using `deploy/dayzero-pocketbase.service` or `deploy/docker-compose.yml`.
- [ ] Run seed script on live instance: `node server/seed/seed.mjs`.
- [ ] Configure automated daily backup cron using `scripts/backup.sh`.
- [ ] Verify public HTTPS health check: `curl -I https://dayzero.your-domain.org/api/health`.

---

## Phase 3: Android Binary Compilation (EAS Cloud or Local Native)

- [ ] Update `DEFAULT_SERVER_URL` in `app/src/lib/api.ts` with your live HTTPS domain.
- [ ] **Preview APK Generation:**
  ```bash
  cd app
  npx eas-cli build -p android --profile preview
  ```
- [ ] Test downloaded `.apk` on physical Android device:
  - [ ] Check-in submission and 7-day consistency metric update.
  - [ ] External map navigation intent launcher (`geo:`).
  - [ ] One-tap phone dialer (`tel:112` and `tel:14416`).
  - [ ] Language switching between English, Malayalam, and Manglish.
  - [ ] Password-confirmed account deletion.
- [ ] **Production AAB Generation:**
  ```bash
  cd app
  npx eas-cli build -p android --profile production
  ```

---

## Phase 4: Google Play Console Configuration

- [ ] Create Google Play App: Name `DayZero (തണൽ)`.
- [ ] Upload `app-release.aab` to **Testing &rarr; Closed testing**.
- [ ] **Health Apps Declaration:** Complete per `docs/PLAY_STORE.md` (Select: "Not a regulated medical device"; Category: "Mental Health / Addiction Recovery Support").
- [ ] **Data Safety Form:** Complete per `docs/PLAY_STORE.md` (Data encrypted in transit, account deletion supported in-app and web, zero data shared or sold).
- [ ] **Account Deletion Link:** Submit `https://<YOUR-DOMAIN>/#settings`.
- [ ] **Reviewer Access Credentials:** Submit test account `reviewer@dayzero.test` and pilot invitation code `PILOT-REVIEW-2026`.
- [ ] Upload Store Listing Graphics: 512x512 icon, 1024x500 feature graphic, and phone screenshots.

---

## Phase 5: 14-Day Mandatory Closed Testing Track

- [ ] Recruit at least 20 peer facilitators, counsellors, and recovery volunteers across Kerala.
- [ ] Add tester emails to the Google Play Console Closed Testing track.
- [ ] Maintain active opt-in for at least 14 continuous days.
- [ ] Collect qualitative feedback on Malayalam script legibility and de-addiction centre accuracy.

---

## Phase 6: Public Store Release

- [ ] Review Google Play Closed Testing completion report.
- [ ] Submit application for Production Track review.
- [ ] Monitor crash logs, server CPU utilization, and backup execution.
- [ ] Maintain weekly checks on official Kerala de-addiction directory links for any facility updates.
