'use client';

import { Box, Button, Container, Typography, Paper } from '@mui/material';
import { SearchOff, Home } from '@mui/icons-material';
import Link from '@shared/ui/AppLink';

export default function NotFound() {
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
                    <SearchOff
                        sx={{
                            fontSize: 80,
                            color: 'primary.main',
                            mb: 2,
                        }}
                    />
                    <Typography variant="h1" gutterBottom fontWeight={700} color="primary">
                        404
                    </Typography>
                    <Typography variant="h5" gutterBottom fontWeight={600}>
                        Page Not Found
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                        Sorry, we couldn't find the page you're looking for.
                    </Typography>
                    <Button
                        component={Link}
                        href="/"
                        variant="contained"
                        size="large"
                        startIcon={<Home />}
                        sx={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                            },
                        }}
                    >
                        Go Home
                    </Button>
                </Paper>
            </Container>
        </Box>
    );
}
