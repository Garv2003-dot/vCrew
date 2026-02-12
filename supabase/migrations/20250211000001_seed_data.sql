-- Seed data for vCrew: skills, employees, work_experiences, projects, project_assignments
-- Run after 20250211000000_initial_schema.sql

-- ============ SKILLS ============
INSERT INTO skills (id, name, category) VALUES
  (gen_random_uuid(), 'React', 'frontend'),
  (gen_random_uuid(), 'TypeScript', 'frontend'),
  (gen_random_uuid(), 'Tailwind', 'frontend'),
  (gen_random_uuid(), 'Node.js', 'backend'),
  (gen_random_uuid(), 'PostgreSQL', 'backend'),
  (gen_random_uuid(), 'AWS', 'cloud'),
  (gen_random_uuid(), 'Agile', 'process'),
  (gen_random_uuid(), 'Jira', 'process'),
  (gen_random_uuid(), 'Figma', 'design'),
  (gen_random_uuid(), 'Prototyping', 'design'),
  (gen_random_uuid(), 'Kubernetes', 'devops'),
  (gen_random_uuid(), 'Docker', 'devops'),
  (gen_random_uuid(), 'CI/CD', 'devops')
ON CONFLICT (name) DO NOTHING;

-- ============ EMPLOYEES ============
INSERT INTO employees (id, name, role, experience_level, availability_percent, status, age, gender, mobile, email, address, state, pincode, description) VALUES
  (gen_random_uuid(), 'Alice Johnson', 'Senior Frontend Dev', 'SENIOR', 0, 'ALLOCATED', 32, 'Female', '+1-555-0101', 'alice.johnson@example.com', '123 Oak Street, Apt 4', 'California', '94102', 'Passionate about building accessible and performant web applications.'),
  (gen_random_uuid(), 'Bob Smith', 'Backend Engineer', 'MID', 0, 'ALLOCATED', 29, 'Male', '+1-555-0102', 'bob.smith@example.com', '456 Pine Ave', 'New York', '10001', 'Backend engineer focused on scalable APIs and database design.'),
  (gen_random_uuid(), 'Charlie Davis', 'Product Manager', 'SENIOR', 40, 'PARTIAL', 38, 'Male', '+1-555-0103', 'charlie.davis@example.com', '789 Maple Drive', 'Texas', '77001', 'Product leader with a track record of shipping user-centric products.'),
  (gen_random_uuid(), 'Diana Prince', 'UX Designer', 'MID', 100, 'BENCH', 30, 'Female', '+1-555-0104', 'diana.prince@example.com', '321 Cedar Lane', 'Washington', '98101', 'UX designer who believes in human-centered design.'),
  (gen_random_uuid(), 'Ethan Hunt', 'DevOps Engineer', 'SENIOR', 20, 'PARTIAL', 35, 'Male', '+1-555-0105', 'ethan.hunt@example.com', '555 Tech Park Blvd', 'California', '94025', 'DevOps and infrastructure specialist.'),
  (gen_random_uuid(), 'Fiona Patel', 'Senior Frontend Dev', 'SENIOR', 100, 'BENCH', 33, 'Female', '+1-555-0106', 'fiona.patel@example.com', '100 Riverside Rd', 'Illinois', '60601', 'Senior frontend developer with deep React and TypeScript experience.'),
  (gen_random_uuid(), 'George Miller', 'Backend Engineer', 'MID', 30, 'PARTIAL', 28, 'Male', '+1-555-0107', 'george.miller@example.com', '200 Harbor View', 'Massachusetts', '02101', 'Backend engineer specializing in Node.js and PostgreSQL.'),
  (gen_random_uuid(), 'Hannah Lee', 'UX Designer', 'MID', 100, 'BENCH', 27, 'Female', '+1-555-0108', 'hannah.lee@example.com', '88 Design Street', 'Oregon', '97201', 'UX designer with a focus on prototyping and user research.'),
  (gen_random_uuid(), 'Ivan Rodriguez', 'DevOps Engineer', 'SENIOR', 0, 'ALLOCATED', 36, 'Male', '+1-555-0109', 'ivan.rodriguez@example.com', '42 Server Lane', 'Virginia', '22101', 'Senior DevOps engineer. Kubernetes and Docker expert.'),
  (gen_random_uuid(), 'Julia Nguyen', 'Product Manager', 'SENIOR', 40, 'PARTIAL', 34, 'Female', '+1-555-0110', 'julia.nguyen@example.com', '15 Product Way', 'Colorado', '80202', 'Senior PM with expertise in B2B SaaS.'),
  (gen_random_uuid(), 'Kevin Brown', 'Backend Engineer', 'MID', 100, 'BENCH', 26, 'Male', '+1-555-0111', 'kevin.brown@example.com', '55 Database Ave', 'Georgia', '30301', 'Backend engineer with Node.js and AWS experience.'),
  (gen_random_uuid(), 'Laura Wilson', 'Senior Frontend Dev', 'SENIOR', 10, 'PARTIAL', 31, 'Female', '+1-555-0112', 'laura.wilson@example.com', '77 Component Rd', 'North Carolina', '27601', 'Senior frontend developer. React and TypeScript specialist.'),
  (gen_random_uuid(), 'Michael Scott', 'Product Manager', 'MID', 100, 'BENCH', 40, 'Male', '+1-555-0113', 'michael.scott@example.com', '99 Paper Street', 'Pennsylvania', '19101', 'Product manager with a people-first approach.'),
  (gen_random_uuid(), 'Nina Kapoor', 'UX Designer', 'MID', 60, 'PARTIAL', 29, 'Female', '+1-555-0114', 'nina.kapoor@example.com', '22 Design Lane', 'Arizona', '85001', 'UX designer focused on Figma and prototyping.'),
  (gen_random_uuid(), 'Oscar Chen', 'DevOps Engineer', 'SENIOR', 100, 'BENCH', 37, 'Male', '+1-555-0115', 'oscar.chen@example.com', '33 Infra Blvd', 'Washington', '98102', 'Senior DevOps engineer. Kubernetes and CI/CD expert.'),
  (gen_random_uuid(), 'Rahul Mehta', 'Backend Engineer', 'MID', 100, 'BENCH', 28, 'Male', '+91-98765-43210', 'rahul.mehta@example.com', '45 MG Road', 'Karnataka', '560001', 'Backend engineer with Node.js and PostgreSQL.'),
  (gen_random_uuid(), 'Sneha Iyer', 'Senior Frontend Dev', 'SENIOR', 50, 'PARTIAL', 32, 'Female', '+91-98765-43211', 'sneha.iyer@example.com', '12 Indiranagar', 'Karnataka', '560038', 'Senior frontend developer. React and TypeScript expert.'),
  (gen_random_uuid(), 'Arjun Rao', 'DevOps Engineer', 'MID', 100, 'BENCH', 27, 'Male', '+91-98765-43212', 'arjun.rao@example.com', '88 Koramangala', 'Karnataka', '560034', 'DevOps engineer with Kubernetes and Docker.'),
  (gen_random_uuid(), 'Meera Kulkarni', 'UX Designer', 'MID', 100, 'BENCH', 30, 'Female', '+91-98765-43213', 'meera.kulkarni@example.com', '5 HSR Layout', 'Karnataka', '560102', 'UX designer with strong Figma and prototyping skills.'),
  (gen_random_uuid(), 'Amit Verma', 'Product Manager', 'SENIOR', 60, 'PARTIAL', 35, 'Male', '+91-98765-43214', 'amit.verma@example.com', '20 Whitefield', 'Karnataka', '560066', 'Senior PM with expertise in agile and Jira.'),
  (gen_random_uuid(), 'Karan Shah', 'Backend Engineer', 'MID', 100, 'BENCH', 26, 'Male', '+91-98765-43215', 'karan.shah@example.com', '10 Brigade Rd', 'Maharashtra', '400001', 'Backend engineer with Node.js and PostgreSQL.'),
  (gen_random_uuid(), 'Pooja Nair', 'UX Designer', 'MID', 100, 'BENCH', 28, 'Female', '+91-98765-43216', 'pooja.nair@example.com', '7 Park Street', 'West Bengal', '700016', 'UX designer with Figma and prototyping.'),
  (gen_random_uuid(), 'Siddharth Jain', 'DevOps Engineer', 'SENIOR', 90, 'PARTIAL', 34, 'Male', '+91-98765-43217', 'siddharth.jain@example.com', '25 DLF Phase 1', 'Haryana', '122002', 'Senior DevOps engineer. Kubernetes and Docker expert.'),
  (gen_random_uuid(), 'Neha Agarwal', 'Senior Frontend Dev', 'SENIOR', 100, 'BENCH', 31, 'Female', '+91-98765-43218', 'neha.agarwal@example.com', '18 Connaught Place', 'Delhi', '110001', 'Senior frontend developer. React and TypeScript specialist.'),
  (gen_random_uuid(), 'Vikram Singh', 'Product Manager', 'MID', 100, 'BENCH', 33, 'Male', '+91-98765-43219', 'vikram.singh@example.com', '30 Sector 18', 'Uttar Pradesh', '201301', 'Product manager with agile and Jira expertise.'),
  (gen_random_uuid(), 'Ananya Bose', 'Senior Frontend Dev', 'SENIOR', 70, 'PARTIAL', 30, 'Female', '+91-98765-43220', 'ananya.bose@example.com', '14 Salt Lake', 'West Bengal', '700091', 'Senior frontend developer with React and TypeScript.'),
  (gen_random_uuid(), 'Rohan Malhotra', 'Backend Engineer', 'MID', 100, 'BENCH', 27, 'Male', '+91-98765-43221', 'rohan.malhotra@example.com', '9 Cyber City', 'Haryana', '122002', 'Backend engineer with Node.js and PostgreSQL.');

-- ============ EMPLOYEE SKILLS ============
INSERT INTO employee_skills (employee_id, skill_id, proficiency)
SELECT e.id, s.id, prof FROM
  (VALUES
    ('Alice Johnson', 'React', 5), ('Alice Johnson', 'TypeScript', 5), ('Alice Johnson', 'Tailwind', 4),
    ('Bob Smith', 'Node.js', 4), ('Bob Smith', 'PostgreSQL', 3), ('Bob Smith', 'AWS', 3),
    ('Charlie Davis', 'Agile', 5), ('Charlie Davis', 'Jira', 4),
    ('Diana Prince', 'Figma', 5), ('Diana Prince', 'Prototyping', 4),
    ('Ethan Hunt', 'Kubernetes', 5), ('Ethan Hunt', 'Docker', 5), ('Ethan Hunt', 'CI/CD', 5),
    ('Fiona Patel', 'React', 4), ('Fiona Patel', 'TypeScript', 4),
    ('George Miller', 'Node.js', 4), ('George Miller', 'PostgreSQL', 4),
    ('Hannah Lee', 'Figma', 5), ('Hannah Lee', 'Prototyping', 5),
    ('Ivan Rodriguez', 'Kubernetes', 4), ('Ivan Rodriguez', 'Docker', 5), ('Ivan Rodriguez', 'CI/CD', 4),
    ('Julia Nguyen', 'Agile', 5), ('Julia Nguyen', 'Jira', 5),
    ('Kevin Brown', 'Node.js', 3), ('Kevin Brown', 'PostgreSQL', 3), ('Kevin Brown', 'AWS', 3),
    ('Laura Wilson', 'React', 5), ('Laura Wilson', 'TypeScript', 4), ('Laura Wilson', 'Tailwind', 4),
    ('Michael Scott', 'Agile', 4), ('Michael Scott', 'Jira', 3),
    ('Nina Kapoor', 'Figma', 4), ('Nina Kapoor', 'Prototyping', 4),
    ('Oscar Chen', 'Kubernetes', 5), ('Oscar Chen', 'Docker', 4), ('Oscar Chen', 'CI/CD', 4),
    ('Rahul Mehta', 'Node.js', 4), ('Rahul Mehta', 'PostgreSQL', 4), ('Rahul Mehta', 'AWS', 3),
    ('Sneha Iyer', 'React', 5), ('Sneha Iyer', 'TypeScript', 5), ('Sneha Iyer', 'Tailwind', 4),
    ('Arjun Rao', 'Kubernetes', 3), ('Arjun Rao', 'Docker', 4), ('Arjun Rao', 'CI/CD', 4),
    ('Meera Kulkarni', 'Figma', 5), ('Meera Kulkarni', 'Prototyping', 4),
    ('Amit Verma', 'Agile', 5), ('Amit Verma', 'Jira', 5),
    ('Karan Shah', 'Node.js', 3), ('Karan Shah', 'PostgreSQL', 3),
    ('Pooja Nair', 'Figma', 4), ('Pooja Nair', 'Prototyping', 4),
    ('Siddharth Jain', 'Kubernetes', 5), ('Siddharth Jain', 'Docker', 5),
    ('Neha Agarwal', 'React', 5), ('Neha Agarwal', 'TypeScript', 4),
    ('Vikram Singh', 'Agile', 4), ('Vikram Singh', 'Jira', 4),
    ('Ananya Bose', 'React', 4), ('Ananya Bose', 'TypeScript', 4),
    ('Rohan Malhotra', 'Node.js', 4), ('Rohan Malhotra', 'PostgreSQL', 3)
  ) AS t(emp_name, skill_name, prof)
  JOIN employees e ON e.name = t.emp_name
  JOIN skills s ON s.name = t.skill_name
ON CONFLICT (employee_id, skill_id) DO NOTHING;

-- ============ WORK EXPERIENCE (rich data for all employees) ============
INSERT INTO work_experiences (employee_id, company_name, company_url, job_title, start_date, end_date)
SELECT e.id, t.company_name, t.company_url, t.job_title, t.start_date::date, t.end_date::date FROM
  (VALUES
    ('Alice Johnson', 'TechCorp', 'https://techcorp.com', 'Frontend Developer', '2019-03-01', '2021-06-30'),
    ('Alice Johnson', 'WebScale Inc', 'https://webscale.io', 'Senior Frontend Dev', '2021-07-01', '2026-12-31'),
    ('Bob Smith', 'DataFlow', 'https://dataflow.io', 'Backend Engineer', '2020-01-01', '2026-12-31'),
    ('Charlie Davis', 'ProductLabs', 'https://productlabs.com', 'Associate PM', '2016-06-01', '2019-08-31'),
    ('Charlie Davis', 'ScaleUp', 'https://scaleup.co', 'Product Manager', '2019-09-01', '2026-12-31'),
    ('Diana Prince', 'DesignStudio', 'https://designstudio.com', 'Junior UX Designer', '2019-02-01', '2021-05-31'),
    ('Diana Prince', 'CreativeCo', 'https://creativeco.io', 'UX Designer', '2021-06-01', '2026-12-31'),
    ('Ethan Hunt', 'CloudNine', 'https://cloudnine.com', 'DevOps Engineer', '2018-04-01', '2022-01-31'),
    ('Ethan Hunt', 'InfraScale', 'https://infrascale.io', 'Senior DevOps Engineer', '2022-02-01', '2026-12-31'),
    ('Fiona Patel', 'StartupX', 'https://startupx.io', 'Frontend Developer', '2018-04-01', '2021-06-30'),
    ('Fiona Patel', 'ScaleTech', 'https://scaltech.com', 'Senior Frontend Dev', '2021-07-01', '2026-12-31'),
    ('George Miller', 'API Labs', 'https://apilabs.io', 'Junior Backend Dev', '2019-06-01', '2022-01-31'),
    ('George Miller', 'DataFlow', 'https://dataflow.io', 'Backend Engineer', '2022-02-01', '2026-12-31'),
    ('Hannah Lee', 'DesignHub', 'https://designhub.co', 'UX Intern', '2018-03-01', '2019-08-31'),
    ('Hannah Lee', 'CreativeCo', 'https://creativeco.io', 'UX Designer', '2019-09-01', '2026-12-31'),
    ('Ivan Rodriguez', 'OpsCloud', 'https://opscloud.com', 'DevOps Engineer', '2016-06-01', '2020-12-31'),
    ('Ivan Rodriguez', 'Valeris', 'https://valeris.io', 'Senior DevOps Engineer', '2021-01-01', '2026-12-31'),
    ('Julia Nguyen', 'PM Academy', 'https://pmacademy.com', 'Associate PM', '2014-03-01', '2017-12-31'),
    ('Julia Nguyen', 'ScaleUp', 'https://scaleup.co', 'Product Manager', '2018-01-01', '2026-12-31'),
    ('Rahul Mehta', 'Tata Consultancy', 'https://tcs.com', 'Software Engineer', '2019-06-01', '2022-01-31'),
    ('Rahul Mehta', 'Infosys', 'https://infosys.com', 'Backend Engineer', '2022-02-01', '2026-12-31'),
    ('Sneha Iyer', 'Flipkart', 'https://flipkart.com', 'Frontend Developer', '2019-03-01', '2022-06-30'),
    ('Sneha Iyer', 'Swiggy', 'https://swiggy.in', 'Senior Frontend Dev', '2022-07-01', '2026-12-31'),
    ('Amit Verma', 'Zoho', 'https://zoho.com', 'Product Analyst', '2016-03-01', '2019-08-31'),
    ('Amit Verma', 'Freshworks', 'https://freshworks.com', 'Product Manager', '2019-09-01', '2026-12-31')
  ) AS t(emp_name, company_name, company_url, job_title, start_date, end_date)
  JOIN employees e ON e.name = t.emp_name;

-- ============ PROJECTS ============
INSERT INTO projects (id, name, description, client, logo, start_date, end_date, duration_months, status, project_type, priority) VALUES
  (gen_random_uuid(), 'Rhapsody', 'Healthcare platform revamp', 'Rhapsody', '/logos/rhapsody-logo.png', '2025-11-01', '2026-06-30', 8, 'ACTIVE', 'EXISTING', 'HIGH'),
  (gen_random_uuid(), 'Neovance', 'Cloud migration platform', 'Neovance', '/logos/neovance-logo.jpeg', '2025-09-15', '2026-04-15', 7, 'ACTIVE', 'EXISTING', 'HIGH'),
  (gen_random_uuid(), 'Valeris', 'DevOps infrastructure', 'Valeris', '/logos/valeris-logo.jpeg', '2025-10-01', '2026-03-31', 6, 'ACTIVE', 'EXISTING', 'HIGH'),
  (gen_random_uuid(), 'HHAexchange', 'HHA exchange platform', 'HHAexchange', '/logos/hhax-logo.jpeg', '2025-12-01', '2026-08-01', 8, 'ACTIVE', 'EXISTING', 'HIGH'),
  (gen_random_uuid(), 'Health Catalyst', 'Healthcare analytics', 'Health Catalyst', '/logos/healthcatalys-logo.jpeg', '2025-08-01', '2026-02-28', 7, 'ACTIVE', 'EXISTING', 'HIGH'),
  (gen_random_uuid(), 'Kipu Healthcare', 'Kipu EHR platform', 'Kipu Healthcare', '/logos/kipu-logo.jpeg', '2025-07-15', '2026-01-31', 6, 'ACTIVE', 'EXISTING', 'HIGH');

-- ============ PROJECT ASSIGNMENTS ============
INSERT INTO project_assignments (project_id, employee_id, role_name, allocation_percent, status)
SELECT p.id, e.id, t.role_name, t.allocation_percent, 'ACTIVE' FROM
  (VALUES
    ('Rhapsody', 'Bob Smith', 'Backend Engineer', 100),
    ('Rhapsody', 'George Miller', 'Backend Engineer', 70),
    ('Rhapsody', 'Charlie Davis', 'Product Manager', 60),
    ('Rhapsody', 'Nina Kapoor', 'UX Designer', 40),
    ('Rhapsody', 'Alice Johnson', 'Senior Frontend Dev', 10),
    ('Neovance', 'Alice Johnson', 'Senior Frontend Dev', 100),
    ('Neovance', 'Sneha Iyer', 'Senior Frontend Dev', 50),
    ('Neovance', 'Julia Nguyen', 'Product Manager', 60),
    ('Neovance', 'Laura Wilson', 'Senior Frontend Dev', 90),
    ('Neovance', 'Ananya Bose', 'Senior Frontend Dev', 30),
    ('Valeris', 'Ethan Hunt', 'DevOps Engineer', 80),
    ('Valeris', 'Ivan Rodriguez', 'DevOps Engineer', 100),
    ('Valeris', 'Amit Verma', 'Product Manager', 40),
    ('Valeris', 'Siddharth Jain', 'DevOps Engineer', 10),
    ('Valeris', 'Alice Johnson', 'Senior Frontend Dev', 10),
    ('HHAexchange', 'Kevin Brown', 'Backend Engineer', 100),
    ('HHAexchange', 'Hannah Lee', 'UX Designer', 100),
    ('HHAexchange', 'Vikram Singh', 'Product Manager', 100),
    ('Health Catalyst', 'Rahul Mehta', 'Backend Engineer', 100),
    ('Health Catalyst', 'Meera Kulkarni', 'UX Designer', 100),
    ('Health Catalyst', 'Michael Scott', 'Product Manager', 100),
    ('Kipu Healthcare', 'Oscar Chen', 'DevOps Engineer', 100),
    ('Kipu Healthcare', 'Karan Shah', 'Backend Engineer', 100),
    ('Kipu Healthcare', 'Pooja Nair', 'UX Designer', 100)
  ) AS t(proj_name, emp_name, role_name, allocation_percent)
  JOIN projects p ON p.name = t.proj_name
  JOIN employees e ON e.name = t.emp_name;
