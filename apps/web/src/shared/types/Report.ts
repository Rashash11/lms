// Auto-generated from Prisma schema

export interface Report {
    id: string;
    tenantId: string;
    name: string;
    description?: string;
    type: 'USER' | 'COURSE' | 'ENROLLMENT' | 'CUSTOM';
    config: any;
    schedule?: string;
    isActive: boolean;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}
