'use client';

import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

export default function NewCoursePage() {
    return (
        <Box>
            <Typography variant="h5" fontWeight={600} gutterBottom>
                Create New Course
            </Typography>
            <Paper sx={{ p: 3, mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                    Course creation form will be implemented here. For now, this redirects to the admin course editor.
                </Typography>
            </Paper>
        </Box>
    );
}
