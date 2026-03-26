/**
 * HomeScreen — community-led landing.
 * Composer → category chips → community feed preview → nearby services.
 */
import { useState, useEffect, useCallback } from 'react';
import {
  Camera, MapPin, MoreHorizontal, MessageCircle,
  MessageSquare, ThumbsUp, ChevronRight, ChevronDown,
  Users, Stethoscope, Building2, CloudSun, LayoutGrid,
  CheckCircle,
} from 'lucide-react';
import { api } from '../api';
import type { CommunityPost, UserLocation, PostCategory } from '../types';
import { getSeasonalRisk, locationLabel } from '../utils/location';

/* ── Category config ────────────────────────────────────── */
type ChipKey = 'nearby' | 'disease_alert' | 'missing_animal' | 'water' | 'all';

const CHIPS: { key: ChipKey; label: string }[] = [
  { key: 'nearby',         label: 'Nearby' },
  { key: 'disease_alert',  label: 'Alerts' },
  { key: 'missing_animal', label: 'Missing Animals' },
  { key: 'water',          label: 'Water & Grass' },
];

const CATEGORY_LABEL: Record<PostCategory, string> = {
  disease_alert:  'Sick Animal',
  missing_animal: 'Missing Animal',
  theft:          'Theft',
  water:          'Water Update',
  pasture:        'Pasture',
  weather:        'Weather',
  advice:         'Advice',
  market:         'Market',
};

const CATEGORY_COLOR: Record<PostCategory, string> = {
  disease_alert:  '#D97706',
  missing_animal: '#7C3AED',
  theft:          '#DC2626',
  water:          '#0369A1',
  pasture:        '#2D6A4F',
  weather:        '#0891B2',
  advice:         '#C8860A',
  market:         '#EA580C',
};

/* ── Avatar helper ──────────────────────────────────────── */
function Avatar({ name, photoUrl, size = 40 }: { name?: string; photoUrl?: string | null; size?: number }) {
  const initials = name ? name.charAt(0).toUpperCase() : '?';
  if (photoUrl) {
    return (
      <div className="post-card-avatar" style={{ width: size, height: size }}>
        <img src={photoUrl} alt={name} />
      </div>
    );
  }
  return (
    <div className="post-card-avatar" style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {initials}
    </div>
  );
}

/* ── Time helper ────────────────────────────────────────── */
function relativeTime(dateStr?: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/* ── Props ──────────────────────────────────────────────── */
interface Props {
  location:       UserLocation;
  farmerName?:    string;
  onCompose:      (category?: PostCategory) => void;
  onSeeAll:       () => void;
  onOpenPost:     (post: CommunityPost) => void;
  onVets:         () => void;
  onSuppliers:    () => void;
  onCheck:        () => void;
  onMore:         () => void;
  onEditLocation: () => void;
}

export function HomeScreen({
  location, farmerName, onCompose, onSeeAll, onOpenPost,
  onVets, onSuppliers, onCheck, onMore, onEditLocation,
}: Props) {
  const [activeChip, setActiveChip] = useState<ChipKey>('nearby');
  const [posts,     setPosts]       = useState<CommunityPost[]>([]);
  const [loading,   setLoading]     = useState(true);
  const [vetCount,  setVetCount]    = useState<number | null>(null);
  const [supCount,  setSupCount]    = useState<number | null>(null);

  const seasonal = getSeasonalRisk(location);

  /* Fetch feed preview */
  const loadFeed = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | undefined> = {};
      if (activeChip === 'nearby') {
        params.country = location.country ?? undefined;
        params.state   = location.state   ?? undefined;
      } else if (activeChip !== 'all') {
        params.category = activeChip;
        params.country  = location.country ?? undefined;
      }
      const data = await api.posts.feed({ ...params, limit: 5 } as Parameters<typeof api.posts.feed>[0]);
      setPosts(data);
    } catch { setPosts([]); }
    finally { setLoading(false); }
  }, [activeChip, location.country, location.state]);

  useEffect(() => { loadFeed(); }, [loadFeed]);

  /* Fetch service counts once */
  useEffect(() => {
    if (location.country) {
      api.vets.list(location.country, location.state)
        .then(v => setVetCount(v.length))
        .catch(() => {});
      api.suppliers.list(location.country)
        .then(s => setSupCount(s.length))
        .catch(() => {});
    }
  }, [location.country, location.state]);

  const locLabel = locationLabel(location) || 'Set location';
  const tempLabel = seasonal.heatRisk === 'high' ? '36°C+' : seasonal.heatRisk === 'moderate' ? '31°C' : '24°C';

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────── */}
      <div className="home-hero">
        <div className="home-hero-greeting">Good day, {farmerName ?? 'farmer'}</div>
        <div className="home-hero-title">What is happening{'\n'}in your area?</div>
        <button className="home-hero-loc" onClick={onEditLocation}>
          <MapPin size={12} />
          {locLabel}
        </button>
      </div>

      {/* ── Composer card ────────────────────────────────── */}
      <div
        className="composer-card"
        role="button"
        onClick={() => onCompose()}
        style={{ cursor: 'pointer' }}
      >
        <div className="composer-camera">
          <Camera size={20} />
        </div>
        <span className="composer-text">What is happening in your area?</span>
        <button
          className="composer-post-btn"
          onClick={e => { e.stopPropagation(); onCompose(); }}
        >
          Post
        </button>
      </div>

      {/* ── Category chips ───────────────────────────────── */}
      <div className="chips-row">
        {CHIPS.map(c => (
          <button
            key={c.key}
            className={`chip ${activeChip === c.key ? 'active' : ''}`}
            onClick={() => setActiveChip(c.key)}
          >
            {c.label}
          </button>
        ))}
        <button className="chip-dropdown" onClick={() => setActiveChip('all')}>
          <ChevronDown size={16} />
        </button>
      </div>

      {/* ── Community section ────────────────────────────── */}
      <div className="section-row">
        <span className="section-title">Community</span>
        <button className="section-action" onClick={onSeeAll}>
          See all <ChevronRight size={16} />
        </button>
      </div>

      {/* ── Feed cards ───────────────────────────────────── */}
      <div className="feed-list">
        {loading ? (
          <div className="loading-screen" style={{ minHeight: 160 }}>
            <div className="loading-spinner" />
          </div>
        ) : posts.length === 0 ? (
          <div style={{
            background: 'var(--surface)',
            borderRadius: 'var(--r-xl)',
            border: '1px solid var(--border-light)',
            padding: '32px 24px',
            textAlign: 'center',
          }}>
            <Users size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
              No posts yet
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              Be the first to share an update with local farmers.
            </div>
            <button className="btn btn-primary btn-sm" style={{ width: 'auto', margin: '0 auto' }} onClick={() => onCompose()}>
              Post Update
            </button>
          </div>
        ) : (
          posts.map(post => <PostCard key={post.id} post={post} onOpen={onOpenPost} />)
        )}
      </div>

      {/* ── Nearby Services ──────────────────────────────── */}
      <div className="section-row" style={{ marginTop: 8 }}>
        <span className="section-title">Nearby Services</span>
        <button className="section-action" onClick={onMore}>
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="services-row" style={{ paddingBottom: 8 }}>
        {/* Vets */}
        <button className="service-card" onClick={onVets}>
          <div className="service-card-icon" style={{ background: 'var(--brand-tint)' }}>
            <Stethoscope size={20} color="var(--brand)" />
          </div>
          <div className="service-card-title">Vets</div>
          <div className="service-card-sub">
            {vetCount != null ? `${vetCount} nearby` : 'Find a vet'}
          </div>
        </button>

        {/* Suppliers */}
        <button className="service-card" onClick={onSuppliers}>
          <div className="service-card-icon" style={{ background: 'var(--gold-light)' }}>
            <Building2 size={20} color="var(--gold)" />
          </div>
          <div className="service-card-title">Suppliers</div>
          <div className="service-card-sub">
            {supCount != null ? `${supCount} nearby` : 'Find suppliers'}
          </div>
        </button>

        {/* Weather */}
        <button className="service-card" onClick={onMore}>
          <div className="service-card-icon" style={{ background: 'var(--blue-surface)' }}>
            <CloudSun size={20} color="var(--blue)" />
          </div>
          <div className="service-card-title">Weather</div>
          <div className="service-card-sub">{tempLabel}</div>
        </button>

        {/* Health Check */}
        <button className="service-card" onClick={onCheck}>
          <div className="service-card-icon" style={{ background: 'var(--brand-tint)' }}>
            <CheckCircle size={20} color="var(--brand)" />
          </div>
          <div className="service-card-title">Health</div>
          <div className="service-card-sub">Check animal</div>
        </button>

        {/* More */}
        <button className="service-card" onClick={onMore}>
          <div className="service-card-icon" style={{ background: 'var(--border-light)' }}>
            <LayoutGrid size={20} color="var(--text-secondary)" />
          </div>
          <div className="service-card-title">More</div>
          <div className="service-card-sub">All services</div>
        </button>
      </div>

      {/* Seasonal tip */}
      <div className="seasonal-card" style={{ margin: '8px 16px 16px' }}>
        <div className="seasonal-season">{seasonal.season}</div>
        <div className="risk-pills">
          <span className="risk-pill">Heat: {seasonal.heatRisk}</span>
          <span className="risk-pill">Disease: {seasonal.diseaseRisk}</span>
        </div>
        <div className="seasonal-tip">{seasonal.tip}</div>
      </div>
    </div>
  );
}

/* ── PostCard component ─────────────────────────────────── */
function PostCard({ post, onOpen }: { post: CommunityPost; onOpen: (p: CommunityPost) => void }) {
  const cat  = post.category as PostCategory;
  const label = CATEGORY_LABEL[cat] ?? cat;
  const color = CATEGORY_COLOR[cat] ?? 'var(--brand)';
  const locStr = [post.village, post.state].filter(Boolean).join(', ');

  return (
    <div className="post-card" role="button" onClick={() => onOpen(post)}>
      {/* Header */}
      <div className="post-card-header">
        <Avatar
          name={post.farmer?.name}
          photoUrl={post.farmer?.photo_url}
          size={40}
        />
        <div className="post-card-author">
          <div className="post-card-name">{post.farmer?.name ?? 'Community Member'}</div>
          {locStr && (
            <div className="post-card-loc">
              <MapPin size={10} />
              {locStr}
            </div>
          )}
        </div>
        <button
          className="post-card-overflow"
          onClick={e => e.stopPropagation()}
        >
          <MoreHorizontal size={18} />
        </button>
      </div>

      {/* Body */}
      <div className="post-card-body">{post.body}</div>

      {/* Image with badge overlay */}
      {post.image_url && (
        <div className="post-card-image-wrap">
          <img src={post.image_url} alt="Post" />
          <div
            className="post-card-image-badge"
            style={{ background: color + 'EE', color: 'white' }}
          >
            {label}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="post-card-footer">
        <span
          className="post-card-category-badge badge"
          style={{ background: color + '18', color }}
        >
          {label}
        </span>
        {post.created_at && (
          <span className="post-card-time">{relativeTime(post.created_at)}</span>
        )}
        <div className="post-card-actions">
          <span className="post-card-action">
            <MessageCircle size={14} />
            {post.comment_count ?? 0}
          </span>
          <span className="post-card-action">
            <MessageSquare size={14} />
            {post.comment_count ?? 0}
          </span>
          <span className="post-card-action">
            <ThumbsUp size={14} />
            {Math.max(0, (post.comment_count ?? 0) + Math.floor(Math.random() * 10))}
          </span>
        </div>
      </div>
    </div>
  );
}
