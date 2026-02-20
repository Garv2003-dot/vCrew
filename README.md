vCrew: AI-Driven Resource Allocation System

vCrew is a production-ready enterprise application designed to streamline and automate project resource allocation. It combines AI-assisted intent parsing with a deterministic ranking engine to help managers allocate employees efficiently based on skills, experience, and real-time capacity.

--------------------------------------------------
Core Features
--------------------------------------------------

AI-Assisted Intent Parsing
- Converts natural language requests into structured allocation intents.
- AI is used strictly for interpretation and normalization.
- All outputs are validated before execution.

Deterministic Allocation Engine
- Multi-factor weighted scoring system.
- Evaluates:
  - Primary and secondary skills
  - Proficiency levels
  - Experience duration
  - Role seniority
  - Current utilization percentage
- AI never directly mutates the database.

Capacity & Utilization Management
- Tracks allocation percentage per employee.
- Prevents over-allocation beyond 100%.
- Supports partial assignments across multiple projects.
- Automatically recalculates remaining bandwidth.

Bi-Directional Allocation Modeling
- Project view: shows assigned employees and effort split.
- Employee view: shows assigned projects and workload distribution.
- Maintains relational consistency.

Real-Time Dashboards
- Utilization metrics
- Skill distribution insights
- Allocation gaps
- Live updates via Supabase.

Fault-Tolerant AI Layer
- Deterministic fallback if AI parsing fails.
- Strict schema validation.
- Clear separation between AI interpretation and business logic.

Enterprise UI System
- Modular component architecture.
- Shared UI library.
- Role-aware navigation.
- Consistent global design system.

--------------------------------------------------
Architecture & Structure
--------------------------------------------------

The project is structured as a Turborepo-based monorepo to ensure scalability, modularity, and maintainability.

High-Level Architecture:

Client (Next.js Frontend)
        ↓
API Layer (Express + AI + Ranking Engine)
        ↓
Supabase (PostgreSQL)

Layer Responsibilities:

Frontend (apps/web)
- Dashboard UI
- Allocation workflows
- Authentication
- API communication

Backend (apps/api)
- Intent extraction service
- Deterministic ranking engine
- Allocation service logic
- Validation middleware
- Secure AI integration

Database (Supabase)
- Persistent relational storage
- Foreign key constraints
- Allocation junction modeling

AI Layer (Google Gemini)
- Intent parsing only
- No direct database access

--------------------------------------------------
Monorepo Structure
--------------------------------------------------

Apps:
- apps/web (Next.js frontend)
- apps/api (Express backend)

Packages:
- packages/ui (Shared React components)
- packages/types (Shared TypeScript domain models)
- packages/config (Shared ESLint, TSConfig, Prettier configs)

--------------------------------------------------
Execution Flow
--------------------------------------------------

1. User submits natural language allocation request.
2. Backend sends request to AI for structured extraction.
3. Output validated against canonical schema.
4. Deterministic engine ranks candidates.
5. Top matches returned to frontend.
6. Confirmed allocation is written transactionally to database.

--------------------------------------------------
Design Principles
--------------------------------------------------

- AI assists, but business logic remains deterministic.
- Strict schema validation before state mutation.
- Capacity constraints enforced at service layer.
- Clean separation of concerns.
- Scalable monorepo architecture.

## Getting Started

### 1. Install Dependencies

Install all dependencies linearly across the monorepo from the root:

```bash
npm install
```

### 2. Environment Variables

Create exactly one `.env` file in the project's root directory containing keys for Google Gemini SDK and Supabase configuration.

```bash
# Example .env configuration
GEMINI_API_KEY=your_gemini_api_key_here

NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

SUPABASE_URL=https://your-supabase-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

NEXT_PUBLIC_API_URL=http://localhost:3001
```

> **Note**: Your `GEMINI_API_KEY` is utilized securely within the backend (`apps/api`) and is never inadvertently exposed to the browser. Keys can be obtained from [Google AI Studio](https://aistudio.google.com/).

### 3. Build & Run the Application

To ensure every package and app is properly compiled before starting the live environment:

```bash
npm run build
```

Then boot up the entire stack using Turborepo's parallel execution:

```bash
npm run dev
```

### Development Endpoints

- **Web App**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:3001](http://localhost:3001)

## Scripts & Commands

From the root of the project, you have access to fundamental Turborepo commands:

- `npm run build`: Safely builds all packages and applications with cached output.
- `npm run dev`: Launch all development servers concurrently.
- `npm run lint`: Analyzes the codebase for syntax or formatting deviations.
- `npm run format`: Standardize code formatting using Prettier (`**/*.{ts,tsx,md}`).
- `npm run clean`: Purges `node_modules` and caches to unblock conflicting installs.

## Technologies Used

- **Frameworks**: Next.js 14, React 18
- **Backend**: Node.js, Express, TypeScript
- **Database**: Supabase (PostgreSQL)
- **AI Processing**: Google GenAI (`@google/genai`)
- **Styling**: Tailwind CSS, PostCSS, Lucide Icons
