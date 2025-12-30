'use client';

import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, TextField, InputAdornment, Card, CardContent,
    Chip, Paper, IconButton, CircularProgress, Alert,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import GroupsIcon from '@mui/icons-material/Groups';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useRouter } from 'next/navigation';
import GroupsEmptyState from '@/components/admin/groups/GroupsEmptyState';

interface Group {
    id: string;
    name: string;
    description: string | null;
    memberCount: number;
    courseCount: number;
    createdAt: string;
}

export default function GroupsPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [stats, setStats] = useState({
        totalGroups: 0,
        totalMembers: 0,
        totalCourses: 0,
    });

    const fetchGroups = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/groups');
            if (res.ok) {
                const data = await res.json();
                setGroups(data.groups || []);

                // Calculate stats
                const totalMembers = data.groups.reduce((sum: number, g: Group) => sum + g.memberCount, 0);
                const totalCourses = data.groups.reduce((sum: number, g: Group) => sum + g.courseCount, 0);
                setStats({
                    totalGroups: data.groups.length,
                    totalMembers,
                    totalCourses,
                });
            } else {
                setError('Failed to fetch groups');
            }
        } catch (err) {
            setError('Failed to fetch groups');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    const filteredGroups = groups.filter(group =>
        group.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleAddGroup = () => {
        router.push('/admin/groups/new');
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!loading && groups.length === 0) {
        return <GroupsEmptyState />;
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'hsl(var(--foreground))' }}>Groups</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddGroup}
                    sx={{
                        textTransform: 'none',
                        fontWeight: 700,
                        bgcolor: 'hsl(var(--primary))',
                        color: 'hsl(var(--primary-foreground))',
                        borderRadius: '6px',
                        '&:hover': { bgcolor: 'hsl(var(--primary) / 0.9)' }
                    }}
                >
                    Create Group
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {/* Stats */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                    <Paper className="glass-card" sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'rgba(13, 20, 20, 0.4)', border: '1px solid rgba(141, 166, 166, 0.1)' }}>
                        <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: 'rgba(26, 84, 85, 0.1)', color: 'hsl(var(--primary))' }}>
                            <GroupsIcon />
                        </Box>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, color: 'hsl(var(--foreground))' }}>{stats.totalGroups}</Typography>
                            <Typography variant="caption" sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 600 }}>Total Groups</Typography>
                        </Box>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Paper className="glass-card" sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'rgba(13, 20, 20, 0.4)', border: '1px solid rgba(141, 166, 166, 0.1)' }}>
                        <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: 'rgba(76, 175, 80, 0.1)', color: '#4caf50' }}>
                            <PeopleIcon />
                        </Box>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, color: 'hsl(var(--foreground))' }}>{stats.totalMembers}</Typography>
                            <Typography variant="caption" sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 600 }}>Total Members</Typography>
                        </Box>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Paper className="glass-card" sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'rgba(13, 20, 20, 0.4)', border: '1px solid rgba(141, 166, 166, 0.1)' }}>
                        <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: 'rgba(3, 169, 244, 0.1)', color: '#03a9f4' }}>
                            <SchoolIcon />
                        </Box>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, color: 'hsl(var(--foreground))' }}>{stats.totalCourses}</Typography>
                            <Typography variant="caption" sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 600 }}>Assigned Courses</Typography>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* Search */}
            <Paper className="glass-card" sx={{ p: 2, mb: 2, bgcolor: 'rgba(13, 20, 20, 0.4)', border: '1px solid rgba(141, 166, 166, 0.1)' }}>
                <TextField
                    size="small"
                    placeholder="Search groups..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: 'hsl(var(--muted-foreground))' }} />
                            </InputAdornment>
                        )
                    }}
                    sx={{ width: 300 }}
                />
            </Paper>

            {/* Grid */}
            <Grid container spacing={3}>
                {filteredGroups.map((group) => (
                    <Grid item xs={12} sm={6} md={4} key={group.id}>
                        <Card
                            className="glass-card"
                            sx={{
                                bgcolor: 'rgba(13, 20, 20, 0.4)',
                                border: '1px solid rgba(141, 166, 166, 0.1)',
                                transition: 'transform 0.2s',
                                '&:hover': { transform: 'translateY(-4px)', bgcolor: 'rgba(13, 20, 20, 0.6)' }
                            }}
                        >
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="h6" sx={{ fontWeight: 700, color: 'hsl(var(--foreground))' }}>{group.name}</Typography>
                                        <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))' }}>
                                            {group.description || 'No description'}
                                        </Typography>
                                    </Box>
                                    <IconButton size="small" sx={{ color: 'hsl(var(--muted-foreground))' }}>
                                        <MoreVertIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                                <Grid container spacing={2} sx={{ mb: 2 }}>
                                    <Grid item xs={6}>
                                        <Typography variant="caption" sx={{ color: 'hsl(var(--muted-foreground))', display: 'block' }}>Members</Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 700, color: 'hsl(var(--foreground))' }}>{group.memberCount}</Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="caption" sx={{ color: 'hsl(var(--muted-foreground))', display: 'block' }}>Courses</Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 700, color: 'hsl(var(--foreground))' }}>{group.courseCount}</Typography>
                                    </Grid>
                                </Grid>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        fullWidth
                                        sx={{
                                            textTransform: 'none',
                                            fontWeight: 600,
                                            borderColor: 'rgba(141, 166, 166, 0.2)',
                                            color: 'hsl(var(--foreground))',
                                            '&:hover': { borderColor: 'hsl(var(--primary))', bgcolor: 'rgba(26, 84, 85, 0.05)' }
                                        }}
                                    >
                                        Members
                                    </Button>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        fullWidth
                                        sx={{
                                            textTransform: 'none',
                                            fontWeight: 600,
                                            borderColor: 'rgba(141, 166, 166, 0.2)',
                                            color: 'hsl(var(--foreground))',
                                            '&:hover': { borderColor: 'hsl(var(--primary))', bgcolor: 'rgba(26, 84, 85, 0.05)' }
                                        }}
                                    >
                                        Courses
                                    </Button>
                                    <IconButton size="small" sx={{ color: 'hsl(var(--muted-foreground))' }}>
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}
