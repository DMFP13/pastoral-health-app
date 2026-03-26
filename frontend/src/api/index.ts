import { cacheGet, cacheSet } from '../utils/cache';
import type {
  Disease, Vet, Supplier, Medicine,
  Animal, AnimalEvent, TriageInput, TriageOutput,
  Farmer, CommunityPost, PostComment,
} from '../types';

// In production the frontend is served by the same FastAPI server,
// so relative paths work. In local dev, fall back to localhost:8000.
const BASE_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:8000' : '');

async function fetchJSON<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, options);
  if (!res.ok) {
    let detail = `API error ${res.status}`;
    try {
      const body = await res.json();
      if (typeof body?.detail === 'string') detail = body.detail;
      else if (Array.isArray(body?.detail)) detail = body.detail.map((e: { msg: string }) => e.msg).join('; ');
    } catch { /* non-JSON error body */ }
    throw new Error(detail);
  }
  return res.json();
}

/** Fetch with localStorage fallback — returns cached data when offline. */
async function fetchWithFallback<T>(cacheKey: string, path: string, maxAgeMs = 86_400_000): Promise<T> {
  try {
    const data = await fetchJSON<T>(path);
    cacheSet(cacheKey, data);
    return data;
  } catch (err) {
    const cached = cacheGet<T>(cacheKey, maxAgeMs);
    if (cached !== null) return cached;
    throw err;
  }
}

function qs(params: Record<string, string | undefined>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) p.set(k, v);
  }
  const s = p.toString();
  return s ? `?${s}` : '';
}

export const api = {
  diseases: {
    list: async (search?: string, species?: string): Promise<Disease[]> => {
      const key = `diseases_${search}_${species}`;
      const cached = cacheGet<Disease[]>(key);
      if (cached) return cached;
      const data = await fetchJSON<Disease[]>(`/diseases/${qs({ search, species })}`);
      cacheSet(key, data);
      return data;
    },
    get: (id: number) => fetchJSON<Disease>(`/diseases/${id}`),
  },

  vets: {
    list: async (country?: string, state?: string, search?: string): Promise<Vet[]> => {
      const key = `vets_${country}_${state}_${search}`;
      const cached = cacheGet<Vet[]>(key, 3600_000); // 1hr cache
      if (cached) return cached;
      const data = await fetchJSON<Vet[]>(`/vets/${qs({ country, state, search })}`);
      cacheSet(key, data);
      return data;
    },
  },

  suppliers: {
    list: async (country?: string, search?: string, state?: string): Promise<Supplier[]> => {
      const key = `suppliers_${country}_${state}_${search}`;
      const cached = cacheGet<Supplier[]>(key, 3600_000);
      if (cached) return cached;
      const data = await fetchJSON<Supplier[]>(`/suppliers/${qs({ country, state, search })}`);
      cacheSet(key, data);
      return data;
    },
  },

  medicines: {
    list: async (type?: string, search?: string): Promise<Medicine[]> => {
      const key = `medicines_${type}_${search}`;
      const cached = cacheGet<Medicine[]>(key, 3600_000);
      if (cached) return cached;
      const data = await fetchJSON<Medicine[]>(`/medicines/${qs({ type, search })}`);
      cacheSet(key, data);
      return data;
    },
  },

  animals: {
    list: (params?: { country?: string; species?: string; search?: string }): Promise<Animal[]> => {
      const key = `animals_${JSON.stringify(params || {})}`;
      return fetchWithFallback<Animal[]>(key, `/animals/${qs(params || {})}`, 300_000);
    },
    get: (id: number): Promise<Animal> =>
      fetchJSON<Animal>(`/animals/${id}`),
    create: (data: Omit<Animal, 'id' | 'created_at' | 'events'>): Promise<Animal> =>
      fetchJSON<Animal>('/animals/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    update: (id: number, data: Partial<Animal>): Promise<Animal> =>
      fetchJSON<Animal>(`/animals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    delete: (id: number): Promise<void> =>
      fetchJSON<void>(`/animals/${id}`, { method: 'DELETE' }),
  },

  events: {
    list: (animalId?: number, eventType?: string): Promise<AnimalEvent[]> =>
      fetchJSON<AnimalEvent[]>(`/events/${qs({
        animal_id: animalId?.toString(),
        event_type: eventType,
      })}`),
    create: (data: Omit<AnimalEvent, 'id' | 'created_at'>): Promise<AnimalEvent> =>
      fetchJSON<AnimalEvent>('/events/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    delete: (id: number): Promise<void> =>
      fetchJSON<void>(`/events/${id}`, { method: 'DELETE' }),
  },

  triage: {
    assess: (data: TriageInput): Promise<TriageOutput> =>
      fetchJSON<TriageOutput>('/triage/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
  },

  farmers: {
    list: (params?: { country?: string; state?: string }): Promise<Farmer[]> =>
      fetchJSON<Farmer[]>(`/farmers/${qs(params || {})}`),
    get: (id: number): Promise<Farmer> =>
      fetchJSON<Farmer>(`/farmers/${id}`),
    create: (data: Omit<Farmer, 'id' | 'created_at' | 'verified'>): Promise<Farmer> =>
      fetchJSON<Farmer>('/farmers/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    update: (id: number, data: Partial<Farmer>): Promise<Farmer> =>
      fetchJSON<Farmer>(`/farmers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
  },

  posts: {
    feed: (params?: {
      category?: string;
      country?: string;
      state?: string;
      village?: string;
      limit?: number;
    }): Promise<CommunityPost[]> => {
      const p: Record<string, string | undefined> = {
        category: params?.category,
        country: params?.country,
        state: params?.state,
        village: params?.village,
        limit: params?.limit?.toString(),
      };
      const key = `posts_feed_${JSON.stringify(p)}`;
      return fetchWithFallback<CommunityPost[]>(key, `/posts/feed${qs(p)}`, 120_000); // 2 min cache
    },
    get: (id: number): Promise<CommunityPost> =>
      fetchJSON<CommunityPost>(`/posts/${id}`),
    create: (data: Partial<CommunityPost>): Promise<CommunityPost> =>
      fetchJSON<CommunityPost>('/posts/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    delete: (id: number): Promise<void> =>
      fetchJSON<void>(`/posts/${id}`, { method: 'DELETE' }),
    addComment: (postId: number, body: string, farmerId?: number): Promise<PostComment> =>
      fetchJSON<PostComment>(`/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, body, farmer_id: farmerId }),
      }),
  },
};
