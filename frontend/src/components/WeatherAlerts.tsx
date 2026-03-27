import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { UserLocation } from '../types';
import { getSeasonalRisk, locationLabel } from '../utils/location';

const ADVISORIES = [
  {
    title:  'Dry Season Disease Risk',
    region: 'Sahel & Northern Nigeria', risk: 'high' as const,
    countries: ['nigeria'],
    desc:   'Low water concentrates animals, increasing FMD and CBPP spread.',
    advice: 'Ensure clean water. Increase surveillance. Avoid overgrazing water points.',
  },
  {
    title:  'Tick Season Alert',
    region: 'East Africa (Kenya, Tanzania)', risk: 'high' as const,
    countries: ['kenya'],
    desc:   'Warm humid conditions increase ticks — higher ECF and LSD risk.',
    advice: 'Apply acaricide every 7 days. Check animals daily. Consider ECF vaccination.',
  },
  {
    title:  'Flood Season Advisory',
    region: 'Niger Delta & Lake Victoria Basin', risk: 'moderate' as const,
    countries: ['nigeria', 'kenya'],
    desc:   'Waterlogged conditions spread foot rot and leptospirosis.',
    advice: 'Improve drainage. Use zinc sulfate footbaths. Inspect hooves weekly.',
  },
  {
    title:  'Harmattan Respiratory Risk',
    region: 'West Africa (Nov–Mar)', risk: 'moderate' as const,
    countries: ['nigeria'],
    desc:   'Dry dusty winds stress respiratory systems — watch for CBPP.',
    advice: 'Provide windbreaks. Monitor for coughing. Check CBPP vaccination status.',
  },
  {
    title:  'Normal Conditions',
    region: 'Central Kenya Highlands', risk: 'low' as const,
    countries: ['kenya'],
    desc:   'No unusual disease pressure. Maintain routine protocols.',
    advice: 'Keep vaccinations up to date. Deworm routinely. Check pasture quality.',
  },
];

const RISK_BORDER: Record<string, string> = {
  high: '#dc2626', moderate: '#f59e0b', low: '#16a34a',
};
const RISK_BADGE: Record<string, string> = {
  high: 'badge-red', moderate: 'badge-amber', low: 'badge-green',
};
const RISK_COLOR: Record<string, string> = {
  high: 'var(--red)', moderate: 'var(--amber)', low: 'var(--brand)',
};

interface Props { location?: UserLocation | null; }

export function WeatherAlerts({ location }: Props) {
  const [filter, setFilter] = useState('');

  const userCountry = (location?.country ?? '').toLowerCase();

  // Pre-filter advisories by farming country when available
  const countryFiltered = userCountry
    ? ADVISORIES.filter(a => a.countries.some(c => userCountry.includes(c)))
    : ADVISORIES;

  const list = filter
    ? countryFiltered.filter(a =>
        a.region.toLowerCase().includes(filter.toLowerCase()) ||
        a.title.toLowerCase().includes(filter.toLowerCase())
      )
    : countryFiltered;

  const seasonal = location ? getSeasonalRisk(location) : null;
  const locLabel  = location ? locationLabel(location) : null;

  return (
    <div className="screen">
      <div className="screen-header">
        <div>
          <div className="screen-title">Alerts</div>
          <div className="screen-subtitle">
            {locLabel ? `Seasonal disease risks — ${locLabel}` : 'Seasonal disease risks'}
          </div>
        </div>
      </div>

      {/* Personalised seasonal card */}
      {seasonal && (
        <div style={{
          margin: '0 16px 16px',
          background: 'var(--surface)',
          border: `1.5px solid ${RISK_COLOR[seasonal.diseaseRisk]}33`,
          borderLeft: `4px solid ${RISK_COLOR[seasonal.diseaseRisk]}`,
          borderRadius: 'var(--r-lg)',
          padding: '14px 16px',
          display: 'flex', alignItems: 'flex-start', gap: 12,
        }}>
          <AlertTriangle size={20} color={RISK_COLOR[seasonal.diseaseRisk]} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>
              {seasonal.season} — disease risk:{' '}
              <span style={{ color: RISK_COLOR[seasonal.diseaseRisk], textTransform: 'uppercase', fontSize: 11 }}>
                {seasonal.diseaseRisk}
              </span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {seasonal.tip}
            </div>
          </div>
        </div>
      )}

      <div className="search-bar">
        <span className="search-bar-icon"></span>
        <input
          className="search-bar-input"
          placeholder="Filter by region or disease…"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
      </div>

      <div className="alert-list">
        {list.length === 0 && (
          <div className="empty-state">
            <div className="empty-title">No alerts for that region</div>
          </div>
        )}
        {list.map((a, i) => (
          <div key={i} className="alert-card" style={{ borderLeftColor: RISK_BORDER[a.risk] }}>
            <div className="alert-card-body">
              <div className="alert-card-header">
                <span className="alert-card-title">{a.title}</span>
                <span className={`badge ${RISK_BADGE[a.risk]}`}>{a.risk}</span>
              </div>
              <div className="alert-region">{a.region}</div>
              <div className="alert-desc">{a.desc}</div>
              <div className="alert-advice">{a.advice}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
