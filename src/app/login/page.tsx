'use client';

import * as React from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import {
    Box,
    Button,
    Card,
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
                boxShadow: 'none',
                '&:hover': {
                    boxShadow: 'none',
                    bgcolor: 'primary.dark',
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
                bgcolor: '#f4f6f8',
                p: 2,
            }}
        >
            <Container maxWidth="xs">
                <Card
                    elevation={0}
                    sx={{
                        p: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid #e0e0e0',
                        boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
                    }}
                >
                    <Box sx={{ mb: 4, textAlign: 'center' }}>
                        <Typography variant="h4" component="h1" fontWeight="700" color="primary" sx={{ mb: 1 }}>
                            TalentLMS
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Welcome back! Please login to your account.
                        </Typography>
                    </Box>

                    {state?.error && (
                        <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
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
                            InputProps={{
                                sx: { borderRadius: 1.5 }
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
                            InputProps={{
                                sx: { borderRadius: 1.5 },
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                            <Link href="#" variant="body2" sx={{ textDecoration: 'none', fontWeight: 500 }}>
                                Forgot password?
                            </Link>
                        </Box>

                        <SubmitButton />

                        <Box sx={{ mt: 2, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                Don't have an account?{' '}
                                <Link href="/signup" underline="hover" sx={{ fontWeight: 600 }}>
                                    Sign up
                                </Link>
                            </Typography>
                        </Box>
                    </Box>
                </Card>
                <Box sx={{ mt: 4, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                        &copy; 2025 TalentLMS Clone. All rights reserved.
                    </Typography>
                </Box>
            </Container>
        </Box>
    );
}
