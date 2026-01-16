// Auto-generated from Prisma schema

export interface Assignment {
    id: string;
    tenantId: string;
    title: string;
    description?: string;
    instructions?: string;
    courseId?: string;
    dueDate?: Date;
    totalPoints?: number;
    passingScore?: number;
    allowLateSubmissions: boolean;
    maxAttempts?: number;
    assignedTo: 'ALL' | 'GROUP' | 'INDIVIDUAL';
    status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}
