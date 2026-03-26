import { useState } from 'react';

const ADVISORIES = [
  {
    icon: '', title: 'Dry Season Disease Risk',
    region: 'Sahel & Northern Nigeria', risk: 'high' as const,
    desc: 'Low water concentrates animals, increasing FMD and CBPP spread.',
    advice: 'Ensure clean water. Increase surveillance. Avoid overgrazing water points.',
  },
  {
    icon: '', title: 'Tick Season Alert',
    region: 'East Africa (Kenya, Tanzania)', risk: 'high' as const,
    desc: 'Warm humid conditions increase ticks — higher ECF and LSD risk.',
    advice: 'Apply acaricide every 7 days. Check animals daily. Consider ECF vaccination.',
  },
  {
    icon: '', title: 'Flood Season Advisory',
    region: 'Niger Delta & Lake Victoria Basin', risk: 'moderate' as const,
    desc: 'Waterlogged conditions spread foot rot and leptospirosis.',
    advice: 'Improve drainage. Use zinc sulfate footbaths. Inspect hooves weekly.',
  },
  {
    icon: '', title: 'Harmattan Respiratory Risk',
    region: 'West Africa (Nov–Mar)', risk: 'moderate' as const,
    desc: 'Dry dusty winds stress respiratory systems — watch for CBPP.',
    advice: 'Provide windbreaks. Monitor for coughing. Check CBPP vaccination status.',
  },
  {
    icon: '', title: 'Normal Conditions',
    region: 'Central Kenya Highlands', risk: 'low' as const,
    desc: 'No unusual disease pressure. Maintain routine protocols.',
    advice: 'Keep vaccinations up to date. Deworm routinely. Check pasture quality.',
  },
];

const RISK_BORDER: Record<string, string> = {
  high: '#dc2626', moderate: '#f59e0b', low: '#16a34a',
};
const RISK_BADGE: Record<string, string> = {
  high: 'badge-red', moderate: 'badge-amber', low: 'badge-green',
};

export function WeatherAlerts() {
  const [filter, setFilter] = useState('');

  const list = filter
    ? ADVISORIES.filter(a => a.region.toLowerCase().includes(filter.toLowerCase()))
    : ADVISORIES;

  return (
    <div className="screen">
      <div className="screen-header">
        <div>
          <div className="screen-title">Alerts</div>
          <div className="screen-subtitle">Seasonal disease risks</div>
        </div>
      </div>

      <div className="search-bar">
        <span className="search-bar-icon"></span>
        <input className="search-bar-input" placeholder="Filter by region…"
          value={filter} onChange={e => setFilter(e.target.value)} />
      </div>

      <div className="alert-list">
        {list.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon"></div>
            <div className="empty-title">No alerts for that region</div>
          </div>
        )}
        {list.map((a, i) => (
          <div key={i} className="alert-card" style={{ borderLeftColor: RISK_BORDER[a.risk] }}>
            <div className="alert-card-body">
              <div className="alert-card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="alert-card-title">{a.title}</span>
                </div>
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
