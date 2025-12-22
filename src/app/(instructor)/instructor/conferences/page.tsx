'use client';

import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

export default function ConferencesPage() {
    return (
        <Box>
            <Typography variant="h5" fontWeight={600} gutterBottom>
                Conferences
            </Typography>
            <Paper sx={{ p: 3, mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                    ILT sessions and conferences will be displayed here.
                </Typography>
            </Paper>
        </Box>
    );
}
