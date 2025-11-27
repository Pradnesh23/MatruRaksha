-- MatruRaksha Supabase schema aligned with backend expectations

create table if not exists public.mothers (
  id bigserial primary key,
  name text not null,
  phone text unique not null,
  age int,
  gravida int,
  parity int,
  bmi numeric,
  location text,
  preferred_language text,
  telegram_chat_id text,
  created_at timestamptz default now()
);

create table if not exists public.appointments (
  id bigserial primary key,
  mother_id bigint references public.mothers(id) on delete cascade,
  appointment_type text not null,
  appointment_date timestamptz not null,
  notes text,
  status text,
  created_at timestamptz default now()
);

create table if not exists public.health_timeline (
  id bigserial primary key,
  mother_id bigint references public.mothers(id) on delete cascade,
  event_date date not null,
  event_type text not null,
  blood_pressure text,
  hemoglobin numeric,
  sugar_level numeric,
  weight numeric,
  concerns jsonb,
  summary text,
  event_data jsonb,
  created_at timestamptz default now()
);

create table if not exists public.medical_reports (
  id bigserial primary key,
  mother_id bigint references public.mothers(id) on delete cascade,
  filename text,
  upload_date timestamptz,
  analysis_summary text,
  health_metrics jsonb,
  concerns jsonb,
  recommendations jsonb,
  processed boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.health_metrics (
  id bigserial primary key,
  mother_id bigint references public.mothers(id) on delete cascade,
  weight_kg numeric,
  blood_pressure_systolic int,
  blood_pressure_diastolic int,
  hemoglobin numeric,
  blood_sugar numeric,
  measured_at timestamptz,
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.context_memory (
  id bigserial primary key,
  mother_id bigint references public.mothers(id) on delete cascade,
  memory_key text not null,
  memory_value text not null,
  memory_type text,
  source text,
  created_at timestamptz default now()
);

create table if not exists public.conversations (
  id bigserial primary key,
  mother_id bigint references public.mothers(id) on delete cascade,
  message_role text not null,
  message_content text not null,
  context_used jsonb,
  agent_response jsonb,
  created_at timestamptz default now()
);

create table if not exists public.agents (
  id bigserial primary key,
  mother_id bigint references public.mothers(id) on delete cascade,
  agent_config jsonb,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_mothers_phone on public.mothers(phone);
create index if not exists idx_appointments_mother_id on public.appointments(mother_id);
create index if not exists idx_timeline_mother_id on public.health_timeline(mother_id);
create index if not exists idx_reports_mother_id on public.medical_reports(mother_id);
create index if not exists idx_metrics_mother_id on public.health_metrics(mother_id);
create index if not exists idx_context_memory_mother_id on public.context_memory(mother_id);
create index if not exists idx_conversations_mother_id on public.conversations(mother_id);
create index if not exists idx_agents_mother_id on public.agents(mother_id);

-- ===== PHASE 1: Schema Upgrades =====
alter table public.mothers
  add column if not exists medical_history jsonb default '{"conditions": [], "medications": [], "trend_analysis": "No prior history."}'::jsonb;

create table if not exists public.asha_workers (
  id bigserial primary key,
  name text not null,
  phone text,
  assigned_area text,
  is_active boolean default true,
  created_at timestamptz default now()
);

insert into public.asha_workers (name, phone, assigned_area, is_active)
  values
  ('Seema Patil', '9000000001', 'Pune', true),
  ('Rakesh Kumar', '9000000002', 'Mumbai', true),
  ('Anita Joshi', '9000000003', 'Nashik', true)
on conflict do nothing;

alter table public.mothers
  add column if not exists asha_worker_id bigint references public.asha_workers(id);

create table if not exists public.case_discussions (
  id bigserial primary key,
  mother_id bigint references public.mothers(id) on delete cascade,
  sender_role text not null,
  sender_name text,
  message text not null,
  created_at timestamptz default now()
);

alter publication supabase_realtime add table public.case_discussions;
alter publication supabase_realtime add table public.risk_assessments;
alter publication supabase_realtime add table public.mothers;

-- ===== Doctor Management (Proximity Assignment) =====
create table if not exists public.doctors (
  id bigserial primary key,
  name text not null,
  phone text,
  assigned_area text,
  is_active boolean default true,
  created_at timestamptz default now()
);

insert into public.doctors (name, phone, assigned_area, is_active)
  values
  ('Dr. Meera Shah', '9100000001', 'Pune', true),
  ('Dr. Arjun Rao', '9100000002', 'Mumbai', true),
  ('Dr. Kavita Desai', '9100000003', 'Nashik', true)
on conflict do nothing;

alter table public.mothers
  add column if not exists doctor_id bigint references public.doctors(id);

-- Ensure appointments have a constrained status and realtime replication
alter table public.appointments
  alter column status drop default;

-- Create status enum-like constraint if not already present
alter table public.appointments
  add constraint if not exists chk_appointments_status
  check (status in ('scheduled','confirmed','completed','missed','cancelled'));

-- Add facility column if missing
do $ begin
  alter table public.appointments add column facility text;
exception when duplicate_column then null;
end $;

-- Add to realtime publication as well
alter publication supabase_realtime add table public.appointments;

-- Case discussions sender role constraint
alter table public.case_discussions
  add constraint if not exists chk_case_discussions_sender_role
  check (sender_role in ('MOTHER','ASHA','DOCTOR','SYSTEM'));

-- ===== Authentication & Authorization System =====

-- Create user roles enum
create type user_role as enum ('ADMIN', 'DOCTOR', 'ASHA_WORKER');

-- Create user profiles table linked to Supabase auth.users
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text not null,
  phone text,
  role user_role not null,
  is_active boolean default true,
  assigned_area text,
  avatar_url text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add user_profile_id to doctors table (link to auth user)
alter table public.doctors
  add column if not exists user_profile_id uuid references public.user_profiles(id),
  add column if not exists email text;

-- Add user_profile_id to asha_workers table (link to auth user)
alter table public.asha_workers
  add column if not exists user_profile_id uuid references public.user_profiles(id),
  add column if not exists email text;

-- Create indexes for performance
create index if not exists idx_user_profiles_email on public.user_profiles(email);
create index if not exists idx_user_profiles_role on public.user_profiles(role);
create index if not exists idx_doctors_user_profile_id on public.doctors(user_profile_id);
create index if not exists idx_asha_workers_user_profile_id on public.asha_workers(user_profile_id);

-- Create function to handle new user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'ASHA_WORKER'::user_role)
  );
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new user sign ups
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Add trigger to update_updated_at for user_profiles
drop trigger if exists update_user_profiles_updated_at on public.user_profiles;
create trigger update_user_profiles_updated_at
  before update on public.user_profiles
  for each row execute function public.update_updated_at_column();

-- Row Level Security (RLS) Policies
alter table public.user_profiles enable row level security;

-- Allow users to read their own profile
create policy "Users can view own profile"
  on public.user_profiles for select
  using (auth.uid() = id);

-- Allow users to update their own profile
create policy "Users can update own profile"
  on public.user_profiles for update
  using (auth.uid() = id);

-- Admin can view all profiles
create policy "Admins can view all profiles"
  on public.user_profiles for select
  using (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'ADMIN'
    )
  );

-- Admin can update all profiles
create policy "Admins can update all profiles"
  on public.user_profiles for update
  using (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'ADMIN'
    )
  );

-- Doctors can view ASHA workers in their area
create policy "Doctors can view ASHA workers"
  on public.user_profiles for select
  using (
    role = 'ASHA_WORKER' and exists (
      select 1 from public.user_profiles doctor
      where doctor.id = auth.uid() 
        and doctor.role = 'DOCTOR'
        and doctor.assigned_area = public.user_profiles.assigned_area
    )
  );

-- Insert default admin user (update email as needed)
insert into public.user_profiles (id, email, full_name, role, is_active)
select 
  gen_random_uuid(),
  'admin@matruraksha.ai',
  'System Admin',
  'ADMIN'::user_role,
  true
where not exists (
  select 1 from public.user_profiles where role = 'ADMIN'
);
