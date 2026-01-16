'use client';

import React from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress, Typography } from '@mui/material';

// Instructor learning path creation - redirect to admin version for now
// Instructors use the admin learning path editor with restricted permissions
export default function InstructorLearningPathsNewPage() {
    const router = useRouter();

    useEffect(() => {
        // For now, redirect to admin learning paths creation
        // TODO: Create instructor-specific learning path editor
        router.replace('/admin/learning-paths/new');
    }, [router]);

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '50vh',
            gap: 2
        }}>
            <CircularProgress color="primary" />
            <Typography color="text.secondary">
                Redirecting to learning path editor...
            </Typography>
        </Box>
    );
}
