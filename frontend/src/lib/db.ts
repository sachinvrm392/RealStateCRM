// Embedded in-app database for seamless serverless execution on Vercel
export interface DbUser {
  id: number;
  username: string;
  password: string; // Plain/hashed comparison for demo
  email: string;
  first_name: string;
  last_name: string;
  role: 'super_admin' | 'manager' | 'agent';
  phone?: string;
  is_active: boolean;
}

export interface DbProject {
  id: number;
  name: string;
  location: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

export interface DbPlot {
  id: number;
  project: number;
  project_name?: string;
  plot_number: string;
  block_sector: string;
  area_sqft: number;
  plot_type: 'residential' | 'commercial' | 'mixed';
  facing: 'east' | 'west' | 'north' | 'south' | 'corner';
  price_per_sqft: number;
  total_price: number;
  status: 'available' | 'reserved' | 'sold';
  dimensions: string;
  floor_level?: string;
  amenities: string;
  created_at: string;
}

export interface DbCallAttempt {
  id: number;
  lead: number;
  agent: number;
  agent_name?: string;
  outcome: string;
  notes: string;
  callback_scheduled_at?: string | null;
  recording_file?: string | null;
  created_at: string;
}

export interface DbLead {
  id: number;
  full_name: string;
  phone_primary: string;
  phone_alternate?: string;
  email?: string;
  whatsapp_number?: string;
  source: string;
  city?: string;
  interested_project?: number | null;
  budget_range?: string;
  plot_size_preference?: string;
  notes?: string;
  status: string;
  temperature: string;
  assigned_agent?: number | null;
  last_contacted_at?: string | null;
  next_callback_at?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface DbMilestone {
  id: number;
  deal: number;
  milestone_type: string;
  amount: number;
  due_date: string;
  paid_date?: string | null;
  is_paid: boolean;
  notes?: string;
  created_at: string;
}

export interface DbDeal {
  id: number;
  lead: number;
  plot: number;
  booking_date: string;
  deal_amount: number;
  discount: number;
  final_amount: number;
  status: 'booked' | 'confirmed' | 'cancelled';
  notes?: string;
  created_by?: number;
  created_at: string;
}

export interface DbAuditLog {
  id: number;
  user?: number | null;
  action: string;
  entity_type: string;
  entity_id: string;
  description: string;
  created_at: string;
}

export interface DbNotification {
  id: number;
  recipient: number;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

class DatabaseStore {
  users: DbUser[] = [];
  projects: DbProject[] = [];
  plots: DbPlot[] = [];
  leads: DbLead[] = [];
  calls: DbCallAttempt[] = [];
  deals: DbDeal[] = [];
  milestones: DbMilestone[] = [];
  auditLogs: DbAuditLog[] = [];
  notifications: DbNotification[] = [];
  private initialized = false;

  constructor() {
    this.seed();
  }

  seed() {
    if (this.initialized) return;
    this.initialized = true;

    const now = new Date().toISOString();

    // 1. Users
    this.users = [
      {
        id: 1,
        username: 'admin',
        password: 'admin123',
        email: 'admin@crm.local',
        first_name: 'Super',
        last_name: 'Admin',
        role: 'super_admin',
        phone: '+91 9800000001',
        is_active: true,
      },
      {
        id: 2,
        username: 'manager',
        password: 'manager123',
        email: 'manager@crm.local',
        first_name: 'Sales',
        last_name: 'Manager',
        role: 'manager',
        phone: '+91 9800011122',
        is_active: true,
      },
      {
        id: 3,
        username: 'agent_rahul',
        password: 'agent123',
        email: 'rahul@crm.local',
        first_name: 'Rahul',
        last_name: 'Sharma',
        role: 'agent',
        phone: '+91 9811122233',
        is_active: true,
      },
      {
        id: 4,
        username: 'agent_priya',
        password: 'agent123',
        email: 'priya@crm.local',
        first_name: 'Priya',
        last_name: 'Patel',
        role: 'agent',
        phone: '+91 9822233344',
        is_active: true,
      },
    ];

    // 2. Projects
    this.projects = [
      {
        id: 1,
        name: 'Green Valley Enclave',
        location: 'Airport Expressway, Sector 45',
        description: 'Premium 50-acre gated plotted township with clubhouse, 40ft wide internal roads, and landscaped parks.',
        is_active: true,
        created_at: now,
      },
      {
        id: 2,
        name: 'Palm Meadows Residency',
        location: 'Outer Ring Road, North Zone',
        description: 'Eco-friendly luxury villa plots with dedicated jogging track, 24/7 security, and solar lighting.',
        is_active: true,
        created_at: now,
      },
    ];

    // 3. Plots
    this.plots = [
      {
        id: 1,
        project: 1,
        project_name: 'Green Valley Enclave',
        plot_number: 'A-101',
        block_sector: 'Block A',
        area_sqft: 1200,
        plot_type: 'residential',
        facing: 'east',
        price_per_sqft: 2500,
        total_price: 3000000,
        status: 'available',
        dimensions: '30x40',
        amenities: 'Park Facing',
        created_at: now,
      },
      {
        id: 2,
        project: 1,
        project_name: 'Green Valley Enclave',
        plot_number: 'A-102',
        block_sector: 'Block A',
        area_sqft: 1500,
        plot_type: 'residential',
        facing: 'north',
        price_per_sqft: 2500,
        total_price: 3750000,
        status: 'available',
        dimensions: '30x50',
        amenities: 'Wide Road',
        created_at: now,
      },
      {
        id: 3,
        project: 1,
        project_name: 'Green Valley Enclave',
        plot_number: 'B-201',
        block_sector: 'Block B',
        area_sqft: 2000,
        plot_type: 'residential',
        facing: 'corner',
        price_per_sqft: 2800,
        total_price: 5600000,
        status: 'reserved',
        dimensions: '40x50',
        amenities: 'Two Side Open Corner',
        created_at: now,
      },
      {
        id: 4,
        project: 1,
        project_name: 'Green Valley Enclave',
        plot_number: 'C-01',
        block_sector: 'Commercial Strip',
        area_sqft: 800,
        plot_type: 'commercial',
        facing: 'north',
        price_per_sqft: 4500,
        total_price: 3600000,
        status: 'available',
        dimensions: '20x40',
        amenities: 'Main Road Facing',
        created_at: now,
      },
      {
        id: 5,
        project: 2,
        project_name: 'Palm Meadows Residency',
        plot_number: 'P-12',
        block_sector: 'Phase 1',
        area_sqft: 1800,
        plot_type: 'residential',
        facing: 'east',
        price_per_sqft: 3200,
        total_price: 5760000,
        status: 'sold',
        dimensions: '30x60',
        amenities: 'Clubhouse Facing',
        created_at: now,
      },
      {
        id: 6,
        project: 2,
        project_name: 'Palm Meadows Residency',
        plot_number: 'P-14',
        block_sector: 'Phase 1',
        area_sqft: 2400,
        plot_type: 'residential',
        facing: 'west',
        price_per_sqft: 3100,
        total_price: 7440000,
        status: 'available',
        dimensions: '40x60',
        amenities: 'Corner Plot',
        created_at: now,
      },
    ];

    // 4. Leads
    this.leads = [
      {
        id: 1,
        full_name: 'Amit Verma',
        phone_primary: '+91 9876543210',
        email: 'amit.verma@example.com',
        source: 'facebook',
        city: 'Delhi NCR',
        interested_project: 1,
        budget_range: '30L - 40L',
        plot_size_preference: '1200 sqft',
        status: 'interested',
        temperature: 'hot',
        assigned_agent: 3,
        last_contacted_at: new Date(Date.now() - 3 * 3600000).toISOString(),
        next_callback_at: new Date(Date.now() + 2 * 3600000).toISOString(),
        notes: 'Looking for immediate registry, requested layout PDF on WhatsApp.',
        created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
      {
        id: 2,
        full_name: 'Sunita Deshmukh',
        phone_primary: '+91 9812345678',
        whatsapp_number: '+91 9812345678',
        email: 'sunita.desh@example.com',
        source: 'whatsapp',
        city: 'Pune',
        interested_project: 2,
        budget_range: '50L - 75L',
        plot_size_preference: '1800 - 2400 sqft',
        status: 'site_visit_scheduled',
        temperature: 'hot',
        assigned_agent: 4,
        last_contacted_at: new Date(Date.now() - 24 * 3600000).toISOString(),
        next_callback_at: new Date(Date.now() + 24 * 3600000).toISOString(),
        notes: 'Site visit scheduled this Saturday 11 AM with family.',
        created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      },
      {
        id: 3,
        full_name: 'Rajesh Gupta',
        phone_primary: '+91 9777665544',
        email: 'rajesh.gupta@example.com',
        source: 'referral',
        city: 'Bangalore',
        interested_project: 1,
        budget_range: '50L+',
        plot_size_preference: '2000 sqft corner',
        status: 'booked',
        temperature: 'hot',
        assigned_agent: 3,
        last_contacted_at: new Date(Date.now() - 48 * 3600000).toISOString(),
        notes: 'Booked plot B-201. Token cheque handed over.',
        created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      },
      {
        id: 4,
        full_name: 'Vikas Khanna',
        phone_primary: '+91 9666554433',
        source: 'website',
        city: 'Mumbai',
        status: 'new',
        temperature: 'unqualified',
        assigned_agent: 4,
        notes: 'Inbound inquiry from website contact form.',
        created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      },
    ];

    // 5. Calls
    this.calls = [
      {
        id: 1,
        lead: 1,
        agent: 3,
        agent_name: 'agent_rahul',
        outcome: 'connected',
        notes: 'Explained payment plan and project location. Customer is highly interested in Block A.',
        created_at: new Date(Date.now() - 5 * 3600000).toISOString(),
      },
      {
        id: 2,
        lead: 1,
        agent: 3,
        agent_name: 'agent_rahul',
        outcome: 'callback_scheduled',
        notes: 'Customer requested a callback at 4 PM after consulting his spouse.',
        callback_scheduled_at: new Date(Date.now() + 2 * 3600000).toISOString(),
        created_at: new Date(Date.now() - 3 * 3600000).toISOString(),
      },
      {
        id: 3,
        lead: 2,
        agent: 4,
        agent_name: 'agent_priya',
        outcome: 'connected',
        notes: 'Confirmed site visit appointment for Saturday morning.',
        created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
      },
    ];

    // 6. Deals & Milestones
    this.deals = [
      {
        id: 1,
        lead: 3,
        plot: 3,
        booking_date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
        deal_amount: 5600000,
        discount: 100000,
        final_amount: 5500000,
        status: 'booked',
        notes: 'Agreed Rs. 1 Lakh discount for full registry within 45 days.',
        created_by: 2,
        created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
    ];

    this.milestones = [
      {
        id: 1,
        deal: 1,
        milestone_type: 'token',
        amount: 100000,
        due_date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
        paid_date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
        is_paid: true,
        notes: 'Token amount paid via IMPS ref #8291039',
        created_at: now,
      },
      {
        id: 2,
        deal: 1,
        milestone_type: 'down_payment',
        amount: 1400000,
        due_date: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
        is_paid: false,
        notes: '25% agreement value due at sale agreement signing.',
        created_at: now,
      },
      {
        id: 3,
        deal: 1,
        milestone_type: 'full_payment',
        amount: 4000000,
        due_date: new Date(Date.now() + 45 * 86400000).toISOString().split('T')[0],
        is_paid: false,
        notes: 'Remaining balance due at sub-registrar plot registry.',
        created_at: now,
      },
    ];

    // 7. Audit Logs
    this.auditLogs = [
      {
        id: 1,
        user: 1,
        action: 'create',
        entity_type: 'Project',
        entity_id: '1',
        description: 'Created Project Green Valley Enclave',
        created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
      },
      {
        id: 2,
        user: 2,
        action: 'create',
        entity_type: 'Deal',
        entity_id: '1',
        description: 'Booked Plot B-201 for Rajesh Gupta',
        created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
    ];

    // 8. Notifications
    this.notifications = [
      {
        id: 1,
        recipient: 3,
        notification_type: 'callback_reminder',
        title: 'Callback Reminder',
        message: 'Scheduled callback with Amit Verma (+91 9876543210)',
        is_read: false,
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
    ];
  }
}

// Global persistent instance for serverless runtime
const globalForDb = globalThis as unknown as { dbStore?: DatabaseStore };
export const db = globalForDb.dbStore ?? new DatabaseStore();
if (process.env.NODE_ENV !== 'production') globalForDb.dbStore = db;
