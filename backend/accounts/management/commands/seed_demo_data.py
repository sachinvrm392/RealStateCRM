from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta, date
from decimal import Decimal
from projects.models import Project
from plots.models import Plot
from leads.models import Lead, CallAttempt
from deals.models import Deal, PaymentMilestone

User = get_user_model()

class Command(BaseCommand):
    help = 'Seed initial demo data for Real Estate CRM (Users, Projects, Plots, Leads, Deals)'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Seeding demo database...'))

        # 1. Users
        admin_user, _ = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@crm.local',
                'first_name': 'Super',
                'last_name': 'Admin',
                'role': 'super_admin',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        admin_user.set_password('admin123')
        admin_user.save()

        manager_user, _ = User.objects.get_or_create(
            username='manager',
            defaults={
                'email': 'manager@crm.local',
                'first_name': 'Sales',
                'last_name': 'Manager',
                'role': 'manager',
                'phone': '+91 9800011122',
            }
        )
        manager_user.set_password('manager123')
        manager_user.save()

        agent_1, _ = User.objects.get_or_create(
            username='agent_rahul',
            defaults={
                'email': 'rahul@crm.local',
                'first_name': 'Rahul',
                'last_name': 'Sharma',
                'role': 'agent',
                'phone': '+91 9811122233',
            }
        )
        agent_1.set_password('agent123')
        agent_1.save()

        agent_2, _ = User.objects.get_or_create(
            username='agent_priya',
            defaults={
                'email': 'priya@crm.local',
                'first_name': 'Priya',
                'last_name': 'Patel',
                'role': 'agent',
                'phone': '+91 9822233344',
            }
        )
        agent_2.set_password('agent123')
        agent_2.save()

        self.stdout.write(self.style.SUCCESS('  [OK] Created users (admin, manager, agent_rahul, agent_priya)'))

        # 2. Projects
        proj_1, _ = Project.objects.get_or_create(
            name='Green Valley Enclave',
            defaults={
                'location': 'Airport Expressway, Sector 45',
                'description': 'Premium 50-acre gated plotted township with clubhouse, 40ft wide internal roads, and landscaped parks.',
                'created_by': admin_user,
            }
        )

        proj_2, _ = Project.objects.get_or_create(
            name='Palm Meadows Residency',
            defaults={
                'location': 'Outer Ring Road, North Zone',
                'description': 'Eco-friendly luxury villa plots with dedicated jogging track, 24/7 security, and solar lighting.',
                'created_by': manager_user,
            }
        )
        self.stdout.write(self.style.SUCCESS('  [OK] Created projects'))

        # 3. Plots
        plots_data = [
            (proj_1, 'A-101', 'Block A', Decimal('1200'), 'residential', 'east', Decimal('2500'), Decimal('3000000'), 'available', '30x40', 'Park Facing'),
            (proj_1, 'A-102', 'Block A', Decimal('1500'), 'residential', 'north', Decimal('2500'), Decimal('3750000'), 'available', '30x50', 'Wide Road'),
            (proj_1, 'B-201', 'Block B', Decimal('2000'), 'residential', 'corner', Decimal('2800'), Decimal('5600000'), 'reserved', '40x50', 'Two Side Open Corner'),
            (proj_1, 'C-01', 'Commercial Strip', Decimal('800'), 'commercial', 'north', Decimal('4500'), Decimal('3600000'), 'available', '20x40', 'Main Road Facing'),
            (proj_2, 'P-12', 'Phase 1', Decimal('1800'), 'residential', 'east', Decimal('3200'), Decimal('5760000'), 'sold', '30x60', 'Clubhouse Facing'),
            (proj_2, 'P-14', 'Phase 1', Decimal('2400'), 'residential', 'west', Decimal('3100'), Decimal('7440000'), 'available', '40x60', 'Corner Plot'),
        ]

        created_plots = []
        for p_proj, p_num, p_block, p_area, p_type, p_facing, p_rate, p_total, p_status, p_dim, p_amenities in plots_data:
            plot, _ = Plot.objects.get_or_create(
                project=p_proj,
                plot_number=p_num,
                defaults={
                    'block_sector': p_block,
                    'area_sqft': p_area,
                    'plot_type': p_type,
                    'facing': p_facing,
                    'price_per_sqft': p_rate,
                    'total_price': p_total,
                    'status': p_status,
                    'dimensions': p_dim,
                    'amenities': p_amenities,
                }
            )
            created_plots.append(plot)

        self.stdout.write(self.style.SUCCESS(f'  [OK] Created {len(created_plots)} plot inventory units'))

        # 4. Leads
        now = timezone.now()
        lead_1, _ = Lead.objects.get_or_create(
            phone_primary='+91 9876543210',
            defaults={
                'full_name': 'Amit Verma',
                'email': 'amit.verma@example.com',
                'source': 'facebook',
                'city': 'Delhi NCR',
                'interested_project': proj_1,
                'budget_range': '30L - 40L',
                'plot_size_preference': '1200 sqft',
                'status': 'interested',
                'temperature': 'hot',
                'assigned_agent': agent_1,
                'last_contacted_at': now - timedelta(hours=3),
                'next_callback_at': now + timedelta(hours=2),
                'notes': 'Looking for immediate registry, requested layout PDF on WhatsApp.',
            }
        )

        lead_2, _ = Lead.objects.get_or_create(
            phone_primary='+91 9812345678',
            defaults={
                'full_name': 'Sunita Deshmukh',
                'email': 'sunita.desh@example.com',
                'whatsapp_number': '+91 9812345678',
                'source': 'whatsapp',
                'city': 'Pune',
                'interested_project': proj_2,
                'budget_range': '50L - 75L',
                'plot_size_preference': '1800 - 2400 sqft',
                'status': 'site_visit_scheduled',
                'temperature': 'hot',
                'assigned_agent': agent_2,
                'last_contacted_at': now - timedelta(days=1),
                'next_callback_at': now + timedelta(days=1),
                'notes': 'Site visit scheduled this Saturday 11 AM with family.',
            }
        )

        lead_3, _ = Lead.objects.get_or_create(
            phone_primary='+91 9777665544',
            defaults={
                'full_name': 'Rajesh Gupta',
                'email': 'rajesh.gupta@example.com',
                'source': 'referral',
                'city': 'Bangalore',
                'interested_project': proj_1,
                'budget_range': '50L+',
                'plot_size_preference': '2000 sqft corner',
                'status': 'booked',
                'temperature': 'hot',
                'assigned_agent': agent_1,
                'last_contacted_at': now - timedelta(days=2),
                'notes': 'Booked plot B-201. Token cheque handed over.',
            }
        )

        lead_4, _ = Lead.objects.get_or_create(
            phone_primary='+91 9666554433',
            defaults={
                'full_name': 'Vikas Khanna',
                'source': 'website',
                'city': 'Mumbai',
                'status': 'new',
                'temperature': 'unqualified',
                'assigned_agent': agent_2,
                'notes': 'Inbound inquiry from website contact form.',
            }
        )

        lead_5, _ = Lead.objects.get_or_create(
            phone_primary='+91 9899887766',
            defaults={
                'full_name': 'Sushil Kumar',
                'email': 'sushil.kumar@example.com',
                'source': 'walkin',
                'city': 'Delhi NCR',
                'interested_project': proj_1,
                'budget_range': '40L - 60L',
                'plot_size_preference': '1500 sqft',
                'status': 'new',
                'temperature': 'warm',
                'assigned_agent': agent_1,
                'notes': 'Interested in Block A residential plot.',
            }
        )

        self.stdout.write(self.style.SUCCESS('  [OK] Created leads across pipeline stages'))

        # 5. Call Attempts
        CallAttempt.objects.get_or_create(
            lead=lead_1,
            outcome='connected',
            defaults={
                'agent': agent_1,
                'notes': 'Explained payment plan and project location. Customer is highly interested in Block A.',
            }
        )

        CallAttempt.objects.get_or_create(
            lead=lead_1,
            outcome='callback_scheduled',
            defaults={
                'agent': agent_1,
                'notes': 'Customer requested a callback at 4 PM after consulting his spouse.',
                'callback_scheduled_at': now + timedelta(hours=2),
            }
        )

        CallAttempt.objects.get_or_create(
            lead=lead_2,
            outcome='connected',
            defaults={
                'agent': agent_2,
                'notes': 'Confirmed site visit appointment for Saturday morning.',
            }
        )
        self.stdout.write(self.style.SUCCESS('  [OK] Created call attempt history'))

        # 6. Deal & Milestones
        deal_plot = created_plots[2] # B-201
        deal, _ = Deal.objects.get_or_create(
            lead=lead_3,
            plot=deal_plot,
            defaults={
                'booking_date': date.today() - timedelta(days=2),
                'deal_amount': Decimal('5600000'),
                'discount': Decimal('100000'),
                'final_amount': Decimal('5500000'),
                'status': 'booked',
                'notes': 'Agreed Rs. 1 Lakh discount for full registry within 45 days.',
                'created_by': manager_user,
            }
        )

        PaymentMilestone.objects.get_or_create(
            deal=deal,
            milestone_type='token',
            defaults={
                'amount': Decimal('100000'),
                'due_date': date.today() - timedelta(days=2),
                'paid_date': date.today() - timedelta(days=2),
                'is_paid': True,
                'notes': 'Token amount paid via IMPS ref #8291039',
            }
        )

        PaymentMilestone.objects.get_or_create(
            deal=deal,
            milestone_type='down_payment',
            defaults={
                'amount': Decimal('1400000'),
                'due_date': date.today() + timedelta(days=15),
                'is_paid': False,
                'notes': '25% agreement value due at sale agreement signing.',
            }
        )

        PaymentMilestone.objects.get_or_create(
            deal=deal,
            milestone_type='full_payment',
            defaults={
                'amount': Decimal('4000000'),
                'due_date': date.today() + timedelta(days=45),
                'is_paid': False,
                'notes': 'Remaining balance due at sub-registrar plot registry.',
            }
        )

        self.stdout.write(self.style.SUCCESS('  [OK] Created sample Deal with payment milestone breakdown'))
        self.stdout.write(self.style.SUCCESS('\nDemo database seed complete!'))
        self.stdout.write('Login credentials:')
        self.stdout.write('  Super Admin: username: admin        / password: admin123')
        self.stdout.write('  Manager:     username: manager      / password: manager123')
        self.stdout.write('  Agent 1:     username: agent_rahul  / password: agent123')
        self.stdout.write('  Agent 2:     username: agent_priya  / password: agent123')
