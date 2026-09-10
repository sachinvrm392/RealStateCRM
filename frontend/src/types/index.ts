export interface User {
  id: number | string;
  username: string;
  email: string;
  role: 'super_admin' | 'manager' | 'agent';
  phone?: string;
  first_name?: string;
  last_name?: string;
}

export interface Project {
  id: number | string;
  name: string;
  description?: string;
  location?: string;
  is_active?: boolean;
  created_at?: string;
}

export interface CallAttempt {
  id: number | string;
  lead: number | string;
  agent?: User | number | string;
  outcome: 'connected' | 'no_answer' | 'busy' | 'switched_off' | 'wrong_number' | 'callback_scheduled' | 'not_interested';
  notes?: string;
  callback_scheduled_at?: string | null;
  recording_file?: string | null;
  created_at: string;
}

export interface Lead {
  id: number | string;
  full_name: string;
  phone_primary: string;
  phone_alternate?: string;
  email?: string;
  whatsapp_number?: string;
  source: 'facebook' | 'whatsapp' | 'referral' | 'walkin' | 'website' | 'other';
  city?: string;
  interested_project?: Project | null;
  budget_range?: string;
  plot_size_preference?: string;
  notes?: string;
  status: 'new' | 'contacted' | 'interested' | 'site_visit_scheduled' | 'site_visit_done' | 'negotiation' | 'booked' | 'deal_confirmed' | 'lost';
  temperature: 'hot' | 'warm' | 'cold' | 'unqualified';
  assigned_agent?: User | null;
  last_contacted_at?: string | null;
  next_callback_at?: string | null;
  created_at: string;
  updated_at?: string;
  call_attempts?: CallAttempt[];
}

export interface Plot {
  id: number | string;
  project: number | string | Project;
  project_name?: string;
  plot_number: string;
  block_sector?: string;
  area_sqft: number | string;
  plot_type: 'residential' | 'commercial' | 'mixed';
  facing?: 'east' | 'west' | 'north' | 'south' | 'corner';
  price_per_sqft?: number | string;
  total_price: number | string;
  status: 'available' | 'reserved' | 'sold';
  dimensions?: string;
  floor_level?: string;
  amenities?: string;
  created_at?: string;
}

export interface PaymentMilestone {
  id: number | string;
  deal: number | string;
  milestone_type: 'token' | 'down_payment' | 'full_payment';
  amount: number | string;
  due_date: string;
  paid_date?: string | null;
  is_paid: boolean;
  notes?: string;
  created_at?: string;
}

export interface Deal {
  id: number | string;
  lead: number | string | Lead;
  lead_name?: string;
  plot: number | string | Plot;
  plot_number?: string;
  booking_date: string;
  deal_amount: number | string;
  discount: number | string;
  final_amount: number | string;
  status: 'booked' | 'confirmed' | 'cancelled';
  notes?: string;
  created_by?: User | number | string;
  created_at: string;
  milestones?: PaymentMilestone[];
  payments?: PaymentMilestone[];
}

export interface Notification {
  id: number | string;
  recipient: User | number | string;
  notification_type: 'callback_reminder' | 'lead_assigned' | 'lead_status_change' | 'deal_update' | 'system';
  title: string;
  message: string;
  is_read: boolean;
  related_lead?: number | string | null;
  related_deal?: number | string | null;
  created_at: string;
}

export interface AuditLog {
  id: number | string;
  user?: User | null;
  action: 'create' | 'update' | 'delete' | 'status_change' | 'assignment';
  entity_type: string;
  entity_id: string;
  old_value?: any;
  new_value?: any;
  description: string;
  ip_address?: string;
  created_at: string;
}
