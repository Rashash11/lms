/**
 * TalentLMS Notification Events
 * Complete list of all notification events matching TalentLMS exactly
 */

export interface NotificationEvent {
    key: string;
    label: string;
    category: 'USER' | 'COURSE' | 'CERTIFICATION' | 'GROUP' | 'BRANCH' | 'ASSIGNMENT' | 'ILT' | 'PAYMENT' | 'GAMIFICATION' | 'LEARNING_PATH';
    supportsHoursOffset: boolean;
    offsetDirection?: 'AFTER' | 'BEFORE' | 'SINCE';
    supportsFilter: boolean;
    filterTypes?: ('COURSES' | 'GROUPS' | 'BRANCHES' | 'LEARNING_PATHS')[];
    description?: string;
    specialLogic?: string;
}

// ==================== USER EVENTS ====================
export const USER_EVENTS: NotificationEvent[] = [
    {
        key: 'ON_USER_CREATE',
        label: 'On user create',
        category: 'USER',
        supportsHoursOffset: false,
        supportsFilter: false,
        description: 'Triggered when a user is created by an admin',
        specialLogic: 'SCIM users: This event won\'t trigger for users created via SCIM. Use "X hours after user creation" instead.',
    },
    {
        key: 'ON_USER_SIGNUP',
        label: 'On user signup',
        category: 'USER',
        supportsHoursOffset: false,
        supportsFilter: false,
        description: 'Triggered when a user signs up',
        specialLogic: 'SSO users: This event won\'t trigger for users created via SSO. Use "X hours after user signup" instead.',
    },
    {
        key: 'HOURS_AFTER_USER_SIGNUP',
        label: 'X hours after user signup',
        category: 'USER',
        supportsHoursOffset: true,
        offsetDirection: 'AFTER',
        supportsFilter: false,
        description: 'Triggered X hours after user signs up',
    },
    {
        key: 'HOURS_AFTER_USER_SIGNUP_NO_PURCHASE',
        label: 'X hours after user signup and the user has not made a purchase',
        category: 'USER',
        supportsHoursOffset: true,
        offsetDirection: 'AFTER',
        supportsFilter: false,
        description: 'Triggered X hours after user signs up if no purchase made',
    },
    {
        key: 'HOURS_AFTER_USER_CREATION',
        label: 'X hours after user creation',
        category: 'USER',
        supportsHoursOffset: true,
        offsetDirection: 'AFTER',
        supportsFilter: false,
        description: 'Triggered X hours after user is created',
    },
    {
        key: 'HOURS_AFTER_USER_CREATION_NOT_SIGNED_IN',
        label: 'X hours after user creation and the user has not signed in',
        category: 'USER',
        supportsHoursOffset: true,
        offsetDirection: 'AFTER',
        supportsFilter: false,
        description: 'Triggered X hours after user creation if they haven\'t signed in',
    },
    {
        key: 'HOURS_AFTER_USER_SIGNUP_NOT_SIGNED_IN',
        label: 'X hours after user sign up and the user has not signed in',
        category: 'USER',
        supportsHoursOffset: true,
        offsetDirection: 'AFTER',
        supportsFilter: false,
        description: 'Triggered X hours after user signup if they haven\'t signed in',
    },
    {
        key: 'HOURS_SINCE_USER_LAST_SIGNED_IN',
        label: 'X hours since user last signed in',
        category: 'USER',
        supportsHoursOffset: true,
        offsetDirection: 'SINCE',
        supportsFilter: false,
        description: 'Triggered X hours after user\'s last sign in',
    },
    {
        key: 'HOURS_SINCE_USER_FIRST_SIGNIN_NO_COMPLETION',
        label: 'X hours since user first sign in and the user has not completed any course',
        category: 'USER',
        supportsHoursOffset: true,
        offsetDirection: 'SINCE',
        supportsFilter: false,
        description: 'Triggered X hours after first sign in if user hasn\'t completed any course',
    },
    {
        key: 'HOURS_BEFORE_USER_DEACTIVATION',
        label: 'X hours before user deactivation',
        category: 'USER',
        supportsHoursOffset: true,
        offsetDirection: 'BEFORE',
        supportsFilter: false,
        description: 'Triggered X hours before scheduled user deactivation (only when deactivation date is set)',
    },
];

// ==================== COURSE EVENTS ====================
export const COURSE_EVENTS: NotificationEvent[] = [
    {
        key: 'ON_COURSE_ASSIGNMENT',
        label: 'On course assignment',
        category: 'COURSE',
        supportsHoursOffset: false,
        supportsFilter: true,
        filterTypes: ['COURSES'],
        description: 'Triggered when a user is assigned to a course',
    },
    {
        key: 'ON_COURSE_SELF_ASSIGNMENT',
        label: 'On course self assignment',
        category: 'COURSE',
        supportsHoursOffset: false,
        supportsFilter: true,
        filterTypes: ['COURSES'],
        description: 'Triggered when a user self-enrolls in a course',
    },
    {
        key: 'HOURS_AFTER_COURSE_ACQUISITION',
        label: 'X hours after course acquisition',
        category: 'COURSE',
        supportsHoursOffset: true,
        offsetDirection: 'AFTER',
        supportsFilter: true,
        filterTypes: ['COURSES'],
        description: 'Triggered X hours after course acquisition',
        specialLogic: 'REMINDER ONLY: This notification is only triggered when the user has NOT completed the course yet.',
    },
    {
        key: 'ON_COURSE_COMPLETION',
        label: 'On course completion',
        category: 'COURSE',
        supportsHoursOffset: false,
        supportsFilter: true,
        filterTypes: ['COURSES'],
        description: 'Triggered when a user completes a course',
    },
    {
        key: 'HOURS_AFTER_COURSE_COMPLETION',
        label: 'X hours after course completion',
        category: 'COURSE',
        supportsHoursOffset: true,
        offsetDirection: 'AFTER',
        supportsFilter: true,
        filterTypes: ['COURSES'],
        description: 'Triggered X hours after course completion',
    },
    {
        key: 'ON_COURSE_FAILURE',
        label: 'On course failure',
        category: 'COURSE',
        supportsHoursOffset: false,
        supportsFilter: true,
        filterTypes: ['COURSES'],
        description: 'Triggered when a user fails a course',
    },
    {
        key: 'ON_COURSE_EXPIRATION',
        label: 'On course expiration',
        category: 'COURSE',
        supportsHoursOffset: false,
        supportsFilter: true,
        filterTypes: ['COURSES'],
        description: 'Triggered when a course expires for a user',
    },
    {
        key: 'HOURS_BEFORE_COURSE_START',
        label: 'X hours before course start',
        category: 'COURSE',
        supportsHoursOffset: true,
        offsetDirection: 'BEFORE',
        supportsFilter: true,
        filterTypes: ['COURSES'],
        description: 'Triggered X hours before a course starts',
    },
    {
        key: 'HOURS_BEFORE_COURSE_EXPIRATION',
        label: 'X hours before course expiration',
        category: 'COURSE',
        supportsHoursOffset: true,
        offsetDirection: 'BEFORE',
        supportsFilter: true,
        filterTypes: ['COURSES'],
        description: 'Triggered X hours before a course expires',
        specialLogic: 'REMINDER ONLY: This notification is only triggered when the user has NOT completed the course yet.',
    },
];

// ==================== CERTIFICATION EVENTS ====================
export const CERTIFICATION_EVENTS: NotificationEvent[] = [
    {
        key: 'ON_CERTIFICATION_ACQUISITION',
        label: 'On certification acquisition',
        category: 'CERTIFICATION',
        supportsHoursOffset: false,
        supportsFilter: false,
        description: 'Triggered when a user acquires a certificate',
    },
    {
        key: 'ON_CERTIFICATION_EXPIRATION',
        label: 'On certification expiration',
        category: 'CERTIFICATION',
        supportsHoursOffset: false,
        supportsFilter: false,
        description: 'Triggered when a certificate expires',
    },
    {
        key: 'HOURS_BEFORE_CERTIFICATION_EXPIRATION',
        label: 'X hours before certification expiration',
        category: 'CERTIFICATION',
        supportsHoursOffset: true,
        offsetDirection: 'BEFORE',
        supportsFilter: false,
        description: 'Triggered X hours before a certificate expires',
    },
];

// ==================== GROUP/BRANCH EVENTS ====================
export const GROUP_BRANCH_EVENTS: NotificationEvent[] = [
    {
        key: 'ON_GROUP_ASSIGNMENT',
        label: 'On group assignment',
        category: 'GROUP',
        supportsHoursOffset: false,
        supportsFilter: true,
        filterTypes: ['GROUPS'],
        description: 'Triggered when a user is assigned to a group',
    },
    {
        key: 'ON_BRANCH_ASSIGNMENT',
        label: 'On branch assignment',
        category: 'BRANCH',
        supportsHoursOffset: false,
        supportsFilter: true,
        filterTypes: ['BRANCHES'],
        description: 'Triggered when a user is assigned to a branch',
    },
];

// ==================== ASSIGNMENT EVENTS ====================
export const ASSIGNMENT_EVENTS: NotificationEvent[] = [
    {
        key: 'ON_ASSIGNMENT_SUBMISSION',
        label: 'On assignment submission',
        category: 'ASSIGNMENT',
        supportsHoursOffset: false,
        supportsFilter: true,
        filterTypes: ['COURSES'],
        description: 'Triggered when a user submits an assignment',
    },
    {
        key: 'ON_ASSIGNMENT_GRADING',
        label: 'On assignment grading',
        category: 'ASSIGNMENT',
        supportsHoursOffset: false,
        supportsFilter: true,
        filterTypes: ['COURSES'],
        description: 'Triggered when an assignment is graded',
    },
];

// ==================== ILT EVENTS ====================
export const ILT_EVENTS: NotificationEvent[] = [
    {
        key: 'ON_ILT_SESSION_CREATE',
        label: 'On ILT session create',
        category: 'ILT',
        supportsHoursOffset: false,
        supportsFilter: false,
        description: 'Triggered when an ILT session is created',
    },
    {
        key: 'ON_ILT_SESSION_REGISTRATION',
        label: 'On ILT session registration',
        category: 'ILT',
        supportsHoursOffset: false,
        supportsFilter: false,
        description: 'Triggered when a user registers for an ILT session',
    },
    {
        key: 'HOURS_BEFORE_ILT_SESSION_START',
        label: 'X hours before an ILT session starts',
        category: 'ILT',
        supportsHoursOffset: true,
        offsetDirection: 'BEFORE',
        supportsFilter: false,
        description: 'Triggered X hours before an ILT session starts',
    },
    {
        key: 'ON_ILT_GRADING',
        label: 'On ILT grading',
        category: 'ILT',
        supportsHoursOffset: false,
        supportsFilter: false,
        description: 'Triggered when ILT is graded',
    },
];

// ==================== PAYMENT EVENTS ====================
export const PAYMENT_EVENTS: NotificationEvent[] = [
    {
        key: 'ON_USER_PAYMENT',
        label: 'On user payment',
        category: 'PAYMENT',
        supportsHoursOffset: false,
        supportsFilter: false,
        description: 'Triggered when a user makes a payment',
    },
];

// ==================== GAMIFICATION EVENTS ====================
export const GAMIFICATION_EVENTS: NotificationEvent[] = [
    {
        key: 'ON_LEVEL_REACHED',
        label: 'On level X reached',
        category: 'GAMIFICATION',
        supportsHoursOffset: false,
        supportsFilter: false,
        description: 'Triggered when a user reaches a specific level',
    },
];

// ==================== LEARNING PATH EVENTS ====================
export const LEARNING_PATH_EVENTS: NotificationEvent[] = [
    {
        key: 'ON_LEARNING_PATH_ASSIGNMENT',
        label: 'On learning path assignment',
        category: 'LEARNING_PATH',
        supportsHoursOffset: false,
        supportsFilter: true,
        filterTypes: ['LEARNING_PATHS'],
        description: 'Triggered when a user is assigned to a learning path',
    },
    {
        key: 'HOURS_AFTER_LEARNING_PATH_ACQUISITION',
        label: 'X hours after learning path acquisition',
        category: 'LEARNING_PATH',
        supportsHoursOffset: true,
        offsetDirection: 'AFTER',
        supportsFilter: true,
        filterTypes: ['LEARNING_PATHS'],
        description: 'Triggered X hours after learning path acquisition',
    },
    {
        key: 'ON_LEARNING_PATH_COMPLETION',
        label: 'On learning path completion',
        category: 'LEARNING_PATH',
        supportsHoursOffset: false,
        supportsFilter: true,
        filterTypes: ['LEARNING_PATHS'],
        description: 'Triggered when a user completes a learning path',
    },
];

// ==================== ALL EVENTS ====================
export const ALL_NOTIFICATION_EVENTS: NotificationEvent[] = [
    ...USER_EVENTS,
    ...COURSE_EVENTS,
    ...CERTIFICATION_EVENTS,
    ...GROUP_BRANCH_EVENTS,
    ...ASSIGNMENT_EVENTS,
    ...ILT_EVENTS,
    ...PAYMENT_EVENTS,
    ...GAMIFICATION_EVENTS,
    ...LEARNING_PATH_EVENTS,
];

// Helper to get event by key
export function getEventByKey(key: string): NotificationEvent | undefined {
    return ALL_NOTIFICATION_EVENTS.find(event => event.key === key);
}

// Helper to get events by category
export function getEventsByCategory(category: NotificationEvent['category']): NotificationEvent[] {
    return ALL_NOTIFICATION_EVENTS.filter(event => event.category === category);
}

// Helper to check if event supports filtering
export function eventSupportsFiltering(eventKey: string): boolean {
    const event = getEventByKey(eventKey);
    return event?.supportsFilter ?? false;
}

// Helper to get filter types for an event
export function getEventFilterTypes(eventKey: string): string[] {
    const event = getEventByKey(eventKey);
    return event?.filterTypes ?? [];
}
