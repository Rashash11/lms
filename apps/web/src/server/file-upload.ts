import { NextRequest, NextResponse } from 'next/server';

/**
 * File Upload Security Module
 * 
 * Provides comprehensive file upload validation:
 * - MIME type validation
 * - File size limits
 * - Magic byte verification
 * - Filename sanitization
 * - Extension validation
 */

/**
 * Allowed MIME types by category
 */
export const ALLOWED_MIME_TYPES: Record<string, string[]> = {
    image: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
    ],
    document: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'text/csv',
    ],
    video: [
        'video/mp4',
        'video/webm',
        'video/ogg',
        'video/quicktime',
    ],
    audio: [
        'audio/mpeg',
        'audio/wav',
        'audio/ogg',
        'audio/webm',
        'audio/mp4',
    ],
    scorm: [
        'application/zip',
        'application/x-zip-compressed',
    ],
    archive: [
        'application/zip',
        'application/x-zip-compressed',
        'application/x-rar-compressed',
        'application/x-7z-compressed',
    ],
};

/**
 * File size limits by category (in bytes)
 */
export const SIZE_LIMITS: Record<string, number> = {
    image: 10 * 1024 * 1024,       // 10MB
    document: 50 * 1024 * 1024,    // 50MB
    video: 500 * 1024 * 1024,      // 500MB
    audio: 100 * 1024 * 1024,      // 100MB
    scorm: 500 * 1024 * 1024,      // 500MB
    archive: 100 * 1024 * 1024,    // 100MB
    default: 50 * 1024 * 1024,     // 50MB
};

/**
 * Magic bytes for common file types
 */
const MAGIC_BYTES: Record<string, number[][]> = {
    'image/jpeg': [[0xFF, 0xD8, 0xFF]],
    'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
    'image/gif': [[0x47, 0x49, 0x46, 0x38, 0x37, 0x61], [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]],
    'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF header
    'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
    'application/zip': [[0x50, 0x4B, 0x03, 0x04], [0x50, 0x4B, 0x05, 0x06]], // PK
    'video/mp4': [[0x00, 0x00, 0x00], [0x66, 0x74, 0x79, 0x70]], // Various MP4 signatures
    'audio/mpeg': [[0xFF, 0xFB], [0xFF, 0xFA], [0xFF, 0xF3], [0x49, 0x44, 0x33]], // MP3/ID3
};

/**
 * Dangerous file extensions that should never be allowed
 */
const DANGEROUS_EXTENSIONS = [
    '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.vbe',
    '.js', '.jse', '.ws', '.wsf', '.wsc', '.wsh', '.ps1', '.ps1xml',
    '.ps2', '.ps2xml', '.psc1', '.psc2', '.msh', '.msh1', '.msh2',
    '.mshxml', '.msh1xml', '.msh2xml', '.scf', '.lnk', '.inf', '.reg',
    '.dll', '.cpl', '.msi', '.jar', '.hta', '.msc', '.gadget', '.application',
    '.php', '.phtml', '.php3', '.php4', '.php5', '.asp', '.aspx', '.cer',
    '.csr', '.jsp', '.jspx', '.cfm', '.swf', '.htaccess', '.htpasswd',
];

/**
 * File validation result
 */
export interface FileValidationResult {
    valid: boolean;
    error?: string;
    sanitizedFilename?: string;
    detectedType?: string;
}

/**
 * Validate uploaded file
 */
export async function validateFile(
    file: File | Blob,
    category: keyof typeof ALLOWED_MIME_TYPES,
    options?: {
        maxSize?: number;
        allowedTypes?: string[];
        skipMagicBytes?: boolean;
    }
): Promise<FileValidationResult> {
    const allowedTypes = options?.allowedTypes || ALLOWED_MIME_TYPES[category] || [];
    const maxSize = options?.maxSize || SIZE_LIMITS[category] || SIZE_LIMITS.default;

    // 1. Check file size
    if (file.size > maxSize) {
        return {
            valid: false,
            error: `File size exceeds maximum of ${formatBytes(maxSize)}`,
        };
    }

    if (file.size === 0) {
        return {
            valid: false,
            error: 'File is empty',
        };
    }

    // 2. Check MIME type
    if (!allowedTypes.includes(file.type)) {
        return {
            valid: false,
            error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
        };
    }

    // 3. Verify magic bytes (if not skipped)
    if (!options?.skipMagicBytes) {
        const isValid = await validateMagicBytes(file, file.type);
        if (!isValid) {
            return {
                valid: false,
                error: 'File content does not match declared type',
            };
        }
    }

    // 4. Sanitize and validate filename (if File)
    let sanitizedFilename: string | undefined;
    if (file instanceof File) {
        const validation = validateFilename(file.name);
        if (!validation.valid) {
            return {
                valid: false,
                error: validation.error,
            };
        }
        sanitizedFilename = validation.sanitized;
    }

    return {
        valid: true,
        sanitizedFilename,
        detectedType: file.type,
    };
}

/**
 * Validate magic bytes of a file
 */
async function validateMagicBytes(file: File | Blob, mimeType: string): Promise<boolean> {
    const expectedBytes = MAGIC_BYTES[mimeType];

    // If no magic bytes defined for this type, skip validation
    if (!expectedBytes) {
        return true;
    }

    try {
        const buffer = await file.slice(0, 16).arrayBuffer();
        const bytes = new Uint8Array(buffer);

        return expectedBytes.some(expected =>
            expected.every((byte, index) => bytes[index] === byte)
        );
    } catch {
        return false;
    }
}

/**
 * Validate and sanitize filename
 */
function validateFilename(filename: string): { valid: boolean; error?: string; sanitized?: string } {
    // Check for empty filename
    if (!filename || filename.trim().length === 0) {
        return { valid: false, error: 'Filename is required' };
    }

    // Get extension
    const ext = getExtension(filename).toLowerCase();

    // Check for dangerous extensions
    if (DANGEROUS_EXTENSIONS.includes(ext)) {
        return { valid: false, error: `File extension ${ext} is not allowed` };
    }

    // Sanitize filename
    const sanitized = sanitizeFilename(filename);

    // Check length
    if (sanitized.length > 255) {
        return { valid: false, error: 'Filename is too long (max 255 characters)' };
    }

    if (sanitized.length < 1) {
        return { valid: false, error: 'Invalid filename' };
    }

    return { valid: true, sanitized };
}

/**
 * Sanitize filename for safe storage
 */
export function sanitizeFilename(filename: string): string {
    // Remove path separators
    let sanitized = filename.replace(/[\/\\]/g, '');

    // Remove null bytes and control characters
    sanitized = sanitized.replace(/[\x00-\x1f\x7f]/g, '');

    // Replace multiple spaces/dots with single
    sanitized = sanitized.replace(/\.+/g, '.').replace(/\s+/g, ' ');

    // Remove leading/trailing spaces and dots
    sanitized = sanitized.trim().replace(/^\.+|\.+$/g, '');

    // Replace potentially problematic characters
    sanitized = sanitized.replace(/[<>:"|?*]/g, '_');

    // Ensure we have a valid name
    if (!sanitized || sanitized === '.' || sanitized === '..') {
        sanitized = `file_${Date.now()}`;
    }

    return sanitized;
}

/**
 * Get file extension including the dot
 */
function getExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot === -1 || lastDot === filename.length - 1) {
        return '';
    }
    return filename.slice(lastDot);
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Generate a secure storage key for a file
 */
export function generateStorageKey(
    tenantId: string,
    category: string,
    originalFilename: string
): string {
    const ext = getExtension(originalFilename);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);

    return `${tenantId}/${category}/${timestamp}_${random}${ext}`;
}

/**
 * Parse multipart form data from request
 */
export async function parseMultipartFile(
    request: NextRequest,
    fieldName: string = 'file'
): Promise<{ file: File; fields: Record<string, string> } | null> {
    try {
        const formData = await request.formData();
        const file = formData.get(fieldName);

        if (!file || !(file instanceof File)) {
            return null;
        }

        // Extract other fields
        const fields: Record<string, string> = {};
        formData.forEach((value, key) => {
            if (typeof value === 'string') {
                fields[key] = value;
            }
        });

        return { file, fields };
    } catch {
        return null;
    }
}

/**
 * File upload error class
 */
export class FileUploadError extends Error {
    constructor(
        message: string,
        public statusCode: number = 400
    ) {
        super(message);
        this.name = 'FileUploadError';
    }
}

/**
 * Get file category from MIME type
 */
export function getFileCategory(mimeType: string): string {
    for (const [category, types] of Object.entries(ALLOWED_MIME_TYPES)) {
        if (types.includes(mimeType)) {
            return category;
        }
    }
    return 'unknown';
}
