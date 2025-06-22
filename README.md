# TypeScript Next.js Template

This is a [Next.js](https://nextjs.org) project with TypeScript, using App Router and a multi-layered architecture.

## 🚀 Technologies

- **Framework**: Next.js 15.3.3 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v5 (beta)
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
│   └── api/auth/               # NextAuth.js API routes
├── components/          # UI components (Atomic Design)
│   ├── atoms/          # Basic UI elements
│   ├── molecules/      # Composite components
│   └── organisms/      # Complex feature components
├── models/             # TypeScript interfaces
├── repositories/       # Data access layer
├── libraries/          # Utility functions
├── requests/           # Zod schemas for validation
└── i18n/              # Internationalization
```

## 🛠️ Getting Started

### Prerequisites

- Node.js 20 or later
- Docker and Docker Compose
- PostgreSQL (if running locally without Docker)

### Local Development (without Docker)

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Setup environment variables**
   ```bash
   cp .env.sample .env
   # Edit .env with your database and auth settings
   ```

3. **Setup database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## 🐳 Docker Development

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
   - Next.js app (production build) at http://localhost:3000
   - PostgreSQL database at localhost:5433
   - LocalStack (S3 + SES emulation) at localhost:4566

3. **Initialize database**
   ```bash
   # Wait for services to be ready, then run:
   npm run docker:db:setup
   ```

4. **For development with hot reload**
   ```bash
   docker compose --profile dev up web-dev
   
   # Initialize development database
   npm run docker:dev:db:setup
   ```

   Development server will be available at http://localhost:3001

### Docker Commands

#### Build Images
```bash
# Build all images
docker compose build

# Build specific service
docker compose build web

# Build development image
docker compose build web-dev
```

#### Start Services
```bash
# Start all services in background
docker compose up -d

# Start only database and LocalStack
docker compose up -d postgres localstack

# Start production web app
docker compose up web

# Start development web app (with hot reload)
docker compose --profile dev up web-dev
```

#### Database Operations

##### Using npm scripts (Recommended)
```bash
# Production environment (web service)
npm run docker:db:migrate    # Run migrations
npm run docker:db:push       # Push schema to database
npm run docker:db:seed       # Run seed data
npm run docker:db:reset      # Reset database (⚠️ deletes all data)
npm run docker:db:setup      # Initial setup (push + seed)
npm run docker:db:studio     # Open Prisma Studio

# Development environment (web-dev service)
npm run docker:dev:db:migrate    # Run migrations in dev
npm run docker:dev:db:push       # Push schema to dev database
npm run docker:dev:db:seed       # Run seed data in dev
npm run docker:dev:db:reset      # Reset dev database
npm run docker:dev:db:setup      # Initial dev setup (push + seed)
npm run docker:dev:db:studio     # Open Prisma Studio in dev
```

##### Usage Examples
```bash
# Initialize production database
docker compose up -d
npm run docker:db:setup

# Initialize development database (requires --profile dev)
docker compose --profile dev up -d
npm run docker:dev:db:setup

# Reset and reinitialize production database
npm run docker:db:reset
npm run docker:db:setup

# Open Prisma Studio for database management
npm run docker:db:studio  # Opens at http://localhost:5555
```

##### Direct Docker commands
```bash
# Run Prisma commands in container
docker compose exec web npx prisma generate
docker compose exec web npx prisma db push
docker compose exec web npx prisma migrate dev

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
Use the provided `.env.docker` file as reference for Docker-specific environment variables:

```bash
# Copy Docker environment template
cp .env.docker .env
```

Key environment variables for Docker:
- `DATABASE_URL`: PostgreSQL connection (automatically configured)
- `AUTH_URL`: NextAuth.js URL
- `AWS_ENDPOINT_URL_S3`: LocalStack S3 endpoint for local development
- `AWS_ENDPOINT_URL_SES`: LocalStack SES endpoint for local development

#### For Production
Update environment variables for production AWS services:
- Use real AWS S3 and SES endpoints
- Configure proper AWS credentials
- Update database connection for production PostgreSQL

## 🎯 Available Scripts

```bash
# Development
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npx prisma generate  # Generate Prisma Client
npx prisma db push   # Push schema changes to database
npx prisma migrate dev # Create and apply migrations
npx prisma studio    # Open Prisma Studio GUI

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
| Next.js (prod) | 3000 | 3000 | Production Next.js application |
| Next.js (dev) | 3001 | 3000 | Development Next.js with hot reload |
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
- **Authentication**: Secure NextAuth.js implementation

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
