'use client';

import React, { useEffect, useState } from 'react';
import {
    Box, Typography, Paper, Card, CardContent, Button,
    LinearProgress, Chip, CircularProgress, CardActions
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import SchoolIcon from '@mui/icons-material/School';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import LayoutIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import { useRouter } from 'next/navigation';

export default function LearnerDashboard() {
    const [loading, setLoading] = useState(true);
    const [enrollments, setEnrollments] = useState<any[]>([]);
    const [upcomingAssignments, setUpcomingAssignments] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [enrollRes, assignRes, userRes] = await Promise.all([
                    fetch('/api/learner/enrollments'),
                    fetch('/api/assignments'),
                    fetch('/api/me')
                ]);

                if (enrollRes.ok) {
                    const enrollData = await enrollRes.json();
                    setEnrollments(enrollData);

                    // Calculate stats from enrollments
                    const completed = enrollData.filter((e: any) => e.status === 'COMPLETED').length;
                    const inProgress = enrollData.filter((e: any) => e.status === 'IN_PROGRESS' || e.status === 'NOT_STARTED').length;
                    setStats({
                        total: enrollData.length,
                        completed,
                        inProgress
                    });
                }

                if (assignRes.ok) {
                    const assignments = await assignRes.json();
                    setUpcomingAssignments(assignments.slice(0, 5));
                }

                if (userRes.ok) {
                    const userData = await userRes.json();
                    setUser(userData.user);
                }
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    const statCards = [
        { label: 'Enrolled Courses', value: stats?.total || 0, icon: <SchoolIcon />, color: 'primary' },
        { label: 'Completed', value: stats?.completed || 0, icon: <CheckCircleIcon />, color: 'success' },
        { label: 'In Progress', value: stats?.inProgress || 0, icon: <AccessTimeIcon />, color: 'warning' },
        { label: 'Upcoming Assignments', value: upcomingAssignments.length, icon: <LayoutIcon />, color: 'info' },
    ];

    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={700}>Welcome back, {user?.firstName || 'Learner'}!</Typography>
                <Typography variant="body2" color="text.secondary">Continue your learning journey. You're making great progress!</Typography>
            </Box>

            {/* Stats */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {statCards.map((stat) => (
                    <Grid item xs={6} md={3} key={stat.label}>
                        <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${stat.color}.lighter`, color: `${stat.color}.main` }}>
                                {stat.icon}
                            </Box>
                            <Box>
                                <Typography variant="h5" fontWeight={700}>{stat.value}</Typography>
                                <Typography variant="body2" color="text.secondary">{stat.label}</Typography>
                            </Box>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {/* Continue Learning */}
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Continue Learning</Typography>
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {enrollments.filter(e => e.status !== 'COMPLETED').map((enrollment) => (
                    <Grid item xs={12} sm={6} md={4} key={enrollment.id}>
                        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ height: 120, bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                {enrollment.course.thumbnail_url ? (
                                    <Box component="img" src={enrollment.course.thumbnail_url} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <Typography variant="h5" color="white">{enrollment.course.title.split(' ')[0]}</Typography>
                                )}
                            </Box>
                            <CardContent sx={{ flex: 1 }}>
                                <Typography variant="h6" gutterBottom>
                                    {enrollment.course?.title || 'Untitled Course'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    {enrollment.course?.description?.slice(0, 100)}{enrollment.course?.description?.length > 100 ? '...' : ''}
                                </Typography>

                                <Box sx={{ mt: 2, mb: 1 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Progress: {enrollment.stats?.completedUnits || 0} / {enrollment.stats?.totalUnits || 0} units ({enrollment.stats?.percent || 0}%)
                                    </Typography>
                                    <LinearProgress
                                        variant="determinate"
                                        value={enrollment.stats?.percent || 0}
                                        sx={{ mt: 0.5 }}
                                    />
                                </Box>

                                <Box sx={{ mt: 1 }}>
                                    <Chip
                                        label={enrollment.status || 'NOT_STARTED'}
                                        size="small"
                                        color={
                                            enrollment.status === 'COMPLETED' ? 'success' :
                                                enrollment.status === 'IN_PROGRESS' ? 'primary' :
                                                    'default'
                                        }
                                    />
                                    {enrollment.resumeState?.lastAccessedAt && (
                                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                            Last active: {new Date(enrollment.resumeState.lastAccessedAt).toLocaleDateString()}
                                        </Typography>
                                    )}
                                </Box>
                            </CardContent>
                            <CardActions>
                                <Button
                                    variant="contained"
                                    startIcon={<PlayArrowIcon />}
                                    onClick={() => {
                                        if (enrollment.resumeState?.lastUnitId) {
                                            router.push(`/learner/courses/${enrollment.courseId}/units/${enrollment.resumeState.lastUnitId}`);
                                        } else {
                                            // Navigate to first unit (will need to fetch units or use a default route)
                                            router.push(`/learner/courses/${enrollment.courseId}`);
                                        }
                                    }}
                                >
                                    {enrollment.resumeState?.lastUnitId ? 'Continue' : 'Start'}
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}

                {enrollments.filter(e => e.status !== 'COMPLETED').length === 0 && (
                    <Grid item xs={12}>
                        <Box sx={{ py: 8, textAlign: 'center', bgcolor: 'background.paper', borderRadius: 4, border: '1px dashed', borderColor: 'divider' }}>
                            <SchoolIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                            <Typography variant="h6" color="text.primary">No active courses</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Explore our course catalog to start your learning journey.
                            </Typography>
                            <Button
                                variant="contained"
                                onClick={() => router.push('/learner/catalog')}
                            >
                                Browse Catalog
                            </Button>
                        </Box>
                    </Grid>
                )}
            </Grid>

            <Grid container spacing={3}>
                {/* Upcoming Assignments */}
                <Grid item xs={12} md={8}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6">Upcoming Assignments</Typography>
                                <Button size="small" onClick={() => router.push('/learner/assignments')}>View All</Button>
                            </Box>
                            {upcomingAssignments.length > 0 ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {upcomingAssignments.map((assignment) => (
                                        <Paper key={assignment.id} sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'background.default' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <AssignmentIcon color="primary" />
                                                <Box>
                                                    <Typography variant="subtitle2" fontWeight={600}>{assignment.title}</Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {assignment.course?.title || 'General Assignment'} • Due: {assignment.dueAt ? new Date(assignment.dueAt).toLocaleDateString() : 'No date'}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            <Button size="small" variant="outlined" onClick={() => router.push(`/learner/assignments/${assignment.id}`)}>
                                                Submit
                                            </Button>
                                        </Paper>
                                    ))}
                                </Box>
                            ) : (
                                <Box sx={{ textAlign: 'center', py: 4, bgcolor: 'background.default', borderRadius: 2 }}>
                                    <AssignmentIcon sx={{ fontSize: 48, color: 'text.disabled', opacity: 0.5 }} />
                                    <Typography color="text.secondary" sx={{ mt: 1 }}>No upcoming assignments</Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Achievements */}
                <Grid item xs={12} md={4}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6">Achievements</Typography>
                                <Chip label="Coming Soon" size="small" />
                            </Box>
                            <Box sx={{ textAlign: 'center', py: 4, bgcolor: 'background.default', borderRadius: 2 }}>
                                <EmojiEventsIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
                                <Typography color="text.secondary" sx={{ mt: 1 }}>Disabled</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}
