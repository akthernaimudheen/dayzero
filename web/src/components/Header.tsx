'use client';

import React from 'react';
import { useApp } from '../context/AppContext';
import type { SupportedLanguage } from '@dayzero/shared';

export const Header: React.FC = () => {
  const { language, setLanguage, activeTab, setActiveTab, setEmergencyModalOpen, t } = useApp();

  const handleLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value as SupportedLanguage);
  };

  return (
    <header style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid var(--border-light)' }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: 'var(--sage)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '1.15rem',
            }}
          >
            DZ
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--deep-olive)', lineHeight: 1.1 }}>
              DayZero
            </h1>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {language === 'ml' ? 'തണൽ മാതൃകയിലുള്ള സ്വകാര്യ ലഹരിമുക്തി സഹായി' : 'Recovery Companion • Thanal Model'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Language Selector */}
          <select
            value={language}
            onChange={handleLangChange}
            aria-label="Select language"
            style={{
              padding: '0.4rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-light)',
              backgroundColor: 'var(--surface-raised)',
              color: 'var(--text-main)',
              fontSize: '0.88rem',
              cursor: 'pointer',
            }}
          >
            <option value="en">English</option>
            <option value="ml">മലയാളം</option>
            <option value="ml-Latn">Manglish</option>
          </select>

          {/* Emergency Alert Button */}
          <button
            type="button"
            className="btn btn-emergency"
            onClick={() => setEmergencyModalOpen(true)}
            style={{ padding: '0.45rem 0.9rem', fontSize: '0.88rem' }}
          >
            🚨 {t('emergency.call112')}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav aria-label="Main Navigation" style={{ backgroundColor: 'var(--surface-raised)', borderTop: '1px solid var(--border-light)' }}>
        <div className="container" style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', padding: '0.4rem 1rem' }}>
          {[
            { id: 'companion', label: t('nav.home'), icon: '🌱' },
            { id: 'care', label: t('nav.care'), icon: '🏥' },
            { id: 'helplines', label: t('nav.helplines'), icon: '📞' },
            { id: 'community', label: t('nav.community'), icon: '🤝' },
            { id: 'settings', label: t('nav.settings'), icon: '🔒' },
          ].map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id as any)}
                style={{
                  padding: '0.55rem 1rem',
                  fontSize: '0.9rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#FFFFFF' : 'var(--text-main)',
                  backgroundColor: isActive ? 'var(--sage)' : 'transparent',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  whiteSpace: 'nowrap',
                  transition: 'background-color 0.15s ease',
                }}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
};
