/**
 * DirectMessages — conversations list + thread view with polling.
 * Requires a logged-in farmer (farmerId prop).
 */
import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, MessageCircle } from 'lucide-react';
import { api } from '../api';
import type { ConversationSummary, MessageOut } from '../api';
import type { Farmer } from '../types';

interface Props {
  farmerId: number;
  /** Pre-open a conversation with this farmer on mount */
  openWithFarmerId?: number;
  onBack: () => void;
}

function ago(dateStr?: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  <  1) return 'just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

function Avatar({ farmer, size = 36 }: { farmer: Farmer; size?: number }) {
  const style: React.CSSProperties = {
    width: size, height: size, borderRadius: '50%',
    objectFit: 'cover', flexShrink: 0,
  };
  if (farmer.photo_url) {
    return <img src={farmer.photo_url} alt={farmer.name} style={style} />;
  }
  return (
    <div style={{
      ...style,
      background: 'var(--brand-tint)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 700, color: 'var(--brand)',
    }}>
      {initials(farmer.name)}
    </div>
  );
}

/* ── Thread view ──────────────────────────────────────── */
function Thread({ farmerId, other, onBack }: { farmerId: number; other: Farmer; onBack: () => void }) {
  const [messages, setMessages] = useState<MessageOut[]>([]);
  const [body,     setBody]     = useState('');
  const [sending,  setSending]  = useState(false);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = async () => {
    const msgs = await api.messages.thread(farmerId, other.id).catch(() => []);
    setMessages(msgs);
    await api.messages.markRead(farmerId, other.id).catch(() => {});
  };

  useEffect(() => {
    load();
    intervalRef.current = setInterval(load, 10_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [farmerId, other.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const text = body.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const msg = await api.messages.send({ sender_id: farmerId, receiver_id: other.id, body: text });
      setMessages(prev => [...prev, msg]);
      setBody('');
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px', borderBottom: '1px solid var(--border)',
        background: 'var(--surface)', flexShrink: 0,
      }}>
        <button className="back-bar-btn" onClick={onBack} style={{ marginRight: 4 }}>
          <ArrowLeft size={18} />
        </button>
        <Avatar farmer={other} size={36} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{other.name}</div>
          {other.village && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{other.village}</div>}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, paddingTop: 32 }}>
            No messages yet. Say hello!
          </div>
        )}
        {messages.map(msg => {
          const mine = msg.sender_id === farmerId;
          return (
            <div key={msg.id} style={{ display: 'flex', flexDirection: mine ? 'row-reverse' : 'row', gap: 8, alignItems: 'flex-end' }}>
              {!mine && <Avatar farmer={other} size={28} />}
              <div style={{
                maxWidth: '72%',
                background: mine ? 'var(--brand)' : 'var(--surface)',
                color: mine ? '#fff' : 'var(--text)',
                borderRadius: mine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                padding: '8px 12px',
                fontSize: 14,
                lineHeight: 1.45,
                boxShadow: '0 1px 2px rgba(0,0,0,0.07)',
                border: mine ? 'none' : '1px solid var(--border-light)',
              }}>
                {msg.body}
                <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4, textAlign: mine ? 'right' : 'left' }}>
                  {ago(msg.created_at)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: 8,
        padding: '10px 16px', borderTop: '1px solid var(--border)',
        background: 'var(--surface)', flexShrink: 0,
      }}>
        <textarea
          className="field-input field-textarea"
          rows={1}
          placeholder="Type a message…"
          value={body}
          onChange={e => setBody(e.target.value)}
          onKeyDown={handleKey}
          style={{ flex: 1, resize: 'none', minHeight: 38, maxHeight: 120 }}
        />
        <button
          className="btn btn-primary"
          style={{ width: 44, height: 44, padding: 0, borderRadius: '50%', flexShrink: 0 }}
          disabled={!body.trim() || sending}
          onClick={send}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}

/* ── Conversations list ───────────────────────────────── */
export function DirectMessages({ farmerId, openWithFarmerId, onBack }: Props) {
  const [convos,  setConvos]  = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [active,  setActive]  = useState<Farmer | null>(null);

  useEffect(() => {
    api.messages.conversations(farmerId)
      .then(setConvos)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [farmerId]);

  // Auto-open conversation if openWithFarmerId is set
  useEffect(() => {
    if (!openWithFarmerId) return;
    // Fetch the farmer to open with
    api.farmers.get(openWithFarmerId)
      .then(f => setActive(f))
      .catch(() => {});
  }, [openWithFarmerId]);

  if (active) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <Thread farmerId={farmerId} other={active} onBack={() => setActive(null)} />
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 16 }}>
      <div className="back-bar">
        <button className="back-bar-btn" onClick={onBack}>
          <ArrowLeft size={18} /> Back
        </button>
        <span className="back-bar-title">Messages</span>
      </div>

      {loading ? (
        <div className="loading-screen"><div className="loading-spinner" /></div>
      ) : convos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><MessageCircle size={28} /></div>
          <div className="empty-title">No messages yet</div>
          <div className="empty-body">Start a conversation by tapping "Message" on a farmer's post.</div>
        </div>
      ) : (
        <div>
          {convos.map(c => (
            <button
              key={c.other_farmer.id}
              onClick={() => setActive(c.other_farmer)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                width: '100%', textAlign: 'left',
                padding: '12px 16px',
                borderBottom: '1px solid var(--border-light)',
                background: 'transparent', border: 'none', cursor: 'pointer',
              }}
            >
              <Avatar farmer={c.other_farmer} size={44} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: c.unread_count > 0 ? 800 : 600, fontSize: 15, color: 'var(--text)' }}>
                    {c.other_farmer.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {ago(c.last_message_at)}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    fontSize: 13, color: 'var(--text-muted)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
                    fontWeight: c.unread_count > 0 ? 600 : 400,
                  }}>
                    {c.last_message}
                  </div>
                  {c.unread_count > 0 && (
                    <div style={{
                      minWidth: 20, height: 20, borderRadius: 10,
                      background: 'var(--brand)', color: '#fff',
                      fontSize: 11, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '0 5px', flexShrink: 0,
                    }}>
                      {c.unread_count}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Standalone "Message" button helper ──────────────── */
export function MessageFarmerButton({
  fromFarmerId,
  toFarmer,
}: {
  fromFarmerId: number;
  toFarmer: Farmer;
}) {
  const [open, setOpen] = useState(false);

  if (open) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
        <Thread farmerId={fromFarmerId} other={toFarmer} onBack={() => setOpen(false)} />
      </div>
    );
  }

  return (
    <button
      className="btn btn-secondary"
      style={{ gap: 6 }}
      onClick={() => setOpen(true)}
    >
      <MessageCircle size={15} />
      Message {toFarmer.name.split(' ')[0]}
    </button>
  );
}
