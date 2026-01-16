'use client';

import { Box, Container, Typography, Button, Stack } from '@mui/material';
import { School, Login as LoginIcon, PersonAdd } from '@mui/icons-material';
import Link from '@shared/ui/AppLink';

export default function HomePage() {
    return (
        <Box
            sx={{
                minHeight: '100vh',
                bgcolor: 'hsl(var(--background))',
                backgroundImage: 'radial-gradient(circle at 50% 50%, hsl(var(--primary) / 0.1) 0%, transparent 50%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                py: 4,
            }}
        >
            <Container maxWidth="md">
                <Box
                    className="hero-glass-card animate-slide-up"
                    sx={{
                        p: { xs: 4, md: 8 },
                        textAlign: 'center',
                    }}
                >
                    <Box sx={{ mb: 4 }}>
                        <School
                            sx={{
                                fontSize: 80,
                                color: 'hsl(var(--accent-foreground))',
                                mb: 2,
                            }}
                        />
                        <Typography
                            variant="h1"
                            sx={{
                                fontWeight: 700,
                                className: 'gradient-text',
                                // Since MUI Typography might not handle class for gradient-text well if it's strictly enforced, we'll use SX
                                background: 'linear-gradient(135deg, hsl(180 60% 55%), hsl(29.5 80% 60%))',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                mb: 2,
                                fontSize: { xs: '2.5rem', md: '4rem' }
                            }}
                        >
                            Zedny LMS
                        </Typography>
                        <Typography
                            variant="h5"
                            sx={{
                                mb: 4,
                                fontWeight: 500,
                                color: 'hsl(var(--foreground))',
                                opacity: 0.9
                            }}
                        >
                            Premium Health Hub & Learning Management
                        </Typography>
                        <Typography
                            variant="body1"
                            sx={{ mb: 4, maxWidth: 600, mx: 'auto', color: 'hsl(var(--muted-foreground))' }}
                        >
                            Empower your organization with a state-of-the-art solution.
                            Experience glassmorphism, fluid animations, and a world-class design system.
                        </Typography>
                    </Box>

                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={2}
                        justifyContent="center"
                        sx={{ mb: 4 }}
                    >
                        <Button
                            component={Link}
                            href="/login"
                            variant="contained"
                            size="large"
                            startIcon={<LoginIcon />}
                            sx={{
                                px: 4,
                                py: 1.5,
                                fontSize: '1.1rem',
                                fontWeight: 600,
                                bgcolor: 'hsl(var(--primary))',
                                '&:hover': {
                                    bgcolor: 'hsl(var(--primary) / 0.9)',
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 0 20px hsl(var(--primary) / 0.4)',
                                },
                                transition: 'all 0.3s ease',
                            }}
                        >
                            Login
                        </Button>
                        <Button
                            component={Link}
                            href="/signup"
                            variant="outlined"
                            size="large"
                            startIcon={<PersonAdd />}
                            sx={{
                                px: 4,
                                py: 1.5,
                                fontSize: '1.1rem',
                                fontWeight: 600,
                                borderColor: 'hsl(var(--border))',
                                color: 'hsl(var(--foreground))',
                                backdropFilter: 'blur(5px)',
                                '&:hover': {
                                    borderColor: 'hsl(var(--primary))',
                                    bgcolor: 'hsl(var(--accent))',
                                    transform: 'translateY(-2px)',
                                },
                                transition: 'all 0.3s ease',
                            }}
                        >
                            Sign Up
                        </Button>
                    </Stack>

                    <Box
                        sx={{
                            pt: 4,
                            borderTop: '1px solid',
                            borderColor: 'hsl(var(--border))',
                        }}
                    >
                        <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))' }}>
                            🏥 Medical Hub • 🎓 Courses • 📊 Analytics • 📜 Certificates
                        </Typography>
                    </Box>
                </Box>
            </Container>
        </Box>
    );
}
