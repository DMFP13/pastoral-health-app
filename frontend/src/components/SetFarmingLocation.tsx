/**
 * SetFarmingLocation — lets the user specify where their farm/herd is located.
 * This is explicitly decoupled from the browser's GPS position.
 */
import { useState } from 'react';
import { MapPin, Navigation, Check, ChevronDown } from 'lucide-react';
import type { UserLocation } from '../types';
import {
  NIGERIAN_STATES, KENYAN_COUNTIES,
  saveFarmingLocation, getCurrentGPS,
} from '../utils/location';

const COUNTRIES = ['Nigeria', 'Kenya', 'Other'];

interface Props {
  current?: UserLocation | null;
  onSave:  (loc: UserLocation) => void;
  onBack:  () => void;
}

export function SetFarmingLocation({ current, onSave, onBack }: Props) {
  const [country, setCountry] = useState(current?.country ?? '');
  const [state,   setState]   = useState(current?.state   ?? '');
  const [lga,     setLga]     = useState(current?.lga     ?? '');
  const [village, setVillage] = useState(current?.village ?? '');
  const [gpsLat,  setGpsLat]  = useState(current?.lat);
  const [gpsLng,  setGpsLng]  = useState(current?.lng);
  const [gpsBusy, setGpsBusy] = useState(false);
  const [gpsOk,   setGpsOk]   = useState(!!(current?.lat && current?.source === 'gps'));
  const [error,   setError]   = useState('');

  const stateOptions: readonly string[] =
    country === 'Nigeria' ? NIGERIAN_STATES :
    country === 'Kenya'   ? KENYAN_COUNTIES :
    [];

  const handleGps = async () => {
    setGpsBusy(true);
    setError('');
    const coords = await getCurrentGPS();
    setGpsBusy(false);
    if (coords) {
      setGpsLat(coords.lat);
      setGpsLng(coords.lng);
      setGpsOk(true);
    } else {
      setError('Could not get GPS coordinates. Check browser permissions.');
    }
  };

  const handleSave = () => {
    if (!country) { setError('Please select a country.'); return; }
    const loc: UserLocation = {
      country,
      state:   state   || undefined,
      lga:     lga     || undefined,
      village: village || undefined,
      lat:     gpsLat,
      lng:     gpsLng,
      source:  gpsOk ? 'gps' : 'manual',
    };
    saveFarmingLocation(loc);
    onSave(loc);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(160deg, var(--brand-dark) 0%, var(--brand) 100%)',
        padding: '52px 20px 28px',
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'rgba(255,255,255,0.2)', border: 'none',
            borderRadius: 'var(--r-full)', padding: '6px 14px',
            color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            marginBottom: 16,
          }}
        >
          ← Back
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <MapPin size={22} color="white" />
          </div>
          <div>
            <div style={{ color: 'white', fontSize: 20, fontWeight: 800 }}>Farming Location</div>
            <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>
              Where your herd is kept
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Info note */}
        <div style={{
          background: 'var(--brand-tint)',
          borderRadius: 'var(--r-lg)',
          padding: '12px 14px',
          fontSize: 13,
          color: 'var(--brand)',
          lineHeight: 1.5,
        }}>
          Set your farming location even if you are currently in a different country.
          Vets, suppliers, alerts, and weather will all use this location.
        </div>

        {/* Country */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
            Country *
          </label>
          <div style={{ position: 'relative' }}>
            <select
              value={country}
              onChange={e => { setCountry(e.target.value); setState(''); setError(''); }}
              style={{
                width: '100%',
                padding: '12px 40px 12px 14px',
                borderRadius: 'var(--r-md)',
                border: '1.5px solid var(--border)',
                background: 'var(--surface)',
                fontSize: 15,
                color: country ? 'var(--text)' : 'var(--text-muted)',
                appearance: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="">Select country…</option>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown size={16} color="var(--text-muted)" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          </div>
        </div>

        {/* State / County */}
        {stateOptions.length > 0 && (
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              {country === 'Nigeria' ? 'State' : 'County'}
            </label>
            <div style={{ position: 'relative' }}>
              <select
                value={state}
                onChange={e => setState(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 40px 12px 14px',
                  borderRadius: 'var(--r-md)',
                  border: '1.5px solid var(--border)',
                  background: 'var(--surface)',
                  fontSize: 15,
                  color: state ? 'var(--text)' : 'var(--text-muted)',
                  appearance: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="">Select {country === 'Nigeria' ? 'state' : 'county'}…</option>
                {stateOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown size={16} color="var(--text-muted)" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>
          </div>
        )}

        {/* LGA (Nigeria only) */}
        {country === 'Nigeria' && (
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              LGA <span style={{ fontWeight: 400, opacity: 0.7 }}>(optional)</span>
            </label>
            <input
              type="text"
              value={lga}
              onChange={e => setLga(e.target.value)}
              placeholder="e.g. Chikun"
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '12px 14px',
                borderRadius: 'var(--r-md)',
                border: '1.5px solid var(--border)',
                background: 'var(--surface)',
                fontSize: 15, color: 'var(--text)',
              }}
            />
          </div>
        )}

        {/* Village */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
            Village / Town <span style={{ fontWeight: 400, opacity: 0.7 }}>(optional)</span>
          </label>
          <input
            type="text"
            value={village}
            onChange={e => setVillage(e.target.value)}
            placeholder="e.g. Ungwan Rimi"
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '12px 14px',
              borderRadius: 'var(--r-md)',
              border: '1.5px solid var(--border)',
              background: 'var(--surface)',
              fontSize: 15, color: 'var(--text)',
            }}
          />
        </div>

        {/* GPS option */}
        <div style={{
          background: 'var(--surface)',
          border: '1.5px solid var(--border)',
          borderRadius: 'var(--r-lg)',
          padding: '14px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Add GPS coordinates</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              {gpsOk
                ? `GPS set: ${gpsLat?.toFixed(4)}, ${gpsLng?.toFixed(4)}`
                : 'Helps match you to the nearest vets'}
            </div>
          </div>
          <button
            onClick={handleGps}
            disabled={gpsBusy}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: gpsOk ? '#F0FAF4' : 'var(--brand-tint)',
              color:      gpsOk ? 'var(--brand)' : 'var(--brand)',
              border:     gpsOk ? '1px solid #86EFAC' : '1px solid var(--brand-surface)',
              borderRadius: 'var(--r-md)',
              padding: '8px 14px',
              fontSize: 13, fontWeight: 600, cursor: gpsBusy ? 'wait' : 'pointer',
              flexShrink: 0,
            }}
          >
            {gpsOk ? <Check size={14} /> : <Navigation size={14} />}
            {gpsBusy ? 'Locating…' : gpsOk ? 'Got it' : 'Use GPS'}
          </button>
        </div>

        {error && (
          <div className="error-card">{error}</div>
        )}

        <button
          onClick={handleSave}
          className="btn btn-primary"
          style={{ marginTop: 4 }}
        >
          Save Farming Location
        </button>
      </div>
    </div>
  );
}
