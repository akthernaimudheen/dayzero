'use client';

import React from 'react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/Header';
import { EmergencyModal } from '../components/EmergencyModal';
import { CompanionView } from '../components/CompanionView';
import { CareDirectoryView } from '../components/CareDirectoryView';
import { HelplinesView } from '../components/HelplinesView';
import { CommunityView } from '../components/CommunityView';
import { SettingsView } from '../components/SettingsView';

export default function HomePage() {
  const { activeTab, emergencyModalOpen, setEmergencyModalOpen, t } = useApp();

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-ivory)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      
      <EmergencyModal />

      <main style={{ flex: 1, paddingBottom: '3rem' }}>
        {activeTab === 'companion' && <CompanionView />}
        {activeTab === 'care' && <CareDirectoryView />}
        {activeTab === 'helplines' && <HelplinesView />}
        {activeTab === 'community' && <CommunityView />}
        {activeTab === 'settings' && <SettingsView />}
      </main>

      <footer style={{
        backgroundColor: 'var(--color-deep-olive)',
        color: 'var(--color-ivory)',
        padding: '2rem 1rem',
        marginTop: 'auto',
        fontSize: '0.875rem',
      }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <strong style={{ fontSize: '1rem', letterSpacing: '0.05em' }}>DayZero (തണൽ)</strong>
              <p style={{ margin: '0.25rem 0 0', opacity: 0.85 }}>
                Open-Source, Zero-Licence-Cost Recovery Support Platform for Kerala.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setEmergencyModalOpen(true)}
                style={{
                  background: 'var(--color-coral)',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '999px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                112 / Tele-MANAS (14416)
              </button>
            </div>
          </div>
          <hr style={{ borderColor: 'rgba(255,255,255,0.15)', margin: '0.5rem 0' }} />
          <div style={{ fontSize: '0.775rem', opacity: 0.8, lineHeight: 1.6 }}>
            <p style={{ margin: '0 0 0.5rem' }}>
              <strong>Clinical & Emergency Notice:</strong> DayZero does not provide medical diagnosis, drug detox prescriptions, or crisis intervention. In an acute medical or psychiatric emergency (including severe alcohol withdrawal, seizures, hallucinations, or suicidal ideation), call <strong>112</strong> (Kerala Emergency Response Support System) or <strong>14416</strong> (Tele-MANAS, 24/7 mental health helpline) immediately or visit your nearest Government Medical College Hospital.
            </p>
            <p style={{ margin: 0 }}>
              Zero paid BaaS &bull; Zero third-party behavioral trackers &bull; Open-source AGPL-v3 &bull; Powered by PocketBase & Next.js.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
