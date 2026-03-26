import { useState, useEffect } from 'react';
import { api } from '../api';
import type { Medicine } from '../types';

const TYPE_FILTERS = ['Antibiotic', 'Vaccine', 'Antiprotozoal', 'Antiparasitic'];

const TYPE_ICONS: Record<string, string> = {
  'Antibiotic':        '💊',
  'Vaccine':           '🛡️',
  'Antiprotozoal':     '🔬',
  'Antiparasitic':     '🪲',
  'Topical antiseptic':'🧴',
};

export function PriceComparison() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [search, setSearch]       = useState('');
  const [type, setType]           = useState('');
  const [selected, setSelected]   = useState<Medicine | null>(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  useEffect(() => {
    setLoading(true);
    api.medicines.list(type || undefined, search || undefined)
      .then(setMedicines)
      .catch(() => setError('Could not load medicines.'))
      .finally(() => setLoading(false));
  }, [search, type]);

  return (
    <div className="screen">
      <div className="screen-header">
        <div>
          <div className="screen-title">Medicines</div>
          <div className="screen-subtitle">Prices in ₦ and KSh</div>
        </div>
      </div>

      <div className="info-box">
        ℹ️ Contact your nearest supplier for exact prices. These are guide ranges only.
      </div>

      <div className="search-bar">
        <span className="search-bar-icon">🔍</span>
        <input className="search-bar-input" placeholder="Search medicine…"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="filter-chips">
        <button className={`filter-chip ${!type ? 'active' : ''}`}
          onClick={() => setType('')}>All</button>
        {TYPE_FILTERS.map(t => (
          <button key={t} className={`filter-chip ${type === t ? 'active' : ''}`}
            onClick={() => setType(t === type ? '' : t)}>
            {TYPE_ICONS[t] ?? '💊'} {t}
          </button>
        ))}
      </div>

      {error && <div className="error-card" style={{ marginBottom: 12 }}>⚠️ {error}</div>}

      {loading ? (
        <div className="loading-screen"><div className="loading-spinner" /></div>
      ) : medicines.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💊</div>
          <div className="empty-title">No medicines found</div>
        </div>
      ) : (
        <div className="medicine-list">
          {medicines.map(m => (
            <button key={m.medicine_id} className="card-pressable medicine-card"
              onClick={() => setSelected(m)}>
              <div className="medicine-header">
                <div>
                  <span style={{ fontSize: 22, marginRight: 8 }}>
                    {TYPE_ICONS[m.type] ?? '💊'}
                  </span>
                  <span className="medicine-name">{m.name}</span>
                </div>
                <span className="badge badge-gray">{m.type}</span>
              </div>
              <div className="medicine-indication">{m.indication}</div>
              <div className="medicine-price">{m.price_range ?? 'Contact supplier'}</div>
            </button>
          ))}
        </div>
      )}

      {/* Medicine detail sheet */}
      {selected && (
        <div className="sheet-overlay" onClick={() => setSelected(null)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 24 }}>{TYPE_ICONS[selected.type] ?? '💊'}</span>
                  <span className="badge badge-gray">{selected.type}</span>
                </div>
                <div className="sheet-title">{selected.name}</div>
              </div>
              <button className="sheet-close" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="sheet-body">
              <div className="sheet-section">
                <div className="sheet-section-title">Used for</div>
                <div className="sheet-section-body">{selected.indication}</div>
              </div>
              {selected.dosage && (
                <div className="sheet-section">
                  <div className="sheet-section-title">Dosage</div>
                  <div className="sheet-section-body">{selected.dosage}</div>
                </div>
              )}
              <div className="sheet-section">
                <div className="sheet-section-title">Price Range</div>
                <div className="sheet-section-body" style={{ fontSize: 16, fontWeight: 700, color: 'var(--green-dark)' }}>
                  {selected.price_range ?? 'Contact supplier for price'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
