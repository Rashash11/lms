'use client';

import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

export default function CalendarPage() {
    return (
        <Box>
            <Typography variant="h5" fontWeight={600} gutterBottom>
                Calendar
            </Typography>
            <Paper sx={{ p: 3, mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                    Calendar events and instructor schedule will be displayed here.
                </Typography>
            </Paper>
        </Box>
    );
}
