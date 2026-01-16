/**
 * Recipient Types for Notifications
 * Defines who should receive notifications
 */

export interface RecipientType {
    value: string;
    label: string;
    description: string;
    requiresUserId?: boolean; // If true, requires selecting a specific user
    applicableEvents?: string[]; // If specified, only applicable to certain events
}

export const RECIPIENT_TYPES: RecipientType[] = [
    {
        value: 'RELATED_USER',
        label: 'Related user',
        description: 'The user directly affected by the event (enrolled user, assigned user, etc.)',
    },
    {
        value: 'COURSE_INSTRUCTORS',
        label: 'Course instructors',
        description: 'All instructors assigned to the course',
        applicableEvents: [
            'ON_COURSE_ASSIGNMENT',
            'ON_COURSE_SELF_ASSIGNMENT',
            'HOURS_AFTER_COURSE_ACQUISITION',
            'ON_COURSE_COMPLETION',
            'HOURS_AFTER_COURSE_COMPLETION',
            'ON_COURSE_FAILURE',
            'ON_COURSE_EXPIRATION',
            'HOURS_BEFORE_COURSE_START',
            'HOURS_BEFORE_COURSE_EXPIRATION',
            'ON_ASSIGNMENT_SUBMISSION',
            'ON_ASSIGNMENT_GRADING',
        ],
    },
    {
        value: 'ADMINS',
        label: 'Admins',
        description: 'All users with admin role',
    },
    {
        value: 'ACCOUNT_OWNERS',
        label: 'Account owners',
        description: 'Superadmin or account owner users',
    },
    {
        value: 'SUPER_ADMINS',
        label: 'Super admins',
        description: 'Users with superadmin privileges',
    },
    {
        value: 'SPECIFIC_USER',
        label: 'Specific user',
        description: 'A specific user selected by the admin',
        requiresUserId: true,
    },
];

// Helper to get recipient type by value
export function getRecipientTypeByValue(value: string): RecipientType | undefined {
    return RECIPIENT_TYPES.find(type => type.value === value);
}

// Helper to get applicable recipient types for an event
export function getApplicableRecipientTypes(eventKey: string): RecipientType[] {
    return RECIPIENT_TYPES.filter(type => {
        // If no applicableEvents specified, it's applicable to all events
        if (!type.applicableEvents) {
            return true;
        }
        // Otherwise check if event is in the list
        return type.applicableEvents.includes(eventKey);
    });
}

// Helper to check if recipient type requires user ID
export function recipientTypeRequiresUserId(recipientType: string): boolean {
    const type = getRecipientTypeByValue(recipientType);
    return type?.requiresUserId ?? false;
}
