# Enterprise Monorepo

This is a production-ready monorepo using Turborepo.

## Structure

### Apps

- `apps/web`: Next.js 14 (App Router) frontend application.
- `apps/api`: Node.js/Express backend API.
- `apps/ai-service`: Standalone AI service for prompt management and validation.

### Packages

- `packages/ui`: Shared React UI components (Button, Card, Layout).
- `packages/types`: Shared TypeScript interfaces (Employee, Project, Allocations).
- `packages/config`: Shared ESLint, TSConfig, and formatting configurations.

## Getting Started

1.  **Install Dependencies**

    ```bash
    npm install
    ```

2.  **Build All Apps and Packages**

    ```bash
    npm run build
    ```

3.  **Run Development Server**
    ```bash
    npm run dev
    ```
    This will start all applications in parallel.

## Development

- **Web**: [http://localhost:3000](http://localhost:3000)
- **API**: [http://localhost:3001](http://localhost:3001)
- **AI Service**: Runs as a background process (or script).

## Commands

- `npm run build`: Build all workspaces.
- `npm run dev`: Run all workspaces in dev mode.
- `npm run lint`: Lint all workspaces.
- `npm run clean`: Clean turbo cache and node_modules (if configured).
