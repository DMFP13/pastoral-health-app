/**
 * HomeScreen — action-first layout.
 * 4 large primary buttons → seasonal risk → recent local alerts.
 */
import { useState, useEffect, useCallback } from 'react';
import {
  Stethoscope, Beef, Megaphone, Phone,
  MapPin, ChevronRight, AlertTriangle, MessageCircle,
  MoreHorizontal, Clock, WifiOff,
} from 'lucide-react';
import { api } from '../api';
import type { CommunityPost, UserLocation, PostCategory } from '../types/index';
import { getSeasonalRisk, locationLabel } from '../utils/location';

const RISK_COLOR = { low: 'var(--brand)', moderate: 'var(--amber)', high: 'var(--red)' } as const;

const CATEGORY_LABEL: Record<string, string> = {
  disease_alert:  'Sick Animal',
  missing_animal: 'Missing',
  theft:          'Theft',
  water:          'Water',
  pasture:        'Pasture',
  weather:        'Weather',
  advice:         'Advice',
  market:         'Market',
};
const CATEGORY_COLOR: Record<string, string> = {
  disease_alert:  '#D97706',
  missing_animal: '#7C3AED',
  theft:          '#DC2626',
  water:          '#0369A1',
  pasture:        '#2D6A4F',
  weather:        '#0891B2',
  advice:         '#C8860A',
  market:         '#EA580C',
};

function relTime(d?: string) {
  if (!d) return '';
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1)   return 'just now';
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

interface Props {
  location:       UserLocation;
  farmerName?:    string;
  onCompose:      (category?: PostCategory) => void;
  onSeeAll:       () => void;
  onOpenPost:     (post: CommunityPost) => void;
  onVets:         () => void;
  onSuppliers:    () => void;
  onCheck:        () => void;
  onAnimals:      () => void;
  onMore:         () => void;
  onEditLocation: () => void;
}

export function HomeScreen({
  location, farmerName, onCompose, onSeeAll, onOpenPost,
  onVets, onCheck, onAnimals, onEditLocation,
}: Props) {
  const [posts,   setPosts]   = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  const seasonal = getSeasonalRisk(location);
  const locLabel = locationLabel(location) || 'Set location';
  const greeting = farmerName ? `Good day, ${farmerName}` : 'Good day, farmer';

  const loadFeed = useCallback(async () => {
    setLoading(true);
    setOffline(false);
    try {
      const data = await api.posts.feed({
        country: location.country ?? undefined,
        state:   location.state   ?? undefined,
        limit:   4,
      });
      setPosts(data);
    } catch {
      setOffline(true);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [location.country, location.state]);

  useEffect(() => { loadFeed(); }, [loadFeed]);

  /* ── Primary action config ── */
  const ACTIONS = [
    {
      label: 'Check Animal',
      sub:   'Health triage',
      Icon:  Stethoscope,
      bg:    'var(--brand)',
      color: 'white',
      onTap: onCheck,
    },
    {
      label: 'My Animals',
      sub:   'Herd registry',
      Icon:  Beef,
      bg:    'var(--brand-tint)',
      color: 'var(--brand)',
      onTap: onAnimals,
    },
    {
      label: 'Post Alert',
      sub:   'Warn nearby farmers',
      Icon:  Megaphone,
      bg:    '#FFF7ED',
      color: 'var(--amber)',
      onTap: () => onCompose(),
    },
    {
      label: 'Call Vet',
      sub:   'Find a vet near you',
      Icon:  Phone,
      bg:    '#F0FAF4',
      color: 'var(--brand)',
      onTap: onVets,
    },
  ];

  return (
    <div style={{ paddingBottom: 24 }}>

      {/* ── Header ── */}
      <div style={{
        background: 'linear-gradient(160deg, var(--brand-dark) 0%, var(--brand) 100%)',
        padding: '52px 20px 28px',
      }}>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 4 }}>
          {greeting}
        </div>
        <div style={{ color: 'white', fontSize: 24, fontWeight: 800, letterSpacing: -0.5, marginBottom: 12 }}>
          How is your herd today?
        </div>
        <button
          onClick={onEditLocation}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: 'rgba(255,255,255,0.15)',
            border: 'none', borderRadius: 'var(--r-full)',
            padding: '6px 12px', color: 'white', fontSize: 13, fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <MapPin size={12} /> {locLabel}
        </button>
      </div>

      {/* ── 4 action buttons ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 10, padding: '16px 16px 0',
      }}>
        {ACTIONS.map(a => (
          <button
            key={a.label}
            onClick={a.onTap}
            style={{
              background: a.bg,
              border: 'none',
              borderRadius: 'var(--r-xl)',
              padding: '18px 14px',
              textAlign: 'left',
              cursor: 'pointer',
              boxShadow: 'var(--sh-sm)',
              display: 'flex', flexDirection: 'column', gap: 10,
              minHeight: 100,
            }}
          >
            <a.Icon size={24} color={a.color} strokeWidth={2} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: a.color, lineHeight: 1.2 }}>
                {a.label}
              </div>
              <div style={{ fontSize: 12, color: a.color, opacity: 0.7, marginTop: 2 }}>
                {a.sub}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* ── Seasonal risk strip ── */}
      <div style={{
        margin: '12px 16px 0',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        padding: '12px 14px',
        display: 'flex', alignItems: 'flex-start', gap: 10,
      }}>
        <AlertTriangle size={18} color={RISK_COLOR[seasonal.diseaseRisk]} style={{ flexShrink: 0, marginTop: 1 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>
            {seasonal.season} — Disease risk:{' '}
            <span style={{ color: RISK_COLOR[seasonal.diseaseRisk], textTransform: 'uppercase', fontSize: 11 }}>
              {seasonal.diseaseRisk}
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            {seasonal.tip}
          </div>
        </div>
      </div>

      {/* ── Recent alerts ── */}
      <div className="section-row" style={{ marginTop: 16 }}>
        <span className="section-title">Recent Alerts</span>
        <button className="section-action" onClick={onSeeAll}>
          See all <ChevronRight size={14} />
        </button>
      </div>

      {offline && (
        <div style={{
          margin: '0 16px 10px',
          padding: '10px 14px',
          background: 'var(--amber-surface)',
          borderRadius: 'var(--r-md)',
          border: '1px solid #FDE68A',
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 13, color: 'var(--amber)',
        }}>
          <WifiOff size={14} /> No connection — alerts unavailable
        </div>
      )}

      {loading ? (
        <div style={{ padding: '24px 0', display: 'flex', justifyContent: 'center' }}>
          <div className="loading-spinner" />
        </div>
      ) : posts.length === 0 && !offline ? (
        <div style={{
          margin: '0 16px',
          padding: '24px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-xl)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 12 }}>
            No local alerts yet. Be the first to post.
          </div>
          <button className="btn btn-primary btn-sm" style={{ width: 'auto', margin: '0 auto' }}
            onClick={() => onCompose()}>
            Post an Alert
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, padding: '0 16px' }}>
          {posts.map(post => (
            <AlertRow key={post.id} post={post} onOpen={onOpenPost} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Compact alert row ───────────────────────────────────── */
function AlertRow({ post, onOpen }: { post: CommunityPost; onOpen: (p: CommunityPost) => void }) {
  const cat   = post.category as string;
  const label = CATEGORY_LABEL[cat] ?? cat;
  const color = CATEGORY_COLOR[cat] ?? 'var(--brand)';
  const loc   = [post.village, post.state].filter(Boolean).join(', ');

  return (
    <div
      role="button"
      onClick={() => onOpen(post)}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        padding: '12px 14px',
        marginBottom: 8,
        cursor: 'pointer',
        display: 'flex', gap: 12, alignItems: 'flex-start',
      }}
    >
      {/* Category dot */}
      <div style={{
        width: 8, height: 8, borderRadius: '50%',
        background: color, flexShrink: 0, marginTop: 5,
      }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <span style={{
            fontSize: 11, fontWeight: 700,
            color, background: color + '15',
            borderRadius: 'var(--r-full)', padding: '2px 7px',
          }}>{label}</span>
          {loc && <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 2 }}>
            <MapPin size={9} />{loc}
          </span>}
        </div>
        <div style={{
          fontSize: 13, color: 'var(--text)', lineHeight: 1.4,
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          {post.body}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
            <Clock size={10} /> {relTime(post.created_at)}
          </span>
          {(post.comment_count ?? 0) > 0 && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <MessageCircle size={10} /> {post.comment_count}
            </span>
          )}
          {post.farmer?.name && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {post.farmer.name}
            </span>
          )}
        </div>
      </div>
      <MoreHorizontal size={16} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: 2 }} />
    </div>
  );
}
