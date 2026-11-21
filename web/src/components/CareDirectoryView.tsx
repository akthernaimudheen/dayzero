'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { pb } from '../lib/pb';
import {
  ALL_DISTRICTS,
  KERALA_DISTRICT_COORDINATES,
  filterAndSortFacilities,
  buildDirectionsUrls,
} from '@dayzero/shared';
import type { Facility, KeralaDistrict } from '@dayzero/shared';

export const CareDirectoryView: React.FC = () => {
  const { t } = useApp();

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState<KeralaDistrict | 'all'>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  // Leaflet map container ref
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    const fetchFacilities = async () => {
      setLoading(true);
      try {
        const data = await pb.getFacilities();
        setFacilities(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load directory');
      } finally {
        setLoading(false);
      }
    };
    fetchFacilities();
  }, []);

  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setGettingLocation(false);
      },
      (err) => {
        setGettingLocation(false);
        alert('Could not retrieve your location. You can select your district from the dropdown.');
      },
      { timeout: 8000 }
    );
  };

  const filtered = filterAndSortFacilities(facilities, {
    query: searchQuery,
    district: selectedDistrict,
    facilityType: selectedType,
    userCoords: userLocation || undefined,
  });

  // Initialize or update Leaflet Map
  useEffect(() => {
    if (viewMode !== 'map' || !mapContainerRef.current) return;

    let isMounted = true;

    // Dynamically load leaflet on the client side
    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      if (!mapInstanceRef.current) {
        const center = userLocation || { lat: 10.5, lng: 76.2 };
        const map = L.map(mapContainerRef.current).setView([center.lat, center.lng], 7);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 18,
        }).addTo(map);

        mapInstanceRef.current = map;
      }

      const map = mapInstanceRef.current;

      // Clear existing markers
      map.eachLayer((layer: any) => {
        if (layer instanceof L.Marker) {
          map.removeLayer(layer);
        }
      });

      // Add markers for filtered facilities
      filtered.forEach((fac) => {
        const lat = fac.lat ?? KERALA_DISTRICT_COORDINATES[fac.district]?.lat;
        const lng = fac.lng ?? KERALA_DISTRICT_COORDINATES[fac.district]?.lng;

        if (lat && lng) {
          const marker = L.marker([lat, lng]).addTo(map);
          const urls = buildDirectionsUrls(fac);
          const popupHtml = `
            <div style="font-family: sans-serif; font-size: 13px; max-width: 240px;">
              <strong>${fac.name}</strong><br/>
              <span style="color: #666;">${fac.address}</span><br/>
              <span style="font-size: 11px; background: #eee; padding: 2px 5px; border-radius: 4px; display: inline-block; margin: 4px 0;">
                ${fac.verificationStatus.toUpperCase()}
              </span><br/>
              <a href="${urls.googleMapsWeb}" target="_blank" rel="noopener noreferrer" style="color: #547A61; font-weight: 600;">
                Get Directions ↗
              </a>
            </div>
          `;
          marker.bindPopup(popupHtml);
        }
      });
    });

    return () => {
      isMounted = false;
    };
  }, [viewMode, filtered, userLocation]);

  return (
    <div style={{ maxWidth: '960px', margin: '1.5rem auto' }}>
      {/* Search & Header */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.35rem', color: 'var(--deep-olive)', marginBottom: '0.35rem' }}>
          {t('care.title')}
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          {t('care.subtitle')} All listings carry traceable government sources and verification dates.
        </p>

        {/* Search Bar */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('care.search')}
            style={{
              flex: 1,
              minWidth: '220px',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-light)',
            }}
          />

          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value as any)}
            style={{
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-light)',
              backgroundColor: 'var(--surface-raised)',
            }}
          >
            <option value="all">{t('care.allDistricts')}</option>
            {ALL_DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            style={{
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-light)',
              backgroundColor: 'var(--surface-raised)',
            }}
          >
            <option value="all">{t('care.allTypes')}</option>
            <option value="punarjani_homoeopathy">Punarjani Homoeopathy</option>
            <option value="govt_deaddiction">Government De-addiction Centre</option>
            <option value="mental_health">Mental Health Centre</option>
            <option value="hospital_atf">Hospital Addiction Treatment Facility</option>
          </select>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleRequestLocation}
            disabled={gettingLocation}
          >
            📍 {gettingLocation ? 'Locating...' : userLocation ? 'Nearby Sorted' : 'Sort Nearest'}
          </button>
        </div>

        {/* View Mode Toggle */}
        <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem' }}>
          <button
            type="button"
            className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('list')}
            style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
          >
            📋 List View ({filtered.length})
          </button>
          <button
            type="button"
            className={`btn ${viewMode === 'map' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('map')}
            style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
          >
            🗺️ OpenStreetMap View
          </button>
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading verified public care directory...
        </div>
      )}

      {error && (
        <div className="card" style={{ backgroundColor: '#FBEBE6', color: '#9E2A2B' }}>
          {error}
        </div>
      )}

      {/* Map View */}
      {viewMode === 'map' && (
        <div className="card" style={{ padding: '0.5rem' }}>
          <link
            rel="stylesheet"
            href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
            integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
            crossOrigin=""
          />
          <div
            ref={mapContainerRef}
            style={{ height: '480px', width: '100%', borderRadius: 'var(--radius-sm)' }}
          />
        </div>
      )}

      {/* Facilities List View */}
      {viewMode === 'list' && (
        <div>
          {filtered.length === 0 && !loading && (
            <div className="card" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
              {t('care.empty')}
            </div>
          )}

          {filtered.map((fac) => {
            const urls = buildDirectionsUrls(fac);
            return (
              <div key={fac.id} className="card" style={{ position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', color: 'var(--deep-olive)', marginBottom: '0.2rem' }}>
                      {fac.name}
                    </h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                      📍 {fac.address}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    {fac.distanceKm !== undefined && (
                      <span className="badge badge-verified">
                        {fac.distanceKm} km away
                      </span>
                    )}
                    <span
                      className={`badge ${
                        fac.verificationStatus === 'verified'
                          ? 'badge-verified'
                          : fac.verificationStatus === 'stale'
                          ? 'badge-stale'
                          : 'badge-emergency'
                      }`}
                    >
                      {fac.verificationStatus === 'verified'
                        ? t('care.status.verified')
                        : fac.verificationStatus === 'stale'
                        ? t('care.status.stale')
                        : t('care.status.unverified')}
                    </span>
                  </div>
                </div>

                {/* Operating hours & Cost note */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem', fontSize: '0.84rem', margin: '0.75rem 0', padding: '0.75rem', backgroundColor: 'var(--surface-raised)', borderRadius: 'var(--radius-sm)' }}>
                  <div>
                    <strong>🕒 {t('care.hours')}:</strong>
                    <div>{fac.hoursNote || 'Standard Outpatient hours.'}</div>
                  </div>
                  <div>
                    <strong>💰 {t('care.cost')}:</strong>
                    <div>{fac.costNote || 'Government subsidized / public facility.'}</div>
                  </div>
                  {fac.eligibilityNote && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <strong>📋 {t('care.eligibility')}:</strong>
                      <div>{fac.eligibilityNote}</div>
                    </div>
                  )}
                </div>

                {/* Source Verification Traceability */}
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  <strong>Source:</strong> {fac.sourceName} •{' '}
                  <a href={fac.sourceUrl} target="_blank" rel="noopener noreferrer">
                    Official Government Portal ↗
                  </a>{' '}
                  • Verified: {fac.verifiedAt}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {fac.phone && (
                    <a href={`tel:${fac.phone}`} className="btn btn-secondary" style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}>
                      📞 {t('care.call')} ({fac.phone})
                    </a>
                  )}
                  <a
                    href={urls.googleMapsWeb}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                    style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
                  >
                    🗺️ Google Maps Directions ↗
                  </a>
                  <a
                    href={urls.openStreetMap}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                    style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
                  >
                    🧭 OpenStreetMap ↗
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
