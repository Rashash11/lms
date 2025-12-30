'use client';

import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Grid, Card, CardContent, Button, Skeleton,
    Avatar, List, ListItem, ListItemAvatar, ListItemText, Chip,
    CircularProgress, IconButton,
} from '@mui/material';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import RouteIcon from '@mui/icons-material/Route';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import CircleIcon from '@mui/icons-material/Circle';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import VideoCameraBackOutlinedIcon from '@mui/icons-material/VideoCameraBackOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import GroupAddOutlinedIcon from '@mui/icons-material/GroupAddOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';

// Donut Chart Component
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

export default function SuperInstructorDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [upcomingConferences, setUpcomingConferences] = useState<any[]>([]);
    const [activityData, setActivityData] = useState<any[]>([]);
    const [userBreakdown, setUserBreakdown] = useState<any[]>([]);
    const [timeline, setTimeline] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        fetchDashboardData();
        fetchCurrentUser();
    }, []);

    const fetchCurrentUser = async () => {
        try {
            const res = await fetch('/api/auth/me');
            if (res.ok) {
                const data = await res.json();
                setCurrentUser(data);
            }
        } catch (error) {
            console.error('Error fetching user info:', error);
        }
    };

    const fetchDashboardData = async () => {
        try {
            const res = await fetch('/api/super-instructor/dashboard');
            if (res.ok) {
                const data = await res.json();
                setStats(data.stats);
                setUpcomingConferences(data.upcomingConferences || []);
                setActivityData(data.activityData || []);
                setUserBreakdown(data.userBreakdown || []);
                setTimeline(data.timeline || []);
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const quickActions = [
        { icon: <PersonAddOutlinedIcon />, label: 'Add user', path: '/super-instructor/users/new', color: '#6B21A8' },
        { icon: <AddBoxOutlinedIcon />, label: 'Add course', path: '/super-instructor/courses/new', color: '#0891B2' },
        { icon: <RouteIcon />, label: 'New path', path: '/super-instructor/learning-paths/new', color: '#059669' },
        { icon: <AssignmentOutlinedIcon />, label: 'Add assignment', path: '/super-instructor/assignments/new', color: '#D97706' },
        { icon: <VideoCameraBackOutlinedIcon />, label: 'Conferences', path: '/super-instructor/conferences', color: '#DC2626' },
    ];

    const overviewStats = [
        { icon: <PeopleOutlineIcon />, label: 'Active users', value: stats?.activeUsers || 0, color: 'hsl(var(--primary))' },
        { icon: <MenuBookOutlinedIcon />, label: 'Courses', value: stats?.totalCourses || 0, color: 'hsl(var(--secondary))' },
        { icon: <RouteIcon />, label: 'Learning paths', value: stats?.totalLearningPaths || 0, color: '#059669' },
        { icon: <AssignmentOutlinedIcon />, label: 'Assignments', value: stats?.totalAssignments || 0, color: '#D97706' },
    ];

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
            <Box className="hero-glass-card" sx={{ mb: 4, textAlign: 'center', p: 4, borderRadius: 4 }}>
                <Typography variant="h4" className="gradient-text" sx={{ fontWeight: 800, mb: 1 }}>
                    Expert Insights, {currentUser?.firstName || 'Instructor'}
                </Typography>
                <Typography variant="body1" sx={{ color: 'hsl(var(--muted-foreground))' }}>
                    Track your impact and manage your educational ecosystem.
                </Typography>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '8fr 4fr' }, gap: 3, mb: 3 }}>
                {/* Column 1: Portal Activity */}
                <Box className="glass-card" sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: 'hsl(var(--foreground))' }}>Activity analysis</Typography>
                        <Button
                            size="small"
                            sx={{ color: 'hsl(var(--muted-foreground))', textTransform: 'none', border: '1px solid hsl(var(--border))', borderRadius: 2, px: 2 }}
                            endIcon={<KeyboardArrowDownIcon />}
                        >
                            Last 7 Days
                        </Button>
                    </Box>

                    {/* Simple Chart Visualization */}
                    <Box sx={{ height: 200, display: 'flex', alignItems: 'flex-end', gap: 2, px: 2, pb: 2, borderBottom: '1px solid hsl(var(--border))' }}>
                        {activityData.map((data, i) => (
                            <Box key={i} sx={{
                                flex: 1,
                                height: `${data.logins}%`,
                                background: i === 3 ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.3)',
                                borderRadius: '4px 4px 0 0',
                                transition: 'all 0.3s ease',
                                position: 'relative',
                                '&:hover': { background: 'hsl(var(--primary))', transform: 'scaleY(1.05)' }
                            }}>
                                <Box sx={{
                                    position: 'absolute',
                                    bottom: 0, left: '20%', right: '20%',
                                    height: `${data.completions}%`,
                                    bgcolor: 'hsl(var(--secondary))',
                                    borderRadius: '2px 2px 0 0',
                                    opacity: 0.8
                                }} />
                            </Box>
                        ))}
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, px: 2 }}>
                        {activityData.map(data => (
                            <Typography key={data.day} variant="caption" sx={{ color: 'hsl(var(--muted-foreground))' }}>{data.day}</Typography>
                        ))}
                    </Box>

                    <Box sx={{ display: 'flex', gap: 3, mt: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CircleIcon sx={{ fontSize: 10, color: 'hsl(var(--primary))' }} />
                            <Typography variant="caption" sx={{ color: 'hsl(var(--foreground))' }}>Platform usage</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CircleIcon sx={{ fontSize: 10, color: 'hsl(var(--secondary))' }} />
                            <Typography variant="caption" sx={{ color: 'hsl(var(--foreground))' }}>Course reach</Typography>
                        </Box>
                    </Box>
                </Box>

                {/* Column 2: Quick Actions */}
                <Box className="glass-card" sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'hsl(var(--foreground))' }}>Command center</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {quickActions.map((action, i) => (
                            <Box
                                key={i}
                                onClick={() => router.push(action.path)}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2,
                                    p: 1.8,
                                    borderRadius: 3,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    bgcolor: 'rgba(141, 166, 166, 0.05)',
                                    border: '1px solid rgba(141, 166, 166, 0.1)',
                                    '&:hover': { bgcolor: 'rgba(26, 84, 85, 0.15)', borderColor: 'rgba(26, 84, 85, 0.3)', transform: 'translateX(6px)' }
                                }}
                            >
                                <Box sx={{ color: action.color, display: 'flex', bgcolor: `${action.color}15`, p: 1, borderRadius: 2 }}>
                                    {React.cloneElement(action.icon as React.ReactElement, { sx: { fontSize: 20 } })}
                                </Box>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: 'hsl(var(--foreground))' }}>{action.label}</Typography>
                                <ChevronRightIcon sx={{ ml: 'auto', fontSize: 18, color: 'hsl(var(--muted-foreground))' }} />
                            </Box>
                        ))}
                    </Box>
                </Box>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 3 }}>
                {/* Overview */}
                <Box className="glass-card" sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'hsl(var(--foreground))' }}>Overview</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        {overviewStats.map((stat, i) => (
                            <Box key={i} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, borderBottom: i < overviewStats.length - 1 ? '1px solid rgba(141, 166, 166, 0.1)' : 'none' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                                    <Box sx={{ color: stat.color, bgcolor: `${stat.color}15`, p: 1, borderRadius: 2 }}>{stat.icon}</Box>
                                    <Typography variant="body2" sx={{ color: 'hsl(var(--foreground))', fontWeight: 500 }}>{stat.label}</Typography>
                                </Box>
                                <Typography variant="h5" sx={{ fontWeight: 800, color: 'hsl(var(--foreground))' }}>{stat.value}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Box>

                {/* Upcoming Conferences */}
                <Box className="glass-card" sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: 'hsl(var(--foreground))' }}>Upcoming conferences</Typography>
                        <IconButton size="small" onClick={() => router.push('/super-instructor/conferences')} sx={{ color: 'hsl(var(--primary))' }}>
                            <ChevronRightIcon />
                        </IconButton>
                    </Box>
                    <Box sx={{ maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {upcomingConferences.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 6, opacity: 0.5 }}>
                                <VideoCameraBackOutlinedIcon sx={{ fontSize: 48, mb: 2 }} />
                                <Typography variant="body2">No scheduled conferences</Typography>
                            </Box>
                        ) : (
                            upcomingConferences.map((conf) => (
                                <Box
                                    key={conf.id}
                                    sx={{
                                        display: 'flex', alignItems: 'center', gap: 2, p: 2,
                                        borderRadius: 3, bgcolor: 'rgba(141, 166, 166, 0.05)',
                                        border: '1px solid rgba(141, 166, 166, 0.1)'
                                    }}
                                >
                                    <Box sx={{ textAlign: 'center', minWidth: 50, py: 0.5, px: 1, borderRadius: 2, bgcolor: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}>
                                        <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>{new Date(conf.startTime).toLocaleString('en-US', { month: 'short' }).toUpperCase()}</Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1 }}>{new Date(conf.startTime).getDate()}</Typography>
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'hsl(var(--foreground))' }}>{conf.title}</Typography>
                                        <Typography variant="caption" sx={{ color: 'hsl(var(--muted-foreground))' }}>
                                            {new Date(conf.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Typography>
                                    </Box>
                                </Box>
                            ))
                        )}
                    </Box>
                </Box>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                {/* Users Distribution */}
                <Box className="glass-card" sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: 'hsl(var(--foreground))' }}>User segmentation</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', gap: 6, py: 2 }}>
                        <Box sx={{ position: 'relative' }}>
                            <DonutChart data={userBreakdown} size={180} />
                            <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                                <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1, color: 'hsl(var(--foreground))' }}>{stats?.totalUsers || 0}</Typography>
                                <Typography variant="caption" sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 600 }}>Total</Typography>
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
                            {userBreakdown.map((item, i) => (
                                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <CircleIcon sx={{ fontSize: 12, color: item.color }} />
                                    <Typography variant="body2" sx={{ flex: 1, fontWeight: 500, color: 'hsl(var(--foreground))' }}>{item.label}</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'hsl(var(--foreground))' }}>{item.value}</Typography>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                </Box>

                {/* Timeline */}
                <Box className="glass-card" sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: 'hsl(var(--foreground))' }}>Live feed</Typography>
                        <IconButton size="small" sx={{ color: 'hsl(var(--primary))' }}>
                            <ChevronRightIcon />
                        </IconButton>
                    </Box>
                    <Box sx={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        {timeline.length === 0 ? (
                            <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))', textAlign: 'center', py: 6 }}>No recent developments</Typography>
                        ) : (
                            timeline.map((event) => (
                                <Box key={event.id} sx={{ display: 'flex', gap: 2.5, p: 1.5, borderRadius: 2, '&:hover': { bgcolor: 'rgba(141, 166, 166, 0.05)' } }}>
                                    <Box sx={{ mt: 0.8 }}>
                                        <CircleIcon sx={{ fontSize: 10, color: 'hsl(var(--primary))' }} />
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="body2" sx={{ fontSize: 14, fontWeight: 500, color: 'hsl(var(--foreground))' }}>
                                            {event.eventType === 'signin' ? 'Session initiated' : event.eventType.replace(/_/g, ' ')}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 500 }}>{formatTime(event.timestamp)}</Typography>
                                    </Box>
                                </Box>
                            ))
                        )}
                    </Box>
                </Box>
            </Box>

            {/* Footer */}
            <Box sx={{ mt: 8, pb: 4, textAlign: 'center', opacity: 0.5 }}>
                <Typography variant="caption" sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 600, letterSpacing: '0.05em' }}>
                    NCOSH ELITE ANALYTICS • PREVIEW MODE
                </Typography>
            </Box>
        </Box>
    );
}
