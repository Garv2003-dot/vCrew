-- Update allocations data: add total_exp_months, fill missing roles (QA, FE, BE, DevOps)
-- Total Exp is in months

-- ============ ADD total_exp_months COLUMN ============
ALTER TABLE employees ADD COLUMN IF NOT EXISTS total_exp_months INTEGER;

-- ============ ADD QA/Testing SKILLS ============
INSERT INTO skills (id, name, category) VALUES
  (gen_random_uuid(), 'Selenium', 'qa'),
  (gen_random_uuid(), 'Jest', 'qa'),
  (gen_random_uuid(), 'Cypress', 'qa'),
  (gen_random_uuid(), 'Manual Testing', 'qa'),
  (gen_random_uuid(), 'API Testing', 'qa')
ON CONFLICT (name) DO NOTHING;

-- ============ UPDATE EXISTING EMPLOYEES WITH total_exp_months ============
-- JUNIOR: 24-48 months, MID: 48-84 months, SENIOR: 84+ months
UPDATE employees SET total_exp_months = 96 WHERE name = 'Alice Johnson';
UPDATE employees SET total_exp_months = 72 WHERE name = 'Bob Smith';
UPDATE employees SET total_exp_months = 120 WHERE name = 'Charlie Davis';
UPDATE employees SET total_exp_months = 84 WHERE name = 'Diana Prince';
UPDATE employees SET total_exp_months = 96 WHERE name = 'Ethan Hunt';
UPDATE employees SET total_exp_months = 96 WHERE name = 'Fiona Patel';
UPDATE employees SET total_exp_months = 60 WHERE name = 'George Miller';
UPDATE employees SET total_exp_months = 84 WHERE name = 'Hannah Lee';
UPDATE employees SET total_exp_months = 108 WHERE name = 'Ivan Rodriguez';
UPDATE employees SET total_exp_months = 144 WHERE name = 'Julia Nguyen';
UPDATE employees SET total_exp_months = 36 WHERE name = 'Kevin Brown';
UPDATE employees SET total_exp_months = 84 WHERE name = 'Laura Wilson';
UPDATE employees SET total_exp_months = 96 WHERE name = 'Michael Scott';
UPDATE employees SET total_exp_months = 72 WHERE name = 'Nina Kapoor';
UPDATE employees SET total_exp_months = 96 WHERE name = 'Oscar Chen';
UPDATE employees SET total_exp_months = 60 WHERE name = 'Rahul Mehta';
UPDATE employees SET total_exp_months = 84 WHERE name = 'Sneha Iyer';
UPDATE employees SET total_exp_months = 48 WHERE name = 'Arjun Rao';
UPDATE employees SET total_exp_months = 72 WHERE name = 'Meera Kulkarni';
UPDATE employees SET total_exp_months = 108 WHERE name = 'Amit Verma';
UPDATE employees SET total_exp_months = 36 WHERE name = 'Karan Shah';
UPDATE employees SET total_exp_months = 48 WHERE name = 'Pooja Nair';
UPDATE employees SET total_exp_months = 96 WHERE name = 'Siddharth Jain';
UPDATE employees SET total_exp_months = 84 WHERE name = 'Neha Agarwal';
UPDATE employees SET total_exp_months = 72 WHERE name = 'Vikram Singh';
UPDATE employees SET total_exp_months = 72 WHERE name = 'Ananya Bose';
UPDATE employees SET total_exp_months = 36 WHERE name = 'Rohan Malhotra';

-- ============ ADD NEW EMPLOYEES (QA, FE, BE, DevOps) ============
INSERT INTO employees (id, name, role, experience_level, availability_percent, status, age, gender, mobile, email, address, state, pincode, description, total_exp_months) VALUES
  (gen_random_uuid(), 'Priya Sharma', 'QA Engineer', 'MID', 100, 'BENCH', 28, 'Female', '+91-98765-43222', 'priya.sharma@example.com', '3 JP Nagar', 'Karnataka', '560078', 'QA engineer with Selenium and API testing experience.', 60),
  (gen_random_uuid(), 'Raj Kumar', 'QA Engineer', 'SENIOR', 50, 'PARTIAL', 34, 'Male', '+91-98765-43223', 'raj.kumar@example.com', '11 BTM Layout', 'Karnataka', '560076', 'Senior QA with automation and manual testing expertise.', 96),
  (gen_random_uuid(), 'Deepa Menon', 'QA Engineer', 'JUNIOR', 100, 'BENCH', 25, 'Female', '+91-98765-43224', 'deepa.menon@example.com', '9 Marathahalli', 'Karnataka', '560037', 'Junior QA engineer learning Cypress and Jest.', 24),
  (gen_random_uuid(), 'Tyler Reed', 'Frontend Developer', 'MID', 100, 'BENCH', 27, 'Male', '+1-555-0125', 'tyler.reed@example.com', '300 Code Lane', 'California', '94103', 'Frontend developer with React and TypeScript.', 48),
  (gen_random_uuid(), 'Maria Garcia', 'Frontend Developer', 'JUNIOR', 100, 'BENCH', 24, 'Female', '+1-555-0126', 'maria.garcia@example.com', '400 UI Street', 'Texas', '77002', 'Junior frontend developer with Tailwind experience.', 18),
  (gen_random_uuid(), 'James Wilson', 'Backend Developer', 'MID', 80, 'PARTIAL', 30, 'Male', '+1-555-0127', 'james.wilson@example.com', '500 API Blvd', 'New York', '10002', 'Backend developer specializing in Node.js and PostgreSQL.', 72),
  (gen_random_uuid(), 'Sarah Connor', 'Backend Developer', 'SENIOR', 20, 'PARTIAL', 36, 'Female', '+1-555-0128', 'sarah.connor@example.com', '600 Server Rd', 'Washington', '98103', 'Senior backend engineer with distributed systems experience.', 120),
  (gen_random_uuid(), 'David Kim', 'DevOps Engineer', 'MID', 100, 'BENCH', 29, 'Male', '+1-555-0129', 'david.kim@example.com', '700 Cloud Ave', 'Virginia', '22102', 'DevOps engineer with Kubernetes and AWS.', 60),
  (gen_random_uuid(), 'Emma Thompson', 'DevOps Engineer', 'JUNIOR', 100, 'BENCH', 26, 'Female', '+1-555-0130', 'emma.thompson@example.com', '800 Infra Way', 'Colorado', '80203', 'Junior DevOps engineer with Docker and CI/CD.', 30),
  (gen_random_uuid(), 'Liam O''Brien', 'QA Engineer', 'MID', 60, 'PARTIAL', 31, 'Male', '+1-555-0131', 'liam.obrien@example.com', '900 Test St', 'Massachusetts', '02102', 'QA engineer with Jest and Cypress automation.', 72);

-- ============ EMPLOYEE SKILLS FOR NEW EMPLOYEES ============
INSERT INTO employee_skills (employee_id, skill_id, proficiency)
SELECT e.id, s.id, prof FROM
  (VALUES
    ('Priya Sharma', 'Selenium', 4), ('Priya Sharma', 'API Testing', 4), ('Priya Sharma', 'Manual Testing', 5),
    ('Raj Kumar', 'Selenium', 5), ('Raj Kumar', 'Cypress', 4), ('Raj Kumar', 'API Testing', 5), ('Raj Kumar', 'Manual Testing', 5),
    ('Deepa Menon', 'Jest', 3), ('Deepa Menon', 'Cypress', 3), ('Deepa Menon', 'Manual Testing', 4),
    ('Tyler Reed', 'React', 4), ('Tyler Reed', 'TypeScript', 4), ('Tyler Reed', 'Tailwind', 4),
    ('Maria Garcia', 'React', 3), ('Maria Garcia', 'Tailwind', 4),
    ('James Wilson', 'Node.js', 4), ('James Wilson', 'PostgreSQL', 4), ('James Wilson', 'AWS', 3),
    ('Sarah Connor', 'Node.js', 5), ('Sarah Connor', 'PostgreSQL', 5), ('Sarah Connor', 'AWS', 4),
    ('David Kim', 'Kubernetes', 4), ('David Kim', 'Docker', 5), ('David Kim', 'AWS', 4), ('David Kim', 'CI/CD', 4),
    ('Emma Thompson', 'Docker', 4), ('Emma Thompson', 'CI/CD', 3), ('Emma Thompson', 'Kubernetes', 3),
    ('Liam O''Brien', 'Jest', 5), ('Liam O''Brien', 'Cypress', 4), ('Liam O''Brien', 'API Testing', 4)
  ) AS t(emp_name, skill_name, prof)
  JOIN employees e ON e.name = t.emp_name
  JOIN skills s ON s.name = t.skill_name
ON CONFLICT (employee_id, skill_id) DO NOTHING;

-- ============ WORK EXPERIENCE FOR NEW EMPLOYEES ============
INSERT INTO work_experiences (employee_id, company_name, company_url, job_title, start_date, end_date)
SELECT e.id, t.company_name, t.company_url, t.job_title, t.start_date::date, t.end_date::date FROM
  (VALUES
    ('Priya Sharma', 'TestPro', 'https://testpro.com', 'QA Engineer', '2021-06-01', '2026-12-31'),
    ('Raj Kumar', 'QualityFirst', 'https://qualityfirst.io', 'Senior QA', '2018-03-01', '2026-12-31'),
    ('Deepa Menon', 'StartupQA', 'https://startupqa.io', 'QA Intern', '2023-07-01', '2026-12-31'),
    ('Tyler Reed', 'WebCo', 'https://webco.io', 'Frontend Developer', '2021-01-01', '2026-12-31'),
    ('Maria Garcia', 'DesignDev', 'https://designdev.com', 'Junior Frontend', '2023-06-01', '2026-12-31'),
    ('James Wilson', 'DataAPI', 'https://dataapi.io', 'Backend Developer', '2019-04-01', '2026-12-31'),
    ('Sarah Connor', 'ScaleBackend', 'https://scalebackend.com', 'Senior Backend', '2015-02-01', '2026-12-31'),
    ('David Kim', 'CloudOps', 'https://cloudops.io', 'DevOps Engineer', '2020-08-01', '2026-12-31'),
    ('Emma Thompson', 'DevOpsLab', 'https://devopslab.com', 'Junior DevOps', '2022-06-01', '2026-12-31'),
    ('Liam O''Brien', 'TestAutomation', 'https://testauto.io', 'QA Engineer', '2019-09-01', '2026-12-31')
  ) AS t(emp_name, company_name, company_url, job_title, start_date, end_date)
  JOIN employees e ON e.name = t.emp_name;

-- ============ ADD PROJECT ASSIGNMENTS FOR NEW EMPLOYEES ============
INSERT INTO project_assignments (project_id, employee_id, role_name, allocation_percent, status)
SELECT p.id, e.id, t.role_name, t.allocation_percent, 'ACTIVE' FROM
  (VALUES
    ('Rhapsody', 'Priya Sharma', 'QA Engineer', 50),
    ('Rhapsody', 'Tyler Reed', 'Frontend Developer', 40),
    ('Neovance', 'Raj Kumar', 'QA Engineer', 30),
    ('Neovance', 'James Wilson', 'Backend Developer', 80),
    ('Valeris', 'David Kim', 'DevOps Engineer', 60),
    ('Valeris', 'Emma Thompson', 'DevOps Engineer', 40),
    ('HHAexchange', 'Liam O''Brien', 'QA Engineer', 50),
    ('HHAexchange', 'Maria Garcia', 'Frontend Developer', 50),
    ('Health Catalyst', 'Deepa Menon', 'QA Engineer', 100),
    ('Health Catalyst', 'Sarah Connor', 'Backend Developer', 50),
    ('Kipu Healthcare', 'Priya Sharma', 'QA Engineer', 50)
  ) AS t(proj_name, emp_name, role_name, allocation_percent)
  JOIN projects p ON p.name = t.proj_name
  JOIN employees e ON e.name = t.emp_name;
