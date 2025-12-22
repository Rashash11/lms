'use client';

import React from 'react';
import { Box, Typography, Paper, Card, CardContent, CardMedia, CardActions, Button, LinearProgress, Chip, Avatar, AvatarGroup } from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import SchoolIcon from '@mui/icons-material/School';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CardMembershipIcon from '@mui/icons-material/CardMembership';

const stats = [
    { label: 'Enrolled Courses', value: '5', icon: <SchoolIcon />, color: 'primary' },
    { label: 'Completed', value: '3', icon: <CheckCircleIcon />, color: 'success' },
    { label: 'In Progress', value: '2', icon: <AccessTimeIcon />, color: 'warning' },
    { label: 'Certificates', value: '2', icon: <CardMembershipIcon />, color: 'info' },
];

const myCourses = [
    { id: 1, title: 'Advanced JavaScript', instructor: 'Dr. Jane Smith', progress: 78, image: 'https://via.placeholder.com/300x150/3f51b5/ffffff?text=JavaScript' },
    { id: 2, title: 'React Fundamentals', instructor: 'Prof. Bob Johnson', progress: 45, image: 'https://via.placeholder.com/300x150/00bcd4/ffffff?text=React' },
    { id: 3, title: 'Node.js Backend', instructor: 'Dr. Jane Smith', progress: 100, image: 'https://via.placeholder.com/300x150/4caf50/ffffff?text=Node.js' },
    { id: 4, title: 'Python Basics', instructor: 'Alice Brown', progress: 100, image: 'https://via.placeholder.com/300x150/ff9800/ffffff?text=Python' },
];

const upcomingILT = [
    { title: 'JavaScript Workshop', date: 'Dec 20, 2024', time: '10:00 AM', instructor: 'Dr. Jane Smith' },
    { title: 'React Q&A Session', date: 'Dec 22, 2024', time: '2:00 PM', instructor: 'Prof. Bob Johnson' },
];

const recentAchievements = [
    { name: 'Quick Learner', description: 'Completed first course', icon: '🎓' },
    { name: 'Code Master', description: 'Scored 90%+ on coding test', icon: '💻' },
];

export default function LearnerDashboard() {
    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={700}>Welcome back, John!</Typography>
                <Typography variant="body2" color="text.secondary">Continue your learning journey. You're making great progress!</Typography>
            </Box>

            {/* Stats */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {stats.map((stat) => (
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
                {myCourses.filter(c => c.progress < 100).map((course) => (
                    <Grid item xs={12} sm={6} md={4} key={course.id}>
                        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ height: 120, bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Typography variant="h5" color="white">{course.title.split(' ')[0]}</Typography>
                            </Box>
                            <CardContent sx={{ flex: 1 }}>
                                <Typography variant="h6" gutterBottom>{course.title}</Typography>
                                <Typography variant="body2" color="text.secondary" gutterBottom>by {course.instructor}</Typography>
                                <Box sx={{ mt: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Typography variant="caption">Progress</Typography>
                                        <Typography variant="caption" fontWeight={600}>{course.progress}%</Typography>
                                    </Box>
                                    <LinearProgress variant="determinate" value={course.progress} sx={{ height: 8, borderRadius: 4 }} />
                                </Box>
                            </CardContent>
                            <CardActions sx={{ p: 2, pt: 0 }}>
                                <Button variant="contained" fullWidth startIcon={<PlayArrowIcon />}>Continue</Button>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
                <Grid item xs={12} sm={6} md={4}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100', minHeight: 280 }}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>Discover More</Typography>
                        <Button variant="outlined">Browse Catalog</Button>
                    </Card>
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                {/* Upcoming ILT */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Upcoming Sessions</Typography>
                            {upcomingILT.map((session, i) => (
                                <Box key={i} sx={{ py: 2, borderBottom: i < upcomingILT.length - 1 ? 1 : 0, borderColor: 'divider' }}>
                                    <Typography fontWeight={500}>{session.title}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {session.date} at {session.time}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">by {session.instructor}</Typography>
                                    <Box sx={{ mt: 1 }}>
                                        <Button size="small" variant="outlined">Add to Calendar</Button>
                                    </Box>
                                </Box>
                            ))}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Achievements */}
                <Grid item xs={12} md={6}>
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
