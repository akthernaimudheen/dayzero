import type { Facility, KeralaDistrict } from './types.js';

export const KERALA_DISTRICT_COORDINATES: Record<KeralaDistrict, { lat: number; lng: number }> = {
  Thiruvananthapuram: { lat: 8.5241, lng: 76.9366 },
  Kollam: { lat: 8.8932, lng: 76.6141 },
  Pathanamthitta: { lat: 9.2648, lng: 76.787 },
  Alappuzha: { lat: 9.4981, lng: 76.3388 },
  Kottayam: { lat: 9.5916, lng: 76.5222 },
  Idukki: { lat: 9.8494, lng: 76.9806 },
  Ernakulam: { lat: 9.9816, lng: 76.2999 },
  Thrissur: { lat: 10.5276, lng: 76.2144 },
  Palakkad: { lat: 10.7867, lng: 76.6548 },
  Malappuram: { lat: 11.0732, lng: 76.074 },
  Kozhikode: { lat: 11.2588, lng: 75.7804 },
  Wayanad: { lat: 11.6854, lng: 76.132 },
  Kannur: { lat: 11.8745, lng: 75.3704 },
  Kasaragod: { lat: 12.5102, lng: 74.9852 },
};

export const ALL_DISTRICTS: KeralaDistrict[] = Object.keys(
  KERALA_DISTRICT_COORDINATES
) as KeralaDistrict[];

/**
 * Calculate the great-circle distance between two coordinates in kilometers using Haversine formula.
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export interface FacilityFilterOptions {
  query?: string;
  district?: KeralaDistrict | 'all';
  facilityType?: string | 'all';
  verificationStatus?: string | 'all';
  userCoords?: { lat: number; lng: number };
}

/**
 * Filter and sort a list of facilities without external paid APIs.
 */
export function filterAndSortFacilities(
  facilities: Facility[],
  options: FacilityFilterOptions
): Facility[] {
  const { query, district, facilityType, verificationStatus, userCoords } = options;

  let filtered = facilities.filter((f) => {
    if (district && district !== 'all' && f.district !== district) {
      return false;
    }
    if (facilityType && facilityType !== 'all' && f.facilityType !== facilityType) {
      return false;
    }
    if (verificationStatus && verificationStatus !== 'all' && f.verificationStatus !== verificationStatus) {
      return false;
    }
    if (query && query.trim()) {
      const q = query.toLowerCase().trim();
      const matchName = f.name.toLowerCase().includes(q);
      const matchAddr = f.address.toLowerCase().includes(q);
      const matchDistrict = f.district.toLowerCase().includes(q);
      const matchServices = Array.isArray(f.services) && f.services.some((s) => s.toLowerCase().includes(q));
      if (!matchName && !matchAddr && !matchDistrict && !matchServices) {
        return false;
      }
    }
    return true;
  });

  // Attach distance if coordinates available
  if (userCoords && userCoords.lat && userCoords.lng) {
    filtered = filtered.map((f) => {
      // If facility has no explicit lat/lng, fallback to district center coordinate
      const targetLat = f.lat ?? KERALA_DISTRICT_COORDINATES[f.district]?.lat;
      const targetLng = f.lng ?? KERALA_DISTRICT_COORDINATES[f.district]?.lng;

      if (targetLat !== undefined && targetLng !== undefined) {
        const d = calculateHaversineDistanceKm(
          userCoords.lat,
          userCoords.lng,
          targetLat,
          targetLng
        );
        return { ...f, distanceKm: d };
      }
      return f;
    });

    // Sort by nearest distance first
    filtered.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
  } else {
    // Sort alphabetically by name
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  }

  return filtered;
}

/**
 * Build external navigation / directions links for Web and Android.
 * Completely free: uses OpenStreetMap or Google Maps web links without paid API keys.
 */
export function buildDirectionsUrls(facility: Facility): {
  openStreetMap: string;
  googleMapsWeb: string;
  androidGeoIntent: string;
} {
  const coords =
    facility.lat && facility.lng
      ? { lat: facility.lat, lng: facility.lng }
      : KERALA_DISTRICT_COORDINATES[facility.district] || { lat: 8.5241, lng: 76.9366 };

  const queryEncoded = encodeURIComponent(`${facility.name}, ${facility.address}`);

  return {
    openStreetMap: `https://www.openstreetmap.org/search?query=${queryEncoded}#map=15/${coords.lat}/${coords.lng}`,
    googleMapsWeb: `https://www.google.com/maps/search/?api=1&query=${queryEncoded}`,
    androidGeoIntent: `geo:${coords.lat},${coords.lng}?q=${encodeURIComponent(facility.name)}`,
  };
}
