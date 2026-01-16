'use client';

import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function SectionPage() {
    const params = useParams();
    const router = useRouter();
    const section = params.section as string;

    // Format section name for display
    const formatSectionName = (slug: string) => {
        return slug
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    return (
        <Box sx={{ maxWidth: 1200, margin: '0 auto', pt: 3, pb: 6 }}>
            <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => router.back()}
                sx={{
                    mb: 3,
                    color: '#1E6FE6',
                    '&:hover': {
                        backgroundColor: 'rgba(30, 111, 230, 0.04)',
                    },
                }}
            >
                Back to Course store
            </Button>

            <Typography
                variant="h4"
                sx={{
                    fontSize: 28,
                    fontWeight: 700,
                    color: '#111827',
                    letterSpacing: '-0.2px',
                    mb: 2,
                }}
            >
                {formatSectionName(section)}
            </Typography>

            <Typography sx={{ fontSize: 16, color: '#6B7280', mb: 4 }}>
                Full catalog view coming soon...
            </Typography>

            <Box
                sx={{
                    p: 6,
                    backgroundColor: '#F6F7F9',
                    borderRadius: 2,
                    textAlign: 'center',
                }}
            >
                <Typography sx={{ fontSize: 16, color: '#374151' }}>
                    This page will display the complete catalog of courses in the{' '}
                    <strong>{formatSectionName(section)}</strong> section.
                </Typography>
            </Box>
        </Box>
    );
}
