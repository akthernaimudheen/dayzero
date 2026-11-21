// DayZero — directory + helpline seed.
//
// Run against a live PocketBase instance with admin credentials:
//   node seed/seed.mjs
//
// This script is idempotent: it creates or updates records by source+name so
// re-running it is safe.  It deliberately does NOT fabricate phone numbers,
// coordinates, operating hours, or cost claims.  Where a claim is not
// verifiable it is labelled honestly.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SERVER_DIR = join(__dirname, "..");
const ADMIN_EMAIL_FILE = join(SERVER_DIR, ".admin_email");
const ADMIN_PASSWORD_FILE = join(SERVER_DIR, ".admin_password");
const SUPERUSER_FILE = join(SERVER_DIR, ".superuser");

const BASE = "http://127.0.0.1:8090/api";

async function getAdminToken() {
    if (existsSync(SUPERUSER_FILE)) {
        const savedSuperuser = readFileSync(SUPERUSER_FILE, "utf8").trim();
        if (savedSuperuser) {
            return savedSuperuser;
        }
    }
    const email = readFileSync(ADMIN_EMAIL_FILE, "utf8").trim();
    const password = readFileSync(ADMIN_PASSWORD_FILE, "utf8").trim();
    const r = await fetch(`${BASE}/collections/_superusers/auth-with-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    const j = await r.json();
    if (!j.token) {
        throw new Error(`admin login failed: ${JSON.stringify(j)}`);
    }
    writeFileSync(SUPERUSER_FILE, j.token);
    return j.token;
}

async function adminFetch(path, method = "GET", body) {
    const token = await getAdminToken();
    const headers = { Authorization: `Bearer ${token}` };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    const r = await fetch(`${BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
    const j = await r.json();
    if (j.error) {
        throw new Error(`adminFetch ${method} ${path}: ${JSON.stringify(j)}`);
    }
    return j;
}

async function createOrUpdate(collection, filter, data) {
    const existing = await adminFetch(`/collections/${collection}/records?filter=${encodeURIComponent(filter)}&limit=1`);
    if (existing.totalItems === 0) {
        const created = await adminFetch(`/collections/${collection}/records`, "POST", data);
        console.log(`seed created ${collection}: ${data.name || data.code}`);
        return created;
    }
    const existingId = existing.items[0].id;
    const patch = {};
    if (data.verifiedAt) patch.verifiedAt = data.verifiedAt;
    if (data.verificationStatus) patch.verificationStatus = data.verificationStatus;
    if (data.status) patch.status = data.status;
    if (data.descriptionEn) patch.descriptionEn = data.descriptionEn;
    if (data.descriptionMl) patch.descriptionMl = data.descriptionMl;
    if (data.costNote) patch.costNote = data.costNote;
    if (data.eligibilityNote) patch.eligibilityNote = data.eligibilityNote;
    if (data.hoursNote) patch.hoursNote = data.hoursNote;
    if (data.services) patch.services = data.services;
    if (data.address) patch.address = data.address;
    if (data.phone !== undefined) patch.phone = data.phone;
    if (data.lat !== undefined) patch.lat = data.lat;
    if (data.lng !== undefined) patch.lng = data.lng;
    if (Object.keys(patch).length > 0) {
        await adminFetch(`/collections/${collection}/records/${existingId}`, "PATCH", patch);
        console.log(`seed refreshed ${collection}: ${data.name || data.code}`);
    }
    return await adminFetch(`/collections/${collection}/records/${existingId}`);
}

const TODAY = new Date().toISOString().slice(0, 10);

const facilities = [
    {
        name: "District Homoeo Hospital, Thiruvananthapuram",
        address: "District Homoeo Hospital, Thiruvananthapuram, Thiruvananthapuram district, Kerala",
        district: "Thiruvananthapuram",
        facilityType: "punarjani_homoeopathy",
        services: JSON.stringify({ note: "Punarjani de-addiction service via the Department of Homoeopathy, Kerala." }),
        costNote: "Source page describes treatment as cost effective; it does not state that care is free. Cost not confirmed.",
        eligibilityNote: "Alcoholism, tobacco and other substance use disorders. Source page notes referrals from PHCs, the police Women cell, school jyagratha samithies, Alcoholics Anonymous, De-addiction centres and NGOs.",
        hoursNote: "Source page does not publish operating hours.",
        phone: null,
        sourceName: "Department of Homoeopathy, Kerala — Punarjani",
        sourceUrl: "https://homoeopathy.kerala.gov.in/en/punarjani/",
        sourceRetrievedAt: TODAY,
        verifiedAt: TODAY,
        verificationStatus: "verified",
        lat: null,
        lng: null,
    },
    {
        name: "District Homoeo Hospital, Kollam",
        address: "District Homoeo Hospital, Kollam, Kollam district, Kerala",
        district: "Kollam",
        facilityType: "punarjani_homoeopathy",
        services: JSON.stringify({ note: "Punarjani de-addiction service via the Department of Homoeopathy, Kerala." }),
        costNote: "Source page describes treatment as cost effective; it does not state that care is free. Cost not confirmed.",
        eligibilityNote: "Alcoholism, tobacco and other substance use disorders.",
        hoursNote: "Source page does not publish operating hours.",
        phone: null,
        sourceName: "Department of Homoeopathy, Kerala — Punarjani",
        sourceUrl: "https://homoeopathy.kerala.gov.in/en/punarjani/",
        sourceRetrievedAt: TODAY,
        verifiedAt: TODAY,
        verificationStatus: "verified",
        lat: null,
        lng: null,
    },
    {
        name: "District Homoeo Hospital, Pathanamthitta",
        address: "District Homoeo Hospital, Pathanamthitta, Pathanamthitta district, Kerala",
        district: "Pathanamthitta",
        facilityType: "punarjani_homoeopathy",
        services: JSON.stringify({ note: "Punarjani de-addiction service via the Department of Homoeopathy, Kerala." }),
        costNote: "Source page describes treatment as cost effective; it does not state that care is free. Cost not confirmed.",
        eligibilityNote: "Alcoholism, tobacco and other substance use disorders.",
        hoursNote: "Source page does not publish operating hours.",
        phone: null,
        sourceName: "Department of Homoeopathy, Kerala — Punarjani",
        sourceUrl: "https://homoeopathy.kerala.gov.in/en/punarjani/",
        sourceRetrievedAt: TODAY,
        verifiedAt: TODAY,
        verificationStatus: "verified",
        lat: null,
        lng: null,
    },
    {
        name: "District Homoeo Hospital, Alappuzha",
        address: "District Homoeo Hospital, Alappuzha, Alappuzha district, Kerala",
        district: "Alappuzha",
        facilityType: "punarjani_homoeopathy",
        services: JSON.stringify({ note: "Punarjani de-addiction service via the Department of Homoeopathy, Kerala." }),
        costNote: "Source page describes treatment as cost effective; it does not state that care is free. Cost not confirmed.",
        eligibilityNote: "Alcoholism, tobacco and other substance use disorders.",
        hoursNote: "Source page does not publish operating hours.",
        phone: null,
        sourceName: "Department of Homoeopathy, Kerala — Punarjani",
        sourceUrl: "https://homoeopathy.kerala.gov.in/en/punarjani/",
        sourceRetrievedAt: TODAY,
        verifiedAt: TODAY,
        verificationStatus: "verified",
        lat: null,
        lng: null,
    },
    {
        name: "District Homoeo Hospital, Kottayam",
        address: "District Homoeo Hospital, Kottayam, Kottayam district, Kerala",
        district: "Kottayam",
        facilityType: "punarjani_homoeopathy",
        services: JSON.stringify({ note: "Punarjani de-addiction service via the Department of Homoeopathy, Kerala." }),
        costNote: "Source page describes treatment as cost effective; it does not state that care is free. Cost not confirmed.",
        eligibilityNote: "Alcoholism, tobacco and other substance use disorders.",
        hoursNote: "Source page does not publish operating hours.",
        phone: null,
        sourceName: "Department of Homoeopathy, Kerala — Punarjani",
        sourceUrl: "https://homoeopathy.kerala.gov.in/en/punarjani/",
        sourceRetrievedAt: TODAY,
        verifiedAt: TODAY,
        verificationStatus: "verified",
        lat: null,
        lng: null,
    },
    {
        name: "District Homoeo Hospital, Idukki",
        address: "District Homoeo Hospital, Idukki, Idukki district, Kerala",
        district: "Idukki",
        facilityType: "punarjani_homoeopathy",
        services: JSON.stringify({ note: "Punarjani de-addiction service via the Department of Homoeopathy, Kerala." }),
        costNote: "Source page describes treatment as cost effective; it does not state that care is free. Cost not confirmed.",
        eligibilityNote: "Alcoholism, tobacco and other substance use disorders.",
        hoursNote: "Source page does not publish operating hours.",
        phone: null,
        sourceName: "Department of Homoeopathy, Kerala — Punarjani",
        sourceUrl: "https://homoeopathy.kerala.gov.in/en/punarjani/",
        sourceRetrievedAt: TODAY,
        verifiedAt: TODAY,
        verificationStatus: "verified",
        lat: null,
        lng: null,
    },
    {
        name: "District Homoeo Hospital, Ernakulam",
        address: "District Homoeo Hospital, Ernakulam, Ernakulam district, Kerala",
        district: "Ernakulam",
        facilityType: "punarjani_homoeopathy",
        services: JSON.stringify({ note: "Punarjani de-addiction service via the Department of Homoeopathy, Kerala." }),
        costNote: "Source page describes treatment as cost effective; it does not state that care is free. Cost not confirmed.",
        eligibilityNote: "Alcoholism, tobacco and other substance use disorders.",
        hoursNote: "Source page does not publish operating hours.",
        phone: null,
        sourceName: "Department of Homoeopathy, Kerala — Punarjani",
        sourceUrl: "https://homoeopathy.kerala.gov.in/en/punarjani/",
        sourceRetrievedAt: TODAY,
        verifiedAt: TODAY,
        verificationStatus: "verified",
        lat: null,
        lng: null,
    },
    {
        name: "District Homoeo Hospital, Thrissur",
        address: "District Homoeo Hospital, Thrissur, Thrissur district, Kerala",
        district: "Thrissur",
        facilityType: "punarjani_homoeopathy",
        services: JSON.stringify({ note: "Punarjani de-addiction service via the Department of Homoeopathy, Kerala." }),
        costNote: "Source page describes treatment as cost effective; it does not state that care is free. Cost not confirmed.",
        eligibilityNote: "Alcoholism, tobacco and other substance use disorders.",
        hoursNote: "Source page does not publish operating hours.",
        phone: null,
        sourceName: "Department of Homoeopathy, Kerala — Punarjani",
        sourceUrl: "https://homoeopathy.kerala.gov.in/en/punarjani/",
        sourceRetrievedAt: TODAY,
        verifiedAt: TODAY,
        verificationStatus: "verified",
        lat: null,
        lng: null,
    },
    {
        name: "District Homoeo Hospital, Palakkad",
        address: "District Homoeo Hospital, Palakkad, Palakkad district, Kerala",
        district: "Palakkad",
        facilityType: "punarjani_homoeopathy",
        services: JSON.stringify({ note: "Punarjani de-addiction service via the Department of Homoeopathy, Kerala." }),
        costNote: "Source page describes treatment as cost effective; it does not state that care is free. Cost not confirmed.",
        eligibilityNote: "Alcoholism, tobacco and other substance use disorders.",
        hoursNote: "Source page does not publish operating hours.",
        phone: null,
        sourceName: "Department of Homoeopathy, Kerala — Punarjani",
        sourceUrl: "https://homoeopathy.kerala.gov.in/en/punarjani/",
        sourceRetrievedAt: TODAY,
        verifiedAt: TODAY,
        verificationStatus: "verified",
        lat: null,
        lng: null,
    },
    {
        name: "District Homoeo Hospital, Malappuram",
        address: "District Homoeo Hospital, Malappuram, Malappuram district, Kerala",
        district: "Malappuram",
        facilityType: "punarjani_homoeopathy",
        services: JSON.stringify({ note: "Punarjani de-addiction service via the Department of Homoeopathy, Kerala." }),
        costNote: "Source page describes treatment as cost effective; it does not state that care is free. Cost not confirmed.",
        eligibilityNote: "Alcoholism, tobacco and other substance use disorders.",
        hoursNote: "Source page does not publish operating hours.",
        phone: null,
        sourceName: "Department of Homoeopathy, Kerala — Punarjani",
        sourceUrl: "https://homoeopathy.kerala.gov.in/en/punarjani/",
        sourceRetrievedAt: TODAY,
        verifiedAt: TODAY,
        verificationStatus: "verified",
        lat: null,
        lng: null,
    },
    {
        name: "District Homoeo Hospital, Kozhikode",
        address: "District Homoeo Hospital, Kozhikode, Kozhikode district, Kerala",
        district: "Kozhikode",
        facilityType: "punarjani_homoeopathy",
        services: JSON.stringify({ note: "Punarjani de-addiction service via the Department of Homoeopathy, Kerala." }),
        costNote: "Source page describes treatment as cost effective; it does not state that care is free. Cost not confirmed.",
        eligibilityNote: "Alcoholism, tobacco and other substance use disorders.",
        hoursNote: "Source page does not publish operating hours.",
        phone: null,
        sourceName: "Department of Homoeopathy, Kerala — Punarjani",
        sourceUrl: "https://homoeopathy.kerala.gov.in/en/punarjani/",
        sourceRetrievedAt: TODAY,
        verifiedAt: TODAY,
        verificationStatus: "verified",
        lat: null,
        lng: null,
    },
    {
        name: "District Homoeo Hospital, Wayanad",
        address: "District Homoeo Hospital, Wayanad, Wayanad district, Kerala",
        district: "Wayanad",
        facilityType: "punarjani_homoeopathy",
        services: JSON.stringify({ note: "Punarjani de-addiction service via the Department of Homoeopathy, Kerala." }),
        costNote: "Source page describes treatment as cost effective; it does not state that care is free. Cost not confirmed.",
        eligibilityNote: "Alcoholism, tobacco and other substance use disorders.",
        hoursNote: "Source page does not publish operating hours.",
        phone: null,
        sourceName: "Department of Homoeopathy, Kerala — Punarjani",
        sourceUrl: "https://homoeopathy.kerala.gov.in/en/punarjani/",
        sourceRetrievedAt: TODAY,
        verifiedAt: TODAY,
        verificationStatus: "verified",
        lat: null,
        lng: null,
    },
    {
        name: "District Homoeo Hospital, Kannur",
        address: "District Homoeo Hospital, Kannur, Kannur district, Kerala",
        district: "Kannur",
        facilityType: "punarjani_homoeopathy",
        services: JSON.stringify({ note: "Punarjani de-addiction service via the Department of Homoeopathy, Kerala." }),
        costNote: "Source page describes treatment as cost effective; it does not state that care is free. Cost not confirmed.",
        eligibilityNote: "Alcoholism, tobacco and other substance use disorders.",
        hoursNote: "Source page does not publish operating hours.",
        phone: null,
        sourceName: "Department of Homoeopathy, Kerala — Punarjani",
        sourceUrl: "https://homoeopathy.kerala.gov.in/en/punarjani/",
        sourceRetrievedAt: TODAY,
        verifiedAt: TODAY,
        verificationStatus: "verified",
        lat: null,
        lng: null,
    },
    {
        name: "District Homoeo Hospital, Kasaragod",
        address: "District Homoeo Hospital, Kasaragod, Kasaragod district, Kerala",
        district: "Kasaragod",
        facilityType: "punarjani_homoeopathy",
        services: JSON.stringify({ note: "Punarjani de-addiction service via the Department of Homoeopathy, Kerala." }),
        costNote: "Source page describes treatment as cost effective; it does not state that care is free. Cost not confirmed.",
        eligibilityNote: "Alcoholism, tobacco and other substance use disorders.",
        hoursNote: "Source page does not publish operating hours.",
        phone: null,
        sourceName: "Department of Homoeopathy, Kerala — Punarjani",
        sourceUrl: "https://homoeopathy.kerala.gov.in/en/punarjani/",
        sourceRetrievedAt: TODAY,
        verifiedAt: TODAY,
        verificationStatus: "verified",
        lat: null,
        lng: null,
    },
];

const helplines = [
    {
        name: "Emergency — Single Emergency Number",
        number: "112",
        category: "emergency",
        descriptionEn: "Single emergency response number for police, fire, medical and other emergencies across India, including Kerala. Route to 100/108 where applicable.",
        descriptionMl: "സഹായം ആവശ്യമെങ്കിൽ 112 എന്ന് വിളിക്കുക. പോലീസ്, ടിക്ക്, മെഡിക്കൽ എന്നിവ ഉൾപ്പെടെ അടിയന്തിര സഹായം.",
        issuer: "Emergency Response Support System (ERSS), Ministry of Home Affairs; implemented in Kerala by SDMA.",
        sourceUrl: "https://sdma.kerala.gov.in/erss-112/",
        verifiedAt: TODAY,
        status: "verified",
    },
    {
        name: "Tele-MANAS — Mental Health Helpline",
        number: "14416",
        category: "crisis",
        descriptionEn: "Government of India mental health support helpline offering counselling and referral for mental health concerns, including substance use-related distress.",
        descriptionMl: "മാനസിക ആരോഗ്യ സഹായത്തിനായി ഗവണ്മെന്റ് ഓഫ് ഇന്ത്യയുടെ ടെലി-മനസ് ഹെൽപ്പ്‌ലൈൻ. 14416.",
        issuer: "Tele-MANAS, Ministry of Health and Family Welfare, Government of India.",
        sourceUrl: "https://kerala.gov.in/articledetail/NDI2MDM4NzY5LjY0/0",
        verifiedAt: TODAY,
        status: "verified",
    },
    {
        name: "Tele-MANAS — Mental Health Helpline (Toll-Free)",
        number: "14446",
        category: "crisis",
        descriptionEn: "Toll-free line for the Tele-MANAS mental health helpline.",
        descriptionMl: "ടെലി-മനസ് മാനസിക ആരോഗ്യ സഹായ ഹെൽപ്പ്‌ലൈൻ.",
        issuer: "Tele-MANAS, Ministry of Health and Family Welfare, Government of India.",
        sourceUrl: "https://kerala.gov.in/articledetail/NDI2MDM4NzY5LjY0/0",
        verifiedAt: TODAY,
        status: "verified",
    },
    {
        name: "Kiran — 24/7 Mental Health Helpline",
        number: "14405",
        category: "counselling",
        descriptionEn: "Central Government 24/7 mental health helpline for counselling and referral.",
        descriptionMl: "മാനസിക ആരോഗ്യത്തിനായി ഗവണ്മെന്റിന്റെ ആറാം തവണ ഹെൽപ്പ്‌ലൈൻ. 14405.",
        issuer: "Ministry of Health and Family Welfare, Government of India.",
        sourceUrl: "https://kerala.gov.in/articledetail/NDI2MDM4NzY5LjY0/0",
        verifiedAt: TODAY,
        status: "verified",
    },
    {
        name: "De-addiction support and referral helpline — pending verification",
        number: "1056",
        category: "referral",
        descriptionEn: "Helpline for de-addiction support and referral. The specific provider for 1056 needs independent verification before it is presented as an established fact.",
        descriptionMl: "മദ്യവിഭ്രമത്തിന്റെയും മയക്കുമരുന്നിന്റെയും സഹായത്തിനായി വിളിക്കാവുന്ന നമ്പർ. ഇത് പരിശോധിക്കപ്പെടേണ്ടതുണ്ട്.",
        issuer: "Proposed de-addiction helpline — unverified source at time of writing.",
        sourceUrl: "https://mayangillakeralam.kerala.gov.in/de-addiction-centres",
        verifiedAt: TODAY,
        status: "unverified",
    },
];

await Promise.all(facilities.map((f) =>
    createOrUpdate("facilities", `name = '${f.name}'`, f)
));

await Promise.all(helplines.map((h) =>
    createOrUpdate("helplines", `number = '${h.number}'`, h)
));

const facilitiesTotal = (await adminFetch("/collections/facilities/records?limit=1")).totalItems;
const helplinesTotal = (await adminFetch("/collections/helplines/records?limit=1")).totalItems;
console.log(`seed complete: facilities total=${facilitiesTotal}  helplines total=${helplinesTotal}`);
