/**
 * EventLogger — 3-tap flow: pick animal → pick type → minimal details → save.
 */
import { useState, useEffect } from 'react';
import { api } from '../api';
import type { Animal, AnimalEvent } from '../types';
import { PhotoCapture } from './PhotoCapture';

const EVENT_TYPES = [
  { id: 'illness',     icon: '', label: 'Illness'     },
  { id: 'treatment',   icon: '', label: 'Treatment'   },
  { id: 'vaccination', icon: '', label: 'Vaccine'     },
  { id: 'birth',       icon: '', label: 'Birth'       },
  { id: 'injury',      icon: '', label: 'Injury'      },
  { id: 'heat',        icon: '', label: 'Heat'        },
  { id: 'sale',        icon: '', label: 'Sale'        },
  { id: 'death',       icon: '', label: 'Death'       },
  { id: 'other',       icon: '', label: 'Other'       },
];

function today() { return new Date().toISOString().split('T')[0]; }

interface Props {
  prefillAnimalId?:  number;
  prefillAnimalTag?: string;
  prefillData?:      Partial<AnimalEvent>;
  onSaved?:          () => void;
  onBack?:           () => void;
}

type Step = 'animal' | 'type' | 'details';

export function EventLogger({ prefillAnimalId, prefillAnimalTag, prefillData, onSaved, onBack }: Props) {
  const [step, setStep]     = useState<Step>(prefillAnimalId ? 'type' : 'animal');
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [animalId, setAnimalId] = useState<number>(prefillAnimalId ?? 0);
  const [animalTag, setAnimalTag] = useState<string>(prefillAnimalTag ?? '');
  const [eventType, setEventType] = useState(prefillData?.event_type ?? '');
  const [form, setForm] = useState({
    event_date:    prefillData?.event_date     ?? today(),
    symptoms:      prefillData?.symptoms       ?? '',
    action_taken:  prefillData?.action_taken   ?? '',
    risk_level:    prefillData?.risk_level     ?? '',
    eating_status: prefillData?.eating_status  ?? '',
    temperature:   '',
    outcome:       '',
  });
  const [imageUrl, setImageUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState('');

  useEffect(() => {
    api.animals.list().then(setAnimals).catch(() => {});
  }, []);

  const selectAnimal = (a: Animal) => {
    setAnimalId(a.id);
    setAnimalTag(a.animal_tag);
    setStep('type');
  };

  const selectType = (t: string) => {
    setEventType(t);
    setStep('details');
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await api.events.create({
        animal_id:    animalId,
        event_type:   eventType,
        event_date:   form.event_date,
        symptoms:     form.symptoms   || undefined,
        action_taken: form.action_taken || undefined,
        risk_level:   form.risk_level || undefined,
        eating_status: form.eating_status || undefined,
        temperature:  form.temperature ? parseFloat(form.temperature) : undefined,
        outcome:      form.outcome || undefined,
        image_url:    imageUrl || undefined,
      });
      setSaved(true);
      onSaved?.();
    } catch {
      setError('Could not save. Check your connection.');
    } finally {
      setSaving(false);
    }
  };

  // ── Saved ────────────────────────────────────────────────
  if (saved) {
    return (
      <div className="screen">
        <div className="success-screen">
          <div className="success-icon"></div>
          <div className="success-title">Event Saved</div>
          <div className="success-body">Recorded for {animalTag}</div>
          <button className="btn btn-primary btn-sm" style={{ width: 'auto', marginTop: 16 }}
            onClick={() => {
              setSaved(false);
              setStep(prefillAnimalId ? 'type' : 'animal');
              setEventType('');
              setForm({ event_date: today(), symptoms: '', action_taken: '',
                        risk_level: '', eating_status: '', temperature: '', outcome: '' });
            }}>
            Log another
          </button>
        </div>
      </div>
    );
  }

  // ── Step 1: Pick animal ──────────────────────────────────
  if (step === 'animal') {
    return (
      <div className="screen">
        <div className="back-bar">
          {onBack && <button className="back-bar-btn" onClick={onBack}>← Back</button>}
          <span className="back-bar-title">Which animal?</span>
        </div>

        {animals.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"></div>
            <div className="empty-title">No animals registered</div>
            <div className="empty-body">Register an animal first to log an event.</div>
          </div>
        ) : (
          <div className="animal-picker-list">
            {animals.map(a => (
              <button key={a.id}
                className={`animal-picker-item ${animalId === a.id ? 'selected' : ''}`}
                onClick={() => selectAnimal(a)}>
                <div>
                  <div className="animal-picker-tag">{a.animal_tag}</div>
                  <div className="animal-picker-owner">{a.owner_name}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Step 2: Pick event type ──────────────────────────────
  if (step === 'type') {
    return (
      <div className="screen">
        <div className="back-bar">
          <button className="back-bar-btn" onClick={() => prefillAnimalId ? onBack?.() : setStep('animal')}>
            ← Back
          </button>
          <span className="back-bar-title">What happened?</span>
        </div>

        {/* Animal chip */}
        <div className="prefilled-chip" style={{ marginBottom: 16 }}>
          <span>{animalTag}</span>
        </div>

        <div className="event-type-grid">
          {EVENT_TYPES.map(t => (
            <button key={t.id}
              className={`event-type-btn ${eventType === t.id ? 'selected' : ''}`}
              onClick={() => selectType(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Step 3: Details ──────────────────────────────────────
  const et = EVENT_TYPES.find(t => t.id === eventType);
  const needsSymptoms = ['illness', 'injury', 'treatment'].includes(eventType);

  return (
    <div className="screen">
      <div className="back-bar">
        <button className="back-bar-btn" onClick={() => setStep('type')}>← Back</button>
        <span className="back-bar-title">{et?.label}</span>
      </div>

      <div className="prefilled-chip" style={{ marginBottom: 16 }}>
        <span>{animalTag}</span>
      </div>

      {error && <div className="error-card" style={{ marginBottom: 12 }}>{error}</div>}

      <div className="form-stack">
        <div className="field">
          <div className="field-label">Date</div>
          <input type="date" className="field-input" value={form.event_date}
            onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))} />
        </div>

        {needsSymptoms && (
          <div className="field">
            <div className="field-label">What do you see?</div>
            <textarea className="field-input field-textarea" rows={3}
              placeholder="Describe symptoms, e.g. limping, not eating, swollen…"
              value={form.symptoms}
              onChange={e => setForm(f => ({ ...f, symptoms: e.target.value }))} />
          </div>
        )}

        {needsSymptoms && (
          <div className="field">
            <div className="field-label">Is it eating?</div>
            <div className="btn-group">
              {[
                { v: 'normal',    l: 'Yes' },
                { v: 'reduced',   l: 'Less' },
                { v: 'not_eating',l: 'No' },
              ].map(o => (
                <button key={o.v}
                  className={`bg-btn ${form.eating_status === o.v ? 'selected' : ''}`}
                  onClick={() => setForm(f => ({ ...f, eating_status: o.v }))}>
                  {o.l}
                </button>
              ))}
            </div>
          </div>
        )}

        {needsSymptoms && (
          <div className="form-row">
            <div className="field">
              <div className="field-label">Temp (°C)</div>
              <input type="number" step="0.1" className="field-input" placeholder="39.5"
                value={form.temperature}
                onChange={e => setForm(f => ({ ...f, temperature: e.target.value }))} />
            </div>
            <div className="field">
              <div className="field-label">Risk</div>
              <select className="field-input field-select" value={form.risk_level}
                onChange={e => setForm(f => ({ ...f, risk_level: e.target.value }))}>
                <option value="">—</option>
                <option value="low">Low</option>
                <option value="moderate">Moderate</option>
                <option value="high">High</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
          </div>
        )}

        <div className="field">
          <div className="field-label">Action taken</div>
          <textarea className="field-input field-textarea" rows={2}
            placeholder="What did you do? e.g. gave antibiotic, called vet…"
            value={form.action_taken}
            onChange={e => setForm(f => ({ ...f, action_taken: e.target.value }))} />
        </div>

        <div className="field">
          <div className="field-label">Outcome</div>
          <input className="field-input" placeholder="e.g. Recovered, Ongoing…"
            value={form.outcome}
            onChange={e => setForm(f => ({ ...f, outcome: e.target.value }))} />
        </div>

        {needsSymptoms && (
          <div className="field">
            <div className="field-label">Photo (optional)</div>
            <PhotoCapture
              label="Take Photo of Symptoms"
              onUploaded={url => setImageUrl(url)}
              onClear={() => setImageUrl('')}
            />
          </div>
        )}

        <button className="btn btn-primary" disabled={saving} onClick={handleSave}>
          {saving ? 'Saving…' : 'Save Event'}
        </button>
      </div>
    </div>
  );
}
