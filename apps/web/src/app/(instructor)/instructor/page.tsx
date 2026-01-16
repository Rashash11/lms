'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Card, CardContent, CardMedia, CardActionArea, Skeleton, Stack, Chip, Divider, IconButton } from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import CelebrationIcon from '@mui/icons-material/Celebration';
import AddIcon from '@mui/icons-material/Add';
import GroupsIcon from '@mui/icons-material/Groups';
import VideocamIcon from '@mui/icons-material/Videocam';
import ChatIcon from '@mui/icons-material/Chat';
import TableChartIcon from '@mui/icons-material/TableChart';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PeopleIcon from '@mui/icons-material/People';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { useRouter } from 'next/navigation';

interface Course {
    id: string;
    title: string;
    code: string;
    image: string | null;
}

export default function InstructorDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [courses, setCourses] = useState<Course[]>([]);
    const [totalCourses, setTotalCourses] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch user data
        fetch('/api/me')
            .then(res => res.json())
            .then(data => {
                if (data.user) {
                    setUser(data.user);
                }
            })
            .catch(err => console.error('Failed to fetch user:', err));

        // Fetch instructor courses
        fetch('/api/instructor/courses?limit=3')
            .then(res => res.json())
            .then(data => {
                if (data.data) {
                    setCourses(data.data);
                    setTotalCourses(data.pagination?.total || data.data.length);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to fetch courses:', err);
                setLoading(false);
            });
    }, []);

    const handleCourseClick = (courseId: string) => {
        router.push(`/instructor/courses/${courseId}`);
    };

    const firstName = user?.firstName || 'mostafa';
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
    const formattedTime = today.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CelebrationIcon sx={{ color: '#F58220', fontSize: 24 }} />
                    <Typography variant="h5" fontWeight={600} color="#172B4D">
                        Welcome, {firstName}!
                    </Typography>
                </Box>
                <Button
                    variant="outlined"
                    size="small"
                    endIcon={<KeyboardArrowDownIcon />}
                    sx={{
                        textTransform: 'none',
                        color: '#172B4D',
                        borderColor: '#DFE1E6',
                        fontSize: 14,
                        fontWeight: 500,
                        px: 2,
                        '&:hover': {
                            bgcolor: '#F4F5F7',
                            borderColor: '#DFE1E6',
                        }
                    }}
                >
                    Customize
                </Button>
            </Box>

            {/* Recent course activity */}
            <Card sx={{ mb: 4, border: '1px solid #DFE1E6', boxShadow: 'none', borderRadius: 2 }}>
                <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, cursor: 'pointer' }}>
                        <Typography variant="h6" fontWeight={600} fontSize={17} color="#172B4D" sx={{ mr: 1 }}>
                            Recent course activity
                        </Typography>
                        <ArrowForwardIcon sx={{ color: '#172B4D', fontSize: 20 }} />
                    </Box>

                    {loading ? (
                        <Grid container spacing={3}>
                            {[1, 2, 3].map((i) => (
                                <Grid item xs={12} sm={4} key={i}>
                                    <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 2 }} />
                                </Grid>
                            ))}
                        </Grid>
                    ) : courses.length > 0 ? (
                        <Grid container spacing={3}>
                            {courses.map((course) => (
                                <Grid item xs={12} sm={4} key={course.id}>
                                    <Card
                                        sx={{
                                            border: '1px solid #E8ECEF',
                                            boxShadow: 'none',
                                            borderRadius: 2,
                                            height: '100%',
                                            '&:hover': {
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                            }
                                        }}
                                    >
                                        <CardActionArea onClick={() => handleCourseClick(course.id)}>
                                            <CardMedia
                                                component="img"
                                                height="140"
                                                image={course.image || '/placeholder-course.jpg'}
                                                alt={course.title}
                                                sx={{ bgcolor: '#F4F5F7' }}
                                            />
                                            <Box sx={{ p: 2 }}>
                                                <Typography variant="body1" fontWeight={600} fontSize={15} color="#172B4D" noWrap>
                                                    {course.title}
                                                </Typography>
                                                <Typography variant="body2" color="#6B778C" fontSize={13}>
                                                    {course.code}
                                                </Typography>
                                            </Box>
                                        </CardActionArea>
                                    </Card>
                                </Grid>
                            ))}
                            {courses.length < 3 && (
                                <Grid item xs={12} sm={4}>
                                    <Card
                                        sx={{
                                            border: '1px solid #E8ECEF',
                                            boxShadow: 'none',
                                            borderRadius: 2,
                                            height: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            bgcolor: '#FDF7F2',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => router.push('/instructor/courses/new/edit')}
                                    >
                                        <Box sx={{ textAlign: 'center', p: 3 }}>
                                            <Box sx={{ color: '#F58220', mb: 2 }}>
                                                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                                                    <path d="M24 8L34 24L24 40L14 24L24 8Z" fill="#F58220" />
                                                </svg>
                                            </Box>
                                            <Typography variant="body2" fontWeight={600} color="#172B4D">
                                                New course
                                            </Typography>
                                        </Box>
                                    </Card>
                                </Grid>
                            )}
                        </Grid>
                    ) : (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="body2" color="text.secondary">
                                No recent course activity. Create your first course!
                            </Typography>
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* Middle Section: Overview and Quick actions */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {/* Overview */}
                <Grid item xs={12} md={6}>
                    <Card sx={{ border: '1px solid #DFE1E6', boxShadow: 'none', borderRadius: 2, height: '100%' }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" fontWeight={600} fontSize={16} color="#172B4D" sx={{ mb: 2 }}>
                                Overview
                            </Typography>
                            <Stack spacing={2}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <MenuBookIcon sx={{ color: '#6B778C', fontSize: 20, mr: 1.5 }} />
                                    <Typography variant="body2" color="#42526E" sx={{ flex: 1 }}>Courses</Typography>
                                    <Typography variant="body2" fontWeight={600} color="#172B4D">{totalCourses}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <PeopleIcon sx={{ color: '#6B778C', fontSize: 20, mr: 1.5 }} />
                                    <Typography variant="body2" color="#42526E" sx={{ flex: 1 }}>Assigned learners</Typography>
                                    <Typography variant="body2" fontWeight={600} color="#172B4D">0</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <TrendingUpIcon sx={{ color: '#6B778C', fontSize: 20, mr: 1.5 }} />
                                    <Typography variant="body2" color="#42526E" sx={{ flex: 1 }}>Completion rate</Typography>
                                    <Typography variant="body2" fontWeight={600} color="#172B4D">0.00%</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <AccessTimeIcon sx={{ color: '#6B778C', fontSize: 20, mr: 1.5 }} />
                                    <Typography variant="body2" color="#42526E" sx={{ flex: 1 }}>Training time</Typography>
                                    <Typography variant="body2" fontWeight={600} color="#172B4D">0h 0m</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <AssessmentIcon sx={{ color: '#6B778C', fontSize: 20, mr: 1.5 }} />
                                    <Typography variant="body2" color="#42526E" sx={{ flex: 1 }}>Average progress</Typography>
                                    <Typography variant="body2" fontWeight={600} color="#172B4D">0.00%</Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Quick actions */}
                <Grid item xs={12} md={6}>
                    <Card sx={{ border: '1px solid #DFE1E6', boxShadow: 'none', borderRadius: 2, height: '100%' }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" fontWeight={600} fontSize={16} color="#172B4D" sx={{ mb: 2 }}>
                                Quick actions
                            </Typography>
                            <Stack spacing={1}>
                                {[
                                    { label: 'Add course', icon: <AddIcon />, path: '/instructor/courses/new/edit' },
                                    { label: 'Add group', icon: <GroupsIcon />, path: '/instructor/groups' },
                                    { label: 'Add conference', icon: <VideocamIcon />, path: '/instructor/conferences' },
                                    { label: 'Add discussion', icon: <ChatIcon />, path: '/instructor/discussions' },
                                    { label: 'Training matrix', icon: <TableChartIcon />, path: '/instructor/reports' },
                                ].map((action) => (
                                    <Box
                                        key={action.label}
                                        onClick={() => router.push(action.path)}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1.5,
                                            p: 1,
                                            borderRadius: 1,
                                            cursor: 'pointer',
                                            '&:hover': { bgcolor: '#F4F5F7' }
                                        }}
                                    >
                                        <Box sx={{ color: '#172B4D', display: 'flex' }}>
                                            {React.cloneElement(action.icon as React.ReactElement, { sx: { fontSize: 20 } })}
                                        </Box>
                                        <Typography variant="body2" color="#172B4D" fontWeight={500}>
                                            {action.label}
                                        </Typography>
                                    </Box>
                                ))}
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Bottom Section: Don't miss and Today */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {/* Don't miss */}
                <Grid item xs={12} md={6}>
                    <Card sx={{ border: '1px solid #DFE1E6', boxShadow: 'none', borderRadius: 2, height: '100%' }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" fontWeight={600} fontSize={16} color="#172B4D" sx={{ mb: 2 }}>
                                Don't miss
                            </Typography>
                            <Stack spacing={2}>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#172B4D', mt: 1 }} />
                                    <Typography variant="body2" color="#172B4D">
                                        You have <strong>no items</strong> pending grading. <Button variant="text" size="small" sx={{ textTransform: 'none', p: 0, minWidth: 0, fontWeight: 500, color: '#0052CC' }}>Go to Grading Hub</Button>
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#172B4D', mt: 1 }} />
                                    <Typography variant="body2" color="#172B4D">
                                        You have <strong>no courses</strong> that are expiring soon.
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#172B4D', mt: 1 }} />
                                    <Typography variant="body2" color="#172B4D">
                                        You are <strong>not registered</strong> to attend any online sessions today.
                                    </Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Today */}
                <Grid item xs={12} md={6}>
                    <Card sx={{ border: '1px solid #DFE1E6', boxShadow: 'none', borderRadius: 2, height: '100%' }}>
                        <CardContent sx={{ p: 3 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                                <Typography variant="h6" fontWeight={600} fontSize={16} color="#172B4D">
                                    Today
                                </Typography>
                                <Typography variant="body2" color="#6B778C">
                                    {formattedDate}, {formattedTime}
                                </Typography>
                            </Stack>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                                <CalendarTodayIcon sx={{ color: '#0052CC', fontSize: 40, mb: 1.5, opacity: 0.8 }} />
                                <Typography variant="body2" fontWeight={600} color="#172B4D">
                                    Nothing happening today
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Charts Section */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Card sx={{ border: '1px solid #DFE1E6', boxShadow: 'none', borderRadius: 2 }}>
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                <Typography variant="h6" fontWeight={600} fontSize={16} color="#172B4D" sx={{ mr: 1 }}>
                                    Courses' progress status
                                </Typography>
                                <ArrowForwardIcon sx={{ color: '#6B778C', fontSize: 18, cursor: 'pointer' }} />
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6 }}>
                                <MenuBookIcon sx={{ color: '#0052CC', fontSize: 48, mb: 2, opacity: 0.8 }} />
                                <Typography variant="h6" fontWeight={600} fontSize={18} color="#172B4D" sx={{ mb: 1 }}>
                                    No stats to show
                                </Typography>
                                <Typography variant="body2" color="#6B778C" sx={{ mb: 2 }}>
                                    Create your first course now
                                </Typography>
                                <Button
                                    variant="text"
                                    onClick={() => router.push('/instructor/courses')}
                                    sx={{ textTransform: 'none', color: '#0052CC', fontWeight: 600 }}
                                >
                                    Go to courses
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Card sx={{ border: '1px solid #DFE1E6', boxShadow: 'none', borderRadius: 2 }}>
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                <Typography variant="h6" fontWeight={600} fontSize={16} color="#172B4D" sx={{ mr: 1 }}>
                                    Courses' completion rate
                                </Typography>
                                <ArrowForwardIcon sx={{ color: '#6B778C', fontSize: 18, cursor: 'pointer' }} />
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6 }}>
                                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.5, mb: 2, height: 48 }}>
                                    <Box sx={{ width: 12, height: 20, bgcolor: '#0052CC', opacity: 0.6, borderRadius: '2px 2px 0 0' }} />
                                    <Box sx={{ width: 12, height: 40, bgcolor: '#0052CC', opacity: 0.8, borderRadius: '2px 2px 0 0' }} />
                                    <Box sx={{ width: 12, height: 30, bgcolor: '#0052CC', opacity: 0.6, borderRadius: '2px 2px 0 0' }} />
                                </Box>
                                <Typography variant="h6" fontWeight={600} fontSize={18} color="#172B4D" sx={{ mb: 1 }}>
                                    No stats to show
                                </Typography>
                                <Typography variant="body2" color="#6B778C" sx={{ mb: 2 }}>
                                    Create your first course now
                                </Typography>
                                <Button
                                    variant="text"
                                    onClick={() => router.push('/instructor/courses')}
                                    sx={{ textTransform: 'none', color: '#0052CC', fontWeight: 600 }}
                                >
                                    Go to courses
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Footer */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6, pb: 4 }}>
                {/* Removed Powered by TalentLMS */}
            </Box>
        </Box>
    );
}
