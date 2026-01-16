'use client';

import React from 'react';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import LockPersonIcon from '@mui/icons-material/LockPerson';
import { useRouter } from 'next/navigation';
import Link from '@shared/ui/AppLink';

export default function ForbiddenPage() {
    const router = useRouter();

    return (
        <Container maxWidth="sm">
            <Box
                sx={{
                    mt: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                }}
            >
                <Paper
                    elevation={0}
                    sx={{
                        p: 5,
                        borderRadius: 4,
                        bgcolor: 'rgba(255, 0, 0, 0.03)',
                        border: '1px solid rgba(255, 0, 0, 0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <LockPersonIcon sx={{ fontSize: 80, color: 'error.main', mb: 2, opacity: 0.8 }} />
                    <Typography variant="h3" fontWeight={700} gutterBottom color="error.main">
                        403
                    </Typography>
                    <Typography variant="h5" fontWeight={600} gutterBottom>
                        Forbidden Access
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                        You don't have the necessary permissions to access this page.
                        Please contact your administrator if you believe this is an error.
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            variant="outlined"
                            onClick={() => router.back()}
                            sx={{ borderRadius: 2, px: 4 }}
                        >
                            Go Back
                        </Button>
                        <Button
                            component={Link}
                            href="/admin"
                            variant="contained"
                            sx={{ borderRadius: 2, px: 4 }}
                        >
                            Go Home
                        </Button>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
}
