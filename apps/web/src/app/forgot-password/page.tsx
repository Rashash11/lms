'use client';

import { useState } from 'react';
import { Box, Typography, TextField, Button, Paper, Alert, CircularProgress } from '@mui/material';
import { apiFetch, ApiFetchError } from '@shared/http/apiFetch';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await apiFetch('/api/auth/forgot-password', {
                method: 'POST',
                body: { email },
            });
            setSuccess(true);
        } catch (err) {
            setError(err instanceof ApiFetchError ? err.message : 'Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'hsl(var(--background))',
            p: 2
        }}>
            <Paper sx={{
                maxWidth: 400,
                width: '100%',
                p: 4,
                borderRadius: 3,
                bgcolor: 'rgba(13, 20, 20, 0.4)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(141, 166, 166, 0.1)'
            }}>
                <Typography variant="h5" fontWeight={700} color="hsl(180 10% 95%)" gutterBottom>
                    Forgot Password
                </Typography>

                {success ? (
                    <Box>
                        <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
                            If an account with that email exists, we've sent password reset instructions.
                        </Alert>
                        <Button
                            component="a"
                            href="/login"
                            fullWidth
                            variant="contained"
                            sx={{
                                mt: 2,
                                bgcolor: 'hsl(var(--primary))',
                                '&:hover': { bgcolor: 'hsl(var(--primary) / 0.9)' }
                            }}
                        >
                            Back to Login
                        </Button>
                    </Box>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <Typography color="hsl(180 10% 60%)" sx={{ mb: 3 }}>
                            Enter your email address and we'll send you a link to reset your password.
                        </Typography>

                        {error && (
                            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                                {error}
                            </Alert>
                        )}

                        <TextField
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            fullWidth
                            sx={{
                                mb: 3,
                                '& .MuiOutlinedInput-root': {
                                    color: 'hsl(180 10% 95%)',
                                    '& fieldset': { borderColor: 'rgba(141, 166, 166, 0.2)' },
                                    '&:hover fieldset': { borderColor: 'rgba(141, 166, 166, 0.4)' },
                                },
                                '& .MuiInputLabel-root': { color: 'hsl(180 10% 60%)' }
                            }}
                        />

                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            disabled={loading}
                            sx={{
                                mb: 2,
                                py: 1.5,
                                bgcolor: 'hsl(var(--primary))',
                                '&:hover': { bgcolor: 'hsl(var(--primary) / 0.9)' }
                            }}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Send Reset Link'}
                        </Button>

                        <Box sx={{ textAlign: 'center' }}>
                            <a href="/login" style={{ color: 'hsl(180.6 65.6% 60%)', textDecoration: 'none' }}>
                                Back to Login
                            </a>
                        </Box>
                    </form>
                )}
            </Paper>
        </Box>
    );
}
