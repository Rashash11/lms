'use client';

import * as React from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import {
    Box,
    Button,
    Container,
    TextField,
    Typography,
    Link,
    Alert,
    InputAdornment,
    IconButton
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { authenticate } from './actions';

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={pending}
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
            {pending ? 'Logging in...' : 'Log in'}
        </Button>
    );
}

export default function LoginPage() {
    const [state, dispatch] = useFormState(authenticate, undefined);
    const [showPassword, setShowPassword] = React.useState(false);

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

                    {state?.error && (
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
                            {state.error}
                        </Alert>
                    )}

                    <Box component="form" action={dispatch} sx={{ width: '100%' }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="username"
                            label="Username or Email"
                            name="username"
                            autoComplete="username"
                            autoFocus
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
                            <Link href="#" variant="body2" sx={{ textDecoration: 'none', fontWeight: 500, color: 'hsl(var(--primary))' }}>
                                Forgot password?
                            </Link>
                        </Box>

                        <SubmitButton />

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
