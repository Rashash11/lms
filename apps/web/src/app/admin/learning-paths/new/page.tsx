'use client';

import React, { useState } from 'react';
import {
    Box, Typography, IconButton, Chip, TextField, Button, Paper, Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { useRouter } from 'next/navigation';
import { getCsrfToken } from '@/lib/client-csrf';

export default function NewLearningPathPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [description, setDescription] = useState('');

    const createLearningPath = async () => {
        const trimmedName = name.trim();
        if (!trimmedName) {
            setError('Name is required');
            return null;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/learning-paths', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': getCsrfToken(),
                },
                body: JSON.stringify({
                    name: trimmedName,
                    code: code.trim() || undefined,
                    description: description.trim() || undefined,
                    isSequential: false,
                }),
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                setError(errorData.error || errorData.message || 'Failed to create learning path');
                return null;
            }
            const created = await res.json();
            return (created?.id as string) || null;
        } catch (err) {
            console.error(err);
            setError('Failed to create learning path');
            return null;
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAndOpenAddCourse = async () => {
        const id = await createLearningPath();
        if (!id) return;
        router.push(`/admin/learning-paths/${id}/edit?addCourse=1`);
    };

    const handleCreateAndOpenDrawer = async (drawer: 'users' | 'settings') => {
        const id = await createLearningPath();
        if (!id) return;
        router.push(`/admin/learning-paths/${id}/edit?drawer=${drawer}`);
    };

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header Section */}
            <Box
                className="hero-glass-card"
                sx={{
                    py: 4,
                    px: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minHeight: 200,
                    m: 2,
                    borderRadius: 2,
                    border: '1px solid rgba(141, 166, 166, 0.2)',
                    background: 'rgba(13, 20, 20, 0.4)',
                }}
            >
                {/* Left Side: Back button and Title */}
                <Box sx={{ flex: 1 }}>
                    <IconButton
                        onClick={() => router.push('/admin/learning-paths')}
                        sx={{
                            color: 'hsl(var(--foreground))',
                            mb: 2,
                            border: '1px solid rgba(141, 166, 166, 0.2)',
                            '&:hover': { bgcolor: 'rgba(141, 166, 166, 0.1)' }
                        }}
                    >
                        <ArrowBackIcon />
                    </IconButton>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="h4" fontWeight={600}>
                            New learning path
                        </Typography>
                        <Chip
                            label="Inactive"
                            sx={{
                                bgcolor: 'rgba(141, 166, 166, 0.1)',
                                color: 'hsl(var(--muted-foreground))',
                                fontWeight: 600,
                                borderRadius: 1,
                                border: '1px solid rgba(141, 166, 166, 0.2)'
                            }}
                        />
                    </Box>
                </Box>

                {/* Right Side: Illustration */}
                <Box
                    sx={{
                        width: 280,
                        height: 180,
                        bgcolor: 'rgba(13, 20, 20, 0.4)',
                        border: '1px solid rgba(141, 166, 166, 0.1)',
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    {/* Abstract illustration placeholder */}
                    <Box
                        sx={{
                            position: 'relative',
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {/* Left primary circle */}
                        <Box
                            sx={{
                                position: 'absolute',
                                left: '25%',
                                width: 80,
                                height: 80,
                                borderRadius: '50%',
                                bgcolor: 'hsl(var(--primary))',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 2,
                                border: '1px solid rgba(141, 166, 166, 0.3)',
                                boxShadow: '0 0 20px hsl(var(--primary) / 0.3)'
                            }}
                        >
                            <AddIcon sx={{ color: 'hsl(var(--primary-foreground))', fontSize: 32 }} />
                        </Box>

                        {/* Center secondary shape */}
                        <Box
                            sx={{
                                position: 'absolute',
                                width: 60,
                                height: 100,
                                bgcolor: 'hsl(var(--secondary))',
                                transform: 'rotate(15deg)',
                                borderRadius: 2,
                                zIndex: 1,
                                opacity: 0.8,
                                boxShadow: '0 0 20px hsl(var(--secondary) / 0.2)'
                            }}
                        />

                        {/* Right primary circle */}
                        <Box
                            sx={{
                                position: 'absolute',
                                right: '25%',
                                width: 80,
                                height: 80,
                                borderRadius: '50%',
                                bgcolor: 'hsl(var(--primary))',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 2,
                                border: '1px solid rgba(141, 166, 166, 0.3)',
                                boxShadow: '0 0 20px hsl(var(--primary) / 0.3)'
                            }}
                        >
                            <SettingsOutlinedIcon sx={{ color: 'hsl(var(--primary-foreground))', fontSize: 28 }} />
                        </Box>
                    </Box>
                </Box>
            </Box>

            {/* Main Content */}
            <Box sx={{ flex: 1, py: 4, px: 4 }}>
                <Box sx={{ maxWidth: 900, mx: 'auto' }}>
                    {error ? <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert> : null}

                    <Paper className="glass-card" sx={{ p: 3, mb: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="Name"
                            fullWidth
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={loading}
                        />
                        <TextField
                            label="Code (optional)"
                            fullWidth
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            disabled={loading}
                            helperText="Letters, numbers, and hyphens only"
                        />
                    </Paper>

                    {/* Description Section */}
                    <Paper className="glass-card" sx={{ p: 3, mb: 3 }}>
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            placeholder="Add a learning path description up to 5000 characters"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            variant="outlined"
                            inputProps={{ maxLength: 5000 }}
                            disabled={loading}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    '& fieldset': {
                                        border: 'none',
                                    },
                                },
                            }}
                        />
                    </Paper>

                    {/* Add Course Section */}
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            size="large"
                            sx={{ mb: 2 }}
                            onClick={handleCreateAndOpenAddCourse}
                            disabled={loading}
                        >
                            {loading ? 'Creating…' : 'Add course'}
                        </Button>
                        <Typography variant="body2" color="text.secondary">
                            Add course here to build your learning path.
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* Bottom Action Bar */}
            <Paper
                elevation={3}
                className="glass-card"
                sx={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    py: 2,
                    px: 4,
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 3,
                    borderTop: '1px solid rgba(141, 166, 166, 0.1)',
                    bgcolor: 'rgba(13, 20, 20, 0.9)',
                    backdropFilter: 'blur(20px)',
                    zIndex: 1000,
                    borderRadius: '24px 24px 0 0',
                    boxShadow: '0 -10px 40px rgba(0,0,0,0.5)'
                }}
            >
                <IconButton
                    onClick={() => handleCreateAndOpenDrawer('users')}
                    disabled={loading}
                    sx={{
                        color: 'hsl(var(--muted-foreground))',
                        border: '1px solid rgba(141, 166, 166, 0.1)',
                        '&:hover': { bgcolor: 'rgba(141, 166, 166, 0.1)', color: 'hsl(var(--primary))' }
                    }}
                >
                    <PeopleOutlineIcon />
                </IconButton>
                <IconButton
                    onClick={() => handleCreateAndOpenDrawer('settings')}
                    disabled={loading}
                    sx={{
                        color: 'hsl(var(--muted-foreground))',
                        border: '1px solid rgba(141, 166, 166, 0.1)',
                        '&:hover': { bgcolor: 'rgba(141, 166, 166, 0.1)', color: 'hsl(var(--primary))' }
                    }}
                >
                    <SettingsOutlinedIcon />
                </IconButton>
            </Paper>
        </Box>
    );
}
