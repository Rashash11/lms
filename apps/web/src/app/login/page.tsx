'use client';

import * as React from 'react';
import {
    Box,
    Button,
    Container,
    TextField,
    Typography,
    Link,
    Alert,
    InputAdornment,
    IconButton,
    CircularProgress
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { apiFetch, ApiFetchError } from '@shared/http/apiFetch';

import { LoginResponse, RoleKey } from '@/lib/auth-definitions';

function getRedirectPath(activeRole: RoleKey): string {
    switch (activeRole) {
        case 'ADMIN':
            return '/admin';
        case 'SUPER_INSTRUCTOR':
            return '/super-instructor';
        case 'INSTRUCTOR':
            return '/instructor';
        case 'LEARNER':
            return '/learner';
        default:
            console.error('Unknown role:', activeRole);
            return '/learner';
    }
}

export default function LoginPage() {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [showPassword, setShowPassword] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);

    const login = async (nextEmail: string, nextPassword: string) => {
        setError(null);
        setIsLoading(true);

        try {
            const data = await apiFetch<LoginResponse>('/api/auth/login', {
                method: 'POST',
                body: { email: nextEmail, password: nextPassword },
                credentials: 'include',
            });
            if (!data.ok) {
                setError(data.message || data.error || 'Login failed');
                setIsLoading(false);
                return;
            }

            // Redirect based on role with full page reload
            // This ensures all permissions and RBAC data are freshly loaded
            const redirectPath = getRedirectPath(data.activeRole);
            window.location.assign(redirectPath);

        } catch (err) {
            console.error('Login error:', err);
            setError(err instanceof ApiFetchError ? err.message : 'An error occurred during login');
            setIsLoading(false);
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await login(email, password);
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'hsl(var(--background))',
                backgroundImage: 'radial-gradient(circle at 10% 10%, hsl(var(--primary) / 0.05) 0%, transparent 40%), radial-gradient(circle at 90% 90%, hsl(var(--secondary) / 0.05) 0%, transparent 40%)',
                p: 2,
            }}
        >
            <Container maxWidth="xs">
                <Box
                    className="glass-card animate-fade-in"
                    sx={{
                        p: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Box sx={{ mb: 4, textAlign: 'center' }}>
                        <Typography
                            variant="h4"
                            component="h1"
                            sx={{
                                fontWeight: 700,
                                background: 'linear-gradient(135deg, hsl(180 60% 55%), hsl(29.5 80% 60%))',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                mb: 1
                            }}
                        >
                            Zedny LMS
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))' }}>
                            Welcome back! Please login to your account.
                        </Typography>
                    </Box>

                    {error && (
                        <Alert
                            severity="error"
                            sx={{
                                width: '100%',
                                mb: 2,
                                bgcolor: 'hsl(0 72% 51% / 0.1)',
                                color: 'hsl(0 72% 51%)',
                                border: '1px solid hsl(0 72% 51% / 0.2)'
                            }}
                        >
                            {error}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="email"
                            label="Email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            autoFocus
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    bgcolor: 'hsl(var(--input))',
                                    color: 'hsl(var(--foreground))',
                                    '& fieldset': { borderColor: 'hsl(var(--border))' },
                                    '&:hover fieldset': { borderColor: 'hsl(var(--primary))' },
                                },
                                '& .MuiInputLabel-root': { color: 'hsl(var(--muted-foreground))' },
                            }}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            id="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    bgcolor: 'hsl(var(--input))',
                                    color: 'hsl(var(--foreground))',
                                    '& fieldset': { borderColor: 'hsl(var(--border))' },
                                    '&:hover fieldset': { borderColor: 'hsl(var(--primary))' },
                                },
                                '& .MuiInputLabel-root': { color: 'hsl(var(--muted-foreground))' },
                            }}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                            sx={{ color: 'hsl(var(--muted-foreground))' }}
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                            <Link href="/forgot-password" variant="body2" sx={{ textDecoration: 'none', fontWeight: 500, color: 'hsl(var(--primary))' }}>
                                Forgot password?
                            </Link>
                        </Box>

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            disabled={isLoading}
                            sx={{
                                mt: 3,
                                mb: 2,
                                height: 48,
                                fontSize: '1rem',
                                textTransform: 'none',
                                bgcolor: 'hsl(var(--primary))',
                                '&:hover': {
                                    bgcolor: 'hsl(var(--primary) / 0.9)',
                                }
                            }}
                        >
                            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Log in'}
                        </Button>

                        {process.env.NODE_ENV !== 'production' && (
                            <Box sx={{
                                mt: 2,
                                p: 2,
                                borderRadius: 2,
                                border: '1px solid hsl(var(--border) / 0.3)',
                                bgcolor: 'hsl(var(--card) / 0.25)',
                            }}>
                                <Typography variant="caption" sx={{ display: 'block', mb: 1, color: 'hsl(var(--muted-foreground))' }}>
                                    Dev quick login
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        disabled={isLoading}
                                        onClick={() => {
                                            setEmail('admin-a@test.local');
                                            setPassword('TestPass123!');
                                        }}
                                    >
                                        Admin
                                    </Button>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        disabled={isLoading}
                                        onClick={() => {
                                            setEmail('super-instructor-a@test.local');
                                            setPassword('TestPass123!');
                                        }}
                                    >
                                        Super instructor
                                    </Button>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        disabled={isLoading}
                                        onClick={() => {
                                            setEmail('instructor-a@test.local');
                                            setPassword('TestPass123!');
                                        }}
                                    >
                                        Instructor
                                    </Button>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        disabled={isLoading}
                                        onClick={() => {
                                            setEmail('learner-a@test.local');
                                            setPassword('TestPass123!');
                                        }}
                                    >
                                        Learner
                                    </Button>
                                </Box>
                                <Button
                                    size="small"
                                    variant="contained"
                                    disabled={isLoading}
                                    onClick={() => login('admin-a@test.local', 'TestPass123!')}
                                    sx={{ mt: 1.5, textTransform: 'none' }}
                                >
                                    Login as Admin
                                </Button>
                            </Box>
                        )}

                        <Box sx={{ mt: 2, textAlign: 'center' }}>
                            <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))' }}>
                                Don't have an account?{' '}
                                <Link href="/signup" underline="hover" sx={{ fontWeight: 600, color: 'hsl(var(--secondary))' }}>
                                    Sign up
                                </Link>
                            </Typography>
                        </Box>
                    </Box>
                </Box>
                <Box sx={{ mt: 4, textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: 'hsl(var(--muted-foreground))' }}>
                        &copy; 2025 Zedny LMS. All rights reserved.
                    </Typography>
                </Box>
            </Container>
        </Box>
    );
}
