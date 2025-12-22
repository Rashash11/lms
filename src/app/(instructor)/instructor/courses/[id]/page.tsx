'use client';

import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { useParams } from 'next/navigation';

export default function CourseDetailPage() {
    const params = useParams();
    const courseId = params.id as string;

    return (
        <Box>
            <Typography variant="h5" fontWeight={600} gutterBottom>
                Course Details
            </Typography>
            <Paper sx={{ p: 3, mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                    Course detail page for course ID: {courseId}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Full course editor will be implemented here.
                </Typography>
            </Paper>
        </Box>
    );
}
