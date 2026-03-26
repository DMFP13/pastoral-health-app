import { useState, useEffect, useCallback } from 'react';
import { Beef, Stethoscope, FileText, Search, Plus, ArrowLeft } from 'lucide-react';
import { api } from '../api';
import type { Animal, AnimalEvent } from '../types';

const SPECIES_OPTIONS = ['Cattle', 'Sheep', 'Goats', 'Pigs', 'Buffalo', 'Other'];

function SpeciesAvatar({ size = 48 }: { species?: string; size?: number }) {
  return (
    <div className="animal-avatar" style={{ width: size, height: size }}>
      <Beef size={size * 0.5} />
    </div>
  );
}

function healthBadge(events: AnimalEvent[]) {
  if (!events.length) return { dot: 'dot-gray', label: 'New' };
  const latest = events[0];
  if (!latest.risk_level) return { dot: 'dot-green', label: 'OK' };
  if (latest.risk_level === 'emergency' || latest.risk_level === 'high')
    return { dot: 'dot-red', label: 'Alert' };
  if (latest.risk_level === 'moderate')
    return { dot: 'dot-amber', label: 'Watch' };
  return { dot: 'dot-green', label: 'OK' };
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  illness: 'Illness', treatment: 'Treatment', birth: 'Birth', death: 'Death',
  sale: 'Sale', vaccination: 'Vaccination', heat: 'Heat', injury: 'Injury', other: 'Other',
};

interface Props {
  onLogEvent?:   (animalId: number, animalTag: string) => void;
  onCheckAnimal?: (species: string) => void;
  initialId?:    number;
}

type View = 'list' | 'detail' | 'add';

export function AnimalRegistry({ onLogEvent, onCheckAnimal, initialId }: Props) {
  const [view,      setView]      = useState<View>('list');
  const [animals,   setAnimals]   = useState<Animal[]>([]);
  const [selected,  setSelected]  = useState<Animal | null>(null);
  const [events,    setEvents]    = useState<AnimalEvent[]>([]);
  const [search,    setSearch]    = useState('');
  const [loading,   setLoading]   = useState(false);
  const [evLoading, setEvLoading] = useState(false);
  const [error,     setError]     = useState('');

  const [form, setForm] = useState({
    animal_tag: '', species: 'Cattle', sex: 'Female',
    approximate_age: '', owner_name: '', herd_name: '',
    village: '', country: '', notes: '',
  });
  const [saving,    setSaving]    = useState(false);
  const [formError, setFormError] = useState('');

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

  const saveAnimal = async () => {
    if (!form.animal_tag.trim()) { setFormError('Tag is required'); return; }
    if (!form.owner_name.trim()) { setFormError('Owner name is required'); return; }
    setSaving(true); setFormError('');
    try {
      await api.animals.create({
        animal_tag: form.animal_tag, species: form.species, sex: form.sex,
        approximate_age: form.approximate_age || undefined,
        owner_name: form.owner_name,
        herd_name:  form.herd_name  || undefined,
        village:    form.village    || undefined,
        country:    form.country    || undefined,
        notes:      form.notes      || undefined,
      } as Omit<Animal, 'id' | 'created_at' | 'events'>);
      setForm({ animal_tag: '', species: 'Cattle', sex: 'Female',
                approximate_age: '', owner_name: '', herd_name: '', village: '', country: '', notes: '' });
      setView('list'); load();
    } catch (e: unknown) {
      setFormError(e instanceof Error && e.message.includes('400')
        ? 'That tag already exists.' : 'Could not save. Try again.');
    } finally { setSaving(false); }
  };

  /* ── Detail view ─────────────────────────────────────────── */
  if (view === 'detail' && selected) {
    const health = healthBadge(events);
    return (
      <div style={{ paddingBottom: 24 }}>
        <div className="animal-detail-header">
          <button className="back-bar-btn" style={{ color: 'rgba(255,255,255,0.85)', marginBottom: 8 }}
            onClick={() => setView('list')}>
            <ArrowLeft size={18} /> Back
          </button>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 'var(--r-lg)', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
              <Beef size={28} />
            </div>
            <div>
              <div className="animal-detail-tag">{selected.animal_tag}</div>
              <div className="animal-detail-species">
                {selected.species}{selected.breed ? ` · ${selected.breed}` : ''} · {selected.sex ?? 'Unknown sex'}
              </div>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div style={{ padding: '16px 16px 0', display: 'flex', gap: 10 }}>
          {onCheckAnimal && (
            <button className="btn btn-outline btn-sm" style={{ flex: 1 }}
              onClick={() => onCheckAnimal(selected.species)}>
              <Stethoscope size={16} /> Check Health
            </button>
          )}
          {onLogEvent && (
            <button className="btn btn-primary btn-sm" style={{ flex: 1 }}
              onClick={() => onLogEvent(selected.id, selected.animal_tag)}>
              <FileText size={16} /> Log Event
            </button>
          )}
        </div>

        {/* Stats grid */}
        <div className="animal-stats-grid">
          <div className="animal-stat-card">
            <div className="animal-stat-label">Owner</div>
            <div className="animal-stat-value" style={{ fontSize: 14 }}>{selected.owner_name}</div>
          </div>
          <div className="animal-stat-card">
            <div className="animal-stat-label">Health</div>
            <div className="animal-stat-value" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div className={`health-dot ${health.dot}`} />
              {health.label}
            </div>
          </div>
          {selected.approximate_age && (
            <div className="animal-stat-card">
              <div className="animal-stat-label">Age</div>
              <div className="animal-stat-value" style={{ fontSize: 14 }}>{selected.approximate_age}</div>
            </div>
          )}
          {selected.village && (
            <div className="animal-stat-card">
              <div className="animal-stat-label">Village</div>
              <div className="animal-stat-value" style={{ fontSize: 14 }}>{selected.village}</div>
            </div>
          )}
          {selected.herd_name && (
            <div className="animal-stat-card" style={{ gridColumn: '1/-1' }}>
              <div className="animal-stat-label">Herd</div>
              <div className="animal-stat-value" style={{ fontSize: 14 }}>{selected.herd_name}</div>
            </div>
          )}
        </div>

        {selected.notes && (
          <div style={{ margin: '0 16px 16px', background: 'var(--surface-alt)', borderRadius: 'var(--r-md)', border: '1px solid var(--border-light)', padding: '12px 14px', fontSize: 13, color: 'var(--text-secondary)' }}>
            {selected.notes}
          </div>
        )}

        <div className="section-label">Health History</div>

        {evLoading && <div className="loading-screen" style={{ minHeight: 100 }}><div className="loading-spinner" /></div>}
        {!evLoading && events.length === 0 && (
          <div className="empty-state" style={{ padding: '24px 0' }}>
            <div className="empty-icon"><FileText size={22} /></div>
            <div className="empty-title">No events recorded</div>
          </div>
        )}
        {!evLoading && (
          <div className="timeline">
            {events.map(e => {
              const riskColor = e.risk_level === 'emergency' || e.risk_level === 'high' ? 'var(--red)'
                : e.risk_level === 'moderate' ? 'var(--amber)' : 'var(--brand)';
              return (
                <div key={e.id} className="timeline-item">
                  <div className="timeline-dot" style={{ background: riskColor + '18' }}>
                    <FileText size={16} color={riskColor} />
                  </div>
                  <div className="timeline-body">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 3 }}>
                      <span className="timeline-type">{EVENT_TYPE_LABELS[e.event_type] ?? e.event_type}</span>
                      {e.risk_level && (
                        <span className={`badge badge-${
                          e.risk_level === 'emergency' || e.risk_level === 'high' ? 'red' :
                          e.risk_level === 'moderate' ? 'amber' : 'green'
                        }`}>{e.risk_level}</span>
                      )}
                    </div>
                    <div className="timeline-date">{e.event_date}</div>
                    {e.symptoms  && <div className="timeline-symptoms">{e.symptoms}</div>}
                    {e.action_taken && <div style={{ fontSize: 12, color: 'var(--brand)', marginTop: 4, fontWeight: 600 }}>{e.action_taken}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  /* ── Add form ────────────────────────────────────────────── */
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
          <div className="screen-subtitle">Add a new animal to your herd</div>
        </div>

        {formError && <div className="error-card" style={{ margin: '12px 16px' }}>{formError}</div>}

        <div style={{ padding: '16px 16px 0' }}>
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

  /* ── List view ───────────────────────────────────────────── */
  return (
    <div style={{ paddingBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 16px 8px' }}>
        <div>
          <div className="screen-title">My Animals</div>
          <div className="screen-subtitle">{animals.length} registered</div>
        </div>
        <button
          style={{ width: 44, height: 44, borderRadius: 'var(--r-full)', background: 'var(--brand)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--sh-brand)', flexShrink: 0 }}
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
          <button style={{ color: 'var(--text-muted)', fontSize: 18, lineHeight: 1 }} onClick={() => setSearch('')}>
            ×
          </button>
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
          {animals.map(a => {
            const health = healthBadge(a.events ?? []);
            return (
              <button key={a.id} className="animal-card" onClick={() => openDetail(a)}>
                <SpeciesAvatar species={a.species} />
                <div className="animal-card-body">
                  <div className="animal-card-tag">{a.animal_tag}</div>
                  <div className="animal-card-meta">
                    {a.species}{a.sex ? ` · ${a.sex}` : ''}{a.village ? ` · ${a.village}` : ''}
                  </div>
                  <div className="animal-card-meta" style={{ marginTop: 2 }}>{a.owner_name}</div>
                </div>
                <div className="animal-card-right">
                  <div className={`health-dot ${health.dot}`} />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{health.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
