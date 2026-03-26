/**
 * LocationSetup — first-use location capture.
 * Tries GPS first, falls back to manual entry.
 */
import { useState } from 'react';
import { MapPin, Navigation, PenLine } from 'lucide-react';
import type { UserLocation } from '../types';
import { getCurrentGPS, saveLocation } from '../utils/location';

interface Props { onComplete: (loc: UserLocation) => void; }
type Step = 'intro' | 'gps-loading' | 'manual';

export function LocationSetup({ onComplete }: Props) {
  const [step,     setStep]     = useState<Step>('intro');
  const [gpsError, setGpsError] = useState('');
  const [country,  setCountry]  = useState('Nigeria');
  const [state,    setState]    = useState('');
  const [lga,      setLga]      = useState('');
  const [village,  setVillage]  = useState('');
  const [error,    setError]    = useState('');

  const tryGPS = async () => {
    setStep('gps-loading');
    const coords = await getCurrentGPS();
    if (coords) {
      const loc: UserLocation = { lat: coords.lat, lng: coords.lng, country: 'Unknown' };
      saveLocation(loc);
      onComplete(loc);
    } else {
      setGpsError('GPS not available. Please enter your location.');
      setStep('manual');
    }
  };

  const submitManual = () => {
    if (!state.trim() && !village.trim()) {
      setError('Please enter at least your state or village.');
      return;
    }
    const loc: UserLocation = {
      country: country.trim() || undefined,
      state:   state.trim()   || undefined,
      lga:     lga.trim()     || undefined,
      village: village.trim() || undefined,
    };
    saveLocation(loc);
    onComplete(loc);
  };

  if (step === 'intro') {
    return (
      <div className="location-setup">
        <div className="location-setup-icon">
          <MapPin size={32} />
        </div>
        <div className="location-setup-title">Where are you?</div>
        <div className="location-setup-sub">
          Your location helps find nearby vets, suppliers, and local alerts from other farmers.
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button className="location-big-btn" onClick={tryGPS}>
            <div className="location-btn-icon"><Navigation size={20} /></div>
            <div>
              <div>Use My Location</div>
              <div className="location-btn-sub">Fastest — tap once</div>
            </div>
          </button>

          <button className="location-big-btn" style={{ borderColor: 'var(--brand)', color: 'var(--brand)' }}
            onClick={() => setStep('manual')}>
            <div className="location-btn-icon"><PenLine size={20} /></div>
            <div>
              <div>Enter Manually</div>
              <div className="location-btn-sub">Country, state, village</div>
            </div>
          </button>
        </div>

        <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 14, marginTop: 16, cursor: 'pointer' }}
          onClick={() => { saveLocation({}); onComplete({}); }}>
          Skip for now
        </button>
      </div>
    );
  }

  if (step === 'gps-loading') {
    return (
      <div className="location-setup">
        <div className="loading-screen" style={{ minHeight: 300 }}>
          <div className="loading-spinner" />
          <span>Getting your location...</span>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
            Allow location access when prompted
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="location-setup" style={{ alignItems: 'stretch', textAlign: 'left' }}>
      <div style={{ marginBottom: 20 }}>
        <div className="location-setup-title" style={{ fontSize: 22, textAlign: 'left' }}>Your Location</div>
        {gpsError && (
          <div style={{ fontSize: 13, color: 'var(--amber)', marginTop: 4 }}>{gpsError}</div>
        )}
      </div>

      <div className="form-group">
        <div className="form-label">Country *</div>
        <select className="form-input" value={country} onChange={e => setCountry(e.target.value)}>
          <option>Nigeria</option>
          <option>Kenya</option>
          <option>Other</option>
        </select>
      </div>
      <div className="form-group">
        <div className="form-label">State / County</div>
        <input className="form-input" placeholder="e.g. Kaduna, Nakuru"
          value={state} onChange={e => setState(e.target.value)} autoFocus />
      </div>
      <div className="form-group">
        <div className="form-label">LGA / District (optional)</div>
        <input className="form-input" placeholder="e.g. Kagarko LGA"
          value={lga} onChange={e => setLga(e.target.value)} />
      </div>
      <div className="form-group">
        <div className="form-label">Village (optional)</div>
        <input className="form-input" placeholder="e.g. Kagarko"
          value={village} onChange={e => setVillage(e.target.value)} />
      </div>

      {error && <div className="error-card">{error}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20, width: '100%' }}>
        <button className="btn btn-primary" onClick={submitManual}>Set My Location</button>
        <button className="btn btn-outline" onClick={tryGPS}>Try GPS instead</button>
        <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer' }}
          onClick={() => { saveLocation({}); onComplete({}); }}>
          Skip for now
        </button>
      </div>
    </div>
  );
}
