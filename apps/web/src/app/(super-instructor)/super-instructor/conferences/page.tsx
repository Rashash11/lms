'use client';

import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Button, TextField, InputAdornment, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Chip, CircularProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import Link from '@shared/ui/AppLink';

interface Conference {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    duration: number;
    meetingUrl: string | null;
    participants?: any[];
}

export default function SuperInstructorConferencesPage() {
    const [conferences, setConferences] = useState<Conference[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchConferences();
    }, []);

    const fetchConferences = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/conferences');
            if (res.ok) {
                const data = await res.json();
                const list = Array.isArray(data) ? data : (data.data || data.conferences || []);
                setConferences(Array.isArray(list) ? list : []);
            }
        } catch {
            setConferences([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box className="animate-fade-in" sx={{ p: { xs: 2, md: 3 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                    <Box sx={{
                        p: 1.5,
                        borderRadius: 3,
                        bgcolor: 'hsl(var(--primary) / 0.1)',
                        color: 'hsl(var(--primary))',
                        display: 'flex',
                        boxShadow: '0 0 20px hsl(var(--primary) / 0.15)'
                    }}>
                        <VideoCallIcon sx={{ fontSize: 32 }} />
                    </Box>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: 'hsl(var(--foreground))', letterSpacing: '-0.02em' }}>Conferences</Typography>
                        <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))' }}>Schedule and manage your live virtual sessions</Typography>
                    </Box>
                </Box>
                <Button
                    component={Link}
                    href="/super-instructor/conferences/new"
                    variant="contained"
                    startIcon={<AddIcon />}
                    sx={{
                        bgcolor: 'hsl(var(--primary))',
                        color: 'white',
                        px: 3,
                        py: 1.2,
                        borderRadius: 2.5,
                        fontWeight: 700,
                        boxShadow: '0 8px 16px hsl(var(--primary) / 0.25)',
                        '&:hover': {
                            bgcolor: 'hsl(var(--primary))',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 12px 20px hsl(var(--primary) / 0.35)',
                        },
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                >
                    Schedule Conference
                </Button>
            </Box>

            <Box className="glass-card" sx={{ p: 2, mb: 3, display: 'flex', gap: 2 }}>
                <TextField
                    placeholder="Search sessions by title..."
                    size="small"
                    fullWidth
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: 'hsl(var(--primary))', mr: 1 }} />
                            </InputAdornment>
                        ),
                    }}
                    sx={{
                        maxWidth: 500,
                        '& .MuiOutlinedInput-root': {
                            bgcolor: 'rgba(141, 166, 166, 0.05)',
                            borderRadius: 2.5,
                            '& fieldset': { borderColor: 'rgba(141, 166, 166, 0.1)' },
                            '&:hover fieldset': { borderColor: 'rgba(141, 166, 166, 0.2)' },
                            '&.Mui-focused fieldset': { borderColor: 'hsl(var(--primary) / 0.5)' },
                        }
                    }}
                />
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                    <CircularProgress />
                </Box>
            ) : conferences.length === 0 ? (
                <Box className="glass-card" sx={{ p: 8, textAlign: 'center', borderRadius: 4 }}>
                    <VideoCallIcon sx={{ fontSize: 48, color: 'hsl(var(--muted-foreground))', opacity: 0.5, mb: 2 }} />
                    <Typography sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 500 }}>No virtual sessions scheduled at the moment</Typography>
                </Box>
            ) : (
                <TableContainer className="glass-card" sx={{ borderRadius: 4, overflow: 'hidden' }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'rgba(141, 166, 166, 0.05)' }}>
                                <TableCell sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Title</TableCell>
                                <TableCell sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Scheduled</TableCell>
                                <TableCell sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Duration</TableCell>
                                <TableCell sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Access</TableCell>
                                <TableCell sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</TableCell>
                                <TableCell align="right" sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {conferences.map((conf) => (
                                <TableRow key={conf.id} sx={{ '&:hover': { bgcolor: 'rgba(141, 166, 166, 0.03)' } }}>
                                    <TableCell>
                                        <Typography sx={{ fontWeight: 700, color: 'hsl(var(--foreground))', fontSize: 14 }}>{conf.title}</Typography>
                                    </TableCell>
                                    <TableCell sx={{ color: 'hsl(var(--foreground))', fontSize: 13, fontWeight: 500 }}>
                                        {new Date(conf.startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                    </TableCell>
                                    <TableCell sx={{ color: 'hsl(var(--muted-foreground))', fontSize: 13, fontWeight: 500 }}>{conf.duration} min</TableCell>
                                    <TableCell sx={{ color: 'hsl(var(--foreground))', fontSize: 13, fontWeight: 600 }}>{conf.participants?.length ?? 0} users</TableCell>
                                    <TableCell>
                                        <Chip
                                            label="SCHEDULED"
                                            size="small"
                                            sx={{
                                                bgcolor: 'rgba(124, 58, 237, 0.1)',
                                                color: '#A78BFA',
                                                fontWeight: 800,
                                                fontSize: 10,
                                                borderRadius: 1.5,
                                                border: '1px solid rgba(124, 58, 237, 0.1)'
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Button
                                            size="small"
                                            variant="contained"
                                            sx={{
                                                bgcolor: 'hsl(var(--primary))',
                                                borderRadius: 2,
                                                fontWeight: 700,
                                                px: 2,
                                                boxShadow: '0 4px 12px hsl(var(--primary) / 0.2)',
                                                '&:hover': { bgcolor: 'hsl(var(--primary))', boxShadow: '0 6px 16px hsl(var(--primary) / 0.3)' }
                                            }}
                                        >
                                            Join Now
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
}
