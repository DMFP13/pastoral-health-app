import { useState, useEffect } from 'react';
import { MapPin, Search, ExternalLink, ShoppingCart, Package, Syringe, Truck, Globe } from 'lucide-react';
import { api } from '../api';
import type { Supplier, UserLocation } from '../types/index';
import { getSavedLocation } from '../utils/location';

/* ── Online store catalogue ─────────────────────────────── */
interface OnlineStore {
  id:         string;
  name:       string;
  tagline:    string;
  url:        string;
  countries:  string[];        // which countries they ship to
  categories: string[];        // product categories
  highlight?: string;          // e.g. "Ships same day in Lagos"
  color:      string;
}

const ONLINE_STORES: OnlineStore[] = [
  {
    id:         'afrimash',
    name:       'Afrimash',
    tagline:    'Nigeria\'s largest online agro-vet marketplace. Vaccines, medicines, feed & equipment delivered nationwide.',
    url:        'https://afrimash.com',
    countries:  ['Nigeria', 'Ghana', 'Other'],
    categories: ['Vaccines', 'Medicines', 'Feed', 'Equipment'],
    highlight:  'Free delivery on orders over ₦20,000',
    color:      '#2D6A4F',
  },
  {
    id:         'agrovet-market',
    name:       'Agrovet Market',
    tagline:    'Kenya\'s leading online vet supply store. Wide range of livestock drugs, vaccines and diagnostics.',
    url:        'https://agrovetmarket.com',
    countries:  ['Kenya', 'Uganda', 'Tanzania'],
    categories: ['Vaccines', 'Medicines', 'Diagnostics', 'Equipment'],
    highlight:  'Serving East Africa since 2015',
    color:      '#0369A1',
  },
  {
    id:         'livestockaid',
    name:       'Livestock Aid Nigeria',
    tagline:    'Specialist in livestock vaccines and veterinary drugs. Bulk orders for herders and cooperatives.',
    url:        'https://livestockaid.com.ng',
    countries:  ['Nigeria'],
    categories: ['Vaccines', 'Medicines', 'Supplements'],
    highlight:  'Bulk discounts for herd owners',
    color:      '#D97706',
  },
  {
    id:         'kilimochoice',
    name:       'KilimoChoice',
    tagline:    'Online agrovet shop for East African farmers. Trusted brands at farm-gate prices.',
    url:        'https://kilimochoice.com',
    countries:  ['Kenya', 'Tanzania'],
    categories: ['Medicines', 'Pesticides', 'Equipment'],
    color:      '#7C3AED',
  },
  {
    id:         'farmtrove',
    name:       'Farmtrove Africa',
    tagline:    'Pan-African agricultural marketplace connecting farmers to suppliers of medicines, feeds and farm inputs.',
    url:        'https://farmtrove.africa',
    countries:  ['Nigeria', 'Kenya', 'Ghana', 'Other'],
    categories: ['Medicines', 'Feed', 'Equipment', 'Inputs'],
    color:      '#0F766E',
  },
  {
    id:         'jumia-agro',
    name:       'Jumia Agro',
    tagline:    'Agro section on Jumia marketplace — vet products, farm tools and livestock feeds with fast delivery.',
    url:        'https://www.jumia.com.ng/mlp-farm-agro-market/',
    countries:  ['Nigeria'],
    categories: ['Medicines', 'Equipment', 'Feed'],
    color:      '#EA580C',
  },
];

const CATEGORY_ICON: Record<string, React.ReactNode> = {
  Vaccines:    <Syringe size={11} />,
  Medicines:   <Package size={11} />,
  Equipment:   <ShoppingCart size={11} />,
  Feed:        <Package size={11} />,
  Supplements: <Package size={11} />,
  Diagnostics: <Package size={11} />,
  Pesticides:  <Package size={11} />,
  Inputs:      <Package size={11} />,
};

const COUNTRIES = ['Nigeria', 'Kenya'];

interface Props { location?: UserLocation; }

type ViewTab = 'local' | 'online';

export function SupplierLocator({ location }: Props) {
  const loc = location ?? getSavedLocation() ?? {};

  const [viewTab, setViewTab] = useState<ViewTab>('local');

  /* ── Local suppliers state ── */
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search,    setSearch]    = useState('');
  const [country,   setCountry]   = useState(loc.country ?? '');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [scope, setScope] = useState<'state' | 'country' | 'all'>(
    loc.state ? 'state' : loc.country ? 'country' : 'all'
  );

  /* ── Online stores filter ── */
  const [onlineSearch, setOnlineSearch] = useState('');

  useEffect(() => {
    if (viewTab !== 'local') return;
    setLoading(true);
    const stateFilter   = scope === 'state' ? (loc.state ?? undefined) : undefined;
    const countryFilter = scope === 'all'   ? (country || undefined)
                        : (country || loc.country || undefined);
    api.suppliers.list(countryFilter, search || undefined)
      .then(data => {
        if (stateFilter) {
          setSuppliers(data.filter(s => s.location.toLowerCase().includes(stateFilter.toLowerCase())));
        } else {
          setSuppliers(data);
        }
      })
      .catch(() => setError('Could not load suppliers.'))
      .finally(() => setLoading(false));
  }, [search, country, scope, loc.state, loc.country, viewTab]);

  /* Filter online stores by user country + search text */
  const userCountry = loc.country ?? '';
  const filteredStores = ONLINE_STORES.filter(store => {
    const matchesCountry = !userCountry
      || store.countries.includes(userCountry)
      || store.countries.includes('Other');
    const q = onlineSearch.toLowerCase();
    const matchesSearch = !q
      || store.name.toLowerCase().includes(q)
      || store.categories.some(c => c.toLowerCase().includes(q))
      || store.tagline.toLowerCase().includes(q);
    return matchesCountry && matchesSearch;
  });

  return (
    <div className="screen">
      {/* Header */}
      <div className="screen-header">
        <div>
          <div className="screen-title">Suppliers</div>
          <div className="screen-subtitle">Buy medicines and vaccines</div>
        </div>
      </div>

      {/* Tab switcher */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        margin: '0 16px 16px',
        background: 'var(--border-light)',
        borderRadius: 'var(--r-lg)',
        padding: 3,
        gap: 3,
      }}>
        {(['local', 'online'] as ViewTab[]).map(t => (
          <button
            key={t}
            onClick={() => setViewTab(t)}
            style={{
              padding: '9px 0',
              borderRadius: 'calc(var(--r-lg) - 3px)',
              border: 'none',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              transition: 'all .15s',
              background: viewTab === t ? 'var(--surface)' : 'transparent',
              color: viewTab === t ? 'var(--brand)' : 'var(--text-muted)',
              boxShadow: viewTab === t ? 'var(--sh-sm)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            {t === 'local' ? <><MapPin size={14} /> Nearby</> : <><Globe size={14} /> Online Stores</>}
          </button>
        ))}
      </div>

      {/* ── LOCAL TAB ── */}
      {viewTab === 'local' && (
        <>
          {loc.state && (
            <div className="filter-chips">
              <button className={`filter-chip ${scope === 'state'   ? 'active' : ''}`} onClick={() => setScope('state')}>
                {loc.state}
              </button>
              <button className={`filter-chip ${scope === 'country' ? 'active' : ''}`} onClick={() => setScope('country')}>
                {loc.country ?? 'Country'}
              </button>
              <button className={`filter-chip ${scope === 'all'     ? 'active' : ''}`} onClick={() => setScope('all')}>
                All
              </button>
            </div>
          )}

          {!loc.state && (
            <div className="filter-chips">
              <button className={`filter-chip ${!country ? 'active' : ''}`} onClick={() => setCountry('')}>All</button>
              {COUNTRIES.map(c => (
                <button key={c} className={`filter-chip ${country === c ? 'active' : ''}`}
                  onClick={() => setCountry(c === country ? '' : c)}>
                  {c}
                </button>
              ))}
            </div>
          )}

          <div className="search-bar">
            <Search size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
            <input className="search-bar-input" placeholder="Search by name or location…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {error && <div className="error-card" style={{ marginBottom: 12 }}>{error}</div>}

          {loading ? (
            <div className="loading-screen"><div className="loading-spinner" /></div>
          ) : suppliers.length === 0 ? (
            <div className="empty-state">
              <MapPin size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
              <div className="empty-title">No local suppliers found</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, marginBottom: 16 }}>
                Try switching to Online Stores to order directly to your door.
              </div>
              {scope !== 'all' && (
                <button className="btn btn-outline" onClick={() => setScope('all')}>
                  Search all regions
                </button>
              )}
              <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={() => setViewTab('online')}>
                Browse online stores
              </button>
            </div>
          ) : (
            <div className="supplier-list">
              {suppliers.map(s => (
                <div key={s.supplier_id} className="supplier-card">
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div className="supplier-name">{s.name}</div>
                    <span className="badge badge-green">{s.country}</span>
                  </div>
                  <div className="supplier-location" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={12} color="var(--text-muted)" />{s.location}
                  </div>
                  <div className="supplier-contact">{s.contact_info}</div>
                  {s.website && (
                    <a href={s.website} target="_blank" rel="noopener noreferrer" className="supplier-website"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
                      <ExternalLink size={13} /> Visit website
                    </a>
                  )}
                </div>
              ))}
              {/* Prompt to also check online */}
              <div style={{
                background: 'var(--brand-tint)',
                border: '1px solid var(--brand-surface)',
                borderRadius: 'var(--r-lg)',
                padding: '14px 16px',
                marginTop: 4,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand)' }}>Need home delivery?</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    Order medicines & vaccines online from verified stores.
                  </div>
                </div>
                <button
                  onClick={() => setViewTab('online')}
                  style={{
                    background: 'var(--brand)', color: 'white', border: 'none',
                    borderRadius: 'var(--r-md)', padding: '8px 14px',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  See stores
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── ONLINE TAB ── */}
      {viewTab === 'online' && (
        <div style={{ paddingBottom: 24 }}>
          <div className="search-bar">
            <Search size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
            <input
              className="search-bar-input"
              placeholder="Search vaccines, medicines, equipment…"
              value={onlineSearch}
              onChange={e => setOnlineSearch(e.target.value)}
            />
          </div>

          {userCountry && (
            <div style={{ padding: '0 16px 12px', fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Truck size={13} /> Showing stores that deliver to {userCountry}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 16px' }}>
            {filteredStores.length === 0 ? (
              <div className="empty-state">
                <Globe size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
                <div className="empty-title">No stores found</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Try clearing your search.</div>
              </div>
            ) : (
              filteredStores.map(store => (
                <OnlineStoreCard key={store.id} store={store} />
              ))
            )}
          </div>

          <div style={{
            margin: '20px 16px 0',
            padding: '14px 16px',
            background: 'var(--amber-surface)',
            borderRadius: 'var(--r-lg)',
            border: '1px solid #FDE68A',
            fontSize: 12,
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
          }}>
            Always verify the seller's registration with NAFDAC (Nigeria) or the Kenya Veterinary Board before purchasing medicines. Check expiry dates on delivery.
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Online store card ───────────────────────────────────── */
function OnlineStoreCard({ store }: { store: OnlineStore }) {
  return (
    <div style={{
      background: 'var(--surface)',
      borderRadius: 'var(--r-xl)',
      border: '1px solid var(--border)',
      overflow: 'hidden',
      boxShadow: 'var(--sh-sm)',
    }}>
      {/* Colour bar + name */}
      <div style={{
        background: store.color + '12',
        borderBottom: `1px solid ${store.color}22`,
        padding: '14px 16px 12px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 'var(--r-md)',
          background: store.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          color: 'white', fontWeight: 800, fontSize: 14, letterSpacing: -0.5,
        }}>
          {store.name.charAt(0)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{store.name}</div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 3 }}>
            {store.countries.filter(c => c !== 'Other').map(c => (
              <span key={c} style={{
                fontSize: 11, fontWeight: 600,
                background: store.color + '18', color: store.color,
                borderRadius: 'var(--r-full)', padding: '1px 7px',
              }}>
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: '12px 16px 14px' }}>
        {/* Tagline */}
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 10px' }}>
          {store.tagline}
        </p>

        {/* Highlight */}
        {store.highlight && (
          <div style={{
            fontSize: 12, fontWeight: 600, color: store.color,
            background: store.color + '10',
            borderRadius: 'var(--r-sm)', padding: '4px 10px',
            display: 'inline-block', marginBottom: 12,
          }}>
            {store.highlight}
          </div>
        )}

        {/* Category chips */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {store.categories.map(cat => (
            <span key={cat} style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 11, fontWeight: 600,
              background: 'var(--surface-alt)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-full)',
              padding: '3px 9px',
              color: 'var(--text-secondary)',
            }}>
              {CATEGORY_ICON[cat] ?? <Package size={11} />}
              {cat}
            </span>
          ))}
        </div>

        {/* CTA */}
        <a
          href={store.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: store.color,
            color: 'white',
            borderRadius: 'var(--r-md)',
            padding: '11px 0',
            fontSize: 14,
            fontWeight: 700,
            textDecoration: 'none',
            width: '100%',
          }}
        >
          <ShoppingCart size={16} />
          Shop on {store.name}
          <ExternalLink size={13} style={{ opacity: 0.7 }} />
        </a>
      </div>
    </div>
  );
}
