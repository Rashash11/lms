'use client';

import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import { useRouter } from 'next/navigation';

export default function GroupsEmptyState() {
    const router = useRouter();

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 8,
                px: 3,
            }}
        >
            <Box
                sx={{
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    bgcolor: '#f5f5f5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 3,
                }}
            >
                <GroupsIcon sx={{ fontSize: 60, color: '#999' }} />
            </Box>

            <Typography variant="h5" fontWeight={600} sx={{ mb: 1, color: '#1a2b4a' }}>
                There are no groups yet!
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 3, textAlign: 'center', maxWidth: 500 }}>
                Groups allow you to assign sets of courses to several users at once.
            </Typography>

            <Button
                variant="contained"
                onClick={() => router.push('/admin/groups/new')}
                sx={{
                    textTransform: 'none',
                    px: 4,
                    bgcolor: '#1976d2',
                    '&:hover': { bgcolor: '#1565c0' },
                }}
            >
                Create Group
            </Button>
        </Box>
    );
}
