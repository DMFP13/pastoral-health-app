/**
 * FarmerOnboarding — first-launch screen.
 * Step 1: Welcome. Step 2: Identity + location. Step 3: Optional photo.
 * Creates a Farmer record on completion; supports Skip to location-only mode.
 */
import { useState } from 'react';
import { MapPin, Navigation, User, Phone, Camera, ChevronRight, X } from 'lucide-react';
import { api } from '../api';
import type { Farmer, UserLocation } from '../types/index';
import { getCurrentGPS, saveLocation } from '../utils/location';
import { uploadPhoto, previewUrl } from '../utils/photo';

type Step = 'welcome' | 'identity' | 'photo';

interface Props {
  onComplete: (farmer: Farmer, location: UserLocation) => void;
  onSkip:     (location: UserLocation) => void;
}

export function FarmerOnboarding({ onComplete, onSkip }: Props) {
  const [step, setStep] = useState<Step>('welcome');

  /* ── Identity form ── */
  const [name,    setName]    = useState('');
  const [phone,   setPhone]   = useState('');
  const [country, setCountry] = useState('Nigeria');
  const [state,   setState]   = useState('');
  const [village, setVillage] = useState('');
  const [locError, setLocError] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [formError, setFormError] = useState('');

  /* ── Photo ── */
  const [photoUrl,  setPhotoUrl]  = useState('');
  const [preview,   setPreview]   = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [photoErr,  setPhotoErr]  = useState('');

  /* ── Submit ── */
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState('');

  /* ── GPS helper ── */
  const tryGPS = async () => {
    setGpsLoading(true);
    setLocError('');
    const coords = await getCurrentGPS();
    setGpsLoading(false);
    if (coords) {
      // GPS gives lat/lng only; country stays as default
      setState('');
      setVillage('');
      setLocError('');
      // store coords for final submission
      _setGpsCoords(coords);
    } else {
      setLocError('GPS unavailable — enter your location below.');
    }
  };

  const [gpsCoords, _setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);

  /* ── Photo file handler ── */
  const handlePhoto = async (file: File) => {
    setPhotoErr('');
    const local = previewUrl(file);
    setPreview(local);
    setUploading(true);
    try {
      const url = await uploadPhoto(file, () => {});
      URL.revokeObjectURL(local);
      setPreview(url);
      setPhotoUrl(url);
    } catch {
      setPhotoErr('Upload failed — you can add a photo later in your profile.');
    } finally {
      setUploading(false);
    }
  };

  /* ── Proceed from identity step ── */
  const goToPhoto = () => {
    setFormError('');
    if (!name.trim() || !phone.trim()) {
      setFormError('Name and phone are required.');
      return;
    }
    if (!gpsCoords && !state.trim() && !village.trim()) {
      setFormError('Please enter your state or village, or use GPS.');
      return;
    }
    setStep('photo');
  };

  /* ── Final submit ── */
  const submit = async (skipPhoto = false) => {
    setSaving(true);
    setSaveErr('');
    const loc: UserLocation = gpsCoords
      ? { lat: gpsCoords.lat, lng: gpsCoords.lng, country }
      : {
          country: country.trim() || undefined,
          state:   state.trim()   || undefined,
          village: village.trim() || undefined,
        };
    try {
      const farmer = await api.farmers.create({
        name:    name.trim(),
        phone:   phone.trim(),
        country: loc.country ?? 'Nigeria',
        state:   loc.state,
        village: loc.village,
        photo_url: (!skipPhoto && photoUrl) ? photoUrl : undefined,
        preferred_language: 'en',
      });
      localStorage.setItem('pastoral_farmer_id', String(farmer.id));
      saveLocation(loc);
      onComplete(farmer, loc);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSaveErr(msg.includes('400') ? 'Phone already registered — try a different number.' : 'Could not create profile. Check your connection.');
    } finally {
      setSaving(false);
    }
  };

  /* ── Skip entirely ── */
  const skipAll = () => {
    const loc: UserLocation = { country: 'Nigeria' };
    saveLocation(loc);
    onSkip(loc);
  };

  /* ════════════════════════════════════════════════════════════ */
  /* STEP: welcome                                               */
  /* ════════════════════════════════════════════════════════════ */
  if (step === 'welcome') {
    return (
      <div style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg)',
      }}>
        {/* Hero */}
        <div style={{
          background: 'linear-gradient(160deg, var(--brand-dark) 0%, var(--brand) 100%)',
          padding: '64px 32px 48px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 16,
        }}>
          <div style={{
            width: 72, height: 72,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(8px)',
          }}>
            <MapPin size={32} color="white" />
          </div>
          <div style={{ color: 'white', fontSize: 28, fontWeight: 800, letterSpacing: -0.5 }}>
            PastoralHealth
          </div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15, lineHeight: 1.5, maxWidth: 280 }}>
            Connect with nearby farmers, track your herd, and get animal health guidance.
          </div>
        </div>

        {/* CTAs */}
        <div style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
            Let's get you set up
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 8, lineHeight: 1.5 }}>
            Create a profile so other farmers know who you are when you post or ask for help.
          </div>

          <button
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            onClick={() => setStep('identity')}
          >
            Create My Profile
            <ChevronRight size={18} />
          </button>

          <button className="btn btn-outline" onClick={skipAll}>
            Skip for now
          </button>

          <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8, lineHeight: 1.4 }}>
            You can create a profile later from the More tab.
          </div>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════ */
  /* STEP: identity                                              */
  /* ════════════════════════════════════════════════════════════ */
  if (step === 'identity') {
    return (
      <div style={{ minHeight: '100dvh', background: 'var(--bg)', paddingBottom: 40 }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(160deg, var(--brand-dark) 0%, var(--brand) 100%)',
          padding: '48px 24px 32px',
        }}>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 6 }}>Step 1 of 2</div>
          <div style={{ color: 'white', fontSize: 22, fontWeight: 800 }}>About you</div>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, marginTop: 6 }}>
            Your name and location help neighbours find and trust you.
          </div>
        </div>

        <div style={{ padding: '24px 20px 0' }}>

          {/* Name */}
          <div className="form-group">
            <div className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <User size={14} /> Your name
            </div>
            <input
              className="form-input"
              placeholder="Full name"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Phone */}
          <div className="form-group">
            <div className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Phone size={14} /> Phone number
            </div>
            <input
              className="form-input"
              placeholder="+234 800 000 0000"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              type="tel"
            />
          </div>

          {/* Location */}
          <div style={{ marginTop: 4, marginBottom: 4 }}>
            <div className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={14} /> Your location
            </div>

            <button
              className="btn btn-outline"
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}
              onClick={tryGPS}
              disabled={gpsLoading}
            >
              <Navigation size={16} />
              {gpsLoading ? 'Getting location...' : gpsCoords ? 'GPS location set' : 'Use GPS'}
            </button>

            {locError && <div style={{ fontSize: 13, color: 'var(--amber)', marginBottom: 8 }}>{locError}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <div className="form-label">Country</div>
                <select className="form-input" value={country} onChange={e => setCountry(e.target.value)}>
                  <option>Nigeria</option>
                  <option>Kenya</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <div className="form-label">State</div>
                <input className="form-input" placeholder="e.g. Kaduna" value={state} onChange={e => setState(e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
                <div className="form-label">Village (optional)</div>
                <input className="form-input" placeholder="e.g. Kagarko" value={village} onChange={e => setVillage(e.target.value)} />
              </div>
            </div>
          </div>

          {formError && <div className="error-card" style={{ marginTop: 12 }}>{formError}</div>}

          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button className="btn btn-primary" onClick={goToPhoto}>
              Continue
              <ChevronRight size={18} style={{ marginLeft: 4 }} />
            </button>
            <button className="btn btn-ghost" onClick={skipAll} style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              Skip profile setup
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════ */
  /* STEP: photo                                                 */
  /* ════════════════════════════════════════════════════════════ */
  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', paddingBottom: 40 }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(160deg, var(--brand-dark) 0%, var(--brand) 100%)',
        padding: '48px 24px 32px',
      }}>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 6 }}>Step 2 of 2</div>
        <div style={{ color: 'white', fontSize: 22, fontWeight: 800 }}>Add your photo</div>
        <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, marginTop: 6 }}>
          A photo helps farmers recognise you in the community feed.
        </div>
      </div>

      <div style={{ padding: '32px 20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>

        {/* Photo circle */}
        <div style={{ position: 'relative' }}>
          <div style={{
            width: 120, height: 120,
            borderRadius: '50%',
            background: preview ? 'transparent' : 'var(--brand-tint)',
            border: `3px solid ${preview ? 'var(--brand)' : 'var(--border)'}`,
            overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {preview
              ? <img src={preview} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <User size={40} color="var(--brand)" />
            }
          </div>
          {preview && (
            <button
              onClick={() => { setPreview(null); setPhotoUrl(''); }}
              style={{
                position: 'absolute', top: 0, right: 0,
                width: 28, height: 28, borderRadius: '50%',
                background: '#DC2626', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'white',
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Upload button */}
        <label style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--surface)',
          border: '1.5px solid var(--border)',
          borderRadius: 'var(--r-lg)',
          padding: '12px 20px',
          cursor: 'pointer',
          fontSize: 15,
          fontWeight: 600,
          color: 'var(--brand)',
        }}>
          <Camera size={20} />
          {uploading ? 'Uploading...' : preview ? 'Change Photo' : 'Take or Upload Photo'}
          <input
            type="file" accept="image/*" capture="environment"
            style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handlePhoto(f); }}
          />
        </label>

        {photoErr && (
          <div style={{ fontSize: 13, color: 'var(--amber)', textAlign: 'center' }}>{photoErr}</div>
        )}

        {saveErr && <div className="error-card" style={{ width: '100%' }}>{saveErr}</div>}

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
          <button className="btn btn-primary" onClick={() => submit(false)} disabled={saving || uploading}>
            {saving ? 'Creating profile...' : 'Finish Setup'}
          </button>
          <button className="btn btn-outline" onClick={() => submit(true)} disabled={saving}>
            Skip photo
          </button>
        </div>

        <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5, maxWidth: 280 }}>
          You can update your photo anytime from your profile in the More tab.
        </div>
      </div>
    </div>
  );
}
