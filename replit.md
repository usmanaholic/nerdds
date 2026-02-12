# Replit.md

## Overview

**nerdds** is a university-based social media platform where students join a single university, post content in their campus feed, interact with peers, follow other students, send direct messages, and earn gamification levels. The goal is daily engagement and strong campus community culture.

The app is a full-stack TypeScript monorepo with an Express backend, React frontend (Vite-bundled), PostgreSQL database via Drizzle ORM, and session-based authentication using Passport.js.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Monorepo Structure
- **`client/`** — React SPA (Vite + TypeScript)
- **`server/`** — Express API server (TypeScript, run via tsx)
- **`shared/`** — Shared code between client and server (schema definitions, route contracts)
- **`migrations/`** — Drizzle-generated database migrations
- **`script/`** — Build tooling (esbuild for server, Vite for client)

### Frontend Architecture
- **Framework:** React 18 with TypeScript, bundled by Vite
- **Routing:** Wouter (lightweight client-side router, not React Router)
- **State/Data Fetching:** TanStack React Query for all server state
- **UI Components:** shadcn/ui (new-york style) built on Radix UI primitives
- **Styling:** Tailwind CSS with CSS variables for theming, supports dark mode via class strategy
- **Fonts:** Inter (body) and Outfit (display/headings)
- **Path aliases:** `@/` maps to `client/src/`, `@shared/` maps to `shared/`
- **Key pages:** Auth (login/register), Feed, Post Detail, Profile, Messages, 404

### Backend Architecture
- **Runtime:** Node.js with Express
- **Dev server:** tsx runs TypeScript directly; Vite middleware serves the frontend in development with HMR
- **Production build:** Vite builds the client to `dist/public/`, esbuild bundles the server to `dist/index.cjs`
- **API pattern:** All routes prefixed with `/api/`. Route contracts defined in `shared/routes.ts` using Zod schemas for input validation and response typing
- **Authentication:** Passport.js with local strategy (username/password), bcryptjs for password hashing, express-session with PostgreSQL session store (connect-pg-simple)
- **Session cookies:** 30-day expiry, secure in production

### Database
- **Database:** PostgreSQL (required — `DATABASE_URL` environment variable must be set)
- **ORM:** Drizzle ORM with drizzle-zod for schema-to-validation integration
- **Schema location:** `shared/schema.ts`
- **Schema push:** `npm run db:push` (uses drizzle-kit push)
- **Core tables:**
  - `universities` — id, name, slug
  - `users` — id, email, password, username, universityId, department, semester, bio, profileImage, points, level, followersCount, followingCount, isBlocked, createdAt
  - `posts` — id, authorId, universityId, content, image, type, tags (text array), likesCount, commentsCount, savesCount, createdAt
  - `comments` — id, postId, authorId, content, createdAt
  - `likes` — tracks user-post like relationships
  - `follows` — tracks follower-following relationships
  - `directMessages` — direct messaging between users

### API Routes (defined in `shared/routes.ts`)
- **Auth:** POST `/api/auth/register`, POST `/api/auth/login`, POST `/api/auth/logout`, GET `/api/user` (current user)
- **Posts:** GET `/api/posts` (with universityId/tag filters), GET `/api/posts/:id`, POST `/api/posts`, POST `/api/posts/:id/like`
- **Comments:** GET `/api/posts/:id/comments`, POST `/api/posts/:id/comments`
- **Users:** GET `/api/users/:username`
- **Universities:** GET `/api/universities`
- **Messages:** GET `/api/messages` (conversations), GET `/api/messages/:userId`, POST `/api/messages/:userId`
- **Follows:** POST `/api/users/:username/follow`

### Storage Layer
- `server/storage.ts` defines an `IStorage` interface and a `DatabaseStorage` implementation
- All database operations go through this storage layer, making it easy to swap implementations

### Build & Run Commands
- `npm run dev` — Start development server (tsx + Vite HMR)
- `npm run build` — Production build (Vite client + esbuild server)
- `npm run start` — Run production build
- `npm run db:push` — Push schema changes to database
- `npm run check` — TypeScript type checking

## External Dependencies

### Database
- **PostgreSQL** — Primary data store, required via `DATABASE_URL` environment variable
- **connect-pg-simple** — PostgreSQL-backed session storage

### Key NPM Packages
- **drizzle-orm / drizzle-kit / drizzle-zod** — ORM, migrations, and Zod schema generation
- **express / express-session** — HTTP server and session management
- **passport / passport-local** — Authentication strategy
- **bcryptjs** — Password hashing
- **@tanstack/react-query** — Client-side data fetching and caching
- **wouter** — Client-side routing
- **zod** — Schema validation (shared between client and server)
- **react-hook-form / @hookform/resolvers** — Form handling with Zod validation
- **shadcn/ui components** — Full set of Radix-based UI primitives (dialog, tabs, select, toast, etc.)
- **date-fns** — Date formatting (relative timestamps)
- **lucide-react** — Icon library
- **tailwindcss / class-variance-authority / clsx / tailwind-merge** — Styling utilities
- **vite / @vitejs/plugin-react** — Frontend build tooling
- **esbuild** — Server bundling for production

### Replit-Specific Plugins
- `@replit/vite-plugin-runtime-error-modal` — Runtime error overlay
- `@replit/vite-plugin-cartographer` — Dev-only cartographer (non-production)
- `@replit/vite-plugin-dev-banner` — Dev-only banner (non-production)

### Environment Variables Required
- `DATABASE_URL` — PostgreSQL connection string (must be provisioned)
- `SESSION_SECRET` — Session encryption key (falls back to `nerdds_secret_key` in dev)