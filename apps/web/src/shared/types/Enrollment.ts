// Auto-generated from Prisma schema

export interface Enrollment {
    id: string;
    tenantId: string;
    userId: string;
    courseId: string;
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
    progress: number;
    score?: number;
    startedAt?: Date;
    completedAt?: Date;
    expiresAt?: Date;
    certificateId?: string;
    lastAccessedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
