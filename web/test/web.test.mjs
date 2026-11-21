import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateWeeklyConsistency,
  toMalayalamScript,
  EMERGENCY_GUIDANCE,
  CLINICAL_SAFETY_DISCLAIMER,
  t,
  ALL_DISTRICTS,
  calculateHaversineDistanceKm,
} from '../../packages/shared/dist/index.js';

describe('Web Platform & Shared Integration', () => {
  it('localizes keys correctly for all supported web languages', () => {
    assert.strictEqual(t('app.name', 'en'), 'DayZero');
    assert.strictEqual(t('app.name', 'ml'), 'ഡേ സീറോ');
    assert.strictEqual(t('app.name', 'ml-Latn'), 'DayZero');

    assert.strictEqual(t('nav.care', 'en'), 'Find Care');
    assert.strictEqual(t('nav.care', 'ml'), 'സേവനങ്ങൾ');
    assert.strictEqual(t('nav.care', 'ml-Latn'), 'Sevanangal');
  });

  it('transliterates Malayalam districts and vocabulary accurately', () => {
    assert.strictEqual(toMalayalamScript('Ernakulam'), 'എറണാകുളം');
    assert.strictEqual(toMalayalamScript('Kozhikode'), 'കോഴിക്കോട്');
    assert.strictEqual(toMalayalamScript('Thiruvananthapuram'), 'തിരുവനന്തപുരം');
    assert.strictEqual(toMalayalamScript('Vimukthi'), 'വിമുക്തി');
    assert.strictEqual(toMalayalamScript('Punarjani'), 'പുനർജനി');
  });

  it('calculates Kerala distance accurately using Haversine formula', () => {
    // Distance between Kochi (9.9816, 76.2999) and Thiruvananthapuram (8.5241, 76.9366) is ~176.5 km
    const dist = calculateHaversineDistanceKm(9.9816, 76.2999, 8.5241, 76.9366);
    assert.ok(dist > 170 && dist < 190, `Distance should be ~176.5km, got ${dist}`);
  });

  it('supports 14 Kerala districts for the directory filter', () => {
    assert.strictEqual(ALL_DISTRICTS.length, 14);
    assert.ok(ALL_DISTRICTS.includes('Ernakulam'));
    assert.ok(ALL_DISTRICTS.includes('Wayanad'));
    assert.ok(ALL_DISTRICTS.includes('Thiruvananthapuram'));
  });

  it('provides deterministic emergency guidance without AI dependencies', () => {
    assert.ok(EMERGENCY_GUIDANCE.severe_alcohol_withdrawal);
    assert.strictEqual(EMERGENCY_GUIDANCE.severe_alcohol_withdrawal.helpline, '112');
    assert.ok(EMERGENCY_GUIDANCE.severe_alcohol_withdrawal.contraindications[0].includes('cold turkey'));

    assert.ok(EMERGENCY_GUIDANCE.suspected_overdose);
    assert.strictEqual(EMERGENCY_GUIDANCE.suspected_overdose.helpline, '112');

    assert.ok(EMERGENCY_GUIDANCE.acute_psychological_crisis);
    assert.strictEqual(EMERGENCY_GUIDANCE.acute_psychological_crisis.helpline, '14416');

    assert.ok(CLINICAL_SAFETY_DISCLAIMER.includes('112'));
  });

  it('computes rolling 7-day consistency metric with zero-shaming supportive status', () => {
    const referenceDate = '2026-10-27';
    const checkins = [
      { id: '1', user: 'u1', localDate: '2026-10-27', mood: 4, completed: true, recordedAt: '2026-10-27T10:00:00Z' },
      { id: '2', user: 'u1', localDate: '2026-10-26', mood: 3, completed: true, recordedAt: '2026-10-26T10:00:00Z' },
      { id: '3', user: 'u1', localDate: '2026-10-25', mood: 5, completed: true, recordedAt: '2026-10-25T10:00:00Z' },
    ];
    const metric = calculateWeeklyConsistency({
      checkins,
      referenceDate,
      onboardedDate: '2026-10-21',
    });

    assert.strictEqual(metric.totalDaysInWindow, 7);
    assert.strictEqual(metric.eligibleDaysCount, 7);
    assert.strictEqual(metric.completedDaysCount, 3);
    assert.strictEqual(metric.consistencyPercentage, 43); // 3 / 7 = 42.85 -> 43%
    assert.strictEqual(metric.days.length, 7);
    assert.ok(metric.supportiveMessageKey.length > 0);
  });
});
