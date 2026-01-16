// Auto-generated from Prisma schema

export interface Test {
    id: string;
    tenantId: string;
    title: string;
    description?: string;
    duration?: number;
    passingScore: number;
    randomizeQuestions: boolean;
    randomizeAnswers: boolean;
    showResults: boolean;
    allowReview: boolean;
    maxAttempts?: number;
    createdAt: Date;
    updatedAt: Date;
}
