import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

interface SectionCardProps {
    title: string;
    children: React.ReactNode;
}

export default function SectionCard({ title, children }: SectionCardProps) {
    return (
        <Paper
            sx={{
                mb: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                overflow: 'hidden'
            }}
        >
            <Box
                sx={{
                    bgcolor: 'grey.50',
                    px: 3,
                    py: 1.5,
                    borderBottom: '1px solid',
                    borderColor: 'divider'
                }}
            >
                <Typography
                    variant="caption"
                    sx={{
                        fontWeight: 700,
                        letterSpacing: '0.5px',
                        color: 'text.secondary'
                    }}
                >
                    {title}
                </Typography>
            </Box>
            <Box>
                {children}
            </Box>
        </Paper>
    );
}
