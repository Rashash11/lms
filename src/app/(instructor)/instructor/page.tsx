'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Card, CardContent, CardMedia, CardActionArea, Skeleton } from '@mui/material';
import Grid from '@mui/material/Grid';
import CelebrationIcon from '@mui/icons-material/Celebration';
import AddIcon from '@mui/icons-material/Add';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
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
        fetch('/api/instructor/courses?limit=2')
            .then(res => res.json())
            .then(data => {
                if (data.courses) {
                    setCourses(data.courses);
                    setTotalCourses(data.total || data.courses.length);
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

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h5" fontWeight={600} color="#172B4D">
                        Welcome, {firstName}!
                    </Typography>
                    <CelebrationIcon sx={{ color: '#FFAB00', fontSize: 24 }} />
                </Box>
                <Button
                    variant="outlined"
                    size="small"
                    endIcon={<KeyboardArrowDownIcon />}
                    sx={{
                        textTransform: 'none',
                        color: '#0052CC',
                        borderColor: '#DFE1E6',
                        fontSize: 13,
                        fontWeight: 500,
                        px: 2,
                        py: 0.75,
                        '&:hover': {
                            borderColor: '#0052CC',
                            bgcolor: '#DEEBFF',
                        }
                    }}
                >
                    Customize
                </Button>
            </Box>

            {/* Recent course activity */}
            <Card sx={{ mb: 3, border: '1px solid #DFE1E6', boxShadow: 'none', borderRadius: 2 }}>
                <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                        <Typography variant="h6" fontWeight={600} fontSize={16} color="#172B4D">
                            Recent course activity
                        </Typography>
                        <ArrowForwardIcon sx={{ color: '#6B778C', fontSize: 18, cursor: 'pointer' }} />
                    </Box>

                    {loading ? (
                        <Grid container spacing={3}>
                            {[1, 2].map((i) => (
                                <Grid item xs={12} sm={6} key={i}>
                                    <Skeleton variant="rectangular" height={150} sx={{ borderRadius: 2 }} />
                                </Grid>
                            ))}
                        </Grid>
                    ) : courses.length > 0 ? (
                        <Grid container spacing={3}>
                            {courses.map((course) => (
                                <Grid item xs={12} sm={6} key={course.id}>
                                    <Card
                                        sx={{
                                            border: '1px solid #E8ECEF',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                                            borderRadius: 2,
                                            '&:hover': {
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                                                transform: 'translateY(-2px)',
                                                transition: 'all 0.2s ease'
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
                                                <Typography
                                                    variant="body1"
                                                    fontWeight={600}
                                                    fontSize={15}
                                                    color="#172B4D"
                                                    gutterBottom
                                                    sx={{
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: 'vertical',
                                                    }}
                                                >
                                                    {course.title}
                                                </Typography>
                                                <Typography variant="body2" color="#6B778C" fontSize={12}>
                                                    {course.code}
                                                </Typography>
                                            </Box>
                                        </CardActionArea>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    ) : (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="body2" color="text.secondary">
                                No recent course activity
                            </Typography>
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* Overview and Quick actions */}
            <Grid container spacing={3}>
                {/* Overview */}
                <Grid item xs={12} md={6}>
                    <Card sx={{ border: '1px solid #DFE1E6', boxShadow: 'none', borderRadius: 2, height: '100%' }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" fontWeight={600} fontSize={16} color="#172B4D" gutterBottom>
                                Overview
                            </Typography>
                            <Box sx={{ mt: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', py: 1.5, borderBottom: '1px solid #F4F5F7' }}>
                                    <Typography variant="body2" color="#42526E" sx={{ flex: 1 }}>
                                        Courses
                                    </Typography>
                                    <Typography variant="h6" fontWeight={600} color="#172B4D">
                                        {totalCourses}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Quick actions */}
                <Grid item xs={12} md={6}>
                    <Card sx={{ border: '1px solid #DFE1E6', boxShadow: 'none', borderRadius: 2, height: '100%' }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" fontWeight={600} fontSize={16} color="#172B4D" gutterBottom>
                                Quick actions
                            </Typography>
                            <Box sx={{ mt: 2 }}>
                                <Box
                                    onClick={() => router.push('/instructor/courses/new/edit')}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1.5,
                                        py: 1.5,
                                        px: 1,
                                        borderRadius: 1,
                                        cursor: 'pointer',
                                        '&:hover': {
                                            bgcolor: '#F4F5F7'
                                        }
                                    }}
                                >
                                    <AddIcon sx={{ color: '#0052CC', fontSize: 20 }} />
                                    <Typography variant="body2" color="#172B4D" fontWeight={500}>
                                        Add course
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}
