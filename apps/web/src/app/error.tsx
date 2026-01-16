'use client';

import { Box, Button, Container, Typography, Paper } from '@mui/material';
import { Error as ErrorIcon, Refresh } from '@mui/icons-material';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
        >
            <Container maxWidth="sm">
                <Paper
                    elevation={24}
                    sx={{
                        p: 6,
                        borderRadius: 4,
                        textAlign: 'center',
                    }}
                >
                    <ErrorIcon
                        sx={{
                            fontSize: 80,
                            color: 'error.main',
                            mb: 2,
                        }}
                    />
                    <Typography variant="h4" gutterBottom fontWeight={700}>
                        Oops! Something went wrong
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                        {error.message || 'An unexpected error occurred'}
                    </Typography>
                    <Button
                        variant="contained"
                        size="large"
                        startIcon={<Refresh />}
                        onClick={reset}
                        sx={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                            },
                        }}
                    >
                        Try Again
                    </Button>
                </Paper>
            </Container>
        </Box>
    );
}
