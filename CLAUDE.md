# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Install dependencies
npm install

# Run development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run ESLint
npm run lint

# Prisma commands
npx prisma generate    # Generate Prisma Client
npx prisma db push     # Push schema changes to database
npx prisma migrate dev # Create and apply migrations
npx prisma studio      # Open Prisma Studio GUI
npx prisma format      # Format schema.prisma file
```

## Architecture Overview

This is a Next.js 15.3.3 template with TypeScript, using App Router and a multi-layered architecture:

### Directory Structure
- **`/src/app`** - Next.js App Router pages and layouts
  - `/(site)/(authorized)` - Protected routes (dashboard, admin, settings)
  - `/(site)/(unauthorized)` - Public auth routes (sign-in, sign-up, password reset)
  - `/api/auth` - NextAuth.js API routes
- **`/src/components`** - Atomic Design UI components using Radix UI and shadcn/ui
- **`/src/models`** - TypeScript interfaces and data models
- **`/src/repositories`** - Data access layer with multiple adapters:
  - `prisma_repository.ts` - PostgreSQL via Prisma
  - `api_repository.ts` - External API integration
  - `airtable_repository.ts` - Airtable integration
  - `local_repository.ts` - Local storage
- **`/src/libraries`** - Utility functions and helpers
- **`/src/requests`** - Zod schemas for form validation
- **`/src/i18n`** - Internationalization configuration (next-intl)

### Key Technologies
- **Authentication**: NextAuth.js v5 (beta) with custom credentials provider
- **Database**: PostgreSQL with Prisma ORM (client output to `/src/generated/prisma`)
- **Forms**: React Hook Form + Zod validation
- **Styling**: Tailwind CSS + CSS Modules + Radix UI
- **Internationalization**: next-intl with Japanese and English support

### Environment Setup
Copy `.env.sample` to `.env` and configure:
- `DATABASE_URL` - PostgreSQL connection string
- `AUTH_URL` - NextAuth URL (http://localhost:3000/api/auth in development)
- `AUTH_SECRET` - NextAuth secret key
- Backend API URLs and optional Airtable credentials

### Repository Pattern
The codebase uses a repository pattern with a base interface. All repositories extend `BaseRepository<T>`:
- Implement CRUD operations: `findAll()`, `findById()`, `create()`, `update()`, `delete()`
- Support multiple data sources through different repository implementations
- Models define TypeScript interfaces, repositories handle data access

### Form Validation Pattern
Forms use React Hook Form with Zod schemas defined in `/src/requests/`:
1. Define Zod schema in requests directory
2. Use schema with `zodResolver` in forms
3. Server actions validate using the same schemas

### Component Structure
Components follow Atomic Design in `/src/components/`:
- `/atoms` - Basic UI elements (buttons, inputs, etc.)
- `/molecules` - Composite components
- `/organisms` - Complex feature components
- All use Radix UI primitives with Tailwind styling

### Coding rules

Coding rules are defined in `.cursor/rules`.
Check all the mdc files in `.cursor/rules` for more details before planning your code.
