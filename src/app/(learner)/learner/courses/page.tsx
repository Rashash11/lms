'use client';

import React, { useState } from 'react';
import {
    Box, Typography, Card, CardContent, CardActions, Button, LinearProgress,
    Chip, TextField, InputAdornment, FormControl, InputLabel, Select, MenuItem,
    Tabs, Tab, Paper, IconButton,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import SearchIcon from '@mui/icons-material/Search';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SchoolIcon from '@mui/icons-material/School';
import FilterListIcon from '@mui/icons-material/FilterList';

interface Course {
    id: string;
    title: string;
    instructor: string;
    progress: number;
    status: 'in_progress' | 'completed' | 'not_started';
    lastAccessed: string;
    totalUnits: number;
    completedUnits: number;
    category: string;
}

const myCourses: Course[] = [
    { id: '1', title: 'Advanced JavaScript', instructor: 'Dr. Jane Smith', progress: 78, status: 'in_progress', lastAccessed: '2 hours ago', totalUnits: 12, completedUnits: 9, category: 'Programming' },
    { id: '2', title: 'React Fundamentals', instructor: 'Prof. Bob Johnson', progress: 45, status: 'in_progress', lastAccessed: '1 day ago', totalUnits: 10, completedUnits: 4, category: 'Frontend' },
    { id: '3', title: 'Node.js Backend', instructor: 'Dr. Jane Smith', progress: 100, status: 'completed', lastAccessed: '1 week ago', totalUnits: 15, completedUnits: 15, category: 'Backend' },
    { id: '4', title: 'Python Basics', instructor: 'Alice Brown', progress: 100, status: 'completed', lastAccessed: '2 weeks ago', totalUnits: 8, completedUnits: 8, category: 'Programming' },
    { id: '5', title: 'Docker & Kubernetes', instructor: 'Charlie Wilson', progress: 0, status: 'not_started', lastAccessed: 'Never', totalUnits: 14, completedUnits: 0, category: 'DevOps' },
];

export default function MyCoursesPage() {
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredCourses = myCourses.filter(course => {
        const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filter === 'all' ||
            (filter === 'in_progress' && course.status === 'in_progress') ||
            (filter === 'completed' && course.status === 'completed') ||
            (filter === 'not_started' && course.status === 'not_started');
        return matchesSearch && matchesFilter;
    });

    return (
        <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>My Courses</Typography>

            {/* Stats */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                    { label: 'Total Enrolled', value: myCourses.length, color: 'primary', icon: <SchoolIcon /> },
                    { label: 'In Progress', value: myCourses.filter(c => c.status === 'in_progress').length, color: 'warning', icon: <AccessTimeIcon /> },
                    { label: 'Completed', value: myCourses.filter(c => c.status === 'completed').length, color: 'success', icon: <CheckCircleIcon /> },
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
            <Grid container spacing={3}>
                {filteredCourses.map((course) => (
                    <Grid item xs={12} sm={6} md={4} key={course.id}>
                        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{
                                height: 100,
                                bgcolor: course.status === 'completed' ? 'success.main' : course.status === 'in_progress' ? 'primary.main' : 'grey.400',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                position: 'relative'
                            }}>
                                {course.status === 'completed' && <CheckCircleIcon sx={{ fontSize: 48, color: 'white' }} />}
                                {course.status === 'in_progress' && <Typography variant="h4" color="white">{course.progress}%</Typography>}
                                {course.status === 'not_started' && <SchoolIcon sx={{ fontSize: 48, color: 'white' }} />}
                            </Box>
                            <CardContent sx={{ flex: 1 }}>
                                <Typography variant="h6" gutterBottom>{course.title}</Typography>
                                <Typography variant="body2" color="text.secondary" gutterBottom>by {course.instructor}</Typography>
                                <Chip label={course.category} size="small" variant="outlined" sx={{ mb: 2 }} />

                                {course.status !== 'not_started' && (
                                    <Box sx={{ mb: 2 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                            <Typography variant="caption">Progress</Typography>
                                            <Typography variant="caption" fontWeight={600}>{course.completedUnits}/{course.totalUnits} units</Typography>
                                        </Box>
                                        <LinearProgress variant="determinate" value={course.progress} sx={{ height: 8, borderRadius: 4 }} color={course.status === 'completed' ? 'success' : 'primary'} />
                                    </Box>
                                )}

                                <Typography variant="caption" color="text.secondary">Last accessed: {course.lastAccessed}</Typography>
                            </CardContent>
                            <CardActions sx={{ p: 2, pt: 0 }}>
                                <Button
                                    variant="contained"
                                    fullWidth
                                    startIcon={course.status === 'completed' ? <CheckCircleIcon /> : <PlayArrowIcon />}
                                    color={course.status === 'completed' ? 'success' : 'primary'}
                                >
                                    {course.status === 'completed' ? 'Review' : course.status === 'in_progress' ? 'Continue' : 'Start'}
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}
