# Zedny LMS - Full Parity Implementation

A complete Learning Management System clone matching TalentLMS functionality with 50+ database models, multi-tenant architecture, and extensive features.

## Features

- **Multi-tenant Architecture**: Portal + Branches with independent themes and settings
- **Role-Based Access**: Admin, Instructor, Learner with switchable roles
- **Course Management**: Draft/Published workflow, SCORM/xAPI/cmi5, ILT, Assignments, Tests
- **Learning Paths**: Sequential course collections (Grow+ plan, max 25 courses)
- **Skills System**: AI-generated self-assessments with related courses
- **Grading Hub**: Assignments + ILT grading with bulk actions
- **Test Builder**: 6 question types including AI generation, randomized pools
- **Messaging System**: Internal messaging with plan gating (paid only)
- **Files Module**: Course/User/Branch/Group files with visibility controls
- **Gamification**: Points, Badges, Levels (max 20), Leaderboards
- **Reports & Analytics**: Custom reports, scheduled reports, analytics dashboards
- **Notifications & Automations**: Event-driven with smart tags and filters
- **Custom Homepage Builder**: Pre/post-login with 10 section types
- **Course Ratings**: 1-5 stars with catalog filtering
- **E-commerce**: Course, group, category pricing with discounts
- **Integrations**: API, OpenID Connect, SAML 2.0, Zoom, Teams, BigBlueButton
- **AI Features**: TalentCraft, course generation, AI Coach for learners

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Material-UI v5
- **Backend**: Next.js API Routes (REST), Prisma ORM
- **Database**: PostgreSQL 15
- **Cache/Jobs**: Redis + BullMQ
- **Email**: SendGrid
- **AI**: OpenAI API
- **Auth**: JWT with role switching, SSO (OpenID/SAML)

## Prerequisites

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 15+ (or use Docker)
- Redis (or use Docker)

## Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd lms
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start Database Services

```bash
docker-compose up -d
```

### 4. Database Setup

```bash
# Generate Prisma Client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database with sample data
npm run db:seed
```

### 5. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

### 6. Start Background Workers (Optional)

```bash
# In a separate terminal
npm run workers
```

## Sample Login Credentials

After seeding, use these credentials:

- **Admin**: `admin@lms.com` / `Admin123!`
- **Instructor**: `instructor@lms.com` / `Instructor123!`
- **Learner**: `learner@lms.com` / `Learner123!`

## Project Structure

```
lms/
├── prisma/
│   ├── schema.prisma          # 50+ database models
│   └── seed.ts                # Sample data
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (admin)/           # Admin routes
│   │   ├── (instructor)/      # Instructor routes
│   │   ├── (learner)/         # Learner routes
│   │   ├── (public)/          # Public routes
│   │   └── api/               # API routes
│   ├── components/            # React components
│   ├── lib/                   # Utilities & helpers
│   ├── hooks/                 # Custom React hooks
│   ├── types/                 # TypeScript types
│   └── workers/               # Background job workers
├── docker-compose.yml         # PostgreSQL + Redis
└── package.json
```

## Database Schema

50+ models including:
- Portal, Branch, User, UserType, UserRole
- Course, CourseUnit, LearningPath, Skill
- Test, Question, QuestionPool
- MessageThread, File, GradingHub
- Certificate, Report, Analytics
- And many more...

## Development Timeline

- **Option A (1 developer)**: 35 weeks
- **Option B (3-5 developers + QA)**: 20-24 weeks

See `implementation_plan.md` for detailed roadmap.

## Scripts

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm start                # Start production server
npm run db:generate      # Generate Prisma Client
npm run db:migrate       # Run database migrations
npm run db:seed          # Seed sample data
npm run db:studio        # Open Prisma Studio
npm run workers          # Start background workers
npm test                 # Run tests
npm run test:api         # Test API endpoints
npm run test:e2e         # Run E2E tests
```

## Features by Plan Tier

### Free
- Basic courses
- Limited users
- File uploads: 100MB general, 10MB images

### Core
- Branches
- Groups
- Reports

### Grow
- Learning Paths (up to 5)
- Skills
- File uploads: 600MB general

### Pro/Enterprise
- Unlimited Learning Paths
- Custom Homepage
- Advanced Reporting
- API Access
- SSO (OpenID/SAML)

## Contributing

See `task.md` for implementation checklist (35 phases).

## License

Proprietary - Zedny LMS Project
