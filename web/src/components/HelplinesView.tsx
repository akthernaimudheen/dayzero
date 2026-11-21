'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { pb } from '../lib/pb';
import type { Helpline } from '@dayzero/shared';

export const HelplinesView: React.FC = () => {
  const { language, t } = useApp();
  const [helplines, setHelplines] = useState<Helpline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHelplines = async () => {
      setLoading(true);
      try {
        const data = await pb.getHelplines();
        setHelplines(data);
      } catch (err) {
        console.error('Failed to load helplines:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHelplines();
  }, []);

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'emergency':
        return <span className="badge badge-emergency">Emergency Response (Life Threatening)</span>;
      case 'crisis':
        return <span className="badge" style={{ backgroundColor: '#EDE7F6', color: '#512DA8', border: '1px solid #D1C4E9' }}>Crisis & Suicide Intervention</span>;
      case 'counselling':
        return <span className="badge badge-verified">Counselling & Support</span>;
      default:
        return <span className="badge badge-stale">Referral</span>;
    }
  };

  return (
    <div style={{ maxWidth: '840px', margin: '1.5rem auto' }}>
      <div className="card">
        <h2 style={{ fontSize: '1.35rem', color: 'var(--deep-olive)', marginBottom: '0.35rem' }}>
          Verified Helplines & Crisis Routing
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          All calls are strictly user-initiated. DayZero never automatically shares your identity, symptoms, or location.
        </p>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
          Loading verified helplines...
        </div>
      )}

      {helplines.map((h) => {
        const desc = language === 'ml' && h.descriptionMl ? h.descriptionMl : h.descriptionEn;
        const isEmergency = h.category === 'emergency';

        return (
          <div
            key={h.id}
            className="card"
            style={{
              borderLeft: isEmergency ? '4px solid #C53929' : '4px solid var(--sage)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', color: 'var(--deep-olive)', marginBottom: '0.2rem' }}>
                  {h.name}
                </h3>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Authority: {h.issuer}
                </div>
              </div>
              <div>{getCategoryBadge(h.category)}</div>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', margin: '0.75rem 0' }}>
              {desc}
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Source:{' '}
                <a href={h.sourceUrl} target="_blank" rel="noopener noreferrer">
                  Official Verification Portal ↗
                </a>{' '}
                • Status: {h.status}
              </div>

              <a
                href={`tel:${h.number.replaceAll('-', '')}`}
                className={`btn ${isEmergency ? 'btn-emergency' : 'btn-primary'}`}
                style={{ padding: '0.5rem 1.15rem', fontSize: '0.95rem' }}
              >
                📞 Call {h.number}
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
};
