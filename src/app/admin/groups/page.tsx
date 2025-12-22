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
                <Typography variant="h4" fontWeight="bold">Groups</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddGroup}>
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
                <Grid item xs={4}>
                    <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ p: 1, borderRadius: 1, bgcolor: 'primary.lighter', color: 'primary.main' }}>
                            <GroupsIcon />
                        </Box>
                        <Box>
                            <Typography variant="h5" fontWeight={700}>{stats.totalGroups}</Typography>
                            <Typography variant="caption" color="text.secondary">Total Groups</Typography>
                        </Box>
                    </Paper>
                </Grid>
                <Grid item xs={4}>
                    <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ p: 1, borderRadius: 1, bgcolor: 'success.lighter', color: 'success.main' }}>
                            <PeopleIcon />
                        </Box>
                        <Box>
                            <Typography variant="h5" fontWeight={700}>{stats.totalMembers}</Typography>
                            <Typography variant="caption" color="text.secondary">Total Members</Typography>
                        </Box>
                    </Paper>
                </Grid>
                <Grid item xs={4}>
                    <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ p: 1, borderRadius: 1, bgcolor: 'info.lighter', color: 'info.main' }}>
                            <SchoolIcon />
                        </Box>
                        <Box>
                            <Typography variant="h5" fontWeight={700}>{stats.totalCourses}</Typography>
                            <Typography variant="caption" color="text.secondary">Assigned Courses</Typography>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* Search */}
            <Paper sx={{ p: 2, mb: 2 }}>
                <TextField
                    size="small"
                    placeholder="Search groups..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
                    sx={{ width: 300 }}
                />
            </Paper>

            {/* Grid */}
            <Grid container spacing={3}>
                {filteredGroups.map((group) => (
                    <Grid item xs={12} sm={6} md={4} key={group.id}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="h6" fontWeight={600}>{group.name}</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {group.description || 'No description'}
                                        </Typography>
                                    </Box>
                                    <IconButton size="small">
                                        <MoreVertIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                                <Grid container spacing={2} sx={{ mb: 2 }}>
                                    <Grid item xs={6}>
                                        <Typography variant="caption" color="text.secondary">Members</Typography>
                                        <Typography variant="h6" fontWeight={600}>{group.memberCount}</Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="caption" color="text.secondary">Courses</Typography>
                                        <Typography variant="h6" fontWeight={600}>{group.courseCount}</Typography>
                                    </Grid>
                                </Grid>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button size="small" variant="outlined" fullWidth>Members</Button>
                                    <Button size="small" variant="outlined" fullWidth>Courses</Button>
                                    <IconButton size="small"><EditIcon fontSize="small" /></IconButton>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}
