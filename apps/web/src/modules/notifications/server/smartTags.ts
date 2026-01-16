/**
 * Smart Tags for Notification Templates
 * Tags that can be inserted into email subject and body
 */

export interface SmartTag {
    tag: string;
    label: string;
    category: 'USER' | 'COURSE' | 'LEARNING_PATH' | 'ORGANIZATION' | 'SYSTEM';
    description: string;
    example?: string;
}

// ==================== USER TAGS ====================
export const USER_TAGS: SmartTag[] = [
    {
        tag: '{related_user_first_name}',
        label: 'Related User First Name',
        category: 'USER',
        description: 'First name of the user related to this notification',
        example: 'John',
    },
    {
        tag: '{related_user_last_name}',
        label: 'Related User Last Name',
        category: 'USER',
        description: 'Last name of the user related to this notification',
        example: 'Doe',
    },
    {
        tag: '{related_user_email}',
        label: 'Related User Email',
        category: 'USER',
        description: 'Email address of the user',
        example: 'john.doe@example.com',
    },
    {
        tag: '{username}',
        label: 'Username',
        category: 'USER',
        description: 'Username of the user',
        example: 'johndoe',
    },
    {
        tag: '{user_full_name}',
        label: 'User Full Name',
        category: 'USER',
        description: 'Full name of the user',
        example: 'John Doe',
    },
];

// ==================== COURSE TAGS ====================
export const COURSE_TAGS: SmartTag[] = [
    {
        tag: '{course_name}',
        label: 'Course Name',
        category: 'COURSE',
        description: 'Title of the course',
        example: 'Introduction to Programming',
    },
    {
        tag: '{course_url}',
        label: 'Course URL',
        category: 'COURSE',
        description: 'Direct link to the course',
        example: 'https://example.com/courses/123',
    },
    {
        tag: '{course_code}',
        label: 'Course Code',
        category: 'COURSE',
        description: 'Unique code of the course',
        example: 'CS101',
    },
    {
        tag: '{course_description}',
        label: 'Course Description',
        category: 'COURSE',
        description: 'Description of the course',
        example: 'Learn the basics of programming...',
    },
];

// ==================== LEARNING PATH TAGS ====================
export const LEARNING_PATH_TAGS: SmartTag[] = [
    {
        tag: '{learning_path_name}',
        label: 'Learning Path Name',
        category: 'LEARNING_PATH',
        description: 'Title of the learning path',
        example: 'Full Stack Developer Path',
    },
    {
        tag: '{learning_path_url}',
        label: 'Learning Path URL',
        category: 'LEARNING_PATH',
        description: 'Direct link to the learning path',
        example: 'https://example.com/learning-paths/456',
    },
    {
        tag: '{learning_path_description}',
        label: 'Learning Path Description',
        category: 'LEARNING_PATH',
        description: 'Description of the learning path',
        example: 'Master full stack development...',
    },
];

// ==================== ORGANIZATION TAGS ====================
export const ORGANIZATION_TAGS: SmartTag[] = [
    {
        tag: '{branch_name}',
        label: 'Branch Name',
        category: 'ORGANIZATION',
        description: 'Name of the branch',
        example: 'Engineering Branch',
    },
    {
        tag: '{group_name}',
        label: 'Group Name',
        category: 'ORGANIZATION',
        description: 'Name of the group',
        example: 'New Hires',
    },
];

// ==================== SYSTEM TAGS ====================
export const SYSTEM_TAGS: SmartTag[] = [
    {
        tag: '{site_url}',
        label: 'Site URL',
        category: 'SYSTEM',
        description: 'URL of the LMS site',
        example: 'https://example.com',
    },
    {
        tag: '{site_name}',
        label: 'Site Name',
        category: 'SYSTEM',
        description: 'Name of the LMS platform',
        example: 'Zedny LMS',
    },
    {
        tag: '{time}',
        label: 'Current Time',
        category: 'SYSTEM',
        description: 'Current timestamp when the notification is sent',
        example: '2024-12-24 13:30:00',
    },
];

// ==================== ALL TAGS ====================
export const ALL_SMART_TAGS: SmartTag[] = [
    ...USER_TAGS,
    ...COURSE_TAGS,
    ...LEARNING_PATH_TAGS,
    ...ORGANIZATION_TAGS,
    ...SYSTEM_TAGS,
];

// Helper to get tags by category
export function getTagsByCategory(category: SmartTag['category']): SmartTag[] {
    return ALL_SMART_TAGS.filter(tag => tag.category === category);
}

// Helper to get tag by tag string
export function getSmartTagByTag(tagString: string): SmartTag | undefined {
    return ALL_SMART_TAGS.find(tag => tag.tag === tagString);
}

// Helper to extract tags from text
export function extractTagsFromText(text: string): string[] {
    const tagRegex = /\{[a-z_]+\}/g;
    const matches = text.match(tagRegex);
    return matches ? Array.from(new Set(matches)) : [];
}

// Helper to validate if all tags in text are valid
export function validateTags(text: string): { valid: boolean; invalidTags: string[] } {
    const extractedTags = extractTagsFromText(text);
    const validTagStrings = ALL_SMART_TAGS.map(tag => tag.tag);
    const invalidTags = extractedTags.filter(tag => !validTagStrings.includes(tag));

    return {
        valid: invalidTags.length === 0,
        invalidTags,
    };
}
