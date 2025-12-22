'use client';

import React from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    LinearProgress,
    Avatar,
    AvatarGroup,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    change?: string;
}

function StatCard({ title, value, icon, color, change }: StatCardProps) {
    return (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box>
                        <Typography color="text.secondary" variant="body2" fontWeight={500}>
                            {title}
                        </Typography>
                        <Typography variant="h4" fontWeight="bold" sx={{ my: 1 }}>
                            {value}
                        </Typography>
                        {change && (
                            <Typography variant="body2" color="success.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <TrendingUpIcon fontSize="small" />
                                {change}
                            </Typography>
                        )}
                    </Box>
                    <Avatar sx={{ bgcolor: `${color}.light`, color: `${color}.main`, width: 48, height: 48 }}>
                        {icon}
                    </Avatar>
                </Box>
            </CardContent>
        </Card>
    );
}

export default function DashboardPage() {
    return (
        <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>
                Dashboard
            </Typography>

            {/* Stats Grid */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Total Users"
                        value="1,234"
                        icon={<PeopleIcon />}
                        color="primary"
                        change="+12% this month"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Active Courses"
                        value="56"
                        icon={<SchoolIcon />}
                        color="secondary"
                        change="+3 new"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Completions"
                        value="892"
                        icon={<CheckCircleIcon />}
                        color="success"
                        change="+24% this week"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Avg. Progress"
                        value="68%"
                        icon={<TrendingUpIcon />}
                        color="info"
                    />
                </Grid>
            </Grid>

            {/* Course Progress Section */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                                Recent Course Activity
                            </Typography>
                            {[
                                { name: 'Introduction to React', progress: 85 },
                                { name: 'Advanced TypeScript', progress: 62 },
                                { name: 'Node.js Fundamentals', progress: 45 },
                                { name: 'Database Design', progress: 90 },
                            ].map((course, index) => (
                                <Box key={index} sx={{ mb: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Typography variant="body2">{course.name}</Typography>
                                        <Typography variant="body2" color="text.secondary">{course.progress}%</Typography>
                                    </Box>
                                    <LinearProgress
                                        variant="determinate"
                                        value={course.progress}
                                        sx={{ height: 8, borderRadius: 4 }}
                                    />
                                </Box>
                            ))}
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                                Top Learners
                            </Typography>
                            {[
                                { name: 'John Doe', courses: 12, avatar: 'J' },
                                { name: 'Jane Smith', courses: 10, avatar: 'J' },
                                { name: 'Bob Johnson', courses: 8, avatar: 'B' },
                                { name: 'Alice Brown', courses: 7, avatar: 'A' },
                            ].map((learner, index) => (
                                <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>{learner.avatar}</Avatar>
                                    <Box sx={{ flexGrow: 1 }}>
                                        <Typography variant="body2" fontWeight={500}>{learner.name}</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {learner.courses} courses completed
                                        </Typography>
                                    </Box>
                                </Box>
                            ))}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}
