'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Box, Card, CardContent, Typography, MenuItem, Select, FormControl, Grid, CircularProgress } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SchoolIcon from '@mui/icons-material/School';
import CategoryIcon from '@mui/icons-material/Category';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import GroupIcon from '@mui/icons-material/Group';
import TimelineIcon from '@mui/icons-material/Timeline';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';

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
    enrollmentDistribution?: {
        completed: number;
        inProgress: number;
        notStarted: number;
    };
    topCourses?: Array<{ name: string; enrollments: number }>;
    userEngagement?: {
        dailyActiveUsers: number;
        weeklyActiveUsers: number;
        avgCompletionDays: number;
        certificatesIssued: number;
    };
    branchStats?: Array<{ name: string; users: number; completions: number }>;
    learningPathProgress?: {
        total: number;
        completed: number;
        inProgress: number;
    };
}

const COLORS = ['#4caf50', '#2196f3', '#ff9800', '#f44336', '#9c27b0'];
const PIE_COLORS = ['#4caf50', '#2196f3', '#ff9800'];

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
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress sx={{ color: 'hsl(var(--primary))' }} />
            </Box>
        );
    }

    const chartData = data.activity.labels.map((label, index) => ({
        name: label,
        Logins: data.activity.logins[index] || 0,
        'Course completions': data.activity.completions[index] || 0,
    }));

    const enrollmentPieData = data.enrollmentDistribution ? [
        { name: 'Completed', value: data.enrollmentDistribution.completed, color: '#4caf50' },
        { name: 'In Progress', value: data.enrollmentDistribution.inProgress, color: '#2196f3' },
        { name: 'Not Started', value: data.enrollmentDistribution.notStarted, color: '#ff9800' },
    ] : [];

    const totalEnrollments = enrollmentPieData.reduce((sum, item) => sum + item.value, 0);
    const completionRate = totalEnrollments > 0
        ? Math.round((data.enrollmentDistribution?.completed || 0) / totalEnrollments * 100)
        : 0;

    return (
        <Box>
            {/* User Engagement Metrics Cards */}
            {data.userEngagement && (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
                    <Card className="glass-card" sx={{ bgcolor: 'rgba(13, 20, 20, 0.4)', border: '1px solid rgba(141, 166, 166, 0.1)' }}>
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                            <TrendingUpIcon sx={{ fontSize: 32, color: '#4caf50', mb: 1 }} />
                            <Typography variant="h4" sx={{ fontWeight: 700, color: 'hsl(var(--foreground))' }}>
                                {data.userEngagement.dailyActiveUsers}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))' }}>
                                Daily Active Users
                            </Typography>
                        </CardContent>
                    </Card>
                    <Card className="glass-card" sx={{ bgcolor: 'rgba(13, 20, 20, 0.4)', border: '1px solid rgba(141, 166, 166, 0.1)' }}>
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                            <PeopleIcon sx={{ fontSize: 32, color: '#2196f3', mb: 1 }} />
                            <Typography variant="h4" sx={{ fontWeight: 700, color: 'hsl(var(--foreground))' }}>
                                {data.userEngagement.weeklyActiveUsers}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))' }}>
                                Weekly Active Users
                            </Typography>
                        </CardContent>
                    </Card>
                    <Card className="glass-card" sx={{ bgcolor: 'rgba(13, 20, 20, 0.4)', border: '1px solid rgba(141, 166, 166, 0.1)' }}>
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                            <AccessTimeIcon sx={{ fontSize: 32, color: '#ff9800', mb: 1 }} />
                            <Typography variant="h4" sx={{ fontWeight: 700, color: 'hsl(var(--foreground))' }}>
                                {data.userEngagement.avgCompletionDays}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))' }}>
                                Avg. Days to Complete
                            </Typography>
                        </CardContent>
                    </Card>
                    <Card className="glass-card" sx={{ bgcolor: 'rgba(13, 20, 20, 0.4)', border: '1px solid rgba(141, 166, 166, 0.1)' }}>
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                            <CardMembershipIcon sx={{ fontSize: 32, color: '#9c27b0', mb: 1 }} />
                            <Typography variant="h4" sx={{ fontWeight: 700, color: 'hsl(var(--foreground))' }}>
                                {data.userEngagement.certificatesIssued}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))' }}>
                                Certificates Issued
                            </Typography>
                        </CardContent>
                    </Card>
                </Box>
            )}

            <Box sx={{ display: 'flex', gap: 3, mb: 3, flexDirection: { xs: 'column', md: 'row' } }}>
                {/* Overview Card */}
                <Box sx={{ flex: 1 }}>
                    <Card className="glass-card" sx={{ bgcolor: 'rgba(13, 20, 20, 0.4)', border: '1px solid rgba(141, 166, 166, 0.1)', height: '100%' }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: 'hsl(var(--foreground))', mb: 2 }}>
                                User Statistics
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

                {/* Enrollment Distribution Pie Chart */}
                {data.enrollmentDistribution && (
                    <Box sx={{ flex: 1 }}>
                        <Card className="glass-card" sx={{ bgcolor: 'rgba(13, 20, 20, 0.4)', border: '1px solid rgba(141, 166, 166, 0.1)', height: '100%' }}>
                            <CardContent>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: 'hsl(var(--foreground))', mb: 1 }}>
                                    Enrollment Status
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <ResponsiveContainer width="60%" height={160}>
                                        <PieChart>
                                            <Pie
                                                data={enrollmentPieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={40}
                                                outerRadius={60}
                                                paddingAngle={2}
                                                dataKey="value"
                                            >
                                                {enrollmentPieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="h3" sx={{ fontWeight: 700, color: '#4caf50', textAlign: 'center' }}>
                                            {completionRate}%
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))', textAlign: 'center' }}>
                                            Completion Rate
                                        </Typography>
                                        <Box sx={{ mt: 2 }}>
                                            {enrollmentPieData.map((item, index) => (
                                                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: item.color }} />
                                                    <Typography variant="caption" sx={{ color: 'hsl(var(--muted-foreground))' }}>
                                                        {item.name}: {item.value}
                                                    </Typography>
                                                </Box>
                                            ))}
                                        </Box>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Box>
                )}

                {/* Learning Structure Card */}
                <Box sx={{ flex: 1 }}>
                    <Card className="glass-card" sx={{ bgcolor: 'rgba(13, 20, 20, 0.4)', border: '1px solid rgba(141, 166, 166, 0.1)', height: '100%' }}>
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
                            </Box>
                        </CardContent>
                    </Card>
                </Box>
            </Box>

            {/* Activity Chart and Top Courses Row */}
            <Box sx={{ display: 'flex', gap: 3, mb: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
                {/* Activity Chart */}
                <Box sx={{ flex: 2 }}>
                    <Card className="glass-card" sx={{ bgcolor: 'rgba(13, 20, 20, 0.4)', border: '1px solid rgba(141, 166, 166, 0.1)' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: 'hsl(var(--foreground))' }}>
                                    Activity Trends
                                </Typography>
                                <FormControl size="small" sx={{ minWidth: 120 }}>
                                    <Select value={period} onChange={(e) => setPeriod(e.target.value)}>
                                        <MenuItem value="month">Last 30 Days</MenuItem>
                                        <MenuItem value="week">Last 7 Days</MenuItem>
                                        <MenuItem value="day">Last 24 Hours</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                    <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }} />
                                    <YAxis tick={{ fill: 'rgba(255,255,255,0.6)' }} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(13, 20, 20, 0.9)',
                                            border: '1px solid rgba(141, 166, 166, 0.2)',
                                            borderRadius: 8
                                        }}
                                    />
                                    <Legend />
                                    <Bar dataKey="Logins" fill="#2196f3" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="Course completions" fill="#4caf50" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </Box>

                {/* Top Courses */}
                {data.topCourses && data.topCourses.length > 0 && (
                    <Box sx={{ flex: 1 }}>
                        <Card className="glass-card" sx={{ bgcolor: 'rgba(13, 20, 20, 0.4)', border: '1px solid rgba(141, 166, 166, 0.1)', height: '100%' }}>
                            <CardContent>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: 'hsl(var(--foreground))', mb: 2 }}>
                                    Top Courses by Enrollment
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                    {data.topCourses.slice(0, 5).map((course, index) => (
                                        <Box key={index}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                <Typography variant="body2" sx={{ color: 'hsl(var(--foreground))', fontSize: 13 }} noWrap>
                                                    {course.name.length > 25 ? `${course.name.slice(0, 25)}...` : course.name}
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: 'hsl(var(--primary))', fontWeight: 600 }}>
                                                    {course.enrollments}
                                                </Typography>
                                            </Box>
                                            <Box sx={{
                                                height: 6,
                                                bgcolor: 'rgba(255,255,255,0.1)',
                                                borderRadius: 3,
                                                overflow: 'hidden'
                                            }}>
                                                <Box sx={{
                                                    height: '100%',
                                                    width: `${Math.min(100, (course.enrollments / (data.topCourses?.[0]?.enrollments || 1)) * 100)}%`,
                                                    bgcolor: COLORS[index % COLORS.length],
                                                    borderRadius: 3,
                                                    transition: 'width 0.5s ease'
                                                }} />
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>
                            </CardContent>
                        </Card>
                    </Box>
                )}
            </Box>

            {/* Branch Stats and Learning Path Progress */}
            <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
                {/* Branch Performance */}
                {data.branchStats && data.branchStats.length > 0 && (
                    <Box sx={{ flex: 1 }}>
                        <Card className="glass-card" sx={{ bgcolor: 'rgba(13, 20, 20, 0.4)', border: '1px solid rgba(141, 166, 166, 0.1)' }}>
                            <CardContent>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: 'hsl(var(--foreground))', mb: 2 }}>
                                    Branch Performance
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {data.branchStats.map((branch, index) => (
                                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <AccountTreeIcon sx={{ color: COLORS[index % COLORS.length] }} />
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="body2" sx={{ color: 'hsl(var(--foreground))' }}>
                                                    {branch.name}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ textAlign: 'right' }}>
                                                <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))' }}>
                                                    {branch.users} users
                                                </Typography>
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>
                            </CardContent>
                        </Card>
                    </Box>
                )}

                {/* Learning Path Progress */}
                {data.learningPathProgress && (
                    <Box sx={{ flex: 1 }}>
                        <Card className="glass-card" sx={{ bgcolor: 'rgba(13, 20, 20, 0.4)', border: '1px solid rgba(141, 166, 166, 0.1)' }}>
                            <CardContent>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: 'hsl(var(--foreground))', mb: 2 }}>
                                    Learning Paths
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                    <Box sx={{ textAlign: 'center', flex: 1 }}>
                                        <TimelineIcon sx={{ fontSize: 40, color: '#2196f3', mb: 1 }} />
                                        <Typography variant="h4" sx={{ fontWeight: 700, color: 'hsl(var(--foreground))' }}>
                                            {data.learningPathProgress.total}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))' }}>
                                            Total Enrollments
                                        </Typography>
                                    </Box>
                                    <Box sx={{ textAlign: 'center', flex: 1 }}>
                                        <CheckCircleIcon sx={{ fontSize: 40, color: '#4caf50', mb: 1 }} />
                                        <Typography variant="h4" sx={{ fontWeight: 700, color: 'hsl(var(--foreground))' }}>
                                            {data.learningPathProgress.completed}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))' }}>
                                            Completed
                                        </Typography>
                                    </Box>
                                    <Box sx={{ textAlign: 'center', flex: 1 }}>
                                        <EmojiEventsIcon sx={{ fontSize: 40, color: '#ff9800', mb: 1 }} />
                                        <Typography variant="h4" sx={{ fontWeight: 700, color: 'hsl(var(--foreground))' }}>
                                            {data.learningPathProgress.inProgress}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))' }}>
                                            In Progress
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Box>
                )}
            </Box>
        </Box>
    );
}
