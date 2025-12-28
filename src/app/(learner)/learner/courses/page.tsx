'use client';

import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Card, CardContent, CardActions, Button, LinearProgress,
    Chip, TextField, InputAdornment, Tabs, Tab, Paper, CircularProgress,
    Dialog, DialogTitle, DialogContent, DialogActions
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
    const [selectedCourse, setSelectedCourse] = useState<any>(null);
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
                            <Card sx={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                position: 'relative',
                                overflow: 'hidden',
                                '&:hover .description-overlay': {
                                    opacity: 1,
                                    transform: 'translateY(0)',
                                }
                            }}>
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

                                {/* Hover Overlay */}
                                <Box
                                    className="description-overlay"
                                    sx={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        bgcolor: 'rgba(0, 0, 0, 0.85)',
                                        color: 'white',
                                        p: 3,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        opacity: 0,
                                        transform: 'translateY(100%)',
                                        transition: 'all 0.3s ease-in-out',
                                        zIndex: 2,
                                    }}
                                >
                                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ color: 'white' }}>
                                        Description
                                    </Typography>
                                    <Typography variant="body2" sx={{
                                        overflow: 'hidden',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 5,
                                        WebkitBoxOrient: 'vertical',
                                        color: 'rgba(255,255,255,0.9)',
                                        lineHeight: 1.6,
                                        mb: 1
                                    }}>
                                        {enrollment.course.description || 'No description available for this course.'}
                                    </Typography>
                                    {enrollment.course.description && enrollment.course.description.length > 200 && (
                                        <Button
                                            size="small"
                                            variant="text"
                                            sx={{ color: '#64b5f6', alignSelf: 'flex-start', p: 0, textTransform: 'none' }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedCourse(enrollment.course);
                                            }}
                                        >
                                            Show more...
                                        </Button>
                                    )}
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
                                <CardActions sx={{ p: 2, pt: 0, zIndex: 3 }}>
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

            {/* Description Dialog */}
            <Dialog
                open={Boolean(selectedCourse)}
                onClose={() => setSelectedCourse(null)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" fontWeight="bold">{selectedCourse?.title}</Typography>
                </DialogTitle>
                <DialogContent dividers>
                    <Typography variant="subtitle2" color="primary" gutterBottom>Course Description</Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                        {selectedCourse?.description}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSelectedCourse(null)} color="primary">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
