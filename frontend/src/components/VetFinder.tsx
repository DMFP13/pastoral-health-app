import { useState, useEffect } from 'react';
import { Stethoscope, MapPin, Phone, Search } from 'lucide-react';
import { api } from '../api';
import type { Vet, UserLocation } from '../types';
import { getSavedLocation } from '../utils/location';

const COUNTRIES = ['Nigeria', 'Kenya'];
interface Props { location?: UserLocation; }

export function VetFinder({ location }: Props) {
  const loc = location ?? getSavedLocation() ?? {};
  const [vets,    setVets]    = useState<Vet[]>([]);
  const [search,  setSearch]  = useState('');
  const [country, setCountry] = useState(loc.country ?? '');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [scope,   setScope]   = useState<'state' | 'country' | 'all'>(
    loc.state ? 'state' : loc.country ? 'country' : 'all'
  );

  useEffect(() => {
    setLoading(true); setError('');
    const stateF   = scope === 'state' ? (loc.state ?? undefined) : undefined;
    const countryF = scope === 'all' ? (country || undefined) : (country || loc.country || undefined);
    api.vets.list(countryF, stateF, search || undefined)
      .then(setVets)
      .catch(() => setError('Could not load vets.'))
      .finally(() => setLoading(false));
  }, [search, country, scope, loc.state, loc.country]);

  return (
    <div style={{ paddingBottom: 16 }}>
      <div style={{ padding: '24px 16px 8px' }}>
        <div className="screen-title">Vets</div>
        <div className="screen-subtitle">Tap to call immediately</div>
      </div>

      {loc.state && (
        <div className="filter-row">
          <button className={`filter-chip ${scope === 'state'   ? 'active' : ''}`} onClick={() => setScope('state')}>
            {loc.state}
          </button>
          <button className={`filter-chip ${scope === 'country' ? 'active' : ''}`} onClick={() => setScope('country')}>
            {loc.country ?? 'Country'}
          </button>
          <button className={`filter-chip ${scope === 'all' ? 'active' : ''}`} onClick={() => setScope('all')}>
            All
          </button>
        </div>
      )}

      {!loc.state && (
        <div className="filter-row">
          <button className={`filter-chip ${!country ? 'active' : ''}`} onClick={() => setCountry('')}>All</button>
          {COUNTRIES.map(c => (
            <button key={c} className={`filter-chip ${country === c ? 'active' : ''}`}
              onClick={() => setCountry(c === country ? '' : c)}>{c}</button>
          ))}
        </div>
      )}

      <div className="search-bar">
        <Search size={16} className="search-bar-icon" />
        <input placeholder="Search name or location..." value={search}
          onChange={e => setSearch(e.target.value)} />
      </div>

      {error && <div className="error-card" style={{ margin: '0 16px 12px' }}>{error}</div>}

      {loading ? (
        <div className="loading-screen"><div className="loading-spinner" /></div>
      ) : vets.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Stethoscope size={24} /></div>
          <div className="empty-title">No vets found</div>
          <div className="empty-sub">Try expanding the area filter.</div>
          {scope !== 'all' && (
            <button className="btn btn-outline" style={{ marginTop: 12, width: 'auto' }} onClick={() => setScope('all')}>
              Search everywhere
            </button>
          )}
        </div>
      ) : (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {vets.map(v => (
            <div key={v.vet_id} style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-xl)',
              overflow: 'hidden',
              boxShadow: 'var(--sh-sm)',
            }}>
              {/* Info row */}
              <div style={{ padding: '14px 14px 12px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'var(--brand-tint)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, color: 'var(--brand)',
                }}>
                  <Stethoscope size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{v.name}</div>
                    <span className={`badge ${v.available === 'yes' ? 'badge-green' : 'badge-gray'}`} style={{ fontSize: 10 }}>
                      {v.available === 'yes' ? 'Available' : 'Busy'}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3, marginBottom: 3 }}>
                    <MapPin size={10} />
                    {v.location}{v.state ? `, ${v.state}` : ''}
                  </div>
                  {v.specialization && (
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{v.specialization}</div>
                  )}
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{v.phone}</div>
                </div>
              </div>
              {/* Full-width call button */}
              <a
                href={`tel:${v.phone}`}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: 'var(--brand)',
                  color: 'white',
                  padding: '13px 0',
                  fontWeight: 700,
                  fontSize: 15,
                  textDecoration: 'none',
                  borderTop: '1px solid var(--brand-dark)',
                }}
              >
                <Phone size={16} /> Call {v.name.split(' ').pop()}
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
