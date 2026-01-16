'use client';

import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Breadcrumbs, Link as MuiLink,
    Card, CardContent, Grid, Button, Stack, Chip,
    LinearProgress, Skeleton, Divider, List, ListItem,
    ListItemText, ListItemAvatar, Avatar
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import RouteIcon from '@mui/icons-material/Route';
import EmojiObjectsOutlinedIcon from '@mui/icons-material/EmojiObjectsOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRouter, useParams } from 'next/navigation';
import Link from '@shared/ui/AppLink';
import Image from 'next/image';

interface SkillDetail {
    id: string;
    name: string;
    description: string;
    image: string | null;
    level: string | null;
    progress: number;
    lastUpdated: string | null;
    userCount: number;
    courses: any[];
    learningPaths: any[];
}

export default function SkillDetailPage() {
    const router = useRouter();
    const params = useParams();
    const skillId = params.id as string;

    const [skill, setSkill] = useState<SkillDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSkillDetail = async () => {
            try {
                const res = await fetch(`/api/instructor/skills/${skillId}`);
                const data = await res.json();
                if (data.skill) {
                    setSkill(data.skill);
                }
            } catch (error) {
                console.error('Failed to fetch skill details:', error);
            } finally {
                setLoading(false);
            }
        };

        if (skillId) {
            fetchSkillDetail();
        }
    }, [skillId]);

    if (loading) {
        return (
            <Box sx={{ maxWidth: 1000, mx: 'auto', p: 3 }}>
                <Skeleton variant="text" width={200} height={30} sx={{ mb: 2 }} />
                <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2, mb: 4 }} />
                <Grid container spacing={4}>
                    <Grid size={{ xs: 12, md: 8 }}>
                        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
                    </Grid>
                </Grid>
            </Box>
        );
    }

    if (!skill) {
        return (
            <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6">Skill not found</Typography>
                <Button onClick={() => router.push('/instructor/skills')} sx={{ mt: 2 }}>
                    Back to Skills
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 1000, mx: 'auto', p: 3 }}>
            {/* Breadcrumbs */}
            <Breadcrumbs
                separator={<NavigateNextIcon fontSize="small" />}
                aria-label="breadcrumb"
                sx={{ mb: 3 }}
            >
                <Link href="/instructor/skills" passHref style={{ textDecoration: 'none' }}>
                    <Typography color="primary" sx={{ fontWeight: 500, '&:hover': { textDecoration: 'underline' } }}>
                        Skills
                    </Typography>
                </Link>
                <Typography color="text.primary" fontWeight={500}>{skill.name}</Typography>
            </Breadcrumbs>

            {/* Header / Intro */}
            <Card sx={{ border: '1px solid #DFE1E6', boxShadow: 'none', borderRadius: 2, mb: 4, overflow: 'visible' }}>
                <CardContent sx={{ p: 4 }}>
                    <Grid container spacing={4} alignItems="center">
                        <Grid size={{ xs: 12, md: 2 }}>
                            <Box sx={{
                                width: 120, height: 120, bgcolor: '#F4F5F7', borderRadius: 3,
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                {skill.image ? (
                                    <Image src={skill.image} alt={skill.name} width={96} height={96} loader={({ src }) => src} unoptimized style={{ maxWidth: '80%', maxHeight: '80%', objectFit: 'contain' }} />
                                ) : (
                                    <EmojiObjectsOutlinedIcon sx={{ fontSize: 64, color: '#DFE1E6' }} />
                                )}
                            </Box>
                        </Grid>
                        <Grid size={{ xs: 12, md: 10 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                <Box>
                                    <Typography variant="h4" fontWeight={700} color="#172B4D" gutterBottom>
                                        {skill.name}
                                    </Typography>
                                    <Typography variant="body1" color="#42526E" sx={{ mb: 2, maxWidth: 600 }}>
                                        {skill.description}
                                    </Typography>
                                    <Stack direction="row" spacing={2}>
                                        <Chip label={`${skill.userCount} skilled users`} size="small" sx={{ bgcolor: '#E3F2FD', color: '#0D47A1', fontWeight: 600 }} />
                                        {skill.lastUpdated && (
                                            <Typography variant="caption" color="#6B778C" sx={{ alignSelf: 'center' }}>
                                                Last active: {new Date(skill.lastUpdated).toLocaleDateString()}
                                            </Typography>
                                        )}
                                    </Stack>
                                </Box>
                                <Button
                                    variant="outlined"
                                    startIcon={<ArrowBackIcon />}
                                    onClick={() => router.back()}
                                    sx={{ textTransform: 'none', fontWeight: 600 }}
                                >
                                    Back
                                </Button>
                            </Stack>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            <Grid container spacing={4}>
                {/* Left Column: Progress and Recommendations */}
                <Grid size={{ xs: 12, md: 7 }}>
                    <Card sx={{ border: '1px solid #DFE1E6', boxShadow: 'none', borderRadius: 2, mb: 4 }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" fontWeight={600} color="#172B4D" gutterBottom>
                                Your progress
                            </Typography>
                            <Box sx={{ mt: 3, p: 3, bgcolor: '#F4F5F7', borderRadius: 2 }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                                    <Typography variant="body1" fontWeight={600}>
                                        {skill.level || 'Not started'}
                                    </Typography>
                                    <Typography variant="body1" fontWeight={700} color="primary">
                                        {skill.progress}%
                                    </Typography>
                                </Stack>
                                <LinearProgress
                                    variant="determinate"
                                    value={skill.progress}
                                    sx={{ height: 10, borderRadius: 5, bgcolor: '#DFE1E6', '& .MuiLinearProgress-bar': { bgcolor: '#F58220' } }}
                                />
                                <Typography variant="caption" color="#6B778C" sx={{ mt: 2, display: 'block' }}>
                                    Complete tasks and courses to increase your skill level.
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>

                    <Card sx={{ border: '1px solid #DFE1E6', boxShadow: 'none', borderRadius: 2 }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" fontWeight={600} color="#172B4D" gutterBottom>
                                About this skill
                            </Typography>
                            <Typography variant="body2" color="#42526E" lineHeight={1.6}>
                                This skill represents proficiency in {skill.name}. It is essential for roles that require a deep understanding of its core principles and applications.
                                By mastering this skill, you demonstrate your capability to handle complex tasks related to {skill.name.toLowerCase()} in a professional environment.
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Right Column: Related Content */}
                <Grid size={{ xs: 12, md: 5 }}>
                    <Stack spacing={4}>
                        {/* Related Courses */}
                        <Card sx={{ border: '1px solid #DFE1E6', boxShadow: 'none', borderRadius: 2 }}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="subtitle1" fontWeight={700} color="#172B4D" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <MenuBookIcon fontSize="small" /> Related courses
                                </Typography>
                                <List disablePadding>
                                    {skill.courses.length > 0 ? skill.courses.map((course, index) => (
                                        <React.Fragment key={course.id}>
                                            <ListItem
                                                disableGutters
                                                sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#F4F5F7' }, borderRadius: 1, px: 1 }}
                                                onClick={() => router.push(`/instructor/courses/${course.id}`)}
                                            >
                                                <ListItemAvatar>
                                                    <Avatar variant="rounded" src={course.thumbnailUrl} sx={{ bgcolor: '#EBECF0' }}>
                                                        <MenuBookIcon fontSize="small" sx={{ color: '#6B778C' }} />
                                                    </Avatar>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={course.title}
                                                    secondary={course.code}
                                                    primaryTypographyProps={{ fontSize: 14, fontWeight: 600, color: '#172B4D' }}
                                                    secondaryTypographyProps={{ fontSize: 12 }}
                                                />
                                            </ListItem>
                                            {index < skill.courses.length - 1 && <Divider component="li" sx={{ my: 1 }} />}
                                        </React.Fragment>
                                    )) : (
                                        <Typography variant="body2" color="#6B778C" sx={{ fontStyle: 'italic', py: 2 }}>
                                            No courses directly related to this skill.
                                        </Typography>
                                    )}
                                </List>
                            </CardContent>
                        </Card>

                        {/* Related Learning Paths */}
                        <Card sx={{ border: '1px solid #DFE1E6', boxShadow: 'none', borderRadius: 2 }}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="subtitle1" fontWeight={700} color="#172B4D" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <RouteIcon fontSize="small" /> Related learning paths
                                </Typography>
                                <List disablePadding>
                                    {skill.learningPaths.length > 0 ? skill.learningPaths.map((path, index) => (
                                        <React.Fragment key={path.id}>
                                            <ListItem
                                                disableGutters
                                                sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#F4F5F7' }, borderRadius: 1, px: 1 }}
                                            >
                                                <ListItemAvatar>
                                                    <Avatar variant="rounded" src={path.image} sx={{ bgcolor: '#EBECF0' }}>
                                                        <RouteIcon fontSize="small" sx={{ color: '#6B778C' }} />
                                                    </Avatar>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={path.name}
                                                    secondary={path.code}
                                                    primaryTypographyProps={{ fontSize: 14, fontWeight: 600, color: '#172B4D' }}
                                                    secondaryTypographyProps={{ fontSize: 12 }}
                                                />
                                            </ListItem>
                                            {index < skill.learningPaths.length - 1 && <Divider component="li" sx={{ my: 1 }} />}
                                        </React.Fragment>
                                    )) : (
                                        <Typography variant="body2" color="#6B778C" sx={{ fontStyle: 'italic', py: 2 }}>
                                            No learning paths related to this skill.
                                        </Typography>
                                    )}
                                </List>
                            </CardContent>
                        </Card>
                    </Stack>
                </Grid>
            </Grid>
        </Box>
    );
}
