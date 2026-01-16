// Auto-generated from Prisma schema

export interface User {
    id: string;
    tenantId: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    bio?: string;
    timezone: string;
    language: string;
    userTypeId?: string;
    passwordHash?: string;
    avatar?: string;
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
    deactivateAt?: Date;
    role: 'ADMIN' | 'SUPER_INSTRUCTOR' | 'INSTRUCTOR' | 'LEARNER';
    isActive: boolean;
    isVerified: boolean;
    lastLoginAt?: Date;
    failedLoginAttempts: number;
    lockedUntil?: Date;
    excludeFromEmails: boolean;
    certificatesArchive?: any;
    rbacOverrides?: any;
    nodeId?: string;
    tokenVersion: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
