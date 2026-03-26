/**
 * CommunityWall — full community feed with compose, filter, and detail view.
 */
import { useState, useEffect, useCallback } from 'react';
import {
  Camera, MapPin, MoreHorizontal, MessageCircle, MessageSquare,
  ThumbsUp, ArrowLeft, Plus,
} from 'lucide-react';
import { api } from '../api';
import type { CommunityPost, PostCategory, UserLocation } from '../types';
import { getSavedLocation, locationLabel } from '../utils/location';
import { PhotoCapture } from './PhotoCapture';

/* ── Config ─────────────────────────────────────────────── */
type ChipKey = 'nearby' | PostCategory | 'all';

const ALL_CHIPS: { key: ChipKey; label: string }[] = [
  { key: 'nearby',         label: 'Nearby' },
  { key: 'disease_alert',  label: 'Alerts' },
  { key: 'missing_animal', label: 'Missing Animals' },
  { key: 'water',          label: 'Water & Grass' },
  { key: 'advice',         label: 'Advice' },
  { key: 'market',         label: 'Market' },
  { key: 'all',            label: 'All Posts' },
];

export const CATEGORY_LABEL: Record<PostCategory, string> = {
  disease_alert:  'Sick Animal',
  missing_animal: 'Missing Animal',
  theft:          'Theft',
  water:          'Water Update',
  pasture:        'Pasture',
  weather:        'Weather',
  advice:         'Advice',
  market:         'Market',
};

export const CATEGORY_COLOR: Record<PostCategory, string> = {
  disease_alert:  '#D97706',
  missing_animal: '#7C3AED',
  theft:          '#DC2626',
  water:          '#0369A1',
  pasture:        '#2D6A4F',
  weather:        '#0891B2',
  advice:         '#C8860A',
  market:         '#EA580C',
};

const COMPOSE_CATEGORIES: PostCategory[] = [
  'disease_alert', 'missing_animal', 'water', 'pasture', 'advice', 'market', 'weather', 'theft',
];

const COMPOSE_PLACEHOLDERS: Record<PostCategory, string> = {
  disease_alert:  'Which animal? What symptoms? How many affected?',
  missing_animal: 'Species, colour, size. Where last seen? Any ear tag?',
  water:          'Is there a water shortage? New pasture available?',
  pasture:        'How is the grazing? Any areas to avoid?',
  advice:         'Ask the community for help or share what worked.',
  market:         'Price updates, buyers, or animals for sale.',
  weather:        'Any severe weather, storms, or unusual conditions?',
  theft:          'Description of animals taken, location, date.',
};

/* ── Helpers ────────────────────────────────────────────── */
function relativeTime(dateStr?: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

function CommentAvatar({ name, photoUrl }: { name?: string; photoUrl?: string | null }) {
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  return photoUrl
    ? <div className="comment-avatar"><img src={photoUrl} alt={name} /></div>
    : <div className="comment-avatar">{initial}</div>;
}

/* ── Props ──────────────────────────────────────────────── */
interface Props {
  farmerId?:       number;
  location?:       UserLocation;
  initialCompose?: PostCategory | null;
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════ */
export function CommunityWall({ farmerId, location, initialCompose }: Props) {
  const loc = location ?? getSavedLocation() ?? {};

  const [chip,        setChip]        = useState<ChipKey>('nearby');
  const [posts,       setPosts]       = useState<CommunityPost[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [view,        setView]        = useState<'feed' | 'compose' | 'detail'>('feed');
  const [detailPost,  setDetailPost]  = useState<CommunityPost | null>(null);

  // Compose state
  const [compCat,     setCompCat]     = useState<PostCategory>(initialCompose ?? 'advice');
  const [compBody,    setCompBody]    = useState('');
  const [compImage,   setCompImage]   = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [submitErr,   setSubmitErr]   = useState('');

  // Comment state
  const [commentText,    setCommentText]    = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentError,   setCommentError]   = useState('');

  useEffect(() => {
    if (initialCompose) { setCompCat(initialCompose); setView('compose'); }
  }, [initialCompose]);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string | undefined> = {};
      if (chip === 'nearby') {
        params.country = loc.country ?? undefined;
        params.state   = loc.state   ?? undefined;
      } else if (chip !== 'all') {
        params.category = chip;
        params.country  = loc.country ?? undefined;
      }
      const data = await api.posts.feed(params as Parameters<typeof api.posts.feed>[0]);
      setPosts(data);
    } catch { setError('Could not load feed. Check your connection.'); }
    finally { setLoading(false); }
  }, [chip, loc.country, loc.state]);

  useEffect(() => { if (view === 'feed') loadFeed(); }, [loadFeed, view]);

  const submitPost = async () => {
    if (!compBody.trim()) { setSubmitErr('Please write something.'); return; }
    setSubmitting(true);
    setSubmitErr('');
    try {
      await api.posts.create({
        category:  compCat,
        body:      compBody.trim(),
        village:   loc.village  ?? undefined,
        lga:       loc.lga      ?? undefined,
        state:     loc.state    ?? undefined,
        country:   loc.country  ?? undefined,
        farmer_id: farmerId,
        image_url: compImage || undefined,
      });
      setCompBody('');
      setCompImage('');
      setView('feed');
    } catch { setSubmitErr('Could not post. Try again.'); }
    finally { setSubmitting(false); }
  };

  const openDetail = async (post: CommunityPost) => {
    setCommentText('');
    setCommentError('');
    try {
      const full = await api.posts.get(post.id);
      setDetailPost(full);
    } catch {
      setDetailPost(post);
    }
    setView('detail');
  };

  const addComment = async () => {
    if (!detailPost || !commentText.trim()) return;
    setCommentLoading(true);
    setCommentError('');
    try {
      const c = await api.posts.addComment(detailPost.id, commentText.trim(), farmerId);
      setDetailPost(prev => prev
        ? { ...prev, comments: [...(prev.comments ?? []), c], comment_count: (prev.comment_count ?? 0) + 1 }
        : prev);
      setCommentText('');
    } catch { setCommentError('Could not add comment.'); }
    finally { setCommentLoading(false); }
  };

  /* ── Detail view ─────────────────────────────────────── */
  if (view === 'detail' && detailPost) {
    const cat   = detailPost.category as PostCategory;
    const label = CATEGORY_LABEL[cat] ?? cat;
    const color = CATEGORY_COLOR[cat] ?? 'var(--brand)';
    const locStr = [detailPost.village, detailPost.state].filter(Boolean).join(', ');

    return (
      <div style={{ paddingBottom: 32 }}>
        <div className="back-bar">
          <button className="back-bar-btn" onClick={() => setView('feed')}>
            <ArrowLeft size={18} /> Back
          </button>
        </div>

        <div style={{ margin: '0 16px' }}>
          <div className="post-card" style={{ cursor: 'default' }}>
            <div className="post-card-header">
              <div className="post-card-avatar" style={{ width: 40, height: 40, fontSize: 16 }}>
                {detailPost.farmer?.photo_url
                  ? <img src={detailPost.farmer.photo_url} alt={detailPost.farmer.name} />
                  : (detailPost.farmer?.name?.charAt(0).toUpperCase() ?? '?')}
              </div>
              <div className="post-card-author">
                <div className="post-card-name">{detailPost.farmer?.name ?? 'Community Member'}</div>
                {locStr && <div className="post-card-loc"><MapPin size={10} />{locStr}</div>}
              </div>
            </div>

            <div className="post-card-body" style={{ fontSize: 16, lineHeight: 1.6 }}>
              {detailPost.body}
            </div>

            {detailPost.image_url && (
              <div className="post-card-image-wrap">
                <img src={detailPost.image_url} alt="Post" />
                <div className="post-card-image-badge" style={{ background: color + 'EE', color: 'white' }}>
                  {label}
                </div>
              </div>
            )}

            <div className="post-card-footer">
              <span className="badge" style={{ background: color + '18', color }}>{label}</span>
              {detailPost.created_at && (
                <span className="post-card-time">{relativeTime(detailPost.created_at)}</span>
              )}
            </div>
          </div>
        </div>

        <div className="section-label">
          Comments ({detailPost.comments?.length ?? detailPost.comment_count ?? 0})
        </div>

        <div style={{ padding: '0 16px' }}>
          {(detailPost.comments ?? []).length === 0 && (
            <div style={{ color: 'var(--text-muted)', fontSize: 14, padding: '8px 0 16px' }}>
              No comments yet. Be the first to respond.
            </div>
          )}
          {(detailPost.comments ?? []).map(c => (
            <div key={c.id} className="comment-item">
              <div className="comment-author">
                <CommentAvatar name={c.farmer?.name} photoUrl={c.farmer?.photo_url} />
                {c.farmer?.name ?? 'Anonymous'}
                {c.created_at && (
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>
                    {relativeTime(c.created_at)}
                  </span>
                )}
              </div>
              <div className="comment-body">{c.body}</div>
            </div>
          ))}

          {commentError && <div className="error-card" style={{ marginTop: 8 }}>{commentError}</div>}

          <div className="comment-compose">
            <textarea
              className="form-input"
              rows={2}
              placeholder="Write a response..."
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              style={{ resize: 'none' }}
            />
            <button
              className="btn btn-primary"
              disabled={commentLoading || !commentText.trim()}
              onClick={addComment}
            >
              {commentLoading ? 'Sending...' : 'Reply'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Compose view ────────────────────────────────────── */
  if (view === 'compose') {
    return (
      <div style={{ paddingBottom: 32 }}>
        <div className="back-bar">
          <button className="back-bar-btn" onClick={() => setView('feed')}>
            <ArrowLeft size={18} /> Back
          </button>
        </div>

        <div className="screen">
          <div className="screen-title" style={{ marginBottom: 4 }}>Share with community</div>
          {(loc.village || loc.state) && (
            <div className="screen-subtitle" style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 20 }}>
              <MapPin size={12} /> {locationLabel(loc)}
            </div>
          )}

          <div className="section-label" style={{ padding: '0 0 8px' }}>Category</div>
          <div className="compose-category-grid">
            {COMPOSE_CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`compose-cat-btn ${compCat === cat ? 'selected' : ''}`}
                onClick={() => setCompCat(cat)}
              >
                <span style={{
                  width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                  background: compCat === cat ? CATEGORY_COLOR[cat] : 'var(--border)',
                }} />
                {CATEGORY_LABEL[cat]}
              </button>
            ))}
          </div>

          <div className="section-label" style={{ padding: '16px 0 8px' }}>Your message</div>
          <textarea
            className="form-input"
            rows={4}
            placeholder={COMPOSE_PLACEHOLDERS[compCat] ?? 'What would you like to share?'}
            value={compBody}
            onChange={e => setCompBody(e.target.value)}
            style={{ resize: 'none', fontSize: 15 }}
            autoFocus
          />

          <div className="section-label" style={{ padding: '16px 0 8px' }}>Photo (optional)</div>
          <PhotoCapture
            label="Add photo of animal or symptoms"
            onUploaded={url => setCompImage(url)}
            onClear={() => setCompImage('')}
            currentUrl={compImage || undefined}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0 4px' }}>
            <span className="badge" style={{ background: CATEGORY_COLOR[compCat] + '18', color: CATEGORY_COLOR[compCat] }}>
              {CATEGORY_LABEL[compCat]}
            </span>
            {(loc.village || loc.state) && (
              <span style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                <MapPin size={11} /> {locationLabel(loc)}
              </span>
            )}
          </div>

          {submitErr && <div className="error-card" style={{ marginTop: 8 }}>{submitErr}</div>}

          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button className="btn btn-primary" disabled={submitting || !compBody.trim()} onClick={submitPost}>
              {submitting ? 'Posting...' : 'Post to Community'}
            </button>
            <button className="btn btn-outline" onClick={() => setView('feed')}>Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Feed view ───────────────────────────────────────── */
  return (
    <div style={{ paddingBottom: 16 }}>
      <div className="community-header">
        <div>
          <div className="screen-title">Community</div>
          <div className="screen-subtitle" style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
            <MapPin size={12} />
            {loc.village || loc.state ? locationLabel(loc) : 'Updates from farmers'}
          </div>
        </div>
        <button className="community-header-btn" onClick={() => { setCompBody(''); setView('compose'); }}>
          <Plus size={16} /> Post
        </button>
      </div>

      <div
        className="composer-card"
        style={{ margin: '12px 16px', cursor: 'pointer' }}
        role="button"
        onClick={() => setView('compose')}
      >
        <div className="composer-camera"><Camera size={20} /></div>
        <span className="composer-text">What is happening in your area?</span>
        <button className="composer-post-btn" onClick={e => { e.stopPropagation(); setView('compose'); }}>
          Post
        </button>
      </div>

      <div className="chips-row">
        {ALL_CHIPS.map(c => (
          <button
            key={c.key}
            className={`chip ${chip === c.key ? 'active' : ''}`}
            onClick={() => setChip(c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {error && <div className="error-card" style={{ margin: '0 16px 8px' }}>{error}</div>}

      {loading ? (
        <div className="loading-screen">
          <div className="loading-spinner" />
          Loading feed...
        </div>
      ) : posts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><MessageCircle size={24} /></div>
          <div className="empty-title">No posts yet</div>
          <div className="empty-sub">
            {chip === 'nearby' ? 'No posts in your area yet.' : 'Nothing in this category yet.'}
          </div>
          <button className="btn btn-primary" style={{ marginTop: 16, width: 'auto' }} onClick={() => setView('compose')}>
            Post Update
          </button>
        </div>
      ) : (
        <div className="feed-list" style={{ paddingBottom: 8 }}>
          {posts.map(post => <FeedCard key={post.id} post={post} onOpen={openDetail} />)}
        </div>
      )}
    </div>
  );
}

/* ── FeedCard ───────────────────────────────────────────── */
function FeedCard({ post, onOpen }: { post: CommunityPost; onOpen: (p: CommunityPost) => void }) {
  const cat   = post.category as PostCategory;
  const label = CATEGORY_LABEL[cat] ?? cat;
  const color = CATEGORY_COLOR[cat] ?? 'var(--brand)';
  const locStr = [post.village, post.state].filter(Boolean).join(', ');

  return (
    <div className="post-card" role="button" onClick={() => onOpen(post)}>
      <div className="post-card-header">
        <div className="post-card-avatar" style={{ width: 40, height: 40, fontSize: 16 }}>
          {post.farmer?.photo_url
            ? <img src={post.farmer.photo_url} alt={post.farmer.name} />
            : (post.farmer?.name?.charAt(0).toUpperCase() ?? '?')}
        </div>
        <div className="post-card-author">
          <div className="post-card-name">{post.farmer?.name ?? 'Community Member'}</div>
          {locStr && (
            <div className="post-card-loc"><MapPin size={10} /> {locStr}</div>
          )}
        </div>
        <button className="post-card-overflow" onClick={e => e.stopPropagation()}>
          <MoreHorizontal size={18} />
        </button>
      </div>

      <div className="post-card-body">{post.body}</div>

      {post.image_url && (
        <div className="post-card-image-wrap">
          <img src={post.image_url} alt="Post" />
          <div className="post-card-image-badge" style={{ background: color + 'EE', color: 'white' }}>
            {label}
          </div>
        </div>
      )}

      <div className="post-card-footer">
        <span className="badge" style={{ background: color + '18', color }}>{label}</span>
        {post.created_at && <span className="post-card-time">{relativeTime(post.created_at)}</span>}
        <div className="post-card-actions">
          <span className="post-card-action"><MessageCircle size={14} /> {post.comment_count ?? 0}</span>
          <span className="post-card-action"><MessageSquare size={14} /> {post.comment_count ?? 0}</span>
          <span className="post-card-action"><ThumbsUp size={14} /> {post.comment_count ?? 0}</span>
        </div>
      </div>
    </div>
  );
}
