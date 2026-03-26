/**
 * FarmerOnboarding — first-launch flow.
 * Step 0: Language. Step 1: Welcome. Step 2: Identity + location. Step 3: Photo.
 */
import { useState } from 'react';
import { MapPin, Navigation, User, Phone, Camera, ChevronRight, X, Check } from 'lucide-react';
import { api } from '../api';
import type { Farmer, Language, UserLocation } from '../types/index';
import { getCurrentGPS, saveLocation } from '../utils/location';
import { setStoredLang } from '../i18n';
import { uploadPhoto, previewUrl } from '../utils/photo';

type Step = 'language' | 'welcome' | 'identity' | 'photo';

const LANGUAGES: { code: Language; label: string; native: string }[] = [
  { code: 'en', label: 'English',  native: 'English'  },
  { code: 'ha', label: 'Hausa',    native: 'Hausa'    },
  { code: 'ff', label: 'Fulfulde', native: 'Fulfulde' },
  { code: 'yo', label: 'Yoruba',   native: 'Yoruba'   },
  { code: 'ig', label: 'Igbo',     native: 'Igbo'     },
];

interface Props {
  onComplete: (farmer: Farmer, location: UserLocation) => void;
  onSkip:     (location: UserLocation) => void;
}

const HDR = {
  background: 'linear-gradient(160deg, var(--brand-dark) 0%, var(--brand) 100%)',
  padding: '48px 24px 32px',
} as const;

export function FarmerOnboarding({ onComplete, onSkip }: Props) {
  const [step,     setStep]     = useState<Step>('language');
  const [lang,     setLangState] = useState<Language>('en');

  /* ── Identity ── */
  const [name,       setName]       = useState('');
  const [phone,      setPhone]      = useState('');
  const [country,    setCountry]    = useState('Nigeria');
  const [state,      setState]      = useState('');
  const [village,    setVillage]    = useState('');
  const [gpsCoords,  setGpsCoords]  = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [locError,   setLocError]   = useState('');
  const [formError,  setFormError]  = useState('');

  /* ── Photo ── */
  const [photoUrl,  setPhotoUrl]  = useState('');
  const [preview,   setPreview]   = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [photoErr,  setPhotoErr]  = useState('');

  /* ── Submit ── */
  const [saving,  setSaving]  = useState(false);
  const [saveErr, setSaveErr] = useState('');

  const pickLang = (code: Language) => {
    setLangState(code);
    setStoredLang(code);
    setStep('welcome');
  };

  const tryGPS = async () => {
    setGpsLoading(true);
    setLocError('');
    const coords = await getCurrentGPS();
    setGpsLoading(false);
    if (coords) {
      setGpsCoords(coords);
      setState('');
      setVillage('');
    } else {
      setLocError('GPS unavailable — enter your location below.');
    }
  };

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
      setPhotoErr('Upload failed — you can add a photo later.');
    } finally {
      setUploading(false);
    }
  };

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

  const submit = async (skipPhoto = false) => {
    setSaving(true);
    setSaveErr('');
    const loc: UserLocation = gpsCoords
      ? { lat: gpsCoords.lat, lng: gpsCoords.lng, country }
      : { country: country.trim() || undefined, state: state.trim() || undefined, village: village.trim() || undefined };
    try {
      const farmer = await api.farmers.create({
        name:    name.trim(),
        phone:   phone.trim(),
        country: loc.country ?? 'Nigeria',
        state:   loc.state,
        village: loc.village,
        photo_url:          (!skipPhoto && photoUrl) ? photoUrl : undefined,
        preferred_language: lang,
      });
      localStorage.setItem('pastoral_farmer_id',   String(farmer.id));
      localStorage.setItem('pastoral_farmer_name', farmer.name);
      saveLocation(loc);
      onComplete(farmer, loc);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSaveErr(msg.includes('400')
        ? 'Phone already registered — try a different number.'
        : 'Could not save. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  const skipAll = () => {
    const loc: UserLocation = { country: 'Nigeria' };
    saveLocation(loc);
    onSkip(loc);
  };

  /* ════════ STEP: language ════════ */
  if (step === 'language') {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--brand-dark)' }}>
        <div style={{ ...HDR, padding: '56px 24px 36px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: 'white', fontSize: 30, fontWeight: 800, letterSpacing: -0.5, marginBottom: 8 }}>
            PastoralHealth
          </div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, marginBottom: 40 }}>
            Choose your language
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%', maxWidth: 340 }}>
            {LANGUAGES.map(l => (
              <button
                key={l.code}
                onClick={() => pickLang(l.code)}
                style={{
                  background: lang === l.code ? 'white' : 'rgba(255,255,255,0.12)',
                  border: 'none',
                  borderRadius: 'var(--r-xl)',
                  padding: '20px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  transition: 'all .15s',
                }}
              >
                <span style={{ fontSize: 17, fontWeight: 700, color: lang === l.code ? 'var(--brand-dark)' : 'white' }}>
                  {l.native}
                </span>
                <span style={{ fontSize: 12, color: lang === l.code ? 'var(--brand)' : 'rgba(255,255,255,0.6)' }}>
                  {l.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: '0 24px 48px', textAlign: 'center' }}>
          <button
            onClick={skipAll}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 14, cursor: 'pointer' }}
          >
            Skip for now
          </button>
        </div>
      </div>
    );
  }

  /* ════════ STEP: welcome ════════ */
  if (step === 'welcome') {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
        <div style={{ ...HDR, padding: '64px 32px 48px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16 }}>
          <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MapPin size={30} color="white" />
          </div>
          <div style={{ color: 'white', fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>
            PastoralHealth
          </div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 1.5, maxWidth: 260 }}>
            Track your herd, check animal health, and connect with nearby farmers.
          </div>
        </div>

        <div style={{ padding: '32px 24px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '16px' }}
            onClick={() => setStep('identity')}
          >
            Create My Profile
            <ChevronRight size={18} />
          </button>
          <button className="btn btn-outline" onClick={skipAll}>
            Skip — use without profile
          </button>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 4, lineHeight: 1.4 }}>
            A profile lets you post alerts and be found by nearby farmers.
          </div>
        </div>
      </div>
    );
  }

  /* ════════ STEP: identity ════════ */
  if (step === 'identity') {
    return (
      <div style={{ minHeight: '100dvh', background: 'var(--bg)', paddingBottom: 40 }}>
        <div style={HDR}>
          <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, marginBottom: 4 }}>Step 1 of 2</div>
          <div style={{ color: 'white', fontSize: 22, fontWeight: 800 }}>About you</div>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 4 }}>
            Your name and location help neighbours find and trust you.
          </div>
        </div>

        <div style={{ padding: '20px 20px 0' }}>
          <div className="form-group">
            <div className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <User size={13} /> Your name
            </div>
            <input className="form-input" placeholder="Full name" value={name}
              onChange={e => setName(e.target.value)} autoFocus />
          </div>

          <div className="form-group">
            <div className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Phone size={13} /> Phone number
            </div>
            <input className="form-input" placeholder="+234 800 000 0000" value={phone}
              onChange={e => setPhone(e.target.value)} type="tel" />
          </div>

          <div className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <MapPin size={13} /> Your location
          </div>

          <button className="btn btn-outline"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 }}
            onClick={tryGPS} disabled={gpsLoading}>
            <Navigation size={15} />
            {gpsLoading ? 'Getting location...' : gpsCoords ? (
              <><Check size={15} /> GPS location set</>
            ) : 'Use GPS (fastest)'}
          </button>

          {locError && <div style={{ fontSize: 12, color: 'var(--amber)', marginBottom: 8 }}>{locError}</div>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <div className="form-label">Country</div>
              <select className="form-input" value={country} onChange={e => setCountry(e.target.value)}>
                <option>Nigeria</option><option>Kenya</option><option>Other</option>
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

          {formError && <div className="error-card" style={{ marginTop: 10 }}>{formError}</div>}

          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button className="btn btn-primary" onClick={goToPhoto}>
              Continue <ChevronRight size={16} style={{ marginLeft: 4 }} />
            </button>
            <button onClick={skipAll}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer', padding: '8px 0' }}>
              Skip profile setup
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ════════ STEP: photo ════════ */
  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', paddingBottom: 40 }}>
      <div style={HDR}>
        <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, marginBottom: 4 }}>Step 2 of 2</div>
        <div style={{ color: 'white', fontSize: 22, fontWeight: 800 }}>Add your photo</div>
        <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 4 }}>
          Helps farmers recognise you in the community feed.
        </div>
      </div>

      <div style={{ padding: '28px 20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        {/* Avatar */}
        <div style={{ position: 'relative' }}>
          <div style={{
            width: 110, height: 110, borderRadius: '50%',
            background: preview ? 'transparent' : 'var(--brand-tint)',
            border: `3px solid ${preview ? 'var(--brand)' : 'var(--border)'}`,
            overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {preview
              ? <img src={preview} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <User size={38} color="var(--brand)" />}
          </div>
          {preview && (
            <button onClick={() => { setPreview(null); setPhotoUrl(''); }} style={{
              position: 'absolute', top: 0, right: 0, width: 26, height: 26, borderRadius: '50%',
              background: '#DC2626', border: 'none', display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer', color: 'white',
            }}>
              <X size={13} />
            </button>
          )}
        </div>

        <label style={{
          display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)',
          border: '1.5px solid var(--border)', borderRadius: 'var(--r-lg)',
          padding: '12px 20px', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: 'var(--brand)',
        }}>
          <Camera size={18} />
          {uploading ? 'Uploading...' : preview ? 'Change Photo' : 'Take or Upload Photo'}
          <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handlePhoto(f); }} />
        </label>

        {photoErr  && <div style={{ fontSize: 12, color: 'var(--amber)', textAlign: 'center' }}>{photoErr}</div>}
        {saveErr   && <div className="error-card" style={{ width: '100%' }}>{saveErr}</div>}

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
          <button className="btn btn-primary" onClick={() => submit(false)} disabled={saving || uploading}>
            {saving ? 'Creating profile...' : 'Finish Setup'}
          </button>
          <button className="btn btn-outline" onClick={() => submit(true)} disabled={saving}>
            Skip photo
          </button>
        </div>

        <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5, margin: 0 }}>
          You can update your photo anytime from your profile in the More tab.
        </p>
      </div>
    </div>
  );
}
