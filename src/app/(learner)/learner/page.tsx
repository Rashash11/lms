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
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import { useRouter } from 'next/navigation';

export default function LearnerDashboard() {
    const [loading, setLoading] = useState(true);
    const [enrollments, setEnrollments] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [enrollRes, userRes] = await Promise.all([
                    fetch('/api/enrollments?limit=10'),
                    fetch('/api/me')
                ]);

                if (enrollRes.ok) {
                    const data = await enrollRes.json();
                    setEnrollments(data.enrollments);
                    setStats(data.stats);
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
        { label: 'Certificates', value: '0', icon: <CardMembershipIcon />, color: 'info' },
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
                                <Typography variant="h6" gutterBottom>{enrollment.course.title}</Typography>
                                <Box sx={{ mt: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Typography variant="caption">Status</Typography>
                                        <Typography variant="caption" fontWeight={600}>{enrollment.status.replace('_', ' ')}</Typography>
                                    </Box>
                                    <LinearProgress
                                        variant="determinate"
                                        value={enrollment.status === 'COMPLETED' ? 100 : (enrollment.status === 'IN_PROGRESS' ? 50 : 0)}
                                        sx={{ height: 8, borderRadius: 4 }}
                                    />
                                </Box>
                            </CardContent>
                            <CardActions sx={{ p: 2, pt: 0, mt: 'auto' }}>
                                <Button
                                    variant="contained"
                                    fullWidth
                                    startIcon={<PlayArrowIcon />}
                                    onClick={() => router.push(`/learner/courses/${enrollment.courseId}`)}
                                >
                                    Continue
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}

                {enrollments.filter(e => e.status !== 'COMPLETED').length === 0 && (
                    <Grid item xs={12}>
                        <Box sx={{ py: 8, textAlign: 'center', bgcolor: '#f7fafc', borderRadius: 4, border: '2px dashed #edf2f7' }}>
                            <SchoolIcon sx={{ fontSize: 48, color: '#a0aec0', mb: 2 }} />
                            <Typography variant="h6" color="#4a5568">No active courses</Typography>
                            <Typography variant="body2" color="#718096" sx={{ mb: 3 }}>
                                Explore our course catalog to start your learning journey.
                            </Typography>
                            <Button
                                variant="contained"
                                onClick={() => router.push('/learner/catalog')}
                                sx={{ bgcolor: '#3182ce' }}
                            >
                                Browse Catalog
                            </Button>
                        </Box>
                    </Grid>
                )}
            </Grid>

            <Grid container spacing={3}>
                {/* Achievements */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6">Recent Achievements</Typography>
                                <Chip label="Coming Soon" size="small" />
                            </Box>
                            <Box sx={{ textAlign: 'center', py: 4, bgcolor: 'grey.100', borderRadius: 2 }}>
                                <EmojiEventsIcon sx={{ fontSize: 48, color: 'grey.400' }} />
                                <Typography color="text.secondary" sx={{ mt: 1 }}>Gamification feature is disabled</Typography>
                                <Typography variant="caption" color="text.secondary">Contact your admin to enable</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}
