'use client';

import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

export default function GradingHubPage() {
    return (
        <Box>
            <Typography variant="h5" fontWeight={600} gutterBottom>
                Grading Hub
            </Typography>
            <Paper sx={{ p: 3, mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                    Pending assignments and tests to grade will be displayed here.
                </Typography>
            </Paper>
        </Box>
    );
}
