'use client';

import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Button, TextField, InputAdornment, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, IconButton, Menu, MenuItem,
    Chip, CircularProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import RouteIcon from '@mui/icons-material/Route';
import Link from 'next/link';

interface LearningPath {
    id: string;
    name: string;
    code: string;
    description: string;
    status: string;
    createdAt: string;
    courseCount?: number;
}

export default function SuperInstructorLearningPathsPage() {
    const [paths, setPaths] = useState<LearningPath[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);

    useEffect(() => {
        fetchPaths();
    }, []);

    const fetchPaths = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/learning-paths');
            if (res.ok) {
                const data = await res.json();
                setPaths(Array.isArray(data) ? data : []);
            } else {
                console.error('Failed to fetch learning paths:', res.status);
                setPaths([]);
            }
        } catch (err) {
            console.error('Error fetching learning paths:', err);
            setPaths([]);
        } finally {
            setLoading(false);
        }
    };

    const filtered = paths.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.code && p.code.toLowerCase().includes(search.toLowerCase()))
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PUBLISHED': return 'success';
            case 'DRAFT': return 'warning';
            default: return 'default';
        }
    };

    return (
        <Box className="animate-fade-in" sx={{ p: { xs: 2, md: 3 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                    <Box sx={{
                        p: 1.5,
                        borderRadius: 3,
                        bgcolor: 'rgba(5, 150, 105, 0.1)',
                        color: '#10B981',
                        display: 'flex',
                        boxShadow: '0 0 20px rgba(5, 150, 105, 0.15)'
                    }}>
                        <RouteIcon sx={{ fontSize: 32 }} />
                    </Box>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: 'hsl(var(--foreground))', letterSpacing: '-0.02em' }}>Learning Paths</Typography>
                        <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))' }}>Structure your curriculum and progressive training</Typography>
                    </Box>
                </Box>
                <Button
                    component={Link}
                    href="/super-instructor/learning-paths/new"
                    variant="contained"
                    startIcon={<AddIcon />}
                    sx={{
                        bgcolor: '#059669',
                        color: 'white',
                        px: 3,
                        py: 1.2,
                        borderRadius: 2.5,
                        fontWeight: 700,
                        boxShadow: '0 8px 16px rgba(5, 150, 105, 0.25)',
                        '&:hover': {
                            bgcolor: '#10B981',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 12px 20px rgba(5, 150, 105, 0.35)',
                        },
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                >
                    Create Path
                </Button>
            </Box>

            <Box className="glass-card" sx={{ p: 2, mb: 3, display: 'flex', gap: 2 }}>
                <TextField
                    placeholder="Search learning paths by name or code..."
                    size="small"
                    fullWidth
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: '#059669', mr: 1 }} />
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
                            '&.Mui-focused fieldset': { borderColor: 'rgba(5, 150, 105, 0.5)' },
                        }
                    }}
                />
            </Box>

            <TableContainer className="glass-card" sx={{ borderRadius: 4, overflow: 'hidden' }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'rgba(141, 166, 166, 0.05)' }}>
                            <TableCell sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Name</TableCell>
                            <TableCell sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Code</TableCell>
                            <TableCell sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Courses</TableCell>
                            <TableCell sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</TableCell>
                            <TableCell sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Created</TableCell>
                            <TableCell align="right" sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                                    No learning paths found
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((path) => (
                                <TableRow key={path.id} sx={{ '&:hover': { bgcolor: 'rgba(141, 166, 166, 0.03)' } }}>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'hsl(var(--foreground))' }}>{path.name}</Typography>
                                        {path.description && (
                                            <Typography variant="caption" noWrap sx={{ color: 'hsl(var(--muted-foreground))', maxWidth: 300, display: 'block', fontWeight: 500 }}>
                                                {path.description}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell sx={{ color: 'hsl(var(--foreground))', fontSize: 13, fontWeight: 500 }}>{path.code || '-'}</TableCell>
                                    <TableCell sx={{ color: 'hsl(var(--foreground))', fontSize: 13, fontWeight: 600 }}>{path.courseCount || 0}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={path.status}
                                            size="small"
                                            sx={{
                                                bgcolor: path.status === 'PUBLISHED' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(141, 166, 166, 0.08)',
                                                color: path.status === 'PUBLISHED' ? '#4ADE80' : 'hsl(var(--muted-foreground))',
                                                fontWeight: 800,
                                                fontSize: 10,
                                                borderRadius: 1.5,
                                                border: '1px solid rgba(34, 197, 94, 0.1)'
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ color: 'hsl(var(--muted-foreground))', fontSize: 13, fontWeight: 500 }}>{new Date(path.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell align="right">
                                        <IconButton onClick={(e) => {
                                            setAnchorEl(e.currentTarget);
                                            setSelectedPath(path);
                                        }} sx={{ color: 'hsl(var(--muted-foreground))', '&:hover': { color: '#10B981' } }}>
                                            <MoreVertIcon sx={{ fontSize: 20 }} />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                PaperProps={{
                    sx: {
                        bgcolor: 'rgba(13, 20, 20, 0.95)',
                        backdropFilter: 'blur(16px)',
                        border: '1px solid rgba(141, 166, 166, 0.1)',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                        borderRadius: 3,
                        mt: 1
                    }
                }}
            >
                <MenuItem
                    component={Link}
                    href={`/super-instructor/learning-paths/${selectedPath?.id}/edit`}
                    onClick={() => setAnchorEl(null)}
                    sx={{ fontSize: 13, py: 1, px: 2, fontWeight: 500 }}
                >
                    Edit
                </MenuItem>
                <MenuItem onClick={() => setAnchorEl(null)} sx={{ fontSize: 13, py: 1, px: 2, fontWeight: 600, color: 'hsl(0 72% 51%)' }}>Delete</MenuItem>
            </Menu>
        </Box>
    );
}
