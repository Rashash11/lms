import { z } from 'zod';

/**
 * Common field validators
 */
export const commonValidators = {
    uuid: z.string().uuid('Invalid ID format'),
    email: z.string().email('Invalid email address'),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
    username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
    name: z.string().min(1).max(100),
    description: z.string().max(5000).optional(),
    url: z.string().url().optional(),
    date: z.string().datetime().optional(),
    positiveInt: z.number().int().positive(),
    nonNegativeInt: z.number().int().nonnegative(),
    percentage: z.number().min(0).max(100),
};

/**
 * Pagination schema
 */
export const paginationSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

/**
 * Search/filter schema
 */
export const searchSchema = z.object({
    search: z.string().max(200).optional(),
    status: z.string().optional(),
    fromDate: z.string().datetime().optional(),
    toDate: z.string().datetime().optional(),
});

/**
 * User schemas
 */
export const userSchemas = {
    create: z.object({
        email: commonValidators.email,
        username: commonValidators.username,
        password: commonValidators.password.optional(),
        firstName: commonValidators.name,
        lastName: commonValidators.name,
        activeRole: z.enum(['ADMIN', 'INSTRUCTOR', 'SUPER_INSTRUCTOR', 'LEARNER']).default('LEARNER'),
        nodeId: commonValidators.uuid.nullable().optional(),
        bio: z.string().max(1000).optional(),
        timezone: z.string().default('UTC'),
        language: z.string().default('en'),
    }),

    update: z.object({
        email: commonValidators.email.optional(),
        username: commonValidators.username.optional(),
        firstName: commonValidators.name.optional(),
        lastName: commonValidators.name.optional(),
        role: z.enum(['ADMIN', 'INSTRUCTOR', 'SUPER_INSTRUCTOR', 'LEARNER']).optional(),
        nodeId: commonValidators.uuid.nullable().optional(),
        bio: z.string().max(1000).optional(),
        timezone: z.string().optional(),
        language: z.string().optional(),
        status: z.enum(['ACTIVE', 'INACTIVE', 'DEACTIVATED']).optional(),
    }),

    changePassword: z.object({
        currentPassword: z.string().min(1),
        newPassword: commonValidators.password,
    }),

    bulkAction: z.object({
        userIds: z.array(commonValidators.uuid).min(1).max(100),
        action: z.enum(['activate', 'deactivate', 'delete', 'sendPasswordReset', 'assign_roles']),
        roleIds: z.array(z.string().uuid()).optional(),
        status: z.enum(['ACTIVE', 'INACTIVE', 'DEACTIVATED']).optional(),
    }),

    import: z.object({
        fileId: commonValidators.uuid,
        options: z.object({
            skipExisting: z.boolean().default(true),
            updateExisting: z.boolean().default(false),
            defaultRoleId: commonValidators.uuid.optional(),
            defaultNodeId: commonValidators.uuid.optional(),
            sendInvite: z.boolean().default(false),
        }).optional(),
    }),
};

/**
 * System Settings schemas
 */
export const settingsSchemas = {
    update: z.object({
        site: z.object({
            name: z.string().min(1).max(100).optional(),
            description: z.string().max(500).optional(),
            logoUrl: z.string().url().optional().nullable(),
            faviconUrl: z.string().url().optional().nullable(),
        }).optional(),
        branding: z.object({
            primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
            secondaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
            fontFamily: z.string().optional(),
        }).optional(),
        registration: z.object({
            allowedDomains: z.array(z.string()).optional(),
            signupMode: z.enum(['direct', 'invitation', 'approval']).optional(),
            maxRegistrations: z.number().int().positive().optional().nullable(),
            termsOfService: z.string().optional().nullable(),
        }).optional(),
        features: z.object({
            prerequisitesEnabled: z.boolean().optional(),
            learningPathsEnabled: z.boolean().optional(),
            messagingEnabled: z.boolean().optional(),
            gamificationEnabled: z.boolean().optional(),
        }).optional(),
        localization: z.object({
            defaultLanguage: z.string().min(2).max(10).optional(),
            timezone: z.string().optional(),
        }).optional(),
    }),
};

/**
 * Course schemas
 */
export const courseSchemas = {
    create: z.object({
        code: z.string().min(1).max(50).regex(/^[A-Z0-9-]+$/i, 'Course code can only contain letters, numbers, and hyphens').optional(),
        title: z.string().min(1).max(200),
        description: z.string().max(5000).optional(),
        categoryId: commonValidators.uuid.optional(),
        instructorId: commonValidators.uuid.optional(),
        capacity: commonValidators.positiveInt.optional(),
        timeLimit: commonValidators.positiveInt.optional(),
        price: z.number().nonnegative().optional(),
        showInCatalog: z.boolean().default(true),
        enrollmentRequestEnabled: z.boolean().default(false),
    }),

    update: z.object({
        code: z.string().min(1).max(50).regex(/^[A-Z0-9-]+$/i).optional(),
        title: z.string().min(1).max(200).optional(),
        description: z.string().max(5000).optional(),
        categoryId: commonValidators.uuid.nullable().optional(),
        instructorId: commonValidators.uuid.nullable().optional(),
        status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
        capacity: commonValidators.positiveInt.nullable().optional(),
        timeLimit: commonValidators.positiveInt.nullable().optional(),
        price: z.number().nonnegative().nullable().optional(),
        showInCatalog: z.boolean().optional(),
        enrollmentRequestEnabled: z.boolean().optional(),
        completionRule: z.enum(['all', 'percentage', 'mandatory']).optional(),
        scoreCalculation: z.enum(['all', 'average', 'highest']).optional(),
    }),
};

/**
 * Course unit schemas
 */
export const unitSchemas = {
    create: z.object({
        type: z.enum([
            'TEXT', 'FILE', 'EMBED', 'VIDEO', 'TEST', 'SURVEY',
            'ASSIGNMENT', 'ILT', 'CMI5', 'TALENTCRAFT', 'SECTION',
            'WEB', 'AUDIO', 'DOCUMENT', 'IFRAME', 'SCORM', 'XAPI'
        ]),
        title: z.string().min(1).max(200),
        sectionId: commonValidators.uuid.optional(),
        config: z.record(z.any()).default({}),
        isSample: z.boolean().default(false),
    }),

    update: z.object({
        title: z.string().min(1).max(200).optional(),
        sectionId: commonValidators.uuid.nullable().optional(),
        config: z.record(z.any()).optional(),
        status: z.enum(['DRAFT', 'PUBLISHED', 'UNPUBLISHED_CHANGES']).optional(),
        isSample: z.boolean().optional(),
    }),

    reorder: z.object({
        unitIds: z.array(commonValidators.uuid).min(1),
    }),
};

/**
 * Enrollment schemas
 */
export const enrollmentSchemas = {
    create: z.object({
        userId: commonValidators.uuid.optional(),
        userIds: z.array(commonValidators.uuid).max(100).optional(),
        expiresAt: z.string().datetime().optional(),
    }).refine(
        data => data.userId || (data.userIds && data.userIds.length > 0),
        { message: 'Either userId or userIds must be provided' }
    ),

    update: z.object({
        status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'EXPIRED']).optional(),
        progress: commonValidators.percentage.optional(),
        expiresAt: z.string().datetime().nullable().optional(),
    }),
};

/**
 * Assignment schemas
 */
export const assignmentSchemas = {
    create: z.object({
        title: z.string().min(1).max(200),
        description: z.string().max(5000).optional(),
        courseId: commonValidators.uuid.optional(),
        dueAt: z.string().datetime().optional(),
    }),

    submit: z.object({
        submissionType: z.enum(['text', 'file']),
        content: z.string().max(50000).optional(),
        fileId: commonValidators.uuid.optional(),
    }).refine(
        data => (data.submissionType === 'text' && data.content) || (data.submissionType === 'file' && data.fileId),
        { message: 'Content or fileId required based on submission type' }
    ),

    grade: z.object({
        score: z.number().min(0).max(100),
        comment: z.string().max(5000).optional(),
    }),

    bulkGrade: z.object({
        submissionIds: z.array(commonValidators.uuid).min(1).max(50),
        score: z.number().min(0).max(100),
        comment: z.string().max(5000).optional(),
    }),
};

/**
 * Test/Quiz schemas
 */
export const testSchemas = {
    create: z.object({
        passingScore: z.number().min(0).max(100).default(70),
        timeLimit: commonValidators.positiveInt.optional(),
        isRandomized: z.boolean().default(false),
        questionsToShow: commonValidators.positiveInt.optional(),
        settings: z.record(z.any()).default({}),
    }),

    question: z.object({
        type: z.enum(['multiple_choice', 'true_false', 'fill_blank', 'matching', 'essay', 'free_text']),
        text: z.string().min(1).max(5000),
        options: z.array(z.object({
            id: z.string(),
            text: z.string(),
            isCorrect: z.boolean().optional(),
        })).optional(),
        correctAnswer: z.any(),
        points: commonValidators.positiveInt.default(1),
        feedback: z.string().max(2000).optional(),
        tags: z.array(z.string()).optional(),
    }),

    submitAttempt: z.object({
        answers: z.array(z.object({
            questionId: commonValidators.uuid,
            answer: z.any(),
        })),
    }),
};

/**
 * Learning path schemas
 */
export const learningPathSchemas = {
    create: z.object({
        name: z.string().min(1).max(200),
        code: z.string().min(1).max(50).regex(/^[A-Z0-9-]+$/i).optional(),
        description: z.string().max(5000).optional(),
        isSequential: z.boolean().default(false),
        certificateType: z.enum(['CLASSIC', 'FANCY', 'MODERN', 'SIMPLE']).optional(),
        limitDays: commonValidators.positiveInt.optional(),
    }),

    addCourse: z.object({
        courseId: commonValidators.uuid,
        sectionId: commonValidators.uuid.optional(),
        unlockType: z.enum(['NONE', 'AFTER_COURSE', 'AFTER_SCORE']).default('NONE'),
        unlockCourseId: commonValidators.uuid.optional(),
        minScore: z.number().min(0).max(100).optional(),
    }),
};

/**
 * Group schemas
 */
export const groupSchemas = {
    create: z.object({
        name: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
        maxMembers: commonValidators.positiveInt.optional(),
        autoEnroll: z.boolean().default(false),
        groupKey: z.string().max(50).optional(),
        price: z.number().nonnegative().optional(),
    }),

    addMembers: z.object({
        userIds: z.array(commonValidators.uuid).min(1).max(100),
    }),

    addCourses: z.object({
        courseIds: z.array(commonValidators.uuid).min(1).max(50),
    }),
};

/**
 * Notification schemas
 */
export const notificationSchemas = {
    create: z.object({
        name: z.string().min(1).max(100),
        eventKey: z.string().min(1).max(50),
        recipientType: z.enum(['user', 'role', 'group', 'branch', 'all']),
        recipientUserId: commonValidators.uuid.optional(),
        messageSubject: z.string().min(1).max(200),
        messageBody: z.string().min(1).max(10000),
        isActive: z.boolean().default(true),
        hoursOffset: z.number().int().optional(),
        offsetDirection: z.enum(['before', 'after']).optional(),
        filterCourses: z.array(commonValidators.uuid).optional(),
        filterGroups: z.array(commonValidators.uuid).optional(),
        filterBranches: z.array(commonValidators.uuid).optional(),
    }),
};

/**
 * Report schemas
 */
export const reportSchemas = {
    create: z.object({
        name: z.string().min(1).max(100),
        type: z.enum(['user_progress', 'course_completion', 'assessment_results', 'enrollment', 'custom']),
        ruleset: z.record(z.any()).default({}),
    }),

    export: z.object({
        reportId: commonValidators.uuid.optional(),
        format: z.enum(['csv', 'xlsx', 'pdf']).default('xlsx'),
        filters: z.record(z.any()).optional(),
    }),

    schedule: z.object({
        reportId: commonValidators.uuid,
        frequency: z.enum(['daily', 'weekly', 'monthly']),
        recipients: z.array(commonValidators.email).min(1),
        config: z.record(z.any()).optional(),
    }),
};

/**
 * Certificate schemas
 */
/**
 * Branch schemas
 */
export const branchSchemas = {
    create: z.object({
        name: z.string()
            .min(3, 'Name must be at least 3 characters')
            .regex(/^[a-z0-9-]+$/, 'Name must contain only lowercase letters, numbers, and hyphens'),
        slug: z.string().optional(),
        title: z.string().optional(),
        description: z.string().max(255).optional(),
        isActive: z.boolean().optional(),
        languageCode: z.string().optional(),
        timezone: z.string().optional(),
        internalAnnouncementEnabled: z.boolean().optional(),
        internalAnnouncement: z.string().optional(),
        externalAnnouncementEnabled: z.boolean().optional(),
        externalAnnouncement: z.string().optional(),
        signupMode: z.enum(['direct', 'invitation', 'approval']).optional(),
        allowedDomains: z.array(z.string()).optional(),
        maxRegistrations: z.number().int().positive().nullable().optional(),
        disallowMainDomainLogin: z.boolean().optional(),
        termsOfService: z.string().nullable().optional(),
        defaultUserTypeId: commonValidators.uuid.nullable().optional(),
        defaultGroupId: commonValidators.uuid.nullable().optional(),
        ecommerceProcessor: z.enum(['none', 'stripe', 'paypal']).nullable().optional(),
        subscriptionEnabled: z.boolean().optional(),
        creditsEnabled: z.boolean().optional(),
        badgeSet: z.enum(['old-school', 'modern', 'minimal']).optional(),
        aiFeaturesEnabled: z.boolean().optional(),
        brandingLogoUrl: z.string().nullable().optional(),
        brandingFaviconUrl: z.string().nullable().optional(),
        defaultCourseImageUrl: z.string().nullable().optional(),
        settings: z.record(z.any()).optional(),
    }),

    update: z.object({
        name: z.string().min(3).regex(/^[a-z0-9-]+$/).optional(),
        slug: z.string().optional(),
        title: z.string().optional(),
        description: z.string().max(255).optional(),
        isActive: z.boolean().optional(),
        settings: z.record(z.any()).optional(),
    }),
};

/**
 * Certificate schemas
 */
export const certificateSchemas = {
    template: z.object({
        name: z.string().min(1).max(100),
        htmlBody: z.string().min(1).max(100000),
        smartTags: z.record(z.any()).default({}),
        isSystem: z.boolean().default(false),
    }),

    issue: z.object({
        userId: commonValidators.uuid,
        templateId: commonValidators.uuid,
        courseId: commonValidators.uuid.optional(),
        pathId: commonValidators.uuid.optional(),
        expiresAt: z.string().datetime().optional(),
    }),
};

/**
 * Auth schemas
 */
export const authSchemas = {
    login: z.object({
        email: commonValidators.email,
        password: z.string().min(1),
    }),

    register: z.object({
        email: commonValidators.email,
        username: commonValidators.username,
        password: commonValidators.password,
        firstName: commonValidators.name,
        lastName: commonValidators.name,
    }),

    resetPassword: z.object({
        token: z.string().min(1),
        newPassword: commonValidators.password,
    }),

    forgotPassword: z.object({
        email: commonValidators.email,
    }),
};

/**
 * Validate request body against schema
 */
export async function validateBody<T extends z.ZodSchema>(
    request: Request,
    schema: T
): Promise<z.infer<T>> {
    let body: unknown;

    try {
        body = await request.json();
    } catch {
        throw new ValidationError('Invalid JSON body');
    }

    const result = schema.safeParse(body);

    if (!result.success) {
        throw new ValidationError(
            'Validation failed',
            result.error.errors.map(e => ({
                path: e.path.map(String),
                message: e.message,
            }))
        );
    }

    return result.data;
}

/**
 * Validate query parameters against schema
 */
export function validateQuery<T extends z.ZodSchema>(
    searchParams: URLSearchParams,
    schema: T
): z.infer<T> {
    const params: Record<string, string | string[]> = {};

    searchParams.forEach((value, key) => {
        if (params[key]) {
            if (Array.isArray(params[key])) {
                (params[key] as string[]).push(value);
            } else {
                params[key] = [params[key] as string, value];
            }
        } else {
            params[key] = value;
        }
    });

    const result = schema.safeParse(params);

    if (!result.success) {
        throw new ValidationError(
            'Invalid query parameters',
            result.error.errors.map(e => ({
                path: e.path.map(String),
                message: e.message,
            }))
        );
    }

    return result.data;
}

/**
 * Validation error class
 */
export class ValidationError extends Error {
    constructor(
        message: string,
        public errors?: Array<{ path: string[]; message: string }>
    ) {
        super(message);
        this.name = 'ValidationError';
    }
}
