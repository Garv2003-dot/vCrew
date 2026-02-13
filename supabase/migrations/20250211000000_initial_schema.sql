-- vCrew: Initial schema for employees, projects, loading table, and allocations
-- Run in Supabase SQL Editor or via supabase db push

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============ SKILLS ============
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============ EMPLOYEES ============
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  experience_level TEXT NOT NULL CHECK (experience_level IN ('JUNIOR', 'MID', 'SENIOR')),
  availability_percent INTEGER NOT NULL DEFAULT 100 CHECK (availability_percent >= 0 AND availability_percent <= 100),
  status TEXT NOT NULL DEFAULT 'BENCH' CHECK (status IN ('ALLOCATED', 'PARTIAL', 'BENCH', 'SHADOW', 'ON_LEAVE')),
  age INTEGER,
  gender TEXT,
  mobile TEXT,
  email TEXT,
  address TEXT,
  state TEXT,
  pincode TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============ EMPLOYEE SKILLS (many-to-many with proficiency) ============
CREATE TABLE employee_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  proficiency INTEGER NOT NULL CHECK (proficiency >= 1 AND proficiency <= 5),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, skill_id)
);

CREATE INDEX idx_employee_skills_employee ON employee_skills(employee_id);
CREATE INDEX idx_employee_skills_skill ON employee_skills(skill_id);

-- ============ WORK EXPERIENCE ============
CREATE TABLE work_experiences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  company_url TEXT,
  job_title TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_work_experiences_employee ON work_experiences(employee_id);

-- ============ PROJECTS ============
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  client TEXT,
  logo TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  duration_months INTEGER NOT NULL DEFAULT 3,
  status TEXT NOT NULL DEFAULT 'PLANNED' CHECK (status IN ('PLANNED', 'ACTIVE', 'COMPLETED')),
  project_type TEXT NOT NULL DEFAULT 'NEW' CHECK (project_type IN ('NEW', 'EXISTING', 'GENERAL_DEMAND')),
  priority TEXT DEFAULT 'HIGH' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============ PROJECT INTERVALS (e.g. Week 1, Week 2, Phase 1) ============
CREATE TABLE project_intervals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  interval_index INTEGER NOT NULL,
  label TEXT NOT NULL,
  start_offset_days INTEGER DEFAULT 0,
  end_offset_days INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, interval_index)
);

CREATE INDEX idx_project_intervals_project ON project_intervals(project_id);

-- ============ PROJECT ROLE DEMANDS (loading table rows: role + skills) ============
CREATE TABLE project_role_demands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL,
  primary_skills TEXT[] DEFAULT '{}',
  secondary_skills TEXT[] DEFAULT '{}',
  experience_level TEXT NOT NULL DEFAULT 'MID' CHECK (experience_level IN ('JUNIOR', 'MID', 'SENIOR')),
  row_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_project_role_demands_project ON project_role_demands(project_id);

-- ============ PROJECT ROLE INTERVAL ALLOCATIONS (cell values: % per interval) ============
-- allocation_percent: 50 = 0.5 FTE, 100 = 1 FTE, 200 = 2 FTE
CREATE TABLE project_role_interval_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_role_demand_id UUID NOT NULL REFERENCES project_role_demands(id) ON DELETE CASCADE,
  project_interval_id UUID NOT NULL REFERENCES project_intervals(id) ON DELETE CASCADE,
  allocation_percent INTEGER NOT NULL DEFAULT 100 CHECK (allocation_percent >= 0 AND allocation_percent <= 500),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_role_demand_id, project_interval_id)
);

CREATE INDEX idx_proj_role_interval_demand ON project_role_interval_allocations(project_role_demand_id);
CREATE INDEX idx_proj_role_interval_interval ON project_role_interval_allocations(project_interval_id);

-- ============ PROJECT ASSIGNMENTS (actual employee allocations) ============
-- Supports per-interval assignments: if project_interval_id is set, allocation is for that interval only
-- If project_interval_id is NULL, allocation is for the whole project
CREATE TABLE project_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL,
  project_interval_id UUID REFERENCES project_intervals(id) ON DELETE CASCADE,
  allocation_percent INTEGER NOT NULL DEFAULT 100 CHECK (allocation_percent >= 0 AND allocation_percent <= 100),
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'REMOVED')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_project_assignments_project ON project_assignments(project_id);
CREATE INDEX idx_project_assignments_employee ON project_assignments(employee_id);
CREATE INDEX idx_project_assignments_interval ON project_assignments(project_interval_id);

-- ============ ALLOCATION PROPOSALS (AI response history) ============
CREATE TABLE allocation_proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  demand_type TEXT,
  demand_payload JSONB,
  proposal_json JSONB NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_allocation_proposals_project ON allocation_proposals(project_id);

-- ============ RLS (optional - enable when auth is ready) ============
-- ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
-- etc.
