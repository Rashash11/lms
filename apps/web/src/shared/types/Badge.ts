// Auto-generated from Prisma schema

export interface Badge {
    id: string;
    tenantId: string;
    name: string;
    description?: string;
    imageUrl?: string;
    criteria: any;
    points: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
