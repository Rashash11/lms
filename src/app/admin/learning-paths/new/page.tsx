'use client';

import React, { useState } from 'react';
import {
    Box, Typography, IconButton, Chip, TextField, Button, Paper,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { useRouter } from 'next/navigation';

export default function NewLearningPathPage() {
    const router = useRouter();
    const [description, setDescription] = useState('');

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header Section - Dark Blue */}
            <Box
                sx={{
                    bgcolor: '#1565c0',
                    color: 'white',
                    py: 4,
                    px: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minHeight: 200,
                }}
            >
                {/* Left Side: Back button and Title */}
                <Box sx={{ flex: 1 }}>
                    <IconButton
                        onClick={() => router.push('/admin/learning-paths')}
                        sx={{
                            color: 'white',
                            mb: 2,
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
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
                                bgcolor: 'rgba(255,255,255,0.2)',
                                color: 'white',
                                fontWeight: 500,
                                borderRadius: 1,
                            }}
                        />
                    </Box>
                </Box>

                {/* Right Side: Illustration */}
                <Box
                    sx={{
                        width: 280,
                        height: 180,
                        bgcolor: 'rgba(255,255,255,0.15)',
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
                        {/* Left blue circle */}
                        <Box
                            sx={{
                                position: 'absolute',
                                left: '25%',
                                width: 80,
                                height: 80,
                                borderRadius: '50%',
                                bgcolor: '#1976d2',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 2,
                            }}
                        >
                            <AddIcon sx={{ color: 'white', fontSize: 32 }} />
                        </Box>

                        {/* Center orange/brown shape */}
                        <Box
                            sx={{
                                position: 'absolute',
                                width: 60,
                                height: 100,
                                bgcolor: '#d84315',
                                transform: 'rotate(15deg)',
                                borderRadius: 2,
                                zIndex: 1,
                            }}
                        />

                        {/* Right blue circle */}
                        <Box
                            sx={{
                                position: 'absolute',
                                right: '25%',
                                width: 80,
                                height: 80,
                                borderRadius: '50%',
                                bgcolor: '#1976d2',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 2,
                            }}
                        >
                            <SettingsOutlinedIcon sx={{ color: 'white', fontSize: 28 }} />
                        </Box>
                    </Box>
                </Box>
            </Box>

            {/* Main Content */}
            <Box sx={{ flex: 1, bgcolor: '#f5f5f5', py: 4, px: 4 }}>
                <Box sx={{ maxWidth: 900, mx: 'auto' }}>
                    {/* Description Section */}
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            placeholder="Add a learning path description up to 5000 characters"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            variant="outlined"
                            inputProps={{ maxLength: 5000 }}
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
                        >
                            Add course
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
                    bgcolor: 'white',
                    borderTop: '1px solid #e0e0e0',
                    zIndex: 1000,
                }}
            >
                <IconButton
                    sx={{
                        color: 'text.secondary',
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
                    }}
                >
                    <PeopleOutlineIcon />
                </IconButton>
                <IconButton
                    sx={{
                        color: 'text.secondary',
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
                    }}
                >
                    <SettingsOutlinedIcon />
                </IconButton>
            </Paper>
        </Box>
    );
}
