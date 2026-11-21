import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateWeeklyConsistency,
  shiftDateString,
  getLocalDateString,
  getDayOfWeekName,
  toMalayalamScript,
  toManglish,
  transliterateWordToMalayalam,
  calculateHaversineDistanceKm,
  filterAndSortFacilities,
  buildDirectionsUrls,
  EMERGENCY_GUIDANCE,
  CLINICAL_SAFETY_DISCLAIMER,
  t,
} from '../dist/index.js';

// ---------------------------------------------------------------------------
// Consistency Calculations Tests
// ---------------------------------------------------------------------------

test('shiftDateString correctly adds and subtracts days across month and year boundaries', () => {
  assert.equal(shiftDateString('2026-10-27', -6), '2026-10-21');
  assert.equal(shiftDateString('2026-03-01', -1), '2026-02-28');
  assert.equal(shiftDateString('2026-01-01', -1), '2025-12-31');
  assert.equal(shiftDateString('2026-12-31', 1), '2027-01-01');
});

test('calculateWeeklyConsistency calculates 100% for full 7-day completed check-ins', () => {
  const ref = '2026-10-27';
  const checkins = [];
  for (let i = -6; i <= 0; i++) {
    checkins.push({
      localDate: shiftDateString(ref, i),
      completed: true,
      mood: 4,
      recordedAt: new Date().toISOString(),
    });
  }

  const result = calculateWeeklyConsistency({
    checkins,
    referenceDate: ref,
    onboardedDate: '2026-01-01',
  });

  assert.equal(result.totalDaysInWindow, 7);
  assert.equal(result.eligibleDaysCount, 7);
  assert.equal(result.completedDaysCount, 7);
  assert.equal(result.consistencyPercentage, 100);
  assert.equal(result.streakDays, 7);
  assert.equal(result.supportiveMessageKey, 'consistency.msg.full');
});

test('calculateWeeklyConsistency handles partial weeks when user onboarded 3 days ago', () => {
  const ref = '2026-10-27';
  // User onboarded 3 days ago on 2026-10-24
  // Eligible days are 2026-10-24, 25, 26, 27 (4 days eligible)
  const onboardedDate = '2026-10-24';
  const checkins = [
    { localDate: '2026-10-24', completed: true, mood: 3, recordedAt: new Date().toISOString() },
    { localDate: '2026-10-25', completed: true, mood: 4, recordedAt: new Date().toISOString() },
    { localDate: '2026-10-26', completed: false, mood: 2, recordedAt: new Date().toISOString() }, // not completed
    { localDate: '2026-10-27', completed: true, mood: 5, recordedAt: new Date().toISOString() },
  ];

  const result = calculateWeeklyConsistency({
    checkins,
    referenceDate: ref,
    onboardedDate,
  });

  // Out of 7 calendar days, only 4 are eligible (days >= 2026-10-24)
  assert.equal(result.eligibleDaysCount, 4);
  // 3 completed out of 4 eligible -> 75%
  assert.equal(result.completedDaysCount, 3);
  assert.equal(result.consistencyPercentage, 75);
  // 3 of 7 days before onboarding are flagged isEligible: false
  const ineligibleDays = result.days.filter((d) => !d.isEligible);
  assert.equal(ineligibleDays.length, 3);
});

test('calculateWeeklyConsistency deduplicates multiple submissions on the same calendar day', () => {
  const ref = '2026-10-27';
  const checkins = [
    { localDate: '2026-10-27', completed: true, mood: 2, recordedAt: '2026-10-27T08:00:00Z' },
    { localDate: '2026-10-27', completed: true, mood: 4, recordedAt: '2026-10-27T14:00:00Z' },
    { localDate: '2026-10-27', completed: true, mood: 5, recordedAt: '2026-10-27T20:00:00Z' },
  ];

  const result = calculateWeeklyConsistency({
    checkins,
    referenceDate: ref,
    onboardedDate: '2026-10-01',
  });

  assert.equal(result.completedDaysCount, 1, 'multiple submissions on same day must count once');
  assert.equal(result.eligibleDaysCount, 7);
  assert.equal(result.consistencyPercentage, 14); // 1/7 = 14%
});

test('calculateWeeklyConsistency handles zero check-ins without shaming', () => {
  const ref = '2026-10-27';
  const result = calculateWeeklyConsistency({
    checkins: [],
    referenceDate: ref,
    onboardedDate: '2026-10-01',
  });

  assert.equal(result.completedDaysCount, 0);
  assert.equal(result.consistencyPercentage, 0);
  assert.equal(result.streakDays, 0);
  assert.equal(result.supportiveMessageKey, 'consistency.msg.starting');
});

// ---------------------------------------------------------------------------
// Transliteration Tests
// ---------------------------------------------------------------------------

test('transliteration maps key recovery terms correctly', () => {
  assert.equal(transliterateWordToMalayalam('thanal'), 'തണൽ');
  assert.equal(transliterateWordToMalayalam('punarjani'), 'പുനർജനി');
  assert.equal(transliterateWordToMalayalam('vimukthi'), 'വിമുക്തി');
  assert.equal(transliterateWordToMalayalam('mayangilla'), 'മയങ്ങില്ല');
  assert.equal(transliterateWordToMalayalam('sahayam'), 'സഹായം');
});

test('transliteration maps Kerala district names accurately', () => {
  assert.equal(transliterateWordToMalayalam('thiruvananthapuram'), 'തിരുവനന്തപുരം');
  assert.equal(transliterateWordToMalayalam('kollam'), 'കൊല്ലം');
  assert.equal(transliterateWordToMalayalam('ernakulam'), 'എറണാകുളം');
  assert.equal(transliterateWordToMalayalam('kozhikode'), 'കോഴിക്കോട്');
});

test('toManglish converts Malayalam words to readable Latin script', () => {
  assert.equal(toManglish('തണൽ'), 'thanal');
  assert.equal(toManglish('പുനർജനി'), 'punarjani');
  assert.equal(toManglish('വിമുക്തി'), 'vimukthi');
});

// ---------------------------------------------------------------------------
// Directory & Distance Tests
// ---------------------------------------------------------------------------

test('calculateHaversineDistanceKm calculates known distance accurately', () => {
  // Thiruvananthapuram (8.5241, 76.9366) to Kollam (8.8932, 76.6141) is approx 55-65 km
  const dist = calculateHaversineDistanceKm(8.5241, 76.9366, 8.8932, 76.6141);
  assert.ok(dist >= 50 && dist <= 70, `Distance was ${dist} km`);
});

test('filterAndSortFacilities filters by district and sorts by distance', () => {
  const sampleFacilities = [
    {
      id: '1',
      name: 'District Homoeo Hospital, Thiruvananthapuram',
      address: 'East Fort, Thiruvananthapuram',
      district: 'Thiruvananthapuram',
      facilityType: 'punarjani_homoeopathy',
      services: ['de_addiction_opd'],
      sourceName: 'Punarjani',
      sourceUrl: 'https://homoeopathy.kerala.gov.in/en/punarjani/',
      sourceRetrievedAt: '2026-10-27',
      verifiedAt: '2026-10-27',
      verificationStatus: 'stale',
      lat: 8.5241,
      lng: 76.9366,
    },
    {
      id: '2',
      name: 'Govt Homoeopathic Hospital Thevally, Kollam',
      address: 'Thevally, Kollam',
      district: 'Kollam',
      facilityType: 'punarjani_homoeopathy',
      services: ['de_addiction_opd'],
      sourceName: 'Punarjani',
      sourceUrl: 'https://homoeopathy.kerala.gov.in/en/punarjani/',
      sourceRetrievedAt: '2026-10-27',
      verifiedAt: '2026-10-27',
      verificationStatus: 'stale',
      lat: 8.8932,
      lng: 76.6141,
    },
  ];

  // User located in Thiruvananthapuram
  const userCoords = { lat: 8.5241, lng: 76.9366 };
  const sorted = filterAndSortFacilities(sampleFacilities, { userCoords });

  assert.equal(sorted.length, 2);
  assert.equal(sorted[0].name, 'District Homoeo Hospital, Thiruvananthapuram');
  assert.ok(sorted[0].distanceKm < sorted[1].distanceKm);

  // Filter by district Kollam
  const kollamOnly = filterAndSortFacilities(sampleFacilities, { district: 'Kollam' });
  assert.equal(kollamOnly.length, 1);
  assert.equal(kollamOnly[0].district, 'Kollam');
});

test('buildDirectionsUrls creates valid OSM and Android Geo intent links', () => {
  const f = {
    id: '1',
    name: 'District Homoeo Hospital, Thiruvananthapuram',
    address: 'Thiruvananthapuram',
    district: 'Thiruvananthapuram',
    facilityType: 'punarjani_homoeopathy',
    services: [],
    sourceName: 'Punarjani',
    sourceUrl: 'https://homoeopathy.kerala.gov.in',
    sourceRetrievedAt: '2026-10-27',
    verifiedAt: '2026-10-27',
    verificationStatus: 'stale',
    lat: 8.5241,
    lng: 76.9366,
  };

  const urls = buildDirectionsUrls(f);
  assert.ok(urls.openStreetMap.includes('openstreetmap.org'));
  assert.ok(urls.googleMapsWeb.includes('google.com/maps'));
  assert.ok(urls.androidGeoIntent.startsWith('geo:8.5241,76.9366'));
});

// ---------------------------------------------------------------------------
// Safety & Clinical Disclaimers Tests
// ---------------------------------------------------------------------------

test('safety guidance includes critical red flags for severe alcohol withdrawal and overdose', () => {
  assert.ok(EMERGENCY_GUIDANCE.severe_alcohol_withdrawal);
  assert.equal(EMERGENCY_GUIDANCE.severe_alcohol_withdrawal.helpline, '112');
  assert.ok(
    EMERGENCY_GUIDANCE.severe_alcohol_withdrawal.contraindications.some((c) =>
      c.includes('NEVER attempt unmonitored')
    )
  );

  assert.ok(EMERGENCY_GUIDANCE.suspected_overdose);
  assert.equal(EMERGENCY_GUIDANCE.suspected_overdose.helpline, '112');

  assert.ok(CLINICAL_SAFETY_DISCLAIMER.includes('does NOT provide medical diagnosis'));
});

// ---------------------------------------------------------------------------
// i18n Localization Tests
// ---------------------------------------------------------------------------

test('i18n t() interpolates parameters and supports en, ml, and ml-Latn', () => {
  const en = t('consistency.pct', 'en', { pct: 85 });
  assert.equal(en, '85% Consistent');

  const ml = t('consistency.pct', 'ml', { pct: 85 });
  assert.equal(ml, '85% പങ്കാളിത്തം');

  const manglish = t('consistency.pct', 'ml-Latn', { pct: 85 });
  assert.equal(manglish, '85% Pankalitham');
});
