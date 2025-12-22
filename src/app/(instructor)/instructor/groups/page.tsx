'use client';

import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

export default function GroupsPage() {
    return (
        <Box>
            <Typography variant="h5" fontWeight={600} gutterBottom>
                Groups
            </Typography>
            <Paper sx={{ p: 3, mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                    Instructor-managed groups will be displayed here.
                </Typography>
            </Paper>
        </Box>
    );
}
