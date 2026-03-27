/**
 * BulkVaccination — log one vaccination event across multiple animals at once.
 * Typical use: annual FMD round, routine deworming across the herd.
 */
import { useState, useEffect } from 'react';
import { Syringe, CheckSquare, Square, Calendar, ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';
import { api } from '../api';
import type { Animal } from '../types';
import { enqueueEvent } from '../utils/offlineQueue';

function today() { return new Date().toISOString().split('T')[0]; }

interface Props { onBack: () => void; }

type Phase = 'select' | 'details' | 'result';

interface BulkResult {
  created: number;
  queued:  number;
  errors:  number;
}

export function BulkVaccination({ onBack }: Props) {
  const [animals,   setAnimals]   = useState<Animal[]>([]);
  const [selected,  setSelected]  = useState<Set<number>>(new Set());
  const [loading,   setLoading]   = useState(true);
  const [phase,     setPhase]     = useState<Phase>('select');
  const [result,    setResult]    = useState<BulkResult | null>(null);
  const [saving,    setSaving]    = useState(false);
  const [search,    setSearch]    = useState('');

  const [form, setForm] = useState({
    vaccine_name:   '',
    event_date:     today(),
    follow_up_date: '',
    notes:          '',
  });

  useEffect(() => {
    api.animals.list().then(setAnimals).finally(() => setLoading(false));
  }, []);

  const filtered = search
    ? animals.filter(a =>
        a.animal_tag.toLowerCase().includes(search.toLowerCase()) ||
        a.species.toLowerCase().includes(search.toLowerCase()) ||
        a.owner_name.toLowerCase().includes(search.toLowerCase())
      )
    : animals;

  const toggle = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(a => a.id)));
    }
  };

  const handleVaccinate = async () => {
    if (!form.vaccine_name.trim()) return;
    setSaving(true);

    const actionTaken = `Administered: ${form.vaccine_name}`;
    const events = Array.from(selected).map(animal_id => ({
      animal_id,
      event_type:     'vaccination',
      event_date:     form.event_date,
      action_taken:   actionTaken + (form.notes ? ` — ${form.notes}` : ''),
      follow_up_date: form.follow_up_date || undefined,
      symptoms:       undefined,
      risk_level:     undefined,
      eating_status:  undefined,
      mobility_status:undefined,
      temperature:    undefined,
      outcome:        undefined,
      image_url:      undefined,
    }));

    let created = 0;
    let queued  = 0;
    let errors  = 0;

    if (navigator.onLine) {
      try {
        const res = await api.events.createBulk(events);
        created = res.created;
        errors  = res.errors.length;
      } catch {
        // Network failed — queue all
        for (const ev of events) {
          enqueueEvent(ev);
          queued++;
        }
      }
    } else {
      for (const ev of events) {
        enqueueEvent(ev);
        queued++;
      }
    }

    setSaving(false);
    setResult({ created, queued, errors });
    setPhase('result');
  };

  /* ── Result ── */
  if (phase === 'result' && result) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: 32, textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#D8F3DC', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <CheckCircle size={32} color="var(--brand)" />
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>
          Vaccination logged
        </div>
        {result.created > 0 && (
          <div style={{ fontSize: 14, color: 'var(--brand)', marginBottom: 4 }}>
            {result.created} animal{result.created !== 1 ? 's' : ''} saved to server
          </div>
        )}
        {result.queued > 0 && (
          <div style={{ fontSize: 14, color: '#D97706', marginBottom: 4 }}>
            {result.queued} animal{result.queued !== 1 ? 's' : ''} saved offline — will sync when connected
          </div>
        )}
        {result.errors > 0 && (
          <div style={{ fontSize: 14, color: '#DC2626', marginBottom: 4 }}>
            {result.errors} failed — animal records may not exist
          </div>
        )}
        <button className="btn btn-primary" style={{ marginTop: 24 }} onClick={onBack}>
          Done
        </button>
      </div>
    );
  }

  /* ── Details ── */
  if (phase === 'details') {
    return (
      <div style={{ paddingBottom: 32 }}>
        <div className="back-bar">
          <button className="back-bar-btn" onClick={() => setPhase('select')}>
            <ArrowLeft size={18} /> Back
          </button>
          <span className="back-bar-title">Vaccination details</span>
        </div>

        <div style={{ padding: '0 16px 16px', fontSize: 13, color: 'var(--text-muted)', background: 'var(--brand-tint)', borderRadius: 'var(--r-md)', margin: '0 16px 16px' }}>
          Vaccinating {selected.size} animal{selected.size !== 1 ? 's' : ''}
        </div>

        <div className="form-stack">
          <div className="field">
            <div className="field-label">Vaccine / Medicine name *</div>
            <input className="field-input" placeholder="e.g. FMD trivalent, Oxytetracycline…"
              value={form.vaccine_name}
              onChange={e => setForm(f => ({ ...f, vaccine_name: e.target.value }))} />
          </div>

          <div className="field">
            <div className="field-label">Date administered</div>
            <input type="date" className="field-input" value={form.event_date}
              onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))} />
          </div>

          <div className="field">
            <div className="field-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Calendar size={13} /> Next dose / booster date (optional)
            </div>
            <input type="date" className="field-input" value={form.follow_up_date}
              onChange={e => setForm(f => ({ ...f, follow_up_date: e.target.value }))} />
          </div>

          <div className="field">
            <div className="field-label">Notes (optional)</div>
            <input className="field-input" placeholder="Batch number, dosage, route…"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>

          {!form.vaccine_name.trim() && (
            <div className="error-card" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={14} /> Vaccine name is required
            </div>
          )}

          <button
            className="btn btn-primary"
            disabled={saving || !form.vaccine_name.trim()}
            onClick={handleVaccinate}
          >
            <Syringe size={16} />
            {saving ? 'Saving…' : `Vaccinate ${selected.size} animal${selected.size !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    );
  }

  /* ── Select animals ── */
  return (
    <div style={{ paddingBottom: 32 }}>
      <div className="back-bar">
        <button className="back-bar-btn" onClick={onBack}>
          <ArrowLeft size={18} /> Back
        </button>
        <span className="back-bar-title">Bulk Vaccination</span>
      </div>

      <div style={{ padding: '0 16px 12px' }}>
        <div className="screen-subtitle">Select animals to vaccinate</div>
      </div>

      {/* Search */}
      <div className="search-bar">
        <input placeholder="Filter by tag, species, owner…" value={search}
          onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Select all row */}
      {filtered.length > 0 && (
        <div style={{
          padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10,
          borderBottom: '1px solid var(--border)', cursor: 'pointer',
        }} onClick={toggleAll}>
          {selected.size === filtered.length && filtered.length > 0
            ? <CheckSquare size={20} color="var(--brand)" />
            : <Square size={20} color="var(--text-muted)" />
          }
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
            {selected.size === filtered.length ? 'Deselect all' : 'Select all'}
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>
            {selected.size} selected
          </span>
        </div>
      )}

      {loading ? (
        <div className="loading-screen"><div className="loading-spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-title">No animals found</div>
        </div>
      ) : (
        <div>
          {filtered.map(a => (
            <div
              key={a.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px',
                borderBottom: '1px solid var(--border-light)',
                background: selected.has(a.id) ? 'var(--brand-tint)' : 'transparent',
                cursor: 'pointer',
              }}
              onClick={() => toggle(a.id)}
            >
              {selected.has(a.id)
                ? <CheckSquare size={20} color="var(--brand)" style={{ flexShrink: 0 }} />
                : <Square size={20} color="var(--text-muted)" style={{ flexShrink: 0 }} />
              }
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{a.animal_tag}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {a.species}{a.sex ? ` · ${a.sex}` : ''} · {a.owner_name}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sticky proceed button */}
      {selected.size > 0 && (
        <div style={{
          position: 'sticky', bottom: 0,
          padding: '12px 16px',
          background: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(8px)',
          borderTop: '1px solid var(--border)',
        }}>
          <button className="btn btn-primary" onClick={() => setPhase('details')}>
            <Syringe size={16} />
            Continue with {selected.size} animal{selected.size !== 1 ? 's' : ''}
          </button>
        </div>
      )}
    </div>
  );
}
