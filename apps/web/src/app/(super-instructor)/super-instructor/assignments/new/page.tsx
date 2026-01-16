'use client';

import React from 'react';
import { Box, Button } from '@mui/material';
import AssignmentForm from '@modules/assignments/ui/AssignmentForm';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRouter } from 'next/navigation';

export default function SuperInstructorNewAssignmentPage() {
    const router = useRouter();

    return (
        <Box sx={{ p: 3 }}>
            <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => router.back()}
                sx={{ mb: 2 }}
            >
                Back to Assignments
            </Button>

            <AssignmentForm
                role="SUPER_INSTRUCTOR"
                onSuccess={() => router.push('/super-instructor/assignments')}
            />
        </Box>
    );
}
