/**
 * FarmerProfile — create or view/edit the current farmer's profile.
 */
import { useState, useEffect } from 'react';
import { MapPin, Phone, Shield, MessageCircle, Edit3 } from 'lucide-react';
import { api } from '../api';
import type { Farmer, Language, UserLocation } from '../types';
import { setStoredLang } from '../i18n';
import { saveLocation } from '../utils/location';
import { PhotoCapture } from './PhotoCapture';

const PROFILE_KEY = 'pastoral_farmer_id';

const LANGUAGES: { code: Language; label: string; native: string }[] = [
  { code: 'en', label: 'English',  native: 'English'  },
  { code: 'ha', label: 'Hausa',    native: 'Hausa'    },
  { code: 'ff', label: 'Fulfulde', native: 'Fulfulde' },
  { code: 'yo', label: 'Yoruba',   native: 'Yoruba'   },
  { code: 'ig', label: 'Igbo',     native: 'Igbo'     },
];

interface Props {
  onLangChange?:    (lang: Language) => void;
  onLocationSaved?: (loc: UserLocation) => void;
  onFarmerSaved?:   (farmer: Farmer) => void;
}

export function FarmerProfile({ onLangChange, onLocationSaved, onFarmerSaved }: Props) {
  const [farmer,   setFarmer]   = useState<Farmer | null>(null);
  const [editing,  setEditing]  = useState(false);
  const [creating, setCreating] = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');

  const [form, setForm] = useState({
    phone: '', name: '', village: '', lga: '', state: '', country: 'Nigeria',
    preferred_language: 'en' as Language,
    herd_name: '', herd_size: '',
    emergency_contact: '', insurance_provider: '',
    photo_url: '',
  });

  useEffect(() => {
    const stored = localStorage.getItem(PROFILE_KEY);
    if (!stored) { setLoading(false); setCreating(true); return; }
    api.farmers.get(Number(stored))
      .then(f => { setFarmer(f); populateForm(f); })
      .catch(() => { localStorage.removeItem(PROFILE_KEY); setCreating(true); })
      .finally(() => setLoading(false));
  }, []);

  const populateForm = (f: Farmer) => {
    setForm({
      phone:              f.phone,
      name:               f.name,
      village:            f.village            ?? '',
      lga:                f.lga                ?? '',
      state:              f.state              ?? '',
      country:            f.country            ?? 'Nigeria',
      preferred_language: (f.preferred_language as Language) ?? 'en',
      herd_name:          f.herd_name          ?? '',
      herd_size:          f.herd_size?.toString() ?? '',
      emergency_contact:  f.emergency_contact  ?? '',
      insurance_provider: f.insurance_provider ?? '',
      photo_url:          f.photo_url          ?? '',
    });
  };

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value }));

  const save = async () => {
    if (!form.phone.trim() || !form.name.trim()) {
      setError('Phone and name are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        herd_size: form.herd_size ? Number(form.herd_size) : undefined,
        photo_url: form.photo_url || undefined,
      };
      let saved: Farmer;
      if (farmer) {
        saved = await api.farmers.update(farmer.id, payload);
      } else {
        saved = await api.farmers.create(payload);
        localStorage.setItem(PROFILE_KEY, String(saved.id));
      }
      setFarmer(saved);
      populateForm(saved);
      setStoredLang(saved.preferred_language as Language ?? 'en');
      onLangChange?.(saved.preferred_language as Language ?? 'en');
      onFarmerSaved?.(saved);
      const loc: UserLocation = {
        village: saved.village ?? undefined,
        lga:     saved.lga    ?? undefined,
        state:   saved.state  ?? undefined,
        country: saved.country ?? undefined,
      };
      saveLocation(loc);
      onLocationSaved?.(loc);
      setEditing(false);
      setCreating(false);
      setSuccess('Profile saved!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg.includes('400') ? 'Phone number already registered.' : 'Could not save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading-screen"><div className="loading-spinner" /></div>;
  }

  /* ── Create / Edit form ─────────────────────────────────── */
  if (creating || editing) {
    return (
      <div style={{ paddingBottom: 32 }}>
        {editing && (
          <div className="back-bar">
            <button className="back-bar-btn" onClick={() => setEditing(false)}>← Back</button>
          </div>
        )}
        <div style={{ padding: '20px 16px 0' }}>
          <div className="screen-title">{farmer ? 'Edit Profile' : 'Create Profile'}</div>
          <div className="screen-subtitle">{farmer ? 'Update your details' : 'Set up your farmer profile'}</div>
        </div>

        <div className="section-label">Profile Photo</div>
        <div style={{ padding: '0 16px 4px' }}>
          {form.photo_url && (
            <img src={form.photo_url} alt="Profile"
              style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', marginBottom: 10, border: '3px solid var(--brand-surface)' }}
            />
          )}
          <PhotoCapture
            label="Take or upload your photo"
            currentUrl={form.photo_url || undefined}
            onUploaded={url => setForm(prev => ({ ...prev, photo_url: url }))}
            onClear={() => setForm(prev => ({ ...prev, photo_url: '' }))}
          />
        </div>

        <div style={{ padding: '0 16px' }}>
          <div className="form-group">
            <div className="form-label">Phone number *</div>
            <input className="form-input" placeholder="+234-800-000-0000" value={form.phone} onChange={set('phone')} />
          </div>
          <div className="form-group">
            <div className="form-label">Your name *</div>
            <input className="form-input" placeholder="Full name" value={form.name} onChange={set('name')} />
          </div>
        </div>

        <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div className="form-group">
            <div className="form-label">Village</div>
            <input className="form-input" placeholder="Your village" value={form.village} onChange={set('village')} />
          </div>
          <div className="form-group">
            <div className="form-label">LGA</div>
            <input className="form-input" placeholder="LGA" value={form.lga} onChange={set('lga')} />
          </div>
          <div className="form-group">
            <div className="form-label">State</div>
            <input className="form-input" placeholder="State / County" value={form.state} onChange={set('state')} />
          </div>
          <div className="form-group">
            <div className="form-label">Country</div>
            <select className="form-input" value={form.country} onChange={set('country')}>
              <option>Nigeria</option>
              <option>Kenya</option>
              <option>Other</option>
            </select>
          </div>
        </div>

        <div className="section-label">Herd details</div>
        <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div className="form-group">
            <div className="form-label">Herd name</div>
            <input className="form-input" placeholder="e.g. Suleiman Herd" value={form.herd_name} onChange={set('herd_name')} />
          </div>
          <div className="form-group">
            <div className="form-label">Herd size</div>
            <input className="form-input" type="number" placeholder="Number of animals" value={form.herd_size} onChange={set('herd_size')} />
          </div>
        </div>

        <div className="section-label">Language</div>
        <div className="lang-grid">
          {LANGUAGES.map(l => (
            <button key={l.code}
              className={`lang-btn ${form.preferred_language === l.code ? 'selected' : ''}`}
              onClick={() => setForm(prev => ({ ...prev, preferred_language: l.code }))}>
              <span className="lang-native">{l.native}</span>
              <span className="lang-label">{l.label}</span>
            </button>
          ))}
        </div>

        <div style={{ padding: '0 16px' }}>
          <div className="form-group" style={{ marginTop: 8 }}>
            <div className="form-label">Emergency contact</div>
            <input className="form-input" placeholder="+234-800-000-0000" value={form.emergency_contact} onChange={set('emergency_contact')} />
          </div>
          <div className="form-group">
            <div className="form-label">Insurance provider (optional)</div>
            <input className="form-input" placeholder="e.g. NAIC" value={form.insurance_provider} onChange={set('insurance_provider')} />
          </div>

          {error && <div className="error-card" style={{ marginTop: 12 }}>{error}</div>}

          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button className="btn btn-primary" disabled={saving} onClick={save}>
              {saving ? 'Saving...' : farmer ? 'Save Changes' : 'Create Profile'}
            </button>
            {editing && (
              <button className="btn btn-outline" onClick={() => setEditing(false)}>Cancel</button>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── Profile view ───────────────────────────────────────── */
  if (farmer) {
    const lang = LANGUAGES.find(l => l.code === farmer.preferred_language);
    return (
      <div style={{ paddingBottom: 32 }}>
        {success && <div className="success-banner" style={{ margin: '0 16px 12px' }}>{success}</div>}

        {/* Hero */}
        <div className="profile-hero">
          <div className="profile-avatar-large">
            {farmer.photo_url
              ? <img src={farmer.photo_url} alt={farmer.name} />
              : farmer.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="profile-name">{farmer.name}</div>
            {farmer.village && (
              <div className="profile-loc" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={12} />
                {farmer.village}{farmer.state ? `, ${farmer.state}` : ''}
              </div>
            )}
            {farmer.verified && (
              <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.18)', borderRadius: 999, padding: '3px 10px', fontSize: 12, fontWeight: 700 }}>
                <Shield size={12} /> Verified
              </div>
            )}
          </div>
        </div>

        {/* Chat stub */}
        <div className="chat-coming-soon">
          <div style={{ width: 40, height: 40, borderRadius: 'var(--r-md)', background: 'var(--brand-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)', flexShrink: 0 }}>
            <MessageCircle size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>Direct messaging — coming soon</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              You will be able to message other farmers directly
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="profile-stats-grid">
          {farmer.herd_name && (
            <div className="profile-stat">
              <div className="profile-stat-val">{farmer.herd_name}</div>
              <div className="profile-stat-key">Herd name</div>
            </div>
          )}
          {farmer.herd_size != null && (
            <div className="profile-stat">
              <div className="profile-stat-val">{farmer.herd_size}</div>
              <div className="profile-stat-key">Animals</div>
            </div>
          )}
          {farmer.country && (
            <div className="profile-stat">
              <div className="profile-stat-val">{farmer.country}</div>
              <div className="profile-stat-key">Country</div>
            </div>
          )}
          {lang && (
            <div className="profile-stat">
              <div className="profile-stat-val">{lang.native}</div>
              <div className="profile-stat-key">Language</div>
            </div>
          )}
        </div>

        {/* Contact */}
        <div className="section-label">Contact</div>
        <div className="info-card">
          <div className="info-row">
            <div className="info-row-icon"><Phone size={16} /></div>
            <span>{farmer.phone}</span>
          </div>
          {farmer.emergency_contact && (
            <div className="info-row">
              <div className="info-row-icon"><Phone size={16} /></div>
              <span>Emergency: {farmer.emergency_contact}</span>
            </div>
          )}
          {farmer.insurance_provider && (
            <div className="info-row">
              <div className="info-row-icon"><Shield size={16} /></div>
              <span>{farmer.insurance_provider}</span>
            </div>
          )}
        </div>

        {/* Language */}
        <div className="section-label">Language</div>
        <div className="lang-grid">
          {LANGUAGES.map(l => (
            <button key={l.code}
              className={`lang-btn ${(farmer.preferred_language ?? 'en') === l.code ? 'selected' : ''}`}
              onClick={async () => {
                try {
                  const updated = await api.farmers.update(farmer.id, { preferred_language: l.code });
                  setFarmer(updated);
                  setStoredLang(l.code);
                  onLangChange?.(l.code);
                } catch { /* offline */ }
              }}>
              <span className="lang-native">{l.native}</span>
              <span className="lang-label">{l.label}</span>
            </button>
          ))}
        </div>

        <div style={{ padding: '8px 16px 0' }}>
          <button className="btn btn-outline" onClick={() => setEditing(true)}>
            <Edit3 size={16} /> Edit Profile
          </button>
        </div>
      </div>
    );
  }

  return null;
}
