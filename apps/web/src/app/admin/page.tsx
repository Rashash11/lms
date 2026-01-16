'use client';

import React, { useState, useEffect } from 'react';
import {
    Box, Typography, CircularProgress, Link, Button, IconButton,
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

// Donut Chart Component updated with NCOSH theme
function DonutChart({ data, size = 180 }: { data: { label: string; value: number; color: string }[]; size?: number }) {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const strokeWidth = 20;
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
                    stroke="hsl(var(--muted))"
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
                        style={{ transition: 'stroke-dasharray 0.5s ease', strokeLinecap: 'round' }}
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
    const [currentUser, setCurrentUser] = useState<{ firstName: string; lastName?: string; username: string } | null>(null);

    // User breakdown data - NCOSH theme colors
    const userBreakdown = [
        { label: 'Admins', value: 1, color: 'hsl(var(--primary))' },
        { label: 'Instructors', value: 0, color: 'hsl(var(--secondary))' },
        { label: 'Learners', value: Math.max(0, stats.totalUsers - 1), color: 'hsl(var(--tertiary, 200 80% 50%))' },
    ];

    useEffect(() => {
        fetchDashboardData();
        fetchCurrentUser();
    }, []);

    const fetchCurrentUser = async () => {
        try {
            const res = await fetch('/api/auth/me', { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                if (data.user) {
                    setCurrentUser({
                        firstName: data.user.firstName,
                        lastName: data.user.lastName,
                        username: data.user.username,
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching user info:', error);
        }
    };

    const fetchDashboardData = async () => {
        try {
            const res = await fetch('/api/dashboard', { credentials: 'include' });
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
                    <>You created the course <Link sx={{ color: 'hsl(var(--primary))' }}>{event.details?.title || ''}</Link></>
                );
            case 'course_enrolled':
                return (
                    <>You added yourself to the course <Link sx={{ color: 'hsl(var(--primary))' }}>{event.details?.title || ''}</Link></>
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
                <CircularProgress sx={{ color: 'hsl(var(--primary))' }} />
            </Box>
        );
    }

    return (
        <Box className="animate-fade-in" sx={{ p: { xs: 2, md: 4 } }}>
            {/* Hero Section */}
            <Box className="hero-glass-card" sx={{ mb: 4, textAlign: 'center' }}>
                <Typography variant="h4" className="gradient-text" sx={{ fontWeight: 800, mb: 1 }}>
                    Welcome Back, {currentUser ? (currentUser.firstName ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim() : currentUser.username) : 'Admin'}
                </Typography>
                <Typography variant="body1" sx={{ color: 'hsl(var(--muted-foreground))' }}>
                    Here's what's happening in your portal today.
                </Typography>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '8fr 4fr' }, gap: 3, mb: 3 }}>
                {/* Column 1: Portal Activity */}
                <Box className="glass-card" sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>Portal activity</Typography>
                        <Button
                            className="btn btn-outline"
                            endIcon={<KeyboardArrowDownIcon />}
                            sx={{ textTransform: 'none' }}
                        >
                            This Week
                        </Button>
                    </Box>

                    {/* Simple Chart Visualization */}
                    <Box sx={{ height: 200, display: 'flex', alignItems: 'flex-end', gap: 2, px: 2, pb: 2, borderBottom: '1px solid hsl(var(--border))' }}>
                        {[40, 70, 45, 90, 65, 85, 30].map((height, i) => (
                            <Box key={i} sx={{
                                flex: 1,
                                height: `${height}%`,
                                background: i === 3 ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.3)',
                                borderRadius: '4px 4px 0 0',
                                transition: 'all 0.3s ease',
                                '&:hover': { background: 'hsl(var(--primary))', transform: 'scaleY(1.05)' }
                            }} />
                        ))}
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, px: 2 }}>
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                            <Typography key={day} variant="caption" sx={{ color: 'hsl(var(--muted-foreground))' }}>{day}</Typography>
                        ))}
                    </Box>

                    <Box sx={{ display: 'flex', gap: 3, mt: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CircleIcon sx={{ fontSize: 10, color: 'hsl(var(--primary))' }} />
                            <Typography variant="caption">Logins</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CircleIcon sx={{ fontSize: 10, color: 'hsl(var(--secondary))' }} />
                            <Typography variant="caption">Course completions</Typography>
                        </Box>
                    </Box>
                </Box>

                {/* Column 2: Quick Actions */}
                <Box className="glass-card" sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>Quick actions</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {quickActions.map((action, i) => (
                            <Box
                                key={i}
                                onClick={() => router.push(action.path)}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2,
                                    p: 1.5,
                                    borderRadius: 1,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    '&:hover': { bgcolor: 'hsl(var(--accent))', transform: 'translateX(4px)' }
                                }}
                            >
                                <Box sx={{ color: 'hsl(var(--primary))', display: 'flex' }}>
                                    {action.icon}
                                </Box>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>{action.label}</Typography>
                                <ChevronRightIcon sx={{ ml: 'auto', fontSize: 18, color: 'hsl(var(--muted-foreground))' }} />
                            </Box>
                        ))}
                    </Box>
                </Box>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 3 }}>
                {/* Overview */}
                <Box className="glass-card" sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>Overview</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {overviewStats.map((stat, i) => (
                            <Box key={i} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1, borderBottom: i < overviewStats.length - 1 ? '1px solid hsl(var(--border))' : 'none' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box sx={{ color: 'hsl(var(--primary) / 0.7)' }}>{stat.icon}</Box>
                                    <Typography variant="body2" sx={{ color: 'hsl(var(--foreground))' }}>{stat.label}</Typography>
                                </Box>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: 'hsl(var(--primary))' }}>{stat.value}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Box>

                {/* Timeline */}
                <Box className="glass-card" sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>Timeline</Typography>
                        <IconButton size="small" sx={{ color: 'hsl(var(--primary))' }}>
                            <ChevronRightIcon />
                        </IconButton>
                    </Box>
                    <Box sx={{ maxHeight: 250, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {timeline.length === 0 ? (
                            <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))', textAlign: 'center', py: 4 }}>No recent activity</Typography>
                        ) : (
                            timeline.map((event) => (
                                <Box key={event.id} sx={{ display: 'flex', gap: 2, p: 1 }}>
                                    <Box sx={{ mt: 0.5 }}>
                                        <CircleIcon sx={{ fontSize: 10, color: event.eventType === 'course_created' ? 'hsl(var(--secondary))' : 'hsl(var(--primary))' }} />
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="body2" sx={{ fontSize: 13 }}>{getEventText(event)}</Typography>
                                        <Typography variant="caption" sx={{ color: 'hsl(var(--muted-foreground))' }}>{formatTime(event.timestamp)}</Typography>
                                    </Box>
                                </Box>
                            ))
                        )}
                    </Box>
                </Box>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                {/* Users Distribution */}
                <Box className="glass-card" sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>Users Distribution</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>{stats.totalUsers}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', gap: 4, py: 2 }}>
                        <Box sx={{ position: 'relative' }}>
                            <DonutChart data={userBreakdown} size={160} />
                            <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1 }}>{stats.totalUsers}</Typography>
                                <Typography variant="caption" sx={{ color: 'hsl(var(--muted-foreground))' }}>Total</Typography>
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, flex: 1 }}>
                            {userBreakdown.map((item, i) => (
                                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <CircleIcon sx={{ fontSize: 10, color: item.color }} />
                                    <Typography variant="body2" sx={{ flex: 1 }}>{item.label}</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.value}</Typography>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                </Box>

                {/* Course Progress */}
                <Box className="glass-card" sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>Courses Progress</Typography>
                        <IconButton size="small" onClick={() => router.push('/admin/courses')} sx={{ color: 'hsl(var(--primary))' }}>
                            <ChevronRightIcon />
                        </IconButton>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 4, textAlign: 'center' }}>
                        <Box sx={{
                            width: 64, height: 64, borderRadius: '50%',
                            bgcolor: 'hsl(var(--primary) / 0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            mb: 2, color: 'hsl(var(--primary))'
                        }}>
                            <DescriptionOutlinedIcon fontSize="large" />
                        </Box>
                        <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>No stats to show</Typography>
                        <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))', mb: 2 }}>Create your first course now</Typography>
                        <Button
                            className="btn btn-primary"
                            onClick={() => router.push('/admin/courses/new/edit')}
                        >
                            Create Course
                        </Button>
                    </Box>
                </Box>
            </Box>

            {/* Footer */}
            <Box sx={{ mt: 6, pb: 4, textAlign: 'center', opacity: 0.6 }}>
                <Typography variant="caption" sx={{ color: 'hsl(var(--muted-foreground))' }}>
                    NCOSH Health Hub &copy; {new Date().getFullYear()} • Empowering Safety Excellence
                </Typography>
            </Box>
        </Box>
    );
}
