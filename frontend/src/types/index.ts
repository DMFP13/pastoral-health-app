export interface Disease {
  disease_id: number;
  name: string;
  symptoms: string;
  treatment_guidance: string;
  affected_species: string;
  severity: string;
  is_contagious: string;
  prevention?: string;
}

export interface Vet {
  vet_id: number;
  name: string;
  phone: string;
  location: string;
  state?: string;
  country: string;
  specialization?: string;
  available: string;
}

export interface Supplier {
  supplier_id: number;
  name: string;
  contact_info: string;
  location: string;
  website?: string;
  country: string;
}

export interface Medicine {
  medicine_id: number;
  name: string;
  supplier_id?: number;
  type: string;
  price_range?: string;
  indication: string;
  dosage?: string;
  supplier?: Supplier;
}

export interface Animal {
  id: number;
  animal_tag: string;
  species: string;
  breed?: string;
  sex?: string;
  approximate_age?: string;
  owner_name: string;
  herd_name?: string;
  village?: string;
  country?: string;
  notes?: string;
  photo_url?: string;
  qr_code?: string;
  created_at?: string;
  events?: AnimalEvent[];
}

export interface AnimalEvent {
  id: number;
  animal_id: number;
  event_type: string;
  event_date: string;
  symptoms?: string;
  temperature?: number;
  eating_status?: string;
  mobility_status?: string;
  risk_level?: string;
  recommendation?: string;
  action_taken?: string;
  follow_up_date?: string;
  outcome?: string;
  location?: string;
  image_url?: string;
  created_at?: string;
}

export interface UserLocation {
  lat?: number;
  lng?: number;
  village?: string;
  lga?: string;
  state?: string;
  country?: string;
  /** How this location was set — used to show the right label in the UI */
  source?: 'manual' | 'gps' | 'default';
}

export interface TriageInput {
  species: string;
  symptoms?: string[];
  eating?: boolean | null;
  lameness?: boolean;
  fever?: boolean;
  nasal_discharge?: boolean;
  salivation?: boolean;
  lesions?: boolean;
  coughing?: boolean;
  pregnancy_status?: string;
  recent_calving?: boolean;
  country?: string;
}

export interface ConditionMatch {
  condition: string;
  confidence: string;
  economic_note: string;
}

export interface TriageOutput {
  likely_conditions: ConditionMatch[];
  risk_level: 'low' | 'moderate' | 'high' | 'emergency';
  recommendation: string;
  urgency_hours?: number;
  isolate_animal: boolean;
  call_vet: boolean;
  rationale: string[];
  economic_note: string;
  suggested_vets: Vet[];
}

export type EventType =
  | 'illness' | 'treatment' | 'birth' | 'death'
  | 'sale' | 'vaccination' | 'heat' | 'injury' | 'other';

export interface Farmer {
  id: number;
  phone: string;
  name: string;
  village?: string;
  lga?: string;
  state?: string;
  country?: string;
  preferred_language?: string;
  herd_name?: string;
  herd_size?: number;
  photo_url?: string;
  verified: boolean;
  insurance_provider?: string;
  emergency_contact?: string;
  created_at?: string;
}

export type PostCategory =
  | 'disease_alert' | 'missing_animal' | 'theft' | 'water'
  | 'pasture' | 'weather' | 'advice' | 'market';

export interface PostComment {
  id: number;
  post_id: number;
  farmer_id?: number;
  body: string;
  created_at?: string;
  farmer?: Farmer;
}

export interface CommunityPost {
  id: number;
  farmer_id?: number;
  category: PostCategory;
  body: string;
  village?: string;
  lga?: string;
  state?: string;
  country?: string;
  image_url?: string;
  created_at?: string;
  farmer?: Farmer;
  comments?: PostComment[];
  comment_count?: number;
}

export type Language = 'en' | 'ha' | 'ff' | 'yo' | 'ig';
