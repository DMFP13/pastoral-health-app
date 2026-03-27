import type { UserLocation } from '../types';

const LOC_KEY         = 'pastoral_location';
const FARM_LOC_KEY    = 'pastoral_farming_location';
const GPS_TIMEOUT_MS  = 8000;

export const NIGERIAN_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT - Abuja',
  'Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi',
  'Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo',
  'Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara',
] as const;

export const KENYAN_COUNTIES = [
  'Baringo','Bomet','Bungoma','Busia','Elgeyo-Marakwet','Embu',
  'Garissa','Homa Bay','Isiolo','Kajiado','Kakamega','Kericho',
  'Kiambu','Kilifi','Kirinyaga','Kisii','Kisumu','Kitui','Kwale',
  'Laikipia','Lamu','Machakos','Makueni','Mandera','Marsabit',
  'Meru','Migori','Mombasa','Murang\'a','Nairobi','Nakuru','Nandi',
  'Narok','Nyamira','Nyandarua','Nyeri','Samburu','Siaya',
  'Taita-Taveta','Tana River','Tharaka-Nithi','Trans Nzoia',
  'Turkana','Uasin Gishu','Vihiga','Wajir','West Pokot',
] as const;

export function getSavedLocation(): UserLocation | null {
  const raw = localStorage.getItem(LOC_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as UserLocation; } catch { return null; }
}

export function saveLocation(loc: UserLocation): void {
  localStorage.setItem(LOC_KEY, JSON.stringify(loc));
}

export function clearLocation(): void {
  localStorage.removeItem(LOC_KEY);
}

/**
 * Farming location — where the animals actually are.
 * Falls back to the general saved location for existing users.
 */
export function getFarmingLocation(): UserLocation | null {
  const raw = localStorage.getItem(FARM_LOC_KEY);
  if (raw) {
    try { return JSON.parse(raw) as UserLocation; } catch { /* fall through */ }
  }
  return getSavedLocation();
}

export function saveFarmingLocation(loc: UserLocation): void {
  localStorage.setItem(FARM_LOC_KEY, JSON.stringify(loc));
  // Also keep the legacy key in sync so existing checks still work.
  saveLocation(loc);
}

/** Attempt browser GPS. Resolves with coords or null on failure/timeout. */
export function getCurrentGPS(): Promise<{ lat: number; lng: number } | null> {
  return new Promise(resolve => {
    if (!navigator.geolocation) { resolve(null); return; }
    const timer = setTimeout(() => resolve(null), GPS_TIMEOUT_MS);
    navigator.geolocation.getCurrentPosition(
      pos => { clearTimeout(timer); resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }); },
      ()  => { clearTimeout(timer); resolve(null); },
      { timeout: GPS_TIMEOUT_MS, maximumAge: 300_000 },
    );
  });
}

/** Haversine distance in km between two lat/lng points. */
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Rule-based seasonal disease risk for a location. */
export function getSeasonalRisk(loc: UserLocation): {
  season: string;
  heatRisk: 'low' | 'moderate' | 'high';
  diseaseRisk: 'low' | 'moderate' | 'high';
  tip: string;
} {
  const month = new Date().getMonth() + 1; // 1-12
  const country = (loc.country ?? '').toLowerCase();

  if (country.includes('nigeria') || country.includes('niger')) {
    if (month >= 11 || month <= 3) {
      return { season: 'Harmattan', heatRisk: 'low', diseaseRisk: 'moderate',
        tip: 'Dusty winds — watch for coughing & respiratory disease (CBPP).' };
    }
    if (month >= 4 && month <= 6) {
      return { season: 'Early Rains', heatRisk: 'moderate', diseaseRisk: 'moderate',
        tip: 'Mud increases foot rot risk. Check hooves weekly.' };
    }
    if (month >= 7 && month <= 9) {
      return { season: 'Rainy Season', heatRisk: 'low', diseaseRisk: 'moderate',
        tip: 'Flooding raises leptospirosis risk. Ensure clean water access.' };
    }
    return { season: 'Post-Rain', heatRisk: 'moderate', diseaseRisk: 'low',
      tip: 'Good grazing conditions. Maintain vaccination schedule.' };
  }

  if (country.includes('kenya')) {
    if (month >= 6 && month <= 8) {
      return { season: 'Cool Dry', heatRisk: 'low', diseaseRisk: 'moderate',
        tip: 'Cold stress on calves. Watch for CBPP in dry conditions.' };
    }
    if (month >= 3 && month <= 5) {
      return { season: 'Long Rains', heatRisk: 'low', diseaseRisk: 'high',
        tip: 'Tick season peak — apply acaricide every 7 days. High ECF risk.' };
    }
    if (month >= 10 && month <= 12) {
      return { season: 'Short Rains', heatRisk: 'moderate', diseaseRisk: 'moderate',
        tip: 'Tick numbers rising. Check LSD vaccination status.' };
    }
    return { season: 'Dry Season', heatRisk: 'high', diseaseRisk: 'moderate',
      tip: 'Heat stress risk. Ensure shade and clean water at all times.' };
  }

  // Generic fallback
  return { season: 'Current', heatRisk: 'moderate', diseaseRisk: 'moderate',
    tip: 'Monitor your animals daily. Keep vaccinations up to date.' };
}

export function locationLabel(loc: UserLocation): string {
  const parts: string[] = [];
  if (loc.village) parts.push(loc.village);
  if (loc.lga && loc.lga !== loc.village) parts.push(loc.lga);
  if (loc.state) parts.push(loc.state);
  return parts.join(', ') || loc.country || 'Unknown location';
}
