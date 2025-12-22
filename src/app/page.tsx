'use client';

import { Box, Container, Typography, Button, Paper, Stack } from '@mui/material';
import { School, Login as LoginIcon, PersonAdd } from '@mui/icons-material';
import Link from 'next/link';

export default function HomePage() {
    return (
        <Box
            sx={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                py: 4,
            }}
        >
            <Container maxWidth="md">
                <Paper
                    elevation={24}
                    sx={{
                        p: { xs: 4, md: 8 },
                        borderRadius: 4,
                        textAlign: 'center',
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(10px)',
                    }}
                >
                    <Box sx={{ mb: 4 }}>
                        <School
                            sx={{
                                fontSize: 80,
                                color: 'primary.main',
                                mb: 2,
                            }}
                        />
                        <Typography
                            variant="h2"
                            component="h1"
                            gutterBottom
                            sx={{
                                fontWeight: 700,
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                backgroundClip: 'text',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                mb: 2,
                            }}
                        >
                            TalentLMS Clone
                        </Typography>
                        <Typography
                            variant="h5"
                            color="text.secondary"
                            sx={{
                                mb: 4,
                                fontWeight: 400,
                            }}
                        >
                            Full-featured Learning Management System
                        </Typography>
                        <Typography
                            variant="body1"
                            color="text.secondary"
                            sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}
                        >
                            Empower your organization with a comprehensive LMS solution.
                            Create courses, manage users, track progress, and deliver exceptional learning experiences.
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
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                                    transform: 'translateY(-2px)',
                                    boxShadow: 6,
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
                                borderWidth: 2,
                                borderColor: 'primary.main',
                                color: 'primary.main',
                                '&:hover': {
                                    borderWidth: 2,
                                    borderColor: 'primary.dark',
                                    backgroundColor: 'primary.50',
                                    transform: 'translateY(-2px)',
                                    boxShadow: 4,
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
                            borderColor: 'divider',
                        }}
                    >
                        <Typography variant="body2" color="text.secondary">
                            🎓 Courses • 📊 Analytics • 🏆 Gamification • 💬 Discussions • 📜 Certificates
                        </Typography>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
}
