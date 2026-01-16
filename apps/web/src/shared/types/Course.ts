// Auto-generated from Prisma schema

export interface Course {
    id: string;
    tenantId: string;
    title: string;
    slug: string;
    description?: string;
    imageUrl?: string;
    categoryId?: string;
    language: string;
    level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    estimatedDuration?: number;
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    hiddenFromCatalog: boolean;
    requiresEnrollmentApproval: boolean;
    maxEnrollments?: number;
    settings: any;
    metadata: any;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
