'use client';

import React from 'react';
import { useApp } from '../context/AppContext';
import { EMERGENCY_GUIDANCE, CLINICAL_SAFETY_DISCLAIMER } from '@dayzero/shared';

export const EmergencyModal: React.FC = () => {
  const { emergencyModalOpen, setEmergencyModalOpen, t } = useApp();

  if (!emergencyModalOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="emergency-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(40, 61, 48, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem',
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius)',
          maxWidth: '680px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: 'var(--shadow-md)',
          padding: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div>
            <span className="badge badge-emergency" style={{ marginBottom: '0.4rem' }}>
              CRITICAL EMERGENCY GUIDANCE
            </span>
            <h2 id="emergency-modal-title" style={{ fontSize: '1.35rem', color: 'var(--deep-olive)' }}>
              {t('emergency.title')}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setEmergencyModalOpen(false)}
            aria-label="Close modal"
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.4rem',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: '0.2rem 0.5rem',
            }}
          >
            ✕
          </button>
        </div>

        {/* Immediate Call Actions */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0.75rem',
            marginBottom: '1.5rem',
          }}
        >
          <a
            href="tel:112"
            className="btn btn-emergency"
            style={{ fontSize: '1.05rem', padding: '0.85rem' }}
          >
            📞 Call 112 (Police / Ambulance)
          </a>
          <a
            href="tel:14416"
            className="btn btn-primary"
            style={{ fontSize: '1.05rem', padding: '0.85rem', backgroundColor: 'var(--deep-olive)' }}
          >
            📞 Call 14416 (Tele-MANAS 24/7)
          </a>
        </div>

        {/* Severe Alcohol Withdrawal Warning */}
        <div
          style={{
            backgroundColor: '#FFF8F6',
            border: '1px solid #F5D2C9',
            borderRadius: 'var(--radius-sm)',
            padding: '1rem',
            marginBottom: '1rem',
          }}
        >
          <h3 style={{ fontSize: '1.05rem', color: '#A23419', marginBottom: '0.35rem' }}>
            ⚠️ {EMERGENCY_GUIDANCE.severe_alcohol_withdrawal.title}
          </h3>
          <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 500 }}>
            Symptoms requiring IMMEDIATE emergency room admission:
          </p>
          <ul style={{ fontSize: '0.88rem', paddingLeft: '1.25rem', marginBottom: '0.5rem' }}>
            {EMERGENCY_GUIDANCE.severe_alcohol_withdrawal.symptoms.map((s, idx) => (
              <li key={idx} style={{ marginBottom: '0.2rem' }}>{s}</li>
            ))}
          </ul>
          <div style={{ backgroundColor: '#FBEBE6', padding: '0.6rem', borderRadius: '4px', fontSize: '0.85rem', color: '#7E250F' }}>
            <strong>CRITICAL CONTRAINDICATION:</strong> {EMERGENCY_GUIDANCE.severe_alcohol_withdrawal.contraindications[0]}
          </div>
        </div>

        {/* Suspected Overdose Guidelines */}
        <div
          style={{
            backgroundColor: '#F8F9F7',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-sm)',
            padding: '1rem',
            marginBottom: '1rem',
          }}
        >
          <h3 style={{ fontSize: '1.05rem', color: 'var(--deep-olive)', marginBottom: '0.35rem' }}>
            🚑 {EMERGENCY_GUIDANCE.suspected_overdose.title}
          </h3>
          <p style={{ fontSize: '0.88rem', marginBottom: '0.5rem' }}>
            If someone is unresponsive, limp, or breathing shallowly / stopped:
          </p>
          <div style={{ whiteSpace: 'pre-line', fontSize: '0.85rem', backgroundColor: '#FFFFFF', padding: '0.65rem', borderRadius: '4px', border: '1px solid var(--border-light)' }}>
            {EMERGENCY_GUIDANCE.suspected_overdose.immediateAction}
          </div>
        </div>

        {/* Disclaimer */}
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem' }}>
          {CLINICAL_SAFETY_DISCLAIMER}
        </div>

        <div style={{ marginTop: '1.25rem', textAlign: 'right' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setEmergencyModalOpen(false)}
          >
            Close Emergency Guidance
          </button>
        </div>
      </div>
    </div>
  );
};
