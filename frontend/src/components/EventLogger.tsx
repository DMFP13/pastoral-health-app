/**
 * EventLogger — 3-tap flow: pick animal → pick type → minimal details → save.
 * Captures: symptoms, vitals, action taken, follow-up date, photo.
 */
import { useState, useEffect } from 'react';
import { Beef, Calendar, WifiOff } from 'lucide-react';
import { api } from '../api';
import type { Animal, AnimalEvent } from '../types';
import { PhotoCapture } from './PhotoCapture';
import { enqueueEvent } from '../utils/offlineQueue';

const EVENT_TYPES = [
  { id: 'illness',      label: 'Illness'     },
  { id: 'treatment',    label: 'Treatment'   },
  { id: 'vaccination',  label: 'Vaccine'     },
  { id: 'weight_check', label: 'Weight'      },
  { id: 'birth',        label: 'Birth'       },
  { id: 'injury',       label: 'Injury'      },
  { id: 'heat',         label: 'Heat'        },
  { id: 'sale',         label: 'Sale'        },
  { id: 'death',        label: 'Death'       },
  { id: 'other',        label: 'Other'       },
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
  const [step,      setStep]      = useState<Step>(prefillAnimalId ? 'type' : 'animal');
  const [animals,   setAnimals]   = useState<Animal[]>([]);
  const [animalId,  setAnimalId]  = useState<number>(prefillAnimalId ?? 0);
  const [animalTag, setAnimalTag] = useState<string>(prefillAnimalTag ?? '');
  const [eventType, setEventType] = useState(prefillData?.event_type ?? '');
  const [form, setForm] = useState({
    event_date:      prefillData?.event_date      ?? today(),
    symptoms:        prefillData?.symptoms        ?? '',
    action_taken:    prefillData?.action_taken    ?? '',
    risk_level:      prefillData?.risk_level      ?? '',
    eating_status:   prefillData?.eating_status   ?? '',
    mobility_status: prefillData?.mobility_status ?? '',
    temperature:     prefillData?.temperature     ? String(prefillData.temperature) : '',
    outcome:         prefillData?.outcome         ?? '',
    follow_up_date:  prefillData?.follow_up_date  ?? '',
    vaccine_name:    '',
    weight_kg:       '',
    bcs:             '',   // body condition score 1-5
  });
  const [imageUrl,    setImageUrl]    = useState('');
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [savedOffline, setSavedOffline] = useState(false);
  const [error,       setError]       = useState('');

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

    const actionTaken = eventType === 'vaccination' && form.vaccine_name
      ? `Administered: ${form.vaccine_name}${form.action_taken ? ` — ${form.action_taken}` : ''}`
      : form.action_taken || undefined;

    // Weight check: store in symptoms as structured text
    const symptomsVal = eventType === 'weight_check' && form.weight_kg
      ? `Weight: ${form.weight_kg} kg${form.bcs ? `, BCS: ${form.bcs}/5` : ''}${form.symptoms ? `. ${form.symptoms}` : ''}`
      : form.symptoms || undefined;

    const payload: Omit<AnimalEvent, 'id' | 'created_at'> = {
      animal_id:       animalId,
      event_type:      eventType === 'weight_check' ? 'other' : eventType,
      event_date:      form.event_date,
      symptoms:        symptomsVal,
      action_taken:    actionTaken,
      risk_level:      form.risk_level       || undefined,
      eating_status:   form.eating_status    || undefined,
      mobility_status: form.mobility_status  || undefined,
      temperature:     form.temperature      ? parseFloat(form.temperature) : undefined,
      outcome:         form.outcome          || undefined,
      follow_up_date:  form.follow_up_date   || undefined,
      image_url:       imageUrl              || undefined,
    };

    try {
      await api.events.create(payload);
      setSaved(true);
      onSaved?.();
    } catch {
      // Queue offline if network is unavailable
      if (!navigator.onLine || animalId > 0) {
        enqueueEvent(payload);
        setSavedOffline(true);
        onSaved?.();
      } else {
        setError('Could not save. Check your connection.');
      }
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setSaved(false); setSavedOffline(false);
    setStep(prefillAnimalId ? 'type' : 'animal');
    setEventType('');
    setForm({
      event_date: today(), symptoms: '', action_taken: '',
      risk_level: '', eating_status: '', mobility_status: '',
      temperature: '', outcome: '', follow_up_date: '', vaccine_name: '',
      weight_kg: '', bcs: '',
    });
    setImageUrl('');
  };

  /* ── Saved (online) ──────────────────────────────────── */
  if (saved) {
    return (
      <div className="screen">
        <div className="success-screen">
          <div className="success-icon"></div>
          <div className="success-title">Event Saved</div>
          <div className="success-body">Recorded for {animalTag}</div>
          <button className="btn btn-primary btn-sm" style={{ width: 'auto', marginTop: 16 }}
            onClick={resetForm}>
            Log another
          </button>
        </div>
      </div>
    );
  }

  /* ── Saved (offline queue) ────────────────────────────── */
  if (savedOffline) {
    return (
      <div className="screen">
        <div className="success-screen">
          <WifiOff size={36} color="#D97706" style={{ margin: '0 auto 12px' }} />
          <div className="success-title" style={{ color: '#D97706' }}>Saved Offline</div>
          <div className="success-body">
            Stored on this device for {animalTag}. Will sync automatically when connected.
          </div>
          <button className="btn btn-primary btn-sm" style={{ width: 'auto', marginTop: 16 }}
            onClick={resetForm}>
            Log another
          </button>
        </div>
      </div>
    );
  }

  /* ── Step 1: Pick animal ──────────────────────────────── */
  if (step === 'animal') {
    return (
      <div className="screen">
        <div className="back-bar">
          {onBack && <button className="back-bar-btn" onClick={onBack}>← Back</button>}
          <span className="back-bar-title">Which animal?</span>
        </div>

        {animals.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Beef size={22} /></div>
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
                  <div className="animal-picker-owner">{a.species} · {a.owner_name}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ── Step 2: Pick event type ──────────────────────────── */
  if (step === 'type') {
    return (
      <div className="screen">
        <div className="back-bar">
          <button className="back-bar-btn" onClick={() => prefillAnimalId ? onBack?.() : setStep('animal')}>
            ← Back
          </button>
          <span className="back-bar-title">What happened?</span>
        </div>

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

  /* ── Step 3: Details ──────────────────────────────────── */
  const et = EVENT_TYPES.find(t => t.id === eventType);
  const needsSymptoms  = ['illness', 'injury', 'treatment'].includes(eventType);
  const isVaccination  = eventType === 'vaccination';
  const isWeightCheck  = eventType === 'weight_check';
  const needsFollowUp  = ['illness', 'treatment', 'vaccination', 'injury', 'weight_check'].includes(eventType);

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

        {/* Date */}
        <div className="field">
          <div className="field-label">Date</div>
          <input type="date" className="field-input" value={form.event_date}
            onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))} />
        </div>

        {/* Weight check fields */}
        {isWeightCheck && (
          <div className="form-row">
            <div className="field">
              <div className="field-label">Weight (kg)</div>
              <input type="number" step="0.5" className="field-input" placeholder="e.g. 245"
                value={form.weight_kg}
                onChange={e => setForm(f => ({ ...f, weight_kg: e.target.value }))} />
            </div>
            <div className="field">
              <div className="field-label">Body condition (1–5)</div>
              <select className="field-input field-select" value={form.bcs}
                onChange={e => setForm(f => ({ ...f, bcs: e.target.value }))}>
                <option value="">—</option>
                <option value="1">1 — Emaciated</option>
                <option value="2">2 — Thin</option>
                <option value="3">3 — Moderate</option>
                <option value="4">4 — Good</option>
                <option value="5">5 — Fat</option>
              </select>
            </div>
          </div>
        )}

        {/* Vaccine name (vaccination only) */}
        {isVaccination && (
          <div className="field">
            <div className="field-label">Vaccine / Medicine name</div>
            <input className="field-input" placeholder="e.g. FMD vaccine, Oxytetracycline…"
              value={form.vaccine_name}
              onChange={e => setForm(f => ({ ...f, vaccine_name: e.target.value }))} />
          </div>
        )}

        {/* Symptoms */}
        {needsSymptoms && (
          <div className="field">
            <div className="field-label">What do you see?</div>
            <textarea className="field-input field-textarea" rows={3}
              placeholder="Describe symptoms, e.g. limping, not eating, swollen…"
              value={form.symptoms}
              onChange={e => setForm(f => ({ ...f, symptoms: e.target.value }))} />
          </div>
        )}

        {/* Eating status */}
        {needsSymptoms && (
          <div className="field">
            <div className="field-label">Is it eating?</div>
            <div className="btn-group">
              {[
                { v: 'normal',     l: 'Normal' },
                { v: 'reduced',    l: 'Reduced' },
                { v: 'not_eating', l: 'Not eating' },
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

        {/* Mobility status */}
        {(needsSymptoms) && (
          <div className="field">
            <div className="field-label">Moving normally?</div>
            <div className="btn-group">
              {[
                { v: 'normal',    l: 'Yes' },
                { v: 'limping',   l: 'Limping' },
                { v: 'cannot_walk', l: 'Cannot walk' },
              ].map(o => (
                <button key={o.v}
                  className={`bg-btn ${form.mobility_status === o.v ? 'selected' : ''}`}
                  onClick={() => setForm(f => ({ ...f, mobility_status: o.v }))}>
                  {o.l}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Temperature + Risk */}
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

        {/* Action taken */}
        <div className="field">
          <div className="field-label">
            {isVaccination ? 'Additional notes' : 'Action taken'}
          </div>
          <textarea className="field-input field-textarea" rows={2}
            placeholder={isVaccination ? 'Any reactions or notes…' : 'What did you do? e.g. gave antibiotic, called vet…'}
            value={form.action_taken}
            onChange={e => setForm(f => ({ ...f, action_taken: e.target.value }))} />
        </div>

        {/* Outcome */}
        <div className="field">
          <div className="field-label">Outcome</div>
          <input className="field-input" placeholder="e.g. Recovered, Ongoing, Died…"
            value={form.outcome}
            onChange={e => setForm(f => ({ ...f, outcome: e.target.value }))} />
        </div>

        {/* Follow-up date */}
        {needsFollowUp && (
          <div className="field">
            <div className="field-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Calendar size={13} /> Follow-up date (optional)
            </div>
            <input type="date" className="field-input"
              value={form.follow_up_date}
              onChange={e => setForm(f => ({ ...f, follow_up_date: e.target.value }))} />
          </div>
        )}

        {/* Photo */}
        {(needsSymptoms || isVaccination) && (
          <div className="field">
            <div className="field-label">Photo (optional)</div>
            <PhotoCapture
              label={isVaccination ? 'Photo of animal' : 'Take photo of symptoms'}
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
