'use client';

import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

export default function LearningPathsPage() {
    return (
        <Box>
            <Typography variant="h5" fontWeight={600} gutterBottom>
                Learning Paths
            </Typography>
            <Paper sx={{ p: 3, mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                    Instructor-specific learning paths will be displayed here.
                </Typography>
            </Paper>
        </Box>
    );
}
