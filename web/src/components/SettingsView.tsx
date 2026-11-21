'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { SupportedLanguage } from '@dayzero/shared';

export const SettingsView: React.FC = () => {
  const { language, setLanguage, account, isAuthenticated, logout, deleteAccount, t } = useApp();

  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirmText !== 'DELETE') {
      setDeleteError('Please type "DELETE" exactly to confirm.');
      return;
    }
    if (!deletePassword) {
      setDeleteError('Password is required.');
      return;
    }

    setDeleting(true);
    setDeleteError('');
    try {
      await deleteAccount(deletePassword);
      alert('Your account and all associated data have been permanently erased.');
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete account');
      setDeleting(false);
    }
  };

  return (
    <div style={{ maxWidth: '720px', margin: '1.5rem auto' }}>
      {/* Language Preference */}
      <div className="card">
        <h2 style={{ fontSize: '1.2rem', color: 'var(--deep-olive)', marginBottom: '0.4rem' }}>
          {t('settings.language')}
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
          {[
            { id: 'en', label: 'English' },
            { id: 'ml', label: 'മലയാളം (Malayalam)' },
            { id: 'ml-Latn', label: 'Manglish (Transliterated)' },
          ].map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => setLanguage(l.id as SupportedLanguage)}
              className={`btn ${language === l.id ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.55rem 1.15rem' }}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Privacy Architecture & Data Minimization Notice */}
      <div className="card">
        <h3 style={{ fontSize: '1.15rem', color: 'var(--deep-olive)', marginBottom: '0.4rem' }}>
          🛡️ {t('settings.privacyPolicy')}
        </h3>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', marginBottom: '0.75rem' }}>
          DayZero is built on an unconditional privacy-first, zero-licence-cost open-source foundation:
        </p>
        <ul style={{ fontSize: '0.86rem', color: 'var(--text-muted)', paddingLeft: '1.25rem', lineHeight: 1.6 }}>
          <li><strong>No Real Names:</strong> We do not ask for or store your legal name. You participate in peer circles with self-chosen pseudonyms.</li>
          <li><strong>No Tracking:</strong> Zero third-party analytics, zero advertising SDKs, zero behavioral surveillance trackers.</li>
          <li><strong>No Device Contact Scraping:</strong> We never access your contacts, phone books, or device identifiers.</li>
          <li><strong>Self-Hosted Infrastructure:</strong> All data is stored in our self-hosted PocketBase database, protected by strict server-side authorization rules.</li>
          <li><strong>No Sensitive Symptom URLs:</strong> Query parameters and URLs never contain medical, symptom, or private reflection data.</li>
        </ul>
      </div>

      {/* Account Info / Logout */}
      {isAuthenticated && (
        <div className="card">
          <h3 style={{ fontSize: '1.15rem', color: 'var(--deep-olive)', marginBottom: '0.4rem' }}>
            Account Profile
          </h3>
          <div style={{ fontSize: '0.88rem', color: 'var(--text-main)', marginBottom: '1rem' }}>
            <div><strong>Role:</strong> {account?.role}</div>
            <div><strong>Timezone:</strong> {account?.timezone}</div>
            <div><strong>Status:</strong> {account?.status}</div>
          </div>

          <button type="button" className="btn btn-secondary" onClick={logout}>
            Sign Out
          </button>
        </div>
      )}

      {/* Permanent Account & Data Deletion */}
      {isAuthenticated && (
        <div className="card" style={{ border: '1px solid #F5C6CB', backgroundColor: '#FFFDFD' }}>
          <h3 style={{ fontSize: '1.15rem', color: '#A23419', marginBottom: '0.4rem' }}>
            ⚠️ {t('settings.deleteAccount')}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            {t('settings.deleteWarning')}
          </p>

          {deleteError && (
            <div style={{ backgroundColor: '#FBEBE6', color: '#9E2A2B', padding: '0.6rem', borderRadius: '4px', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
              {deleteError}
            </div>
          )}

          <form onSubmit={handleDelete}>
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                Type "DELETE" to confirm
              </label>
              <input
                type="text"
                required
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                style={{ width: '100%', maxWidth: '280px', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                Your Password (for re-authentication)
              </label>
              <input
                type="password"
                required
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', maxWidth: '280px', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}
              />
            </div>

            <button type="submit" className="btn btn-danger" disabled={deleting}>
              {deleting ? 'Erasing Data...' : 'Permanently Delete Account & All Data'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
