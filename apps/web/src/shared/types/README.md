# TypeScript Model Type Definitions

This directory contains individual TypeScript interface files for each Prisma model.

## Organization

Each file represents a single model/entity:

```
📁 types/
├─ 📄 index.ts              # Barrel export (import all types from here)
├─ 📄 User.ts               # User model interface
├─ 📄 Course.ts             # Course model interface
├─ 📄 Enrollment.ts         # Enrollment model interface
├─ 📄 Assignment.ts         # Assignment model interface
├─ 📄 LearningPath.ts       # LearningPath model interface
├─ 📄 Skill.ts              # Skill model interface
├─ 📄 Badge.ts              # Badge model interface
├─ 📄 Notification.ts       # Notification model interface
├─ 📄 Report.ts             # Report model interface
└─ 📄 Test.ts               # Test model interface
```

## Usage

Import individual types:
```typescript
import { User } from '@shared/types/User';
import { Course } from '@shared/types/Course';
```

Or import everything:
```typescript
import { User, Course, Enrollment } from '@shared/types';
```

## Note

These are simplified TypeScript interfaces. For full Prisma types with relations, use:
```typescript
import { User } from '@prisma/client';
```
