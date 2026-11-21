# DayZero — Google Play Store Distribution & Compliance Guide

## 1. Application Identity & Metadata

- **Application ID (Package Name):** `com.dayzero.app`
- **Application Name:** DayZero (തണൽ)
- **Target Android SDK:** API Level 34 (Android 14) / API Level 35 (Android 15)
- **Minimum Android SDK:** API Level 24 (Android 7.0 Nougat)
- **Short Description (80 chars max):** Privacy-first recovery companion, Kerala de-addiction discovery & peer circles.
- **Full Description:**
  DayZero is an open-source, zero-licence-cost recovery platform inspired by Thanal (തണൽ). It assists individuals across Kerala with verified government de-addiction centre discovery, 24/7 crisis helpline routing (112, Tele-MANAS 14416, Vimukthi 14446), private daily check-ins, a non-shaming 7-day consistency metric, and invitation-only moderated recovery circles.
- **Default Language:** English (US) &bull; Additional Locales: Malayalam (`ml`) &bull; Manglish (`ml-Latn`).
- **Category:** Health & Fitness &bull; Subcategory: Mental Health / Habit Tracker.
- **Content Rating:** Suitable for General Audience (Teen / Everyone 12+ due to substance recovery support references).

---

## 2. Google Play Health Apps Policy Declaration

Under Google Play's 2024–2026 **Health Apps Declaration** requirements:

| Declaration Question | Required Play Console Response | Verification Rationale |
| :--- | :--- | :--- |
| **Is this app a regulated medical device?** | **NO** | DayZero is a self-care habit reflection and directory navigation tool. It does not diagnose medical conditions, interpret sensor biometrics, or prescribe pharmaceuticals. |
| **Does this app provide clinical medical advice?** | **NO** | Deterministic clinical emergency guidance explicitly advises users to call 112 or visit a Government Medical College for acute medical withdrawal, delirium tremens, or overdose. |
| **Primary Health Focus Category** | **Mental Health / Addiction Recovery Support** | Focuses on personal reflection consistency, harm reduction education, and public care directory discovery. |
| **Target Audience** | Adults (18+) and adolescents seeking voluntary addiction support. | Explicitly voluntary self-service. |

---

## 3. Google Play Data Safety Form Responses

When completing the Google Play Console **Data Safety** section, select the following exact answers:

### Data Collection & Sharing Overview:
- **Does your app collect or share any user data?** &rarr; **Yes**
- **Is all user data collected by your app encrypted in transit?** &rarr; **Yes** (Enforced via TLS 1.3 / HTTPS)
- **Do you provide a way for users to request that their data be deleted?** &rarr; **Yes** (Instant password-confirmed in-app and web deletion)
- **Is any data shared with third parties?** &rarr; **NO** (Zero data shared or sold)

### Data Types Collected:
1. **Personal Info &bull; Email Address:**
   - *Collected:* Yes (For pseudonymous authentication and account recovery)
   - *Shared:* No (Never shared or sold to third parties)
   - *Ephemerality:* Stored until user deletes account
   - *Purpose:* App functionality / Account management
2. **Health & Fitness &bull; Health Info:**
   - *Collected:* Yes (Voluntary daily mood score 1–5 and reflection text)
   - *Shared:* No (Never shared or sold to third parties)
   - *Ephemerality:* Stored until user deletes account
   - *Purpose:* App functionality (Calculating personal 7-day consistency percentage)
3. **Location Info:**
   - *Collected:* **NO** (Zero continuous GPS tracking; care searches use coarse district selection or user-initiated external navigation intents)

---

## 4. Google Play Account Deletion URL Requirement

Google Play requires developers to provide a publicly accessible URL where users can request account and data deletion:

- **Web Deletion Portal:** `https://<YOUR-DOMAIN>/#settings`
- **Deletion SLA:** Deletion is instantaneous, automatic, and irreversible. Entering the account password permanently purges all check-in entries, personal intentions, group memberships, posts, and account records directly from the database without manual human intervention.

---

## 5. App Access Instructions for Google Play Reviewers

Google Play reviewers require credentials to test all authenticated portions of the application. Provide the following in the **App Access** section:

1. **Test Account Credentials:**
   - *Username / Email:* `reviewer@dayzero.test`
   - *Password:* `PlayReviewer2026!`
   - *Authentication Note:* No phone number, OTP, or hardware token required.
2. **Recovery Circle Invitation Access:**
   - Reviewers can test the community features using pre-seeded test circle invitation code:
   - *Invite Code:* `PILOT-REVIEW-2026`
   - *Pseudonym:* `Reviewer`
3. **Unauthenticated Features:**
   - The Public Care Directory, Emergency Guidance (112 / Tele-MANAS 14416), and Helplines screens are accessible immediately without registration.

---

## 6. Graphic Assets & Store Listing Checklist

| Asset | Specifications | Status |
| :--- | :--- | :--- |
| **App Icon** | 512 &times; 512 px PNG (32-bit color, max 1024 KB) | Provided in `app/assets/icon.png` |
| **Adaptive Icon** | Foreground 512 &times; 512 px PNG, Background `#283D30` (Deep Olive) | Provided in `app/assets/adaptive-icon.png` |
| **Splash Screen** | 1024 &times; 1024 px PNG, Background `#F6F2E9` (Ivory) | Provided in `app/assets/splash.png` |
| **Feature Graphic** | 1024 &times; 500 px JPEG or 24-bit PNG (no alpha) | Required prior to public store release |
| **Phone Screenshots** | Minimum 2, maximum 8 screenshots (16:9 or 9:16 aspect ratio, min 1080 px) | Captured from running web/mobile preview |
| **Privacy Policy URL** | Live HTTPS URL explaining data minimization, DPDP compliance, and zero trackers | Hosted at `https://<YOUR-DOMAIN>/#settings` |

---

## 7. Build Commands: Preview APK & Production AAB

### Dedicated Build Profiles in `app/eas.json`:
- `preview`: Produces an installable standalone `.apk` for direct sideloading and personal device testing.
- `production`: Produces a signed `.aab` (Android App Bundle) optimized for Google Play distribution.

### Cloud Build (Recommended — No local Android SDK needed):
```bash
cd app

# Build installable preview APK
npx eas-cli build -p android --profile preview

# Build production Android App Bundle (.aab)
npx eas-cli build -p android --profile production
```

### Local Build (Requires JDK 17 & Android SDK installed locally):
```bash
cd app
npx expo prebuild --platform android --no-install
cd android

# Build standalone test APK
./gradlew assembleRelease
# Output: android/app/build/outputs/apk/release/app-release.apk

# Build production Google Play bundle
./gradlew bundleRelease
# Output: android/app/build/outputs/bundle/release/app-release.aab
```

---

## 8. Mandatory Testing Track Requirements (Personal Developer Accounts)

If publishing under a personal Google Play Console account created after November 2023:
1. **Closed Testing Requirement:** Google requires a minimum of **20 testers opted-in for at least 14 days continuously** before applying for production access.
2. **Distribution Plan:** Distribute the preview APK or closed testing track link to recovery peer facilitators, counsellors, and community volunteers across Kerala.
3. **Feedback Gathering:** Collect qualitative usability feedback on Malayalam transliteration clarity and care directory navigation.
