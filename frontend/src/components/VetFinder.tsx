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
        vets.map(v => (
          <div key={v.vet_id} className="vet-card">
            <div className="vet-avatar"><Stethoscope size={20} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="vet-name">{v.name}</div>
              <div className="vet-loc" style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <MapPin size={10} />
                {v.location}{v.state ? `, ${v.state}` : ''} · {v.country}
              </div>
              {v.specialization && <div className="vet-spec">{v.specialization}</div>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
              <span className={`badge ${v.available === 'yes' ? 'badge-green' : 'badge-gray'}`}>
                {v.available === 'yes' ? 'Available' : 'Busy'}
              </span>
              <a href={`tel:${v.phone}`} className="vet-call-btn">
                <Phone size={13} /> Call
              </a>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
