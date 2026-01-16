// Auto-generated from Prisma schema

export interface Skill {
    id: string;
    tenantId: string;
    name: string;
    category?: string;
    description?: string;
    iconUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}
