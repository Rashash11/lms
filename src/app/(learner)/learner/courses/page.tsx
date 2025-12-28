'use client';

import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Card, CardContent, CardActions, Button, LinearProgress,
    Chip, TextField, InputAdornment, Tabs, Tab, Paper, CircularProgress
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import SearchIcon from '@mui/icons-material/Search';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SchoolIcon from '@mui/icons-material/School';
import { useRouter } from 'next/navigation';

export default function MyCoursesPage() {
    const [loading, setLoading] = useState(true);
    const [enrollments, setEnrollments] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();

    const fetchEnrollments = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/enrollments?status=${filter}&search=${searchQuery}`);
            if (res.ok) {
                const data = await res.json();
                setEnrollments(data.enrollments);
                setStats(data.stats);
            }
        } catch (error) {
            console.error('Error fetching enrollments:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchEnrollments();
        }, 300); // Debounce search
        return () => clearTimeout(timer);
    }, [filter, searchQuery]);

    return (
        <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>My Courses</Typography>

            {/* Stats */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                    { label: 'Total Enrolled', value: stats?.total || 0, color: 'primary', icon: <SchoolIcon /> },
                    { label: 'In Progress', value: stats?.inProgress || 0, color: 'warning', icon: <AccessTimeIcon /> },
                    { label: 'Completed', value: stats?.completed || 0, color: 'success', icon: <CheckCircleIcon /> },
                ].map((stat) => (
                    <Grid item xs={4} key={stat.label}>
                        <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ p: 1, borderRadius: 1, bgcolor: `${stat.color}.lighter`, color: `${stat.color}.main` }}>
                                {stat.icon}
                            </Box>
                            <Box>
                                <Typography variant="h5" fontWeight={700}>{stat.value}</Typography>
                                <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
                            </Box>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <TextField
                        size="small" placeholder="Search courses..."
                        value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
                        sx={{ width: 300 }}
                    />
                    <Tabs value={filter} onChange={(_, v) => setFilter(v)}>
                        <Tab label="All" value="all" />
                        <Tab label="In Progress" value="in_progress" />
                        <Tab label="Completed" value="completed" />
                        <Tab label="Not Started" value="not_started" />
                    </Tabs>
                </Box>
            </Paper>

            {/* Courses Grid */}
            {loading && enrollments.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <Grid container spacing={3}>
                    {enrollments.map((enrollment) => (
                        <Grid item xs={12} sm={6} md={4} key={enrollment.id}>
                            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <Box sx={{
                                    height: 100,
                                    bgcolor: enrollment.status === 'COMPLETED' ? 'success.main' : enrollment.status === 'IN_PROGRESS' ? 'primary.main' : 'grey.400',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    position: 'relative'
                                }}>
                                    {enrollment.status === 'COMPLETED' && <CheckCircleIcon sx={{ fontSize: 48, color: 'white' }} />}
                                    {enrollment.status === 'IN_PROGRESS' && <Typography variant="h4" color="white">?</Typography>}
                                    {enrollment.status === 'NOT_STARTED' && <SchoolIcon sx={{ fontSize: 48, color: 'white' }} />}
                                </Box>
                                <CardContent sx={{ flex: 1 }}>
                                    <Typography variant="h6" gutterBottom>{enrollment.course.title}</Typography>
                                    <Chip label={enrollment.status.replace('_', ' ')} size="small" variant="outlined" sx={{ mb: 2 }} />

                                    <Box sx={{ mb: 2 }}>
                                        <LinearProgress
                                            variant="determinate"
                                            value={enrollment.status === 'COMPLETED' ? 100 : (enrollment.status === 'IN_PROGRESS' ? 50 : 0)}
                                            sx={{ height: 8, borderRadius: 4 }}
                                            color={enrollment.status === 'COMPLETED' ? 'success' : 'primary'}
                                        />
                                    </Box>

                                    <Typography variant="caption" color="text.secondary">Course Code: {enrollment.course.code}</Typography>
                                </CardContent>
                                <CardActions sx={{ p: 2, pt: 0 }}>
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        startIcon={enrollment.status === 'COMPLETED' ? <CheckCircleIcon /> : <PlayArrowIcon />}
                                        color={enrollment.status === 'COMPLETED' ? 'success' : 'primary'}
                                        onClick={() => router.push(`/learner/courses/${enrollment.courseId}`)}
                                    >
                                        {enrollment.status === 'COMPLETED' ? 'Review' : enrollment.status === 'IN_PROGRESS' ? 'Continue' : 'Start'}
                                    </Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}

                    {enrollments.length === 0 && !loading && (
                        <Grid item xs={12}>
                            <Box sx={{ py: 8, textAlign: 'center' }}>
                                <Typography variant="h6" color="text.secondary">No courses found matching your criteria</Typography>
                            </Box>
                        </Grid>
                    )}
                </Grid>
            )}
        </Box>
    );
}
