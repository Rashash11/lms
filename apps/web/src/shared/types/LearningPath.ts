// Auto-generated from Prisma schema

export interface LearningPath {
    id: string;
    tenantId: string;
    title: string;
    description?: string;
    imageUrl?: string;
    categoryId?: string;
    estimatedDuration?: number;
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
