'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    ListItemIcon,
    CircularProgress,
    Chip,
    IconButton,
    Divider,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ArticleIcon from '@mui/icons-material/Article';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import CodeIcon from '@mui/icons-material/Code';
import FolderIcon from '@mui/icons-material/Folder';
import QuizIcon from '@mui/icons-material/Quiz';
import PollIcon from '@mui/icons-material/Poll';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import UnitRenderer from '@/components/course-player/UnitRenderer';

interface CourseUnit {
    id: string;
    type: string;
    title: string;
    content: any;
    order: number;
}

interface Course {
    id: string;
    title: string;
    description?: string;
    status: string;
    units: CourseUnit[];
}

export default function CoursePlayerPage() {
    const params = useParams();
    const router = useRouter();
    const courseId = params.id as string;

    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentUnitIndex, setCurrentUnitIndex] = useState(0);
    const [completedUnits, setCompletedUnits] = useState<Set<string>>(new Set());

    useEffect(() => {
        loadCourse();
    }, [courseId]);

    const loadCourse = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/courses/${courseId}`);
            if (!response.ok) throw new Error('Failed to load course');
            const data = await response.json();
            setCourse(data);
        } catch (error) {
            console.error('Error loading course:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUnitClick = (index: number) => {
        setCurrentUnitIndex(index);
        // Mark previous unit as completed
        if (currentUnitIndex < course!.units.length) {
            const prevUnitId = course!.units[currentUnitIndex].id;
            setCompletedUnits(prev => new Set(prev).add(prevUnitId));
        }
    };

    const handleNext = () => {
        if (currentUnitIndex < (course?.units.length || 0) - 1) {
            handleUnitClick(currentUnitIndex + 1);
        }
    };

    const handlePrevious = () => {
        if (currentUnitIndex > 0) {
            handleUnitClick(currentUnitIndex - 1);
        }
    };

    const getUnitIcon = (type: string) => {
        const iconProps = { fontSize: 'small' as const };
        switch (type) {
            case 'TEXT': return <ArticleIcon {...iconProps} />;
            case 'FILE': return <AttachFileIcon {...iconProps} />;
            case 'VIDEO': return <PlayCircleIcon {...iconProps} />;
            case 'EMBED': return <CodeIcon {...iconProps} />;
            case 'SECTION': return <FolderIcon {...iconProps} />;
            case 'TEST': return <QuizIcon {...iconProps} />;
            case 'SURVEY': return <PollIcon {...iconProps} />;
            default: return <ArticleIcon {...iconProps} />;
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!course) {
        return (
            <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h5" gutterBottom>Course not found</Typography>
                <Button onClick={() => router.back()}>Go Back</Button>
            </Box>
        );
    }

    const currentUnit = course.units[currentUnitIndex];
    const progress = course.units.length > 0
        ? Math.round((completedUnits.size / course.units.length) * 100)
        : 0;

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
            {/* Header */}
            <Box sx={{ bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider', py: 2, px: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <IconButton onClick={() => router.push('/admin/courses')} size="small">
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h5" fontWeight={600} sx={{ flex: 1 }}>
                        {course.title}
                    </Typography>
                    <Chip label={course.status} color={course.status === 'PUBLISHED' ? 'success' : 'default'} size="small" />
                    <Button
                        startIcon={<EditIcon />}
                        onClick={() => router.push(`/admin/courses/new/edit?id=${course.id}`)}
                        size="small"
                    >
                        Edit
                    </Button>
                </Box>
                {course.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 6 }}>
                        {course.description}
                    </Typography>
                )}
                {course.units.length > 0 && (
                    <Box sx={{ ml: 6, mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ flex: 1, height: 8, bgcolor: '#e0e0e0', borderRadius: 1, overflow: 'hidden' }}>
                            <Box
                                sx={{
                                    width: `${progress}%`,
                                    height: '100%',
                                    bgcolor: 'success.main',
                                    transition: 'width 0.3s',
                                }}
                            />
                        </Box>
                        <Typography variant="caption" fontWeight={600} color="text.secondary">
                            {progress}% complete
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* Main Content */}
            <Box sx={{ display: 'flex', height: 'calc(100vh - 140px)' }}>
                {/* Sidebar - Units List */}
                <Box
                    sx={{
                        width: 280,
                        bgcolor: 'white',
                        borderRight: '1px solid',
                        borderColor: 'divider',
                        overflowY: 'auto',
                    }}
                >
                    {course.units.length === 0 ? (
                        <Box sx={{ p: 3, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                No content available
                            </Typography>
                        </Box>
                    ) : (
                        <List sx={{ p: 1 }}>
                            {course.units.map((unit, index) => (
                                <ListItem key={unit.id} disablePadding>
                                    <ListItemButton
                                        selected={index === currentUnitIndex}
                                        onClick={() => handleUnitClick(index)}
                                        sx={{
                                            borderRadius: 1,
                                            mb: 0.5,
                                            '&.Mui-selected': {
                                                bgcolor: 'primary.50',
                                                '&:hover': { bgcolor: 'primary.100' },
                                            },
                                        }}
                                    >
                                        <ListItemIcon sx={{ minWidth: 36 }}>
                                            {completedUnits.has(unit.id) ? (
                                                <CheckCircleIcon fontSize="small" color="success" />
                                            ) : (
                                                getUnitIcon(unit.type)
                                            )}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={unit.title}
                                            primaryTypographyProps={{
                                                variant: 'body2',
                                                fontWeight: index === currentUnitIndex ? 600 : 400,
                                            }}
                                        />
                                    </ListItemButton>
                                </ListItem>
                            ))}
                        </List>
                    )}
                </Box>

                {/* Content Area */}
                <Box sx={{ flex: 1, overflowY: 'auto', p: 4 }}>
                    {currentUnit ? (
                        <Card sx={{ maxWidth: 900, mx: 'auto' }}>
                            <CardContent sx={{ p: 4 }}>
                                <UnitRenderer unit={currentUnit} />

                                {/* Navigation Buttons */}
                                <Divider sx={{ my: 4 }} />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Button
                                        startIcon={<ChevronLeftIcon />}
                                        onClick={handlePrevious}
                                        disabled={currentUnitIndex === 0}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        endIcon={<ChevronRightIcon />}
                                        onClick={handleNext}
                                        disabled={currentUnitIndex === course.units.length - 1}
                                        variant="contained"
                                    >
                                        Next
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    ) : (
                        <Box sx={{ textAlign: 'center', py: 8 }}>
                            <Typography variant="h6" color="text.secondary">
                                Select a unit to begin
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Box>
        </Box>
    );
}
