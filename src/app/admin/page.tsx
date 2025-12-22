'use client';

import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Select, MenuItem, FormControl,
    List, ListItem, ListItemIcon, ListItemText, CircularProgress, Link, Button,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import GroupAddOutlinedIcon from '@mui/icons-material/GroupAddOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CircleIcon from '@mui/icons-material/Circle';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

interface DashboardStats {
    activeUsers: number;
    totalUsers: number;
    totalCourses: number;
    publishedCourses: number;
    totalBranches: number;
}

interface TimelineEvent {
    id: string;
    eventType: string;
    details: any;
    timestamp: string;
}

// Donut Chart Component
function DonutChart({ data, size = 180 }: { data: { label: string; value: number; color: string }[]; size?: number }) {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const strokeWidth = 24;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    let currentOffset = 0;

    if (total === 0) {
        return (
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="#e0e0e0"
                    strokeWidth={strokeWidth}
                />
            </svg>
        );
    }

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {data.map((item, index) => {
                const percentage = item.value / total;
                const strokeDasharray = `${percentage * circumference} ${circumference}`;
                const strokeDashoffset = -currentOffset;
                currentOffset += percentage * circumference;

                return (
                    <circle
                        key={index}
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke={item.color}
                        strokeWidth={strokeWidth}
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        transform={`rotate(-90 ${size / 2} ${size / 2})`}
                        style={{ transition: 'stroke-dasharray 0.5s ease' }}
                    />
                );
            })}
        </svg>
    );
}

export default function AdminDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStats>({
        activeUsers: 0,
        totalUsers: 0,
        totalCourses: 0,
        publishedCourses: 0,
        totalBranches: 0,
    });
    const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
    const [trainingTime, setTrainingTime] = useState('0h 0m');

    // User breakdown data - matching TalentLMS colors
    const userBreakdown = [
        { label: 'Admins', value: 1, color: '#1976d2' },
        { label: 'Instructors', value: 0, color: '#42a5f5' },
        { label: 'Learners', value: Math.max(0, stats.totalUsers - 1), color: '#0d47a1' },
    ];

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const res = await fetch('/api/dashboard');
            if (res.ok) {
                const data = await res.json();
                setStats(data.stats);
                setTimeline(data.timeline || []);
                setTrainingTime(data.trainingTime || '0h 0m');
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const quickActions = [
        { icon: <PersonAddOutlinedIcon />, label: 'Add user', path: '/admin/users/new' },
        { icon: <AddBoxOutlinedIcon />, label: 'Add course', path: '/admin/courses/new/edit' },
        { icon: <SettingsOutlinedIcon />, label: 'Portal settings', path: '/admin/settings' },
        { icon: <GroupAddOutlinedIcon />, label: 'Add group', path: '/admin/groups/new' },
        { icon: <AssessmentOutlinedIcon />, label: 'Custom reports', path: '/admin/reports' },
    ];


    const overviewStats = [
        { icon: <PeopleOutlineIcon />, label: 'Active users', value: stats.activeUsers.toString() },
        { icon: <MenuBookOutlinedIcon />, label: 'Assigned courses', value: stats.totalCourses.toString() },
        { icon: <GroupsOutlinedIcon />, label: 'Groups', value: '0' },
        { icon: <AccessTimeOutlinedIcon />, label: 'Training time', value: trainingTime },
    ];

    const getEventText = (event: TimelineEvent) => {
        switch (event.eventType) {
            case 'signin': return 'You signed in';
            case 'course_created':
                return (
                    <>You created the course <Link sx={{ color: '#1976d2' }}>{event.details?.title || ''}</Link></>
                );
            case 'course_enrolled':
                return (
                    <>You added yourself to the course <Link sx={{ color: '#1976d2' }}>{event.details?.title || ''}</Link></>
                );
            default: return event.eventType;
        }
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins} minutes ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hour ago`;
        return `${Math.floor(diffMins / 1440)} days ago`;
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            {/* Header with Welcome message and Customize button */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#1a2b4a', fontWeight: 500 }}>
                    <span style={{ fontSize: 24 }}>👋</span> Welcome, mostafa!
                </Typography>
                <Button
                    variant="outlined"
                    endIcon={<KeyboardArrowDownIcon />}
                    sx={{
                        borderColor: '#ddd',
                        color: '#1a2b4a',
                        textTransform: 'none',
                        fontWeight: 400,
                        '&:hover': { borderColor: '#bbb', bgcolor: 'transparent' }
                    }}
                >
                    Customize
                </Button>
            </Box>

            {/* Row 1: Portal Activity & Quick Actions */}
            <Box sx={{ display: 'flex', gap: 2.5, mb: 2.5, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
                {/* Portal Activity Chart */}
                <Paper sx={{ p: 2.5, flex: { xs: '1 1 100%', md: '1 1 60%' }, boxShadow: '0 1px 2px rgba(0,0,0,0.05)', border: '1px solid #e8e8e8', borderRadius: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                        <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#1a1a1a', fontSize: '15px' }}>Portal activity</Typography>
                        <FormControl size="small" sx={{ minWidth: 90 }}>
                            <Select
                                defaultValue="week"
                                variant="outlined"
                                sx={{
                                    fontSize: 14,
                                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#ddd' },
                                }}
                            >
                                <MenuItem value="week">Week</MenuItem>
                                <MenuItem value="month">Month</MenuItem>
                                <MenuItem value="year">Year</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>

                    {/* Chart Area */}
                    <Box sx={{ height: 180, position: 'relative', pl: 3 }}>
                        {[1, 0.8, 0.6, 0.4, 0.2, 0].map((val, i) => (
                            <Box key={val} sx={{
                                position: 'absolute', left: 0,
                                top: `${i * 20}%`,
                                transform: 'translateY(-50%)',
                            }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>{val}</Typography>
                            </Box>
                        ))}

                        {[0, 20, 40, 60, 80, 100].map((pos) => (
                            <Box key={pos} sx={{
                                position: 'absolute', left: 24, right: 0,
                                top: `${pos}%`,
                                borderTop: '1px dashed #e0e0e0',
                            }} />
                        ))}

                        {/* Bar for Thursday */}
                        <Box sx={{
                            position: 'absolute',
                            right: '8%',
                            bottom: 0,
                            width: 20,
                            height: '100%',
                            bgcolor: '#1976d2',
                            borderRadius: '3px 3px 0 0',
                        }} />
                    </Box>

                    {/* X-axis labels */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', pl: 3, mt: 1, pr: 2 }}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>Friday</Typography>
                            <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: 11 }}>December 12</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>Monday</Typography>
                            <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: 11 }}>December 15</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>Thursday</Typography>
                            <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: 11 }}>December 18</Typography>
                        </Box>
                    </Box>

                    {/* Legend */}
                    <Box sx={{ display: 'flex', gap: 3, mt: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <CircleIcon sx={{ fontSize: 8, color: '#1976d2' }} />
                            <Typography variant="caption" sx={{ fontSize: 12, color: '#1976d2' }}>Logins</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <CircleIcon sx={{ fontSize: 8, color: '#4caf50' }} />
                            <Typography variant="caption" sx={{ fontSize: 12, color: '#4caf50' }}>Course completions</Typography>
                        </Box>
                    </Box>
                </Paper>

                {/* Quick Actions */}
                <Paper sx={{ p: 2.5, flex: { xs: '1 1 100%', md: '1 1 40%' }, boxShadow: '0 1px 2px rgba(0,0,0,0.05)', border: '1px solid #e8e8e8', borderRadius: 1.5 }}>
                    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, color: '#1a1a1a', fontSize: '15px' }}>Quick actions</Typography>
                    <List disablePadding>
                        {quickActions.map((action, i) => (
                            <ListItem
                                key={i}
                                disablePadding
                                sx={{
                                    py: 1,
                                    cursor: 'pointer',
                                    '&:hover': { bgcolor: '#f5f7fa' },
                                    borderRadius: 1,
                                }}
                                onClick={() => router.push(action.path)}
                            >
                                <ListItemIcon sx={{ minWidth: 40 }}>
                                    {React.cloneElement(action.icon, { sx: { color: '#5c6b7a', fontSize: 20 } })}
                                </ListItemIcon>
                                <ListItemText
                                    primary={action.label}
                                    primaryTypographyProps={{
                                        color: '#1976d2',
                                        fontWeight: 400,
                                        fontSize: 14,
                                    }}
                                />
                            </ListItem>
                        ))}
                    </List>
                </Paper>
            </Box>

            {/* Row 2: Overview & Timeline */}
            <Box sx={{ display: 'flex', gap: 2.5, mb: 2.5, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
                {/* Overview */}
                <Paper sx={{ p: 2.5, flex: { xs: '1 1 100%', md: '1 1 50%' }, boxShadow: '0 1px 2px rgba(0,0,0,0.05)', border: '1px solid #e8e8e8', borderRadius: 1.5 }}>
                    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, color: '#1a1a1a', fontSize: '15px' }}>Overview</Typography>
                    <List disablePadding>
                        {overviewStats.map((stat, i) => (
                            <ListItem
                                key={i}
                                disablePadding
                                sx={{ py: 1.5, borderBottom: i < overviewStats.length - 1 ? '1px solid #f0f0f0' : 'none' }}
                            >
                                <ListItemIcon sx={{ minWidth: 40 }}>
                                    {React.cloneElement(stat.icon, { sx: { color: '#5c6b7a', fontSize: 20 } })}
                                </ListItemIcon>
                                <ListItemText
                                    primary={stat.label}
                                    primaryTypographyProps={{ fontSize: 14, color: '#1976d2' }}
                                />
                                <Typography variant="body1" fontWeight={400} sx={{ color: '#1a2b4a' }}>{stat.value}</Typography>
                            </ListItem>
                        ))}
                    </List>
                </Paper>

                {/* Timeline */}
                <Paper sx={{ p: 2.5, flex: { xs: '1 1 100%', md: '1 1 50%' }, boxShadow: '0 1px 2px rgba(0,0,0,0.05)', border: '1px solid #e8e8e8', borderRadius: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, cursor: 'pointer' }}>
                        <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#1a1a1a', fontSize: '15px' }}>Timeline</Typography>
                        <ChevronRightIcon sx={{ ml: 0.5, color: '#1a2b4a', fontSize: 20 }} />
                    </Box>
                    <List disablePadding sx={{ maxHeight: 220, overflow: 'auto' }}>
                        {timeline.length === 0 ? (
                            <ListItem disablePadding sx={{ py: 2 }}>
                                <Typography variant="body2" color="text.secondary">No recent activity</Typography>
                            </ListItem>
                        ) : (
                            timeline.map((event) => (
                                <ListItem
                                    key={event.id}
                                    disablePadding
                                    alignItems="flex-start"
                                    sx={{ py: 1 }}
                                >
                                    <ListItemIcon sx={{ minWidth: 20, mt: 0.75 }}>
                                        <CircleIcon sx={{ fontSize: 8, color: event.eventType === 'course_created' ? '#4caf50' : '#1976d2' }} />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={
                                            <Typography component="span" fontSize={13} color="#333">
                                                {getEventText(event)}
                                            </Typography>
                                        }
                                    />
                                    <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap', fontSize: 11, ml: 1 }}>
                                        {formatTime(event.timestamp)}
                                    </Typography>
                                </ListItem>
                            ))
                        )}
                    </List>
                </Paper>
            </Box>

            {/* Row 3: Users Donut Chart & Courses Progress Status */}
            <Box sx={{ display: 'flex', gap: 2.5, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
                {/* Users Donut Chart */}
                <Paper sx={{ p: 2.5, flex: { xs: '1 1 100%', md: '1 1 50%' }, boxShadow: '0 1px 2px rgba(0,0,0,0.05)', border: '1px solid #e8e8e8', borderRadius: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => router.push('/admin/users')}>
                            <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#1a1a1a', fontSize: '15px' }}>Users</Typography>
                            <ChevronRightIcon sx={{ ml: 0.5, color: '#1a2b4a', fontSize: 20 }} />
                        </Box>
                        <Typography variant="subtitle1" fontWeight={400} sx={{ color: '#1a2b4a' }}>{stats.totalUsers}</Typography>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
                        <DonutChart data={userBreakdown} size={180} />

                        {/* Legend */}
                        <Box sx={{ display: 'flex', gap: 3, mt: 3 }}>
                            {userBreakdown.map((item, i) => (
                                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <CircleIcon sx={{ fontSize: 10, color: item.color }} />
                                    <Typography variant="caption" sx={{ fontSize: 12, color: '#333' }}>{item.label}</Typography>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                </Paper>

                {/* Courses Progress Status */}
                <Paper sx={{ p: 2.5, flex: { xs: '1 1 100%', md: '1 1 50%' }, boxShadow: '0 1px 2px rgba(0,0,0,0.05)', border: '1px solid #e8e8e8', borderRadius: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', mb: 2 }} onClick={() => router.push('/admin/courses')}>
                        <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#1a2b4a' }}>Courses&apos; progress status</Typography>
                        <ChevronRightIcon sx={{ ml: 0.5, color: '#1a2b4a', fontSize: 20 }} />
                    </Box>

                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        py: 5,
                    }}>
                        <DescriptionOutlinedIcon sx={{ fontSize: 48, color: '#1976d2', mb: 2 }} />
                        <Typography variant="body1" fontWeight={500} sx={{ color: '#1a2b4a', mb: 1 }}>
                            No stats to show
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Create your first course now
                        </Typography>
                        <Link
                            component="button"
                            variant="body2"
                            onClick={() => router.push('/admin/courses')}
                            sx={{ color: '#1976d2', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                        >
                            Go to courses
                        </Link>
                    </Box>
                </Paper>
            </Box>

            {/* Footer */}
            <Box sx={{ textAlign: 'center', mt: 4, py: 2 }}>
                <Typography variant="body2" color="text.secondary">
                    Powered by <Typography component="span" fontWeight={600} color="#1a2b4a">TalentLMS</Typography>
                </Typography>
            </Box>
        </Box>
    );
}
