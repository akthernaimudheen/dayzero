'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { pb } from '../lib/pb';
import {
  calculateWeeklyConsistency,
  getLocalDateString,
  shiftDateString,
} from '@dayzero/shared';
import type { Checkin, Goal, WeeklyConsistencyMetric } from '@dayzero/shared';

export const CompanionView: React.FC = () => {
  const { account, isAuthenticated, login, register, t } = useApp();

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Check-ins & Metric
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [todayMood, setTodayMood] = useState<number>(3);
  const [todayNote, setTodayNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [checkinSuccess, setCheckinSuccess] = useState(false);

  const tz = account?.timezone || 'Asia/Kolkata';
  const todayStr = getLocalDateString(new Date(), tz);

  const loadData = async () => {
    if (!isAuthenticated) return;
    try {
      const [cList, gList] = await Promise.all([pb.getCheckins(), pb.getGoals()]);
      setCheckins(cList);
      setGoals(gList);

      const existingToday = cList.find((c) => c.localDate === todayStr);
      if (existingToday) {
        setTodayMood(existingToday.mood);
        if (existingToday.note) setTodayNote(existingToday.note);
      }
    } catch (err) {
      console.error('Failed to load checkins/goals:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAuthenticated]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      if (authMode === 'register') {
        await register({
          email,
          pass: password,
          language: 'en',
          timezone: 'Asia/Kolkata',
        });
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await pb.createCheckin({
        localDate: todayStr,
        mood: todayMood,
        note: todayNote,
        completed: true,
      });
      setCheckinSuccess(true);
      await loadData();
      setTimeout(() => setCheckinSuccess(false), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to record check-in');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;
    try {
      await pb.createGoal(newGoalTitle.trim());
      setNewGoalTitle('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to save goal');
    }
  };

  // Calculate consistency
  const onboardedDate = account?.onboardedAt ? account.onboardedAt.slice(0, 10) : undefined;
  const consistency: WeeklyConsistencyMetric = calculateWeeklyConsistency({
    checkins,
    referenceDate: todayStr,
    onboardedDate,
    timeZone: tz,
  });

  const moodEmojis = ['', '😔', '😟', '😐', '🙂', '😌'];

  if (!isAuthenticated) {
    return (
      <div style={{ maxWidth: '440px', margin: '2rem auto' }}>
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', color: 'var(--deep-olive)', marginBottom: '0.4rem' }}>
            {authMode === 'login' ? 'Sign In to Companion' : 'Create Private Account'}
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            {t('checkin.subtitle')} We never ask for legal names or phone numbers.
          </p>

          {authError && (
            <div style={{ backgroundColor: '#FBEBE6', color: '#9E2A2B', padding: '0.6rem', borderRadius: '4px', fontSize: '0.85rem', marginBottom: '1rem' }}>
              {authError}
            </div>
          )}

          <form onSubmit={handleAuth}>
            <div style={{ marginBottom: '0.85rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                Account Email (or private identifier)
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                Password (min 8 chars)
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: '1rem' }} disabled={authLoading}>
              {authLoading ? 'Processing...' : authMode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div style={{ textAlign: 'center', fontSize: '0.88rem' }}>
            {authMode === 'login' ? (
              <span>
                New to DayZero?{' '}
                <button type="button" onClick={() => setAuthMode('register')} style={{ background: 'none', border: 'none', color: 'var(--sage)', fontWeight: 600, cursor: 'pointer' }}>
                  Register privately
                </button>
              </span>
            ) : (
              <span>
                Already have an account?{' '}
                <button type="button" onClick={() => setAuthMode('login')} style={{ background: 'none', border: 'none', color: 'var(--sage)', fontWeight: 600, cursor: 'pointer' }}>
                  Sign in
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '1.5rem auto' }}>
      {/* 7-Day Consistency Metric Card */}
      <div className="card" style={{ borderLeft: '4px solid var(--sage)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', color: 'var(--deep-olive)' }}>
              {t('consistency.title')}
            </h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              {t('consistency.subtitle')}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--sage)', lineHeight: 1 }}>
              {consistency.consistencyPercentage}%
            </span>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {t('consistency.eligible', {
                completed: consistency.completedDaysCount,
                eligible: consistency.eligibleDaysCount,
              })}
            </div>
          </div>
        </div>

        {/* 7-Day Visual Tracker */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.4rem', margin: '1rem 0' }}>
          {consistency.days.map((day) => {
            const isToday = day.date === todayStr;
            return (
              <div
                key={day.date}
                style={{
                  textAlign: 'center',
                  padding: '0.6rem 0.2rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: day.isCompleted
                    ? 'var(--pale-sage)'
                    : day.isEligible
                    ? 'var(--surface-raised)'
                    : '#F0F0EE',
                  border: isToday ? '2px solid var(--sage)' : '1px solid var(--border-light)',
                  opacity: day.isEligible ? 1 : 0.45,
                }}
              >
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  {day.dayOfWeek}
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, margin: '0.2rem 0' }}>
                  {day.date.slice(8)}
                </div>
                <div style={{ fontSize: '1.1rem' }}>
                  {day.isCompleted ? moodEmojis[day.mood || 3] : '○'}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'var(--deep-olive)' }}>
          <span>🌱 {t(consistency.supportiveMessageKey)}</span>
          {consistency.streakDays > 0 && (
            <span className="badge badge-verified">
              🔥 {t('consistency.streak', { streak: consistency.streakDays })}
            </span>
          )}
        </div>
      </div>

      {/* Daily Check-in Form */}
      <div className="card">
        <h2 style={{ fontSize: '1.15rem', color: 'var(--deep-olive)', marginBottom: '0.25rem' }}>
          {t('checkin.title')}
        </h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Date: {todayStr} ({tz})
        </p>

        {checkinSuccess && (
          <div style={{ backgroundColor: '#E2EFE7', color: '#2D6A4F', padding: '0.65rem', borderRadius: 'var(--radius-sm)', fontSize: '0.88rem', marginBottom: '1rem' }}>
            ✓ {t('checkin.done')}
          </div>
        )}

        <form onSubmit={handleCheckin}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              {t('checkin.mood')}
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem' }}>
              {[
                { val: 1, label: t('checkin.mood.1'), emoji: '😔' },
                { val: 2, label: t('checkin.mood.2'), emoji: '😟' },
                { val: 3, label: t('checkin.mood.3'), emoji: '😐' },
                { val: 4, label: t('checkin.mood.4'), emoji: '🙂' },
                { val: 5, label: t('checkin.mood.5'), emoji: '😌' },
              ].map((m) => (
                <button
                  key={m.val}
                  type="button"
                  onClick={() => setTodayMood(m.val)}
                  style={{
                    padding: '0.65rem 0.4rem',
                    textAlign: 'center',
                    borderRadius: 'var(--radius-sm)',
                    border: todayMood === m.val ? '2px solid var(--sage)' : '1px solid var(--border-light)',
                    backgroundColor: todayMood === m.val ? 'var(--pale-sage)' : 'var(--surface-raised)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: '1.4rem' }}>{m.emoji}</div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 500, marginTop: '0.2rem' }}>{m.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 500, marginBottom: '0.35rem' }}>
              {t('checkin.note')}
            </label>
            <textarea
              rows={3}
              maxLength={500}
              value={todayNote}
              onChange={(e) => setTodayNote(e.target.value)}
              placeholder={t('checkin.note.placeholder')}
              style={{
                width: '100%',
                padding: '0.65rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-light)',
                resize: 'vertical',
              }}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Recording...' : t('checkin.submit')}
          </button>
        </form>
      </div>

      {/* Personal Goals / Intentions */}
      <div className="card">
        <h3 style={{ fontSize: '1.1rem', color: 'var(--deep-olive)', marginBottom: '0.5rem' }}>
          Personal Goals & Daily Intentions
        </h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Small, tangible acts of self-care for today.
        </p>

        <form onSubmit={handleAddGoal} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <input
            type="text"
            maxLength={120}
            value={newGoalTitle}
            onChange={(e) => setNewGoalTitle(e.target.value)}
            placeholder="e.g. 20-minute walk, call a supportive friend..."
            style={{ flex: 1, padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}
          />
          <button type="submit" className="btn btn-secondary">
            Add Intention
          </button>
        </form>

        {goals.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            No personal intentions set yet. Add one above whenever you are ready.
          </p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {goals.map((g) => (
              <li
                key={g.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.5rem 0',
                  borderBottom: '1px solid var(--border-light)',
                  fontSize: '0.9rem',
                }}
              >
                <span style={{ marginRight: '0.5rem', color: 'var(--sage)' }}>✓</span>
                <span>{g.title}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
