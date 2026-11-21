import type { Checkin, DayStatus, WeeklyConsistencyMetric } from './types.js';

export interface ConsistencyCalculationOptions {
  checkins: Checkin[];
  referenceDate: string; // YYYY-MM-DD
  onboardedDate?: string; // YYYY-MM-DD (days before this are not eligible)
  timeZone?: string;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Format a Date object to YYYY-MM-DD in the provided timezone (defaults to Asia/Kolkata).
 */
export function getLocalDateString(date: Date = new Date(), timeZone: string = 'Asia/Kolkata'): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  } catch {
    // Fallback if timezone not supported
    const d = new Date(date.getTime() + 330 * 60000);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}

/**
 * Add or subtract days from a YYYY-MM-DD string cleanly in calendar terms.
 */
export function shiftDateString(dateStr: string, dayOffset: number): string {
  const parts = dateStr.split('-').map(Number);
  const year = parts[0];
  const month = parts[1] - 1;
  const day = parts[2];
  const utcDate = new Date(Date.UTC(year, month, day + dayOffset));
  const y = utcDate.getUTCFullYear();
  const m = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
  const d = String(utcDate.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Get day of week abbreviation ('Sun', 'Mon', etc.) for a YYYY-MM-DD string.
 */
export function getDayOfWeekName(dateStr: string): string {
  const parts = dateStr.split('-').map(Number);
  const utcDate = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  return DAY_NAMES[utcDate.getUTCDay()];
}

/**
 * Calculate weekly consistency percentage and breakdown for a 7-day window.
 *
 * Requirements:
 * - 7-day window ending on referenceDate.
 * - Eligible days: days within window that are >= onboardedDate and <= referenceDate.
 * - Duplicate submissions on the same calendar day count once.
 * - Non-stigmatizing presentation: consistency is an indicator of reflection practice,
 *   never a clinical diagnosis or shame metric.
 */
export function calculateWeeklyConsistency(
  options: ConsistencyCalculationOptions
): WeeklyConsistencyMetric {
  const { checkins, referenceDate, onboardedDate } = options;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(referenceDate)) {
    throw new Error('referenceDate must be formatted as YYYY-MM-DD');
  }

  // 7-day window: [referenceDate - 6 days ... referenceDate]
  const windowStart = shiftDateString(referenceDate, -6);
  const windowEnd = referenceDate;

  // Build a map of distinct completed calendar days
  // Duplicate check-ins on the same day are deduplicated; highest mood and note snippet kept
  const checkinMap = new Map<string, { mood: number; noteSnippet?: string; completed: boolean }>();

  for (const c of checkins) {
    if (!c.completed) continue;
    const existing = checkinMap.get(c.localDate);
    if (!existing) {
      checkinMap.set(c.localDate, {
        mood: c.mood,
        noteSnippet: c.note ? c.note.slice(0, 60) : undefined,
        completed: true,
      });
    } else {
      // Keep existing completed status; if multiple, pick latest or valid mood
      existing.mood = c.mood || existing.mood;
      if (c.note && !existing.noteSnippet) {
        existing.noteSnippet = c.note.slice(0, 60);
      }
    }
  }

  const days: DayStatus[] = [];
  let eligibleCount = 0;
  let completedCount = 0;

  for (let offset = -6; offset <= 0; offset++) {
    const curDate = shiftDateString(referenceDate, offset);
    const dayName = getDayOfWeekName(curDate);

    // Day is eligible if:
    // 1. It is <= referenceDate (always true in this loop)
    // 2. It is >= onboardedDate (if onboardedDate is provided)
    const isEligible = !onboardedDate || curDate >= onboardedDate;
    const checkinInfo = checkinMap.get(curDate);
    const isCompleted = isEligible && !!checkinInfo && checkinInfo.completed;

    if (isEligible) {
      eligibleCount++;
      if (isCompleted) {
        completedCount++;
      }
    }

    days.push({
      date: curDate,
      dayOfWeek: dayName,
      isEligible,
      isCompleted,
      mood: checkinInfo?.mood,
      noteSnippet: checkinInfo?.noteSnippet,
    });
  }

  const consistencyPercentage =
    eligibleCount === 0 ? 0 : Math.round((completedCount / eligibleCount) * 100);

  // Calculate current streak ending today / referenceDate
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    const d = days[i];
    if (!d.isEligible) break;
    if (d.isCompleted) {
      streak++;
    } else {
      // If reference date is today and not yet completed, allow streak to continue from yesterday
      if (i === days.length - 1 && d.date === referenceDate) {
        continue;
      }
      break;
    }
  }

  // Supportive, compassionate messaging based on consistency practice
  let supportiveMessageKey = 'consistency.msg.starting';
  if (consistencyPercentage === 100) {
    supportiveMessageKey = 'consistency.msg.full';
  } else if (consistencyPercentage >= 70) {
    supportiveMessageKey = 'consistency.msg.high';
  } else if (consistencyPercentage >= 40) {
    supportiveMessageKey = 'consistency.msg.moderate';
  } else if (completedCount > 0) {
    supportiveMessageKey = 'consistency.msg.some';
  }

  return {
    windowStart,
    windowEnd,
    totalDaysInWindow: 7,
    eligibleDaysCount: eligibleCount,
    completedDaysCount: completedCount,
    consistencyPercentage,
    days,
    streakDays: streak,
    supportiveMessageKey,
  };
}
