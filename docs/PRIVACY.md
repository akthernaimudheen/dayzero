# DayZero — Privacy Policy & Data Architecture

## 1. Privacy First: Data Minimization Principles

DayZero is built for individuals seeking support for substance use, chemical dependency, and behavioral wellbeing. Because recovery data is among the most sensitive personal information an individual can hold, DayZero adheres to **aggressive data minimization**:

1. **No Legal Names Required:** Users sign up with a pseudonymous handle or private email.
2. **No Phone Numbers Collected:** Phone numbers are neither requested nor stored in the database.
3. **No Contact Book Access:** DayZero never requests or accesses mobile device contacts.
4. **No Precise GPS Tracking:** The application does not require `ACCESS_FINE_LOCATION`. Care directory distances are calculated using manual district selection or coarse coordinates; navigation opens external intent links (`geo:`) without tracking movement.
5. **No Third-Party Trackers or Analytics:** There are **zero advertising SDKs**, zero session replay tools, and zero third-party behavioral analytics in both the web and Android applications.

---

## 2. Pseudonymity vs. Anonymity: Honest User Disclosure

> [!IMPORTANT]
> **Pseudonyms and discreet branding reduce stigma and local social exposure, but they do NOT guarantee absolute legal or technical anonymity.**

- **What Pseudonyms Protect:** When participating in moderated recovery circles, other participants only see your chosen pseudonym (e.g. `RiverGuide` or `Pratheeksha`). Other members cannot see your real name, email address, IP address, or account ID.
- **What Pseudonyms Cannot Protect:** 
  - If a user shares identifying personal stories, phone numbers, or landmarks in their post text, other participants may deduce their identity.
  - If a device is physically inspected by family or law enforcement, cached local app data may reveal participation.
  - Self-hosted server operators receive network TCP connection logs (IP addresses) in standard web server logs (`/var/log/caddy/dayzero_access.log`).

---

## 3. Compliance with Indian Digital Personal Data Protection (DPDP) Act 2023

DayZero is designed in strict accordance with the core principles of India's **Digital Personal Data Protection Act, 2023**:

1. **Purpose Limitation:** Check-in data and mood reflections are processed exclusively to provide the user with personal reflection metrics (the 7-day consistency tracker). They are never aggregated, commercialized, or shared with third parties.
2. **Explicit User Consent:** Joining a recovery circle requires active confirmation and agreement to the community rules before participation.
3. **Right to Erasure (Data Erasure):** A user can permanently purge their entire account and all associated records (check-ins, goals, group memberships, posts, and reports) instantly using the in-app password-authenticated deletion feature.
4. **Data Security Safeguards:** All data in transit is encrypted using TLS 1.3. Server databases are protected by Linux filesystem permissions and isolated from public access.

---

## 4. Cache & Storage Isolation

To prevent recovery reflections from being exposed on shared devices:
- **No Private Data in Service Worker Caches:** Service worker caches in the web application are strictly restricted to static assets (HTML shell, CSS, bundle scripts). API responses containing check-ins are excluded via `no-store` headers.
- **Client Storage:** Web clients store only the session JWT in `localStorage`. Mobile clients retain tokens in isolated app sandbox storage.
- **URL Privacy:** Check-in mood scores, reflection notes, and symptom flags are transmitted exclusively via HTTP request bodies (POST/PATCH)—never in URL query parameters that could leak into browser history or proxy access logs.
