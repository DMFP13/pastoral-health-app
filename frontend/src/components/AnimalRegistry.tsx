import { useState, useEffect, useCallback } from 'react';
import {
  Beef, Stethoscope, FileText, Search, Plus, ArrowLeft,
  AlertTriangle, Calendar, Thermometer, Share2, Camera,
  Activity, Syringe, Heart, Tag, QrCode,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../api';
import type { Animal, AnimalEvent } from '../types';
import { PhotoCapture } from './PhotoCapture';

const SPECIES_OPTIONS = ['Cattle', 'Sheep', 'Goats', 'Pigs', 'Buffalo', 'Other'];

/* ── Event type visual config ────────────────────────────── */
const EVENT_CFG: Record<string, { color: string; bg: string; label: string; Icon: React.ElementType }> = {
  illness:    { color: '#DC2626', bg: '#FEF2F2', label: 'Illness',    Icon: Activity  },
  treatment:  { color: '#0369A1', bg: '#EFF6FF', label: 'Treatment',  Icon: FileText  },
  vaccination:{ color: '#2D6A4F', bg: '#D8F3DC', label: 'Vaccination',Icon: Syringe   },
  birth:      { color: '#7C3AED', bg: '#F5F3FF', label: 'Birth',      Icon: Heart     },
  injury:     { color: '#EA580C', bg: '#FFF7ED', label: 'Injury',     Icon: AlertTriangle },
  heat:       { color: '#D97706', bg: '#FFFBEB', label: 'Heat',       Icon: Thermometer },
  sale:       { color: '#0891B2', bg: '#ECFEFF', label: 'Sale',       Icon: Tag       },
  death:      { color: '#71717A', bg: '#F4F4F5', label: 'Death',      Icon: FileText  },
  other:      { color: '#6B7280', bg: '#F9FAFB', label: 'Other',      Icon: FileText  },
};

function formatDate(d?: string) {
  if (!d) return '';
  try {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch { return d; }
}

function daysAgo(d?: string): string {
  if (!d) return '';
  const diff = Math.floor((Date.now() - new Date(d + 'T00:00:00').getTime()) / 86400000);
  if (diff === 0) return 'today';
  if (diff === 1) return '1 day ago';
  return `${diff} days ago`;
}

function isOverdue(dateStr?: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr + 'T23:59:59') < new Date();
}

/* ── Health badge ────────────────────────────────────────── */
function healthStatus(events: AnimalEvent[]): { dot: string; label: string; color: string } {
  if (!events.length) return { dot: 'dot-gray', label: 'No history', color: 'var(--text-muted)' };
  const latest = events[0];
  if (latest.risk_level === 'emergency') return { dot: 'dot-red',   label: 'Emergency', color: '#DC2626' };
  if (latest.risk_level === 'high')      return { dot: 'dot-red',   label: 'High Risk',  color: '#DC2626' };
  if (latest.risk_level === 'moderate')  return { dot: 'dot-amber', label: 'Monitoring', color: '#D97706' };
  return { dot: 'dot-green', label: 'Healthy', color: 'var(--brand)' };
}

interface Props {
  onLogEvent?:    (animalId: number, animalTag: string) => void;
  onCheckAnimal?: (species: string) => void;
  onShare?:       (animal: Animal) => void;
  initialId?:     number;
}

type View = 'list' | 'detail' | 'add';

/* ─────────────────────────────────────────────────────────── */
export function AnimalRegistry({ onLogEvent, onCheckAnimal, onShare, initialId }: Props) {
  const [view,      setView]      = useState<View>('list');
  const [animals,   setAnimals]   = useState<Animal[]>([]);
  const [selected,  setSelected]  = useState<Animal | null>(null);
  const [events,    setEvents]    = useState<AnimalEvent[]>([]);
  const [search,    setSearch]    = useState('');
  const [loading,   setLoading]   = useState(false);
  const [evLoading, setEvLoading] = useState(false);
  const [error,     setError]     = useState('');

  const [form, setForm] = useState({
    animal_tag: '', species: 'Cattle', sex: 'Female', breed: '',
    approximate_age: '', owner_name: '', herd_name: '',
    village: '', country: '', notes: '',
  });
  const [photoUrl,      setPhotoUrl]      = useState('');
  const [saving,        setSaving]        = useState(false);
  const [formError,     setFormError]     = useState('');
  const [photoUpdating, setPhotoUpdating] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.animals.list({ search: search || undefined })
      .then(setAnimals)
      .catch(() => setError('Could not load animals.'))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (initialId && animals.length) {
      const a = animals.find(x => x.id === initialId);
      if (a) openDetail(a);
    }
  }, [initialId, animals]); // eslint-disable-line react-hooks/exhaustive-deps

  const openDetail = (a: Animal) => {
    setSelected(a);
    setView('detail');
    setEvLoading(true);
    api.events.list(a.id)
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setEvLoading(false));
  };

  const updateAnimalPhoto = async (url: string) => {
    if (!selected) return;
    setPhotoUpdating(true);
    try {
      const updated = await api.animals.update(selected.id, { photo_url: url });
      setSelected(updated);
      setAnimals(prev => prev.map(a => a.id === updated.id ? { ...a, photo_url: updated.photo_url } : a));
    } catch { /* silently ignore */ }
    finally { setPhotoUpdating(false); }
  };

  const saveAnimal = async () => {
    if (!form.animal_tag.trim()) { setFormError('Tag is required'); return; }
    if (!form.owner_name.trim()) { setFormError('Owner name is required'); return; }
    setSaving(true); setFormError('');
    try {
      await api.animals.create({
        animal_tag:      form.animal_tag,
        species:         form.species,
        breed:           form.breed           || undefined,
        sex:             form.sex,
        approximate_age: form.approximate_age || undefined,
        owner_name:      form.owner_name,
        herd_name:       form.herd_name       || undefined,
        village:         form.village         || undefined,
        country:         form.country         || undefined,
        notes:           form.notes           || undefined,
        photo_url:       photoUrl             || undefined,
      } as Omit<Animal, 'id' | 'created_at' | 'events'>);
      setForm({ animal_tag: '', species: 'Cattle', sex: 'Female', breed: '',
                approximate_age: '', owner_name: '', herd_name: '', village: '', country: '', notes: '' });
      setPhotoUrl('');
      setView('list'); load();
    } catch (e: unknown) {
      setFormError(e instanceof Error && e.message.includes('400')
        ? 'That tag already exists.' : 'Could not save. Try again.');
    } finally { setSaving(false); }
  };

  /* ═══════════════════════════════════════════════════════════
     PASSPORT / DETAIL VIEW
  ═══════════════════════════════════════════════════════════ */
  if (view === 'detail' && selected) {
    const hs = healthStatus(events);
    const overdueFollowUp = events.find(e => isOverdue(e.follow_up_date) && !e.outcome);
    const today = new Date().toISOString().split('T')[0];
    const upcomingFollowUp = !overdueFollowUp && events.find(e =>
      e.follow_up_date && e.follow_up_date >= today && !e.outcome
    );
    const vaccinationEvents = events.filter(e => e.event_type === 'vaccination');

    return (
      <div style={{ paddingBottom: 32 }}>

        {/* ── Passport hero ── */}
        <div style={{
          background: 'linear-gradient(160deg, var(--brand-dark) 0%, var(--brand) 100%)',
          padding: '48px 16px 24px',
        }}>
          <button
            onClick={() => setView('list')}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 'var(--r-full)', padding: '6px 14px', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 16 }}
          >
            ← Back
          </button>

          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            {/* Photo or avatar with change-photo overlay */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: 68, height: 68, borderRadius: 'var(--r-lg)',
                background: 'rgba(255,255,255,0.15)',
                overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {selected.photo_url
                  ? <img src={selected.photo_url} alt={selected.animal_tag} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <Beef size={32} color="white" />
                }
              </div>
              <div style={{
                position: 'absolute', bottom: -4, right: -4,
                width: 24, height: 24, borderRadius: '50%',
                background: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                pointerEvents: 'none',
              }}>
                {photoUpdating
                  ? <div style={{ width: 10, height: 10, borderRadius: '50%', border: '2px solid var(--brand)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                  : <Camera size={13} color="var(--brand)" />
                }
              </div>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: 'white', fontSize: 26, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.1 }}>
                {selected.animal_tag}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 3 }}>
                {[selected.species, selected.breed, selected.sex, selected.approximate_age]
                  .filter(Boolean).join(' · ')}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 1 }}>
                {selected.owner_name}
              </div>
            </div>
          </div>

          {/* Health pill */}
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className={`health-dot ${hs.dot}`} style={{ width: 10, height: 10, flexShrink: 0 }} />
            <span style={{ color: 'white', fontSize: 14, fontWeight: 700 }}>{hs.label}</span>
            {events.length > 0 && (
              <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>
                · {events.length} event{events.length !== 1 ? 's' : ''} · last {daysAgo(events[0]?.event_date)}
              </span>
            )}
          </div>
        </div>

        {/* ── Alert: overdue follow-up ── */}
        {overdueFollowUp && (
          <div style={{
            margin: '12px 16px 0', padding: '12px 14px',
            background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--r-lg)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <AlertTriangle size={18} color="#DC2626" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#DC2626' }}>Follow-up overdue</div>
              <div style={{ fontSize: 12, color: '#7F1D1D' }}>
                {EVENT_CFG[overdueFollowUp.event_type]?.label ?? overdueFollowUp.event_type} · due {formatDate(overdueFollowUp.follow_up_date ?? undefined)}
              </div>
            </div>
            {onLogEvent && (
              <button
                onClick={() => onLogEvent(selected.id, selected.animal_tag)}
                style={{ background: '#DC2626', color: 'white', border: 'none', borderRadius: 'var(--r-md)', padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
              >
                Log now
              </button>
            )}
          </div>
        )}

        {/* ── Upcoming follow-up (not overdue) ── */}
        {upcomingFollowUp && (
          <div style={{
            margin: '12px 16px 0', padding: '10px 14px',
            background: '#F0FAF4', border: '1px solid #86EFAC', borderRadius: 'var(--r-lg)',
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 13, color: 'var(--brand)',
          }}>
            <Calendar size={15} style={{ flexShrink: 0 }} />
            Follow-up due {formatDate(upcomingFollowUp.follow_up_date ?? undefined)}
          </div>
        )}

        {/* ── Quick actions ── */}
        <div style={{ padding: '12px 16px 0', display: 'flex', gap: 8 }}>
          {onCheckAnimal && (
            <button className="btn btn-outline btn-sm" style={{ flex: 1 }}
              onClick={() => onCheckAnimal(selected.species)}>
              <Stethoscope size={15} /> Check
            </button>
          )}
          {onLogEvent && (
            <button className="btn btn-primary btn-sm" style={{ flex: 1 }}
              onClick={() => onLogEvent(selected.id, selected.animal_tag)}>
              <FileText size={15} /> Log Event
            </button>
          )}
          {onShare && (
            <button className="btn btn-outline btn-sm" style={{ flexShrink: 0, padding: '0 14px' }}
              onClick={() => onShare(selected)}>
              <Share2 size={15} />
            </button>
          )}
        </div>

        {/* ── Animal photo update ── */}
        <div style={{ padding: '8px 16px 0' }}>
          <PhotoCapture
            label={selected.photo_url ? 'Change animal photo' : 'Add animal photo'}
            currentUrl={selected.photo_url ?? undefined}
            onUploaded={url => updateAnimalPhoto(url)}
            onClear={() => updateAnimalPhoto('')}
          />
        </div>

        {/* ── Passport details grid ── */}
        <div style={{ margin: '12px 16px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { label: 'Owner',       value: selected.owner_name },
            { label: 'Village',     value: selected.village   || '—' },
            { label: 'Herd',        value: selected.herd_name || '—' },
            { label: 'Events',      value: String(events.length) },
            ...(vaccinationEvents.length > 0 ? [{
              label: 'Last vaccination',
              value: formatDate(vaccinationEvents[0].event_date),
            }] : []),
          ].map(stat => (
            <div key={stat.label} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)', padding: '10px 12px',
            }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {stat.label}
              </div>
              <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600, marginTop: 2 }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Notes */}
        {selected.notes && (
          <div style={{ margin: '8px 16px 0', background: 'var(--surface-alt)', borderRadius: 'var(--r-md)', border: '1px solid var(--border-light)', padding: '10px 12px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {selected.notes}
          </div>
        )}

        {/* ── QR Code ── */}
        <AnimalQRCode tag={selected.animal_tag} />

        {/* ── Health timeline ── */}
        <div style={{ padding: '20px 16px 0' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>
            Health History
          </div>

          {evLoading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
              <div className="loading-spinner" />
            </div>
          )}

          {!evLoading && events.length === 0 && (
            <div style={{
              textAlign: 'center', padding: '32px 0',
              border: '1.5px dashed var(--border)', borderRadius: 'var(--r-xl)',
            }}>
              <FileText size={28} color="var(--text-muted)" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>No events recorded yet</div>
              {onLogEvent && (
                <button className="btn btn-primary btn-sm" style={{ marginTop: 12, width: 'auto' }}
                  onClick={() => onLogEvent(selected.id, selected.animal_tag)}>
                  Log first event
                </button>
              )}
            </div>
          )}

          {!evLoading && events.map(e => (
            <EventCard
              key={e.id}
              event={e}
              onLogFollowUp={onLogEvent ? () => onLogEvent(selected.id, selected.animal_tag) : undefined}
            />
          ))}
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════
     ADD FORM
  ═══════════════════════════════════════════════════════════ */
  if (view === 'add') {
    return (
      <div style={{ paddingBottom: 32 }}>
        <div className="back-bar">
          <button className="back-bar-btn" onClick={() => setView('list')}>
            <ArrowLeft size={18} /> Back
          </button>
        </div>
        <div style={{ padding: '0 16px 4px' }}>
          <div className="screen-title">Register Animal</div>
          <div className="screen-subtitle">Add to your herd</div>
        </div>

        {formError && <div className="error-card" style={{ margin: '12px 16px' }}>{formError}</div>}

        <div style={{ padding: '16px 16px 0' }}>

          {/* Photo */}
          <div className="form-group">
            <div className="form-label">Photo (optional)</div>
            <PhotoCapture
              label="Take animal photo"
              onUploaded={url => setPhotoUrl(url)}
              onClear={() => setPhotoUrl('')}
            />
          </div>

          <div className="form-group">
            <div className="form-label">Animal Tag / ID *</div>
            <input className="form-input" placeholder="e.g. NG-KAD-003"
              value={form.animal_tag}
              onChange={e => setForm(f => ({ ...f, animal_tag: e.target.value }))} />
          </div>

          <div className="form-group">
            <div className="form-label">Species *</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {SPECIES_OPTIONS.map(s => (
                <button key={s}
                  className={`species-btn ${form.species === s ? 'selected' : ''}`}
                  style={{ aspectRatio: 'unset', padding: '10px 8px', minHeight: 44 }}
                  onClick={() => setForm(f => ({ ...f, species: s }))}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div className="form-group">
              <div className="form-label">Sex</div>
              <select className="form-input" value={form.sex}
                onChange={e => setForm(f => ({ ...f, sex: e.target.value }))}>
                <option>Female</option>
                <option>Male</option>
                <option>Unknown</option>
              </select>
            </div>
            <div className="form-group">
              <div className="form-label">Age</div>
              <input className="form-input" placeholder="e.g. 3 years"
                value={form.approximate_age}
                onChange={e => setForm(f => ({ ...f, approximate_age: e.target.value }))} />
            </div>
          </div>

          <div className="form-group">
            <div className="form-label">Breed (optional)</div>
            <input className="form-input" placeholder="e.g. Zebu, Ankole"
              value={form.breed}
              onChange={e => setForm(f => ({ ...f, breed: e.target.value }))} />
          </div>

          <div className="form-group">
            <div className="form-label">Owner Name *</div>
            <input className="form-input" placeholder="Owner's full name"
              value={form.owner_name}
              onChange={e => setForm(f => ({ ...f, owner_name: e.target.value }))} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div className="form-group">
              <div className="form-label">Village</div>
              <input className="form-input" placeholder="Village" value={form.village}
                onChange={e => setForm(f => ({ ...f, village: e.target.value }))} />
            </div>
            <div className="form-group">
              <div className="form-label">Country</div>
              <input className="form-input" placeholder="Country" value={form.country}
                onChange={e => setForm(f => ({ ...f, country: e.target.value }))} />
            </div>
          </div>

          <div className="form-group">
            <div className="form-label">Herd Name</div>
            <input className="form-input" placeholder="Optional herd name" value={form.herd_name}
              onChange={e => setForm(f => ({ ...f, herd_name: e.target.value }))} />
          </div>

          <div className="form-group">
            <div className="form-label">Notes</div>
            <textarea className="form-input" placeholder="Any notes..." rows={3}
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>

          <button className="btn btn-primary" disabled={saving} onClick={saveAnimal}>
            {saving ? 'Saving...' : 'Register Animal'}
          </button>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════
     LIST VIEW
  ═══════════════════════════════════════════════════════════ */
  return (
    <div style={{ paddingBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 16px 8px' }}>
        <div>
          <div className="screen-title">My Animals</div>
          <div className="screen-subtitle">{animals.length} registered</div>
        </div>
        <button
          style={{ width: 44, height: 44, borderRadius: 'var(--r-full)', background: 'var(--brand)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--sh-brand)', flexShrink: 0, border: 'none', cursor: 'pointer' }}
          onClick={() => setView('add')}
        >
          <Plus size={22} />
        </button>
      </div>

      <div className="search-bar">
        <Search size={16} className="search-bar-icon" />
        <input placeholder="Search tag, owner, herd..." value={search}
          onChange={e => setSearch(e.target.value)} />
        {search && (
          <button style={{ color: 'var(--text-muted)', fontSize: 18, lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer' }}
            onClick={() => setSearch('')}>×</button>
        )}
      </div>

      {error && <div className="error-card" style={{ margin: '0 16px 12px' }}>{error}</div>}

      {loading ? (
        <div className="loading-screen"><div className="loading-spinner" /></div>
      ) : animals.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Beef size={24} /></div>
          <div className="empty-title">No animals yet</div>
          <div className="empty-sub">Register your first animal to start tracking health.</div>
          <button className="btn btn-primary" style={{ marginTop: 16, width: 'auto' }}
            onClick={() => setView('add')}>
            Register Animal
          </button>
        </div>
      ) : (
        <div className="animal-list">
          {animals.map(a => (
            <AnimalListCard key={a.id} animal={a} onOpen={openDetail} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Animal QR Code ──────────────────────────────────────── */
function AnimalQRCode({ tag }: { tag: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{ margin: '12px 16px 0' }}>
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--r-lg)', padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
        }}
      >
        <QrCode size={18} color="var(--text-secondary)" />
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Animal QR Code</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {expanded ? 'Tap to collapse' : 'Tap to view — screenshot to print'}
          </div>
        </div>
        <span style={{ fontSize: 16, color: 'var(--text-muted)' }}>{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderTop: 'none', borderRadius: '0 0 var(--r-lg) var(--r-lg)',
          padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        }}>
          <div style={{ padding: 12, background: 'white', borderRadius: 'var(--r-md)', boxShadow: 'var(--sh-sm)' }}>
            <QRCodeSVG value={tag} size={160} level="M" />
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: 1, color: 'var(--text)' }}>{tag}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.4 }}>
            Screenshot and print this code. Attach to the animal's ear tag or collar.
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Animal list card ────────────────────────────────────── */
function AnimalListCard({ animal: a, onOpen }: { animal: Animal; onOpen: (a: Animal) => void }) {
  return (
    <button className="animal-card" onClick={() => onOpen(a)}>
      <div style={{
        width: 44, height: 44, borderRadius: 'var(--r-md)',
        background: 'var(--brand-tint)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, overflow: 'hidden',
      }}>
        {a.photo_url
          ? <img src={a.photo_url} alt={a.animal_tag} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <Beef size={20} color="var(--brand)" />
        }
      </div>
      <div className="animal-card-body">
        <div className="animal-card-tag">{a.animal_tag}</div>
        <div className="animal-card-meta">
          {a.species}{a.breed ? ` · ${a.breed}` : ''}{a.sex ? ` · ${a.sex}` : ''}{a.village ? ` · ${a.village}` : ''}
        </div>
        <div className="animal-card-meta" style={{ marginTop: 2 }}>{a.owner_name}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
        <Camera size={13} color="var(--text-muted)" style={{ opacity: a.photo_url ? 1 : 0 }} />
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>›</span>
      </div>
    </button>
  );
}

/* ── Event card (used in passport timeline) ─────────────── */
function EventCard({ event: e, onLogFollowUp }: { event: AnimalEvent; onLogFollowUp?: () => void }) {
  const cfg = EVENT_CFG[e.event_type] ?? EVENT_CFG.other;
  const { Icon } = cfg;
  const overdue = isOverdue(e.follow_up_date) && !e.outcome;

  const riskBadgeClass =
    e.risk_level === 'emergency' || e.risk_level === 'high' ? 'badge-red' :
    e.risk_level === 'moderate' ? 'badge-amber' :
    e.risk_level === 'low' ? 'badge-green' : '';

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderLeft: `3px solid ${cfg.color}`,
      borderRadius: 'var(--r-lg)',
      marginBottom: 10,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: cfg.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon size={16} color={cfg.color} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
            {e.risk_level && riskBadgeClass && (
              <span className={`badge ${riskBadgeClass}`} style={{ fontSize: 10 }}>{e.risk_level}</span>
            )}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
            {formatDate(e.event_date)}
          </div>
        </div>
      </div>

      {/* Body */}
      {(e.symptoms || e.temperature || e.eating_status || e.mobility_status || e.action_taken || e.outcome || e.follow_up_date) && (
        <div style={{ padding: '0 14px 12px', borderTop: '1px solid var(--border-light)' }}>

          {e.symptoms && (
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.4 }}>
              {e.symptoms}
            </div>
          )}

          {/* Vitals row */}
          {(e.temperature || e.eating_status || e.mobility_status) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 7 }}>
              {e.temperature && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-secondary)' }}>
                  <Thermometer size={11} /> {e.temperature}°C
                </span>
              )}
              {e.eating_status && (
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  Eating: {e.eating_status.replace('_', ' ')}
                </span>
              )}
              {e.mobility_status && (
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  Mobility: {e.mobility_status.replace('_', ' ')}
                </span>
              )}
            </div>
          )}

          {e.action_taken && (
            <div style={{ fontSize: 13, color: 'var(--brand)', marginTop: 7, fontWeight: 600, lineHeight: 1.4 }}>
              {e.action_taken}
            </div>
          )}

          {e.outcome && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              Outcome: {e.outcome}
            </div>
          )}

          {e.follow_up_date && (
            <div style={{
              marginTop: 8, padding: '6px 10px',
              background: overdue ? '#FEF2F2' : '#F0FAF4',
              borderRadius: 'var(--r-sm)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
            }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: overdue ? '#DC2626' : 'var(--brand)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Calendar size={11} />
                {overdue ? 'Follow-up OVERDUE' : 'Follow-up due'}: {formatDate(e.follow_up_date)}
              </span>
              {overdue && onLogFollowUp && (
                <button
                  onClick={onLogFollowUp}
                  style={{ background: '#DC2626', color: 'white', border: 'none', borderRadius: 'var(--r-sm)', padding: '3px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                >
                  Log now
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Photo */}
      {e.image_url && (
        <img
          src={e.image_url}
          alt="Event photo"
          style={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block', borderTop: '1px solid var(--border-light)' }}
        />
      )}
    </div>
  );
}
