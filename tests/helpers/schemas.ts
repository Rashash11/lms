import { z } from 'zod';

export const courseSchema = z.object({
    id: z.string(),
    title: z.string().optional(),
}).passthrough();

export const coursesListSchema = z.object({
    courses: z.array(courseSchema).optional(),
    data: z.array(courseSchema).optional(),
}).passthrough();

export const learnerProgressSchema = z.object({
    courseId: z.string(),
    completedUnitIds: z.array(z.string()).optional(),
    percent: z.number().optional(),
}).passthrough();

