'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Box, Card, CardContent, Typography, MenuItem, Select, FormControl } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SchoolIcon from '@mui/icons-material/School';
import CategoryIcon from '@mui/icons-material/Category';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import GroupIcon from '@mui/icons-material/Group';
import TimelineIcon from '@mui/icons-material/Timeline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface OverviewData {
    overview: {
        activeUsers: number;
        neverLoggedIn: number;
        assignedCourses: number;
        completedCourses: number;
    };
    learningStructure: {
        courses: number;
        categories: number;
        branches: number;
        groups: number;
        learningPaths: number;
    };
    activity: {
        labels: string[];
        logins: number[];
        completions: number[];
    };
}

export default function OverviewTab() {
    const [data, setData] = useState<OverviewData | null>(null);
    const [period, setPeriod] = useState('month');
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/reports/overview?period=${period}`);
            const json = await res.json();
            setData(json);
        } catch (error) {
            console.error('Error fetching overview:', error);
        } finally {
            setLoading(false);
        }
    }, [period]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading || !data) {
        return <Box>Loading...</Box>;
    }

    const chartData = data.activity.labels.map((label, index) => ({
        name: label,
        Logins: data.activity.logins[index] || 0,
        'Course completions': data.activity.completions[index] || 0,
    }));

    return (
        <Box>
            <Box sx={{ display: 'flex', gap: 3, mb: 3, flexDirection: { xs: 'column', md: 'row' } }}>
                {/* Overview Card */}
                <Box sx={{ flex: 1 }}>
                    <Card className="glass-card" sx={{ bgcolor: 'rgba(13, 20, 20, 0.4)', border: '1px solid rgba(141, 166, 166, 0.1)' }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: 'hsl(var(--foreground))', mb: 2 }}>
                                Overview
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <PeopleIcon sx={{ color: 'hsl(var(--primary))' }} />
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))' }}>
                                            Active users
                                        </Typography>
                                    </Box>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'hsl(var(--foreground))' }}>
                                        {data.overview.activeUsers}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <PersonOffIcon sx={{ color: 'hsl(var(--muted-foreground))' }} />
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))' }}>
                                            Never logged in
                                        </Typography>
                                    </Box>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'hsl(var(--foreground))' }}>
                                        {data.overview.neverLoggedIn}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <AssignmentIcon sx={{ color: '#ff9800' }} />
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))' }}>
                                            Assigned courses
                                        </Typography>
                                    </Box>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'hsl(var(--foreground))' }}>
                                        {data.overview.assignedCourses}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <CheckCircleIcon sx={{ color: '#4caf50' }} />
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))' }}>
                                            Completed courses
                                        </Typography>
                                    </Box>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'hsl(var(--foreground))' }}>
                                        {data.overview.completedCourses}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Box>

                {/* Learning Structure Card */}
                <Box sx={{ flex: 1 }}>
                    <Card className="glass-card" sx={{ bgcolor: 'rgba(13, 20, 20, 0.4)', border: '1px solid rgba(141, 166, 166, 0.1)' }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: 'hsl(var(--foreground))', mb: 2 }}>
                                Learning Structure
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <SchoolIcon sx={{ color: 'hsl(var(--muted-foreground))' }} />
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))' }}>
                                            Courses
                                        </Typography>
                                    </Box>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'hsl(var(--foreground))' }}>
                                        {data.learningStructure.courses}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <CategoryIcon sx={{ color: 'hsl(var(--muted-foreground))' }} />
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))' }}>
                                            Categories
                                        </Typography>
                                    </Box>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'hsl(var(--foreground))' }}>
                                        {data.learningStructure.categories}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <AccountTreeIcon sx={{ color: 'hsl(var(--muted-foreground))' }} />
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))' }}>
                                            Branches
                                        </Typography>
                                    </Box>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'hsl(var(--foreground))' }}>
                                        {data.learningStructure.branches}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <GroupIcon sx={{ color: 'hsl(var(--muted-foreground))' }} />
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))' }}>
                                            Groups
                                        </Typography>
                                    </Box>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'hsl(var(--foreground))' }}>
                                        {data.learningStructure.groups}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <TimelineIcon sx={{ color: 'hsl(var(--muted-foreground))' }} />
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))' }}>
                                            Learning Paths
                                        </Typography>
                                    </Box>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'hsl(var(--foreground))' }}>
                                        {data.learningStructure.learningPaths}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Box>
            </Box>

            {/* Activity Chart */}
            <Card className="glass-card" sx={{ mb: 3, bgcolor: 'rgba(13, 20, 20, 0.4)', border: '1px solid rgba(141, 166, 166, 0.1)' }}>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: 'hsl(var(--foreground))' }}>
                            Activity
                        </Typography>
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                            <Select value={period} onChange={(e) => setPeriod(e.target.value)}>
                                <MenuItem value="month">Month</MenuItem>
                                <MenuItem value="week">Week</MenuItem>
                                <MenuItem value="day">Day</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="Logins" fill="#1976d2" />
                            <Bar dataKey="Course completions" fill="#2e7d32" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Courses Section */}
            <Card className="glass-card" sx={{ bgcolor: 'rgba(13, 20, 20, 0.4)', border: '1px solid rgba(141, 166, 166, 0.1)' }}>
                <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'hsl(var(--foreground))', mb: 2 }}>
                        Courses
                    </Typography>
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <SchoolIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                            No stats to show
                        </Typography>
                        <Typography variant="body2" color="primary" sx={{ cursor: 'pointer' }}>
                            Go to courses
                        </Typography>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
}
