/**
 * TriageTool — one question per screen, tap-only.
 * No emoji. Lucide icons throughout.
 */
import { useState } from 'react';
import {
  ArrowLeft, Stethoscope, Leaf, Footprints, Eye, Wind, Droplets,
  Thermometer, Activity, CheckCircle2, XCircle, SkipForward,
  Volume2, VolumeX, Beef, Rabbit, ShieldAlert, AlertTriangle,
  CircleAlert, CircleCheck, Lock, Phone, FileText,
} from 'lucide-react';
import { api } from '../api';
import type { TriageInput, TriageOutput, AnimalEvent } from '../types';
import { speak, canSpeak } from '../utils/audio';

/* ── Species ────────────────────────────────────────────── */
const SPECIES = [
  { value: 'cattle',  label: 'Cattle'  },
  { value: 'sheep',   label: 'Sheep'   },
  { value: 'goats',   label: 'Goats'   },
  { value: 'pigs',    label: 'Pigs'    },
  { value: 'buffalo', label: 'Buffalo' },
  { value: 'other',   label: 'Other'   },
];

function SpeciesIcon({ species, size = 28 }: { species: string; size?: number }) {
  const s = species.toLowerCase();
  if (s === 'cattle' || s === 'buffalo') return <Beef size={size} />;
  if (s === 'goats')  return <Rabbit size={size} />;
  return <Activity size={size} />;
}

/* ── Questions ──────────────────────────────────────────── */
interface Question {
  id: string;
  Icon: React.FC<{ size?: number }>;
  question: string;
  hint?: string;
  yesLabel: string;
  noLabel:  string;
  setYes: (i: TriageInput) => TriageInput;
  setNo:  (i: TriageInput) => TriageInput;
}

const QUESTIONS: Question[] = [
  {
    id: 'eating',
    Icon: ({ size }) => <Leaf size={size} />,
    question: 'Is it eating?',
    hint: 'Eating grass, feed or drinking water normally',
    yesLabel: 'Yes, eating normally',
    noLabel:  'Not eating or eating less',
    setYes: i => ({ ...i, eating: true }),
    setNo:  i => ({ ...i, eating: false }),
  },
  {
    id: 'walking',
    Icon: ({ size }) => <Footprints size={size} />,
    question: 'Is it walking normally?',
    hint: 'Can it move freely without limping?',
    yesLabel: 'Yes, walking fine',
    noLabel:  'Limping or cannot walk',
    setYes: i => ({ ...i, lameness: false }),
    setNo:  i => ({ ...i, lameness: true }),
  },
  {
    id: 'lesions',
    Icon: ({ size }) => <Eye size={size} />,
    question: 'Do you see sores or wounds?',
    hint: 'On mouth, feet, skin or anywhere on the body',
    yesLabel: 'Yes, I see sores or wounds',
    noLabel:  'No sores or wounds',
    setYes: i => ({ ...i, lesions: true }),
    setNo:  i => ({ ...i, lesions: false }),
  },
  {
    id: 'coughing',
    Icon: ({ size }) => <Wind size={size} />,
    question: 'Is it coughing?',
    hint: 'A dry or wet cough, or laboured breathing',
    yesLabel: 'Yes, coughing',
    noLabel:  'No coughing',
    setYes: i => ({ ...i, coughing: true }),
    setNo:  i => ({ ...i, coughing: false }),
  },
  {
    id: 'nasal',
    Icon: ({ size }) => <Droplets size={size} />,
    question: 'Does it have a runny nose or eyes?',
    hint: 'Watery or thick discharge from nose or eyes',
    yesLabel: 'Yes, runny nose or eyes',
    noLabel:  'No discharge',
    setYes: i => ({ ...i, nasal_discharge: true }),
    setNo:  i => ({ ...i, nasal_discharge: false }),
  },
  {
    id: 'saliva',
    Icon: ({ size }) => <Droplets size={size} />,
    question: 'Is it drooling a lot?',
    hint: 'Unusually large amounts of saliva or foam',
    yesLabel: 'Yes, drooling or foaming',
    noLabel:  'Normal saliva',
    setYes: i => ({ ...i, salivation: true }),
    setNo:  i => ({ ...i, salivation: false }),
  },
  {
    id: 'fever',
    Icon: ({ size }) => <Thermometer size={size} />,
    question: 'Does it feel hot or feverish?',
    hint: 'Body feels unusually warm to the touch',
    yesLabel: 'Yes, feels hot',
    noLabel:  'Normal temperature',
    setYes: i => ({ ...i, fever: true }),
    setNo:  i => ({ ...i, fever: false }),
  },
];

const RISK_CONFIG = {
  emergency: { bg: '#DC2626', Icon: ShieldAlert,     label: 'EMERGENCY', action: 'Isolate now. Call a vet immediately.' },
  high:      { bg: '#EA580C', Icon: AlertTriangle,   label: 'HIGH RISK', action: 'Isolate animal. See a vet today.' },
  moderate:  { bg: '#D97706', Icon: CircleAlert,     label: 'MODERATE',  action: 'Begin treatment. Monitor closely.' },
  low:       { bg: '#2D6A4F', Icon: CircleCheck,     label: 'LOW RISK',  action: 'Monitor the animal. Provide water and shade.' },
};

interface Props {
  onLogEvent?: (data: Partial<AnimalEvent>) => void;
  onBack?:     () => void;
}

export function TriageTool({ onLogEvent, onBack }: Props) {
  const [step,    setStep]    = useState<'species' | 'questions' | 'result'>('species');
  const [qIndex,  setQIndex]  = useState(0);
  const [input,   setInput]   = useState<TriageInput>({ species: '' });
  const [result,  setResult]  = useState<TriageOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [audioOn, setAudioOn] = useState(false);

  const answer = (yes: boolean) => {
    const q       = QUESTIONS[qIndex];
    const updated = yes ? q.setYes(input) : q.setNo(input);
    setInput(updated);
    if (qIndex + 1 < QUESTIONS.length) {
      setQIndex(qIndex + 1);
    } else {
      submit(updated);
    }
  };

  const submit = async (finalInput: TriageInput) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.triage.assess(finalInput);
      setResult(res);
      setStep('result');
      if (audioOn) {
        const map: Record<string, string> = {
          emergency: 'Warning: emergency. Isolate the animal now and call a vet.',
          high:      'High risk. Isolate this animal and call a vet today.',
          moderate:  'Moderate risk. Begin treatment and monitor for two to three days.',
          low:       'Low risk. Keep the animal comfortable and watch for changes.',
        };
        speak(map[res.risk_level] ?? '');
      }
    } catch {
      setError('Could not connect. Check your internet and try again.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep('species'); setQIndex(0);
    setInput({ species: '' }); setResult(null);
    setError(''); setLoading(false);
  };

  const goBack = () => {
    if (step === 'questions' && qIndex > 0) { setQIndex(qIndex - 1); return; }
    if (step === 'questions')               { setStep('species');     return; }
    if (step === 'result')                  { reset();                return; }
    onBack?.();
  };

  /* ── Species selection ─────────────────────────────────── */
  if (step === 'species') {
    return (
      <div className="triage-screen">
        <div className="triage-top">
          <button className="back-bar-btn" onClick={onBack ?? (() => {})}>
            {onBack ? <><ArrowLeft size={18} /> Back</> : null}
          </button>
          {canSpeak() && (
            <button style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600 }}
              onClick={() => setAudioOn(a => !a)}>
              {audioOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
              {audioOn ? 'Audio on' : 'Audio off'}
            </button>
          )}
        </div>

        <div className="triage-body" style={{ justifyContent: 'flex-start', paddingTop: 8 }}>
          <div className="triage-q-icon">
            <Stethoscope size={32} />
          </div>
          <div className="triage-question">Health Check</div>
          <div className="triage-hint">Which animal needs checking?</div>
          <div className="species-grid">
            {SPECIES.map(s => (
              <button
                key={s.value}
                className={`species-btn ${input.species === s.value ? 'selected' : ''}`}
                onClick={() => setInput(i => ({ ...i, species: s.value }))}
              >
                <div className="species-icon">
                  <SpeciesIcon species={s.value} size={28} />
                </div>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="triage-answers">
          <button className="btn btn-primary" disabled={!input.species}
            onClick={() => { setQIndex(0); setStep('questions'); }}>
            Start Check
          </button>
        </div>
      </div>
    );
  }

  /* ── Loading ──────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="loading-screen" style={{ minHeight: 'calc(100dvh - 68px)' }}>
        <div className="loading-spinner" />
        <span>Assessing symptoms...</span>
      </div>
    );
  }

  /* ── Question screen ──────────────────────────────────── */
  if (step === 'questions') {
    const q           = QUESTIONS[qIndex];
    const speciesObj  = SPECIES.find(s => s.value === input.species);
    return (
      <div className="triage-screen">
        <div style={{ padding: '14px 16px 8px' }}>
          <div className="triage-progress">
            {QUESTIONS.map((_, i) => (
              <div key={i} className={`triage-progress-dot ${i < qIndex ? 'done' : i === qIndex ? 'current' : ''}`} />
            ))}
          </div>
        </div>

        <div className="triage-top">
          <button className="back-bar-btn" onClick={goBack}><ArrowLeft size={18} /> Back</button>
          {speciesObj && (
            <div className="species-chip">
              <SpeciesIcon species={speciesObj.value} size={14} />
              {speciesObj.label}
            </div>
          )}
        </div>

        <div className="triage-body">
          <div className="triage-q-icon"><q.Icon size={32} /></div>
          <div className="triage-question">{q.question}</div>
          {q.hint && <div className="triage-hint">{q.hint}</div>}
        </div>

        {error && <div className="error-card" style={{ margin: '0 16px 12px' }}>{error}</div>}

        <div className="triage-answers">
          <button className="triage-btn-yes" onClick={() => answer(true)}>
            <CheckCircle2 size={20} /> {q.yesLabel}
          </button>
          <button className="triage-btn-no" onClick={() => answer(false)}>
            <XCircle size={20} /> {q.noLabel}
          </button>
          <button className="triage-skip" onClick={() => answer(true)}>
            <SkipForward size={14} style={{ display: 'inline', marginRight: 4 }} />
            Not sure — skip
          </button>
        </div>
      </div>
    );
  }

  /* ── Result screen ────────────────────────────────────── */
  if (step === 'result' && result) {
    const cfg         = RISK_CONFIG[result.risk_level] ?? RISK_CONFIG.low;
    const RiskIcon    = cfg.Icon;
    const speciesObj  = SPECIES.find(s => s.value === input.species);

    const handleLog = () => {
      const conditions = result.likely_conditions.map(c => c.condition).join(', ');
      onLogEvent?.({
        event_type:     'illness',
        event_date:     new Date().toISOString().split('T')[0],
        symptoms:       conditions || undefined,
        risk_level:     result.risk_level,
        recommendation: result.recommendation,
      });
    };

    return (
      <div style={{ paddingBottom: 24 }}>
        {/* Hero */}
        <div className="triage-result-hero" style={{ background: cfg.bg }}>
          <div className="triage-result-icon"><RiskIcon size={32} color="white" /></div>
          <div className="triage-result-level">{cfg.label}</div>
          <div className="triage-result-action-text">{cfg.action}</div>
          {speciesObj && (
            <div style={{ marginTop: 8, fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>
              {speciesObj.label}
            </div>
          )}
        </div>

        {/* Action cards */}
        {(result.isolate_animal || result.call_vet) && (
          <div className="triage-action-cards">
            {result.isolate_animal && (
              <div className="triage-action-card tac-isolate">
                <Lock size={24} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>Isolate this animal</div>
                  <div style={{ fontSize: 12, marginTop: 2, opacity: 0.85 }}>Separate from the herd immediately</div>
                </div>
              </div>
            )}
            {result.call_vet && (
              <div className="triage-action-card tac-vet">
                <Phone size={24} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>
                    Call a vet{result.urgency_hours ? ` within ${result.urgency_hours}h` : ''}
                  </div>
                  <div style={{ fontSize: 12, marginTop: 2, opacity: 0.85 }}>
                    {result.urgency_hours === 2 ? 'This is urgent — act now' : 'Do not sell or move the animal'}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Conditions */}
        {result.likely_conditions.length > 0 && (
          <>
            <div className="section-label">Possible conditions</div>
            <div className="conditions-list">
              {result.likely_conditions.map((c, i) => (
                <div key={i} className="condition-card">
                  <div className="condition-top">
                    <span className="condition-name">{c.condition}</span>
                    <span className={`badge ${c.confidence === 'likely' ? 'badge-red' : 'badge-amber'}`}>
                      {c.confidence}
                    </span>
                  </div>
                  <div className="condition-econ">{c.economic_note}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Suggested vets */}
        {result.suggested_vets.length > 0 && (
          <>
            <div className="section-label">Vets in your area</div>
            <div className="result-vets">
              {result.suggested_vets.map(v => (
                <div key={v.vet_id} className="result-vet-card">
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--brand-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)', flexShrink: 0 }}>
                    <Stethoscope size={20} />
                  </div>
                  <div className="result-vet-info" style={{ flex: 1 }}>
                    <div className="result-vet-name">{v.name}</div>
                    <div className="result-vet-loc">{v.location}</div>
                  </div>
                  <a href={`tel:${v.phone}`} className="result-vet-call">Call</a>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Rationale */}
        {result.rationale.length > 0 && (
          <>
            <div className="section-label">Why this result</div>
            <div className="rationale-list">
              {result.rationale.map((r, i) => (
                <div key={i} className="rationale-item">{r}</div>
              ))}
            </div>
          </>
        )}

        {/* Economic note */}
        {result.economic_note && (
          <div className="econ-card">
            <div className="econ-card-title">Economic Impact</div>
            {result.economic_note}
          </div>
        )}

        {/* Footer */}
        <div className="result-footer">
          {onLogEvent && (
            <button className="btn btn-primary" onClick={handleLog}>
              <FileText size={18} /> Save as Event
            </button>
          )}
          <button className="btn btn-outline" onClick={reset}>
            Check another animal
          </button>
        </div>
      </div>
    );
  }

  return null;
}
