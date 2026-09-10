export const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  interested: 'Interested',
  site_visit_scheduled: 'Site Visit Scheduled',
  site_visit_done: 'Site Visit Done',
  negotiation: 'Negotiation',
  booked: 'Booked',
  deal_confirmed: 'Deal Confirmed',
  lost: 'Lost',
};

export const LEAD_STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'interested', label: 'Interested' },
  { value: 'site_visit_scheduled', label: 'Site Visit Scheduled' },
  { value: 'site_visit_done', label: 'Site Visit Done' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'booked', label: 'Booked' },
  { value: 'deal_confirmed', label: 'Deal Confirmed' },
  { value: 'lost', label: 'Lost' },
];

export const LEAD_TEMPERATURE_OPTIONS = [
  { value: 'hot', label: 'Hot' },
  { value: 'warm', label: 'Warm' },
  { value: 'cold', label: 'Cold' },
  { value: 'unqualified', label: 'Unqualified' },
];

export const LEAD_SOURCE_OPTIONS = [
  { value: 'facebook', label: 'Facebook Lead Ads' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'referral', label: 'Referral' },
  { value: 'walkin', label: 'Walk-in' },
  { value: 'website', label: 'Website' },
  { value: 'other', label: 'Other' },
];

export const TEMPERATURE_COLORS: Record<string, "error" | "warning" | "info" | "default"> = {
  hot: 'error',
  warm: 'warning',
  cold: 'info',
  unqualified: 'default'
};

export const PLOT_STATUS_COLORS: Record<string, "success" | "warning" | "error"> = {
  available: 'success',
  reserved: 'warning',
  sold: 'error',
};

export const DEAL_STATUS_COLORS: Record<string, "warning" | "success" | "error"> = {
  booked: 'warning',
  confirmed: 'success',
  cancelled: 'error',
};

export const ROLES: Record<string, string> = {
  super_admin: 'Super Admin',
  manager: 'Manager',
  agent: 'Agent',
};
