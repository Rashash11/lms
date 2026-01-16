# Repository Hygiene Runbook

This runbook establishes standards and procedures for maintaining the Zedny LMS codebase.

## Folder Structure Standards

### Feature-First Modules (`src/modules/`)
All domain-specific code should live in `src/modules/<domain>/`:
- `server/` - Business logic, services, database operations
- `ui/` - React components specific to this domain
- `schemas/` - Zod validation schemas
- `types.ts` - TypeScript type definitions
- `index.ts` - Barrel export for public API

### Shared Infrastructure (`src/shared/`)
Cross-cutting concerns that are used by multiple modules:
- `ui/layout/` - App shell components (DashboardLayout)
- `ui/components/` - Truly reusable UI (AccessDenied, FeatureFlagged)
- `theme/` - MUI ThemeRegistry
- `hooks/` - Shared React hooks
- `types/` - Global type definitions

### Core Libraries (`src/lib/`)
Infrastructure-only code:
- `prisma.ts` - Database client singleton
- `env.ts` - Environment variable validation
- `logger.ts` - Logging infrastructure

## Import Path Conventions

Use these TypeScript path aliases:
```typescript
// Module imports
import { createCourse } from '@modules/courses/server';

// Shared UI
import DashboardLayout from '@shared/ui/layout/DashboardLayout';

// Core infrastructure
import { prisma } from '@/lib/prisma';
```

## Route Handler Pattern

Route handlers should be **thin controllers**:
1. Parse request input
2. Authenticate/authorize
3. Call module service
4. Return response

```typescript
// ✅ Good: Thin controller
export const POST = withTenant(async (request) => {
    const session = await requireAuth();
    if (!(await can(session, 'course:create'))) return forbidden();
    
    const input = CreateCourseInput.safeParse(await request.json());
    if (!input.success) return validationError(input.error);
    
    const course = await createCourse(input.data, session.userId);
    return NextResponse.json(course, { status: 201 });
});
```

## Debug Artifact Management

- **Never commit** debug outputs to root directory
- Place temporary debug files in `_archive/[date]-[purpose]/`
- Clean up after debugging sessions

## Pre-Commit Checklist

Before committing, ensure:
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds
- [ ] No console.log statements in production code
- [ ] No debug files in root directory
- [ ] New components are in correct module folder
