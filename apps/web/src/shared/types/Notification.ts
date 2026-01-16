// Auto-generated from Prisma schema

export interface Notification {
    id: string;
    tenantId: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    link?: string;
    isRead: boolean;
    readAt?: Date;
    createdAt: Date;
}
