import { useState, useEffect } from 'react';
import { api } from '../api';
import type { Disease } from '../types';

const SPECIES_FILTERS = ['Cattle', 'Sheep', 'Goats', 'Pigs', 'Buffalo'];

const SEVERITY_CONFIG: Record<string, { bg: string; text: string; badge: string }> = {
  high:     { bg: '#fee2e2', text: '#991b1b', badge: 'badge-red'    },
  moderate: { bg: '#fef3c7', text: '#92400e', badge: 'badge-amber'  },
  low:      { bg: '#dcfce7', text: '#166534', badge: 'badge-green'  },
};

const DISEASE_ICONS: Record<string, string> = {
  'Foot and Mouth Disease (FMD)':                       '',
  'Contagious Bovine Pleuropneumonia (CBPP)':           '',
  'Foot Rot (Interdigital Necrobacillosis)':            '',
  'East Coast Fever (ECF)':                            '',
  'Lumpy Skin Disease (LSD)':                          '',
};

function diseaseIcon(name: string) {
  return DISEASE_ICONS[name] ?? '';
}

export function DiseaseChecker() {
  const [diseases, setDiseases]  = useState<Disease[]>([]);
  const [search, setSearch]      = useState('');
  const [species, setSpecies]    = useState('');
  const [selected, setSelected]  = useState<Disease | null>(null);
  const [loading, setLoading]    = useState(false);
  const [error, setError]        = useState('');

  useEffect(() => {
    setLoading(true);
    api.diseases.list(search || undefined, species || undefined)
      .then(setDiseases)
      .catch(() => setError('Could not load diseases.'))
      .finally(() => setLoading(false));
  }, [search, species]);

  const cfg = selected ? (SEVERITY_CONFIG[selected.severity] ?? SEVERITY_CONFIG.moderate) : null;

  return (
    <div className="screen">
      <div className="screen-header">
        <div>
          <div className="screen-title">Diseases</div>
          <div className="screen-subtitle">Know what to watch for</div>
        </div>
      </div>

      {/* Search */}
      <div className="search-bar">
        <span className="search-bar-icon"></span>
        <input className="search-bar-input" placeholder="Search disease or symptom…"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Species filter chips */}
      <div className="filter-chips">
        <button className={`filter-chip ${!species ? 'active' : ''}`}
          onClick={() => setSpecies('')}>All</button>
        {SPECIES_FILTERS.map(s => (
          <button key={s} className={`filter-chip ${species === s ? 'active' : ''}`}
            onClick={() => setSpecies(s === species ? '' : s)}>
            {s}
          </button>
        ))}
      </div>

      {error && <div className="error-card" style={{ marginBottom: 12 }}>{error}</div>}

      {loading ? (
        <div className="loading-screen"><div className="loading-spinner" /></div>
      ) : diseases.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"></div>
          <div className="empty-title">No diseases found</div>
        </div>
      ) : (
        <div className="disease-list">
          {diseases.map(d => {
            const sc = SEVERITY_CONFIG[d.severity] ?? SEVERITY_CONFIG.moderate;
            return (
              <button key={d.disease_id} className="disease-card" onClick={() => setSelected(d)}>
                <div className="disease-icon-col">
                  <div className="disease-icon-box" style={{ background: sc.bg }}>
                    <span>{diseaseIcon(d.name)}</span>
                  </div>
                </div>
                <div className="disease-info">
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
                    <span className="disease-name">{d.name}</span>
                    <span className={`badge ${sc.badge}`}>{d.severity}</span>
                  </div>
                  <div className="disease-species">Affects: {d.affected_species}</div>
                  <div className="disease-snippet">{d.symptoms}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Disease detail sheet */}
      {selected && cfg && (
        <div className="sheet-overlay" onClick={() => setSelected(null)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 28 }}>{diseaseIcon(selected.name)}</span>
                  <span className={`badge ${cfg.badge}`}>{selected.severity}</span>
                  {selected.is_contagious === 'yes' && (
                    <span className="badge badge-red">Contagious</span>
                  )}
                </div>
                <div className="sheet-title">{selected.name}</div>
              </div>
              <button className="sheet-close" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="sheet-body">
              <div className="sheet-section">
                <div className="sheet-section-title">Affects</div>
                <div className="sheet-section-body">{selected.affected_species}</div>
              </div>
              <div className="sheet-section">
                <div className="sheet-section-title">Symptoms</div>
                <div className="sheet-section-body">{selected.symptoms}</div>
              </div>
              <div className="sheet-section">
                <div className="sheet-section-title">Treatment</div>
                <div className="sheet-section-body">{selected.treatment_guidance}</div>
              </div>
              {selected.prevention && (
                <div className="sheet-section">
                  <div className="sheet-section-title">Prevention</div>
                  <div className="sheet-section-body">{selected.prevention}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
