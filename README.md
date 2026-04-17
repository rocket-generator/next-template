# TypeScript Next.js Template

This is a [Next.js](https://nextjs.org) project with TypeScript, using App Router and a multi-layered architecture.

## 🚀 Technologies

- **Framework**: Next.js 16.2.4 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Better Auth (with cookie-backed sessions)
- **UI Components**: Radix UI + shadcn/ui
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form + Zod validation
- **Internationalization**: next-intl (Japanese/English)
- **Containerization**: Docker & Docker Compose

## 📁 Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── (site)/(authorized)/    # Protected routes
│   ├── (site)/(unauthorized)/  # Public auth routes
│   └── api/auth/               # Better Auth handler
├── proxy.ts            # Route guard for protected pages
├── components/          # UI components (Atomic Design)
│   ├── atoms/          # Basic UI elements
│   ├── molecules/      # Composite components
│   └── organisms/      # Complex feature components
├── models/             # Zod schemas and domain models
├── repositories/       # Data access layer
├── libraries/          # Utility functions
├── requests/           # Zod schemas for validation
└── i18n/              # Internationalization
```

## 🛠️ Getting Started

### Prerequisites

- Node.js 20.19.0 or later
- Docker and Docker Compose
- PostgreSQL (if running locally without Docker)

### Local Development (without Docker)

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Setup environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database and auth settings
   ```

3. **Setup database**
   ```bash
   npm run db:setup
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## 🐳 Docker Development (Local Only)

Docker Compose configuration is designed for local development only.

### Quick Start with Docker

1. **Clone and navigate to the project**
   ```bash
   git clone <repository-url>
   cd typescript-next-template
   ```

2. **Start all services**
   ```bash
   docker compose up
   ```

   This will start:
   - Next.js app (development mode with hot reload) at http://localhost:3000
   - PostgreSQL database at localhost:5433
   - LocalStack (S3 + SES emulation) at localhost:4566

3. **Initialize database**
   ```bash
   # Wait for services to be ready, then run:
   npm run docker:db:setup
   ```

### Docker Commands

#### Build Images
```bash
# Build all images
docker compose build

# Build specific service
docker compose build web

```

#### Start Services
```bash
# Start all services in background
docker compose up -d

# Start only database and LocalStack
docker compose up -d postgres localstack

# Start web app (development mode with hot reload)
docker compose up web
```

#### Database Operations

##### Using npm scripts (Recommended)
```bash
npm run docker:db:migrate    # Run migrations
npm run docker:db:generate   # Generate Prisma Client
npm run docker:db:push       # Push schema to database
npm run docker:db:seed       # Run seed data
npm run docker:db:reset      # Reset DB, regenerate client, and reseed (⚠️ deletes all data)
npm run docker:db:setup      # Initial setup (generate + push + seed)
npm run docker:db:studio     # Open Prisma Studio
```

##### Usage Examples
```bash
# Initialize database
docker compose up -d
npm run docker:db:setup

# Reset and reinitialize database
npm run docker:db:reset
npm run docker:db:setup

# Open Prisma Studio for database management
npm run docker:db:studio  # Opens at http://localhost:5555
```

##### Direct Docker commands
```bash
# Run Prisma commands in container
docker compose exec web npm run db:generate
docker compose exec web npm run db:push
docker compose exec web npm run db:migrate
docker compose exec web npm run db:seed

# Connect to database
docker compose exec postgres psql -U postgres -d myapp
```

#### Logs and Debugging
```bash
# View logs for all services
docker compose logs

# View logs for specific service
docker compose logs web
docker compose logs postgres
docker compose logs localstack

# Follow logs in real-time
docker compose logs -f web
```

#### Cleanup
```bash
# Stop all services
docker compose down

# Stop and remove volumes (⚠️ This will delete database data)
docker compose down -v

# Clean up Docker system
docker system prune -f
```

### Environment Configuration

#### For Docker Development
`docker-compose.yml` already provides the default environment variables required for the local containers.
If you also run Prisma CLI or Next.js directly on your host machine, copy `.env.example` to `.env` first.

Key environment variables for Docker:
- `DATABASE_URL`: PostgreSQL connection (automatically configured)
- `BETTER_AUTH_BASE_URL`: Base URL used by Better Auth
- `BETTER_AUTH_SECRET`: Secret key for Better Auth session encryption
- `SYSTEM_AWS_S3_REGION`: AWS S3 region (us-east-1 for LocalStack)
- `SYSTEM_AWS_ACCESS_KEY_ID`: AWS access key (test for LocalStack)
- `SYSTEM_AWS_SECRET_ACCESS_KEY`: AWS secret key (test for LocalStack)
- `SYSTEM_AWS_S3_BUCKET`: S3 bucket name (my-app-bucket for LocalStack)
- `LOCALSTACK_ENDPOINT`: LocalStack endpoint for server-side S3 and SES operations
- `LOCALSTACK_PUBLIC_ENDPOINT`: LocalStack endpoint for browser access to uploaded files (defaults to localhost:4566)
- `SYSTEM_AWS_SES_REGION`: AWS SES region (us-east-1 for LocalStack)
- `EMAIL_FROM`: Default sender email address (`SES_FROM_EMAIL` is still accepted as a deprecated fallback)
- `STORAGE_PROVIDER`: Storage backend selector (`s3`, `s3-compatible`, `gcs`)
- `S3_COMPATIBLE_ENDPOINT` / `S3_COMPATIBLE_PUBLIC_ENDPOINT` / `S3_COMPATIBLE_FORCE_PATH_STYLE`: S3-compatible storage options for R2, MinIO, Spaces, and similar providers
- `GCS_PROJECT_ID` / `GCS_BUCKET` / `GCS_CLIENT_EMAIL` / `GCS_PRIVATE_KEY` / `GCS_REGION`: Google Cloud Storage options
- `EMAIL_PROVIDER`: Email backend selector (`ses`, `smtp`)
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USER` / `SMTP_PASS`: SMTP delivery options
- `ENABLE_AUTH_PAGE_REDIRECT`: Redirect authenticated users away from auth pages (true/false, default true)

#### For Production Deployment
This Docker Compose setup is for local development only. For production deployment:
- Deploy to cloud platforms (Vercel, AWS, etc.)
- Use managed database services
- Configure real storage and email providers
- Set proper environment variables for production

#### Migration Notes
If you are upgrading an existing derived project to the provider-switching implementation:

- Rename `AWS_S3_REGION`, `AWS_SES_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `AWS_S3_BUCKET` to the `SYSTEM_AWS_*` equivalents
- Prefer `EMAIL_FROM` instead of `SES_FROM_EMAIL` (`SES_FROM_EMAIL` still works as a deprecated fallback)
- Review any existing `.env` file and align it with the current `.env.example`
- If you use Docker development, update the app container environment block in `docker-compose.yml` to the same `SYSTEM_AWS_*` / `EMAIL_FROM` naming

### Logging / Monitoring

This template includes a lightweight structured logger in `src/libraries/logger.ts`.

- The default sink is the console adapter.
- `LOG_LEVEL` accepts `debug`, `info`, `warn`, `error` and defaults to `info`.
- `LOG_FORMAT` accepts `auto`, `json`, `pretty` and defaults to `auto`.
- `LOG_FORMAT=auto` resolves to `json` in production and `pretty` in non-production environments.
- Server-side logs under `src/libraries`, `src/repositories`, and `src/app` use this logger. Browser-side `console.*` usage in `src/components/**` is intentionally left for a separate cleanup task.

Derived projects can replace the default adapters without rewriting call sites:

1. Implement a custom `LogSink` and/or `MonitoringAdapter`.
2. Register them with `setLogSinks()` and `setMonitoringAdapter()` from a server-only initialization module.
3. Keep application code on `createLogger("scope")` so future Sentry / OpenTelemetry / Cloudflare Logs integration stays an adapter swap instead of another refactor.

### Security Headers and External Images

This template adds baseline security headers through `next.config.ts`.

- `Content-Security-Policy`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy`
- `Strict-Transport-Security` in production only

The CSP is environment-aware by design.

- Development keeps `unsafe-eval`, `http:`, `ws:`, and `wss:` available so Next.js HMR, local APIs, and LocalStack do not break.
- Production removes those generic development allowances and only adds HSTS there.

If your production deployment needs external APIs, scripts, images, or WebSocket endpoints, update [`src/libraries/security-headers.ts`](./src/libraries/security-headers.ts) to allow them explicitly. `EXTRA_REMOTE_IMAGE_URLS` only extends `next/image` host matching. It does not update CSP automatically.

Use `EXTRA_REMOTE_IMAGE_URLS` when you need additional remote image sources without editing `next.config.ts`:

```bash
EXTRA_REMOTE_IMAGE_URLS=https://cdn.example.com,https://images.example.com/account123/,http://localhost:9000/my-bucket/
```

Each CSV entry must be an absolute `http` or `https` URL prefix. The template converts each entry into a `remotePatterns` rule using its protocol, hostname, optional port, and path prefix.

Future hardening such as nonce-based CSP is intentionally left as separate follow-up work.

## 🎯 Available Scripts

```bash
# Development
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npm run db:generate  # Generate Prisma Client
npm run db:push      # Push schema changes to database
npm run db:migrate   # Create and apply migrations
npm run db:seed      # Seed the database explicitly
npm run db:reset     # Reset DB, regenerate client, and reseed
npm run db:studio    # Open Prisma Studio GUI
npm run db:format    # Format schema.prisma

# Testing
npm run test         # Run Jest tests
npm run test:watch   # Run tests in watch mode

# Storybook
npm run storybook    # Start Storybook development server
npm run build-storybook # Build Storybook for production
```

## 📊 Services Overview

| Service | Local Port | Docker Port | Description |
|---------|------------|-------------|-------------|
| Next.js | 3000 | 3000 | Development Next.js with hot reload |
| PostgreSQL | 5433 | 5432 | Database server |
| LocalStack | 4566 | 4566 | AWS services emulation (S3, SES) |

## 🔧 Development Tools

- **Prisma Studio**: Database GUI at http://localhost:5555 (when running `npx prisma studio`)
- **Storybook**: Component library at http://localhost:6006 (when running `npm run storybook`)
- **LocalStack**: AWS services dashboard at http://localhost:4566

## 📝 Architecture Notes

- **Repository Pattern**: Multiple data source adapters (Prisma, API, Airtable, Local storage)
- **Atomic Design**: Component organization for scalability
- **Form Validation**: Consistent Zod schemas for client/server validation
- **Internationalization**: Built-in Japanese/English support
- **Authentication**: Secure Better Auth implementation
- **Prisma 7 Setup**: Prisma CLI is configured in `prisma.config.ts`, and the generated client is emitted to `src/generated/prisma` and imported from `src/generated/prisma/client`. This directory is not committed and must be regenerated with `npm run db:generate`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
