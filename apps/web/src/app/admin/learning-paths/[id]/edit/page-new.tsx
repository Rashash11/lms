'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, IconButton, TextField, Button,
    Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem,
    ListItemText, ListItemButton, CircularProgress, Snackbar, Alert,
} from '@mui/material';
import { getCsrfToken } from "@/lib/client-csrf";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';

interface Course {
    id: string;
    title: string;
    code: string;
}

interface LearningPathCourse {
    id: string;
    courseId: string;
    order: number;
    course: Course;
}

interface LearningPath {
    id: string;
    name: string;
    code: string | null;
    description: string | null;
    image: string | null;
    category: string | null;
    status: string;
    isActive: boolean;
    courses: LearningPathCourse[];
}

export default function EditLearningPathPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [path, setPath] = useState<LearningPath | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showCourseDialog, setShowCourseDialog] = useState(false);
    const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    // Fetch learning path
    const fetchPath = useCallback(async () => {
        try {
            const response = await fetch(`/api/learning-paths/${id}`);
            if (response.ok) {
                const data = await response.json();
                setPath(data);
            }
        } catch (error) {
            console.error('Failed to fetch learning path:', error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    // Fetch available courses
    const fetchCourses = async () => {
        try {
            const response = await fetch('/api/courses');
            if (response.ok) {
                const data = await response.json();
                setAvailableCourses(Array.isArray(data) ? data : (data.data || []));
            }
        } catch (error) {
            console.error('Failed to fetch courses:', error);
        }
    };

    useEffect(() => {
        fetchPath();
        fetchCourses();
    }, [fetchPath]);

    // Auto-save function
    const saveField = useCallback(async (field: string, value: any) => {
        if (!id) return;

        setSaving(true);
        try {
            const response = await fetch(`/api/learning-paths/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [field]: value }),
            });

            if (response.ok) {
                const updated = await response.json();
                setPath(updated);
                setSnackbar({ open: true, message: 'Saved', severity: 'success' });
            } else {
                setSnackbar({ open: true, message: 'Failed to save', severity: 'error' });
            }
        } catch (error) {
            console.error('Failed to save:', error);
            setSnackbar({ open: true, message: 'Failed to save', severity: 'error' });
        } finally {
            setSaving(false);
        }
    }, [id]);

    // Handle name change
    const handleNameChange = (value: string) => {
        if (!path) return;
        setPath({ ...path, name: value });
    };

    const pathId = path?.id;
    const pathName = path?.name ?? '';
    const pathDescription = path?.description ?? '';

    useEffect(() => {
        if (!pathId) return;
        const timeout = setTimeout(() => {
            void saveField('name', pathName);
        }, 1000);
        return () => clearTimeout(timeout);
    }, [pathId, pathName, saveField]);

    // Handle description change
    const handleDescriptionChange = (value: string) => {
        if (!path) return;
        if (value.length > 5000) return;
        setPath({ ...path, description: value });
    };

    useEffect(() => {
        if (!pathId) return;
        const timeout = setTimeout(() => {
            void saveField('description', pathDescription);
        }, 1000);
        return () => clearTimeout(timeout);
    }, [pathDescription, pathId, saveField]);

    // Toggle status
    const toggleStatus = async () => {
        if (!path) return;
        const newIsActive = !path.isActive;
        await saveField('isActive', newIsActive);
    };

    // Add course
    const handleAddCourse = async (courseId: string) => {
        try {
            const response = await fetch(`/api/learning-paths/${id}/courses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courseId }),
            });

            if (response.ok) {
                await fetchPath();
                setShowCourseDialog(false);
                setSnackbar({ open: true, message: 'Course added', severity: 'success' });
            } else {
                const error = await response.json();
                setSnackbar({ open: true, message: error.error || 'Failed to add course', severity: 'error' });
            }
        } catch (error) {
            console.error('Failed to add course:', error);
            setSnackbar({ open: true, message: 'Failed to add course', severity: 'error' });
        }
    };

    // Remove course
    const handleRemoveCourse = async (courseId: string) => {
        if (!confirm('Remove this course from the learning path?')) return;

        try {
            const response = await fetch(`/api/learning-paths/${id}/courses?courseId=${courseId}`, {
                method: 'DELETE',
                headers: {
                    'x-csrf-token': getCsrfToken(),
                },
            });

            if (response.ok) {
                await fetchPath();
                setSnackbar({ open: true, message: 'Course removed', severity: 'success' });
            } else {
                setSnackbar({ open: true, message: 'Failed to remove course', severity: 'error' });
            }
        } catch (error) {
            console.error('Failed to remove course:', error);
            setSnackbar({ open: true, message: 'Failed to remove course', severity: 'error' });
        }
    };

    // Handle image upload
    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setSnackbar({ open: true, message: 'Please select an image file', severity: 'error' });
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setSnackbar({ open: true, message: 'Image must be smaller than 5MB', severity: 'error' });
            return;
        }

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = reader.result as string;
            await saveField('image', base64);
        };
        reader.readAsDataURL(file);
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!path) {
        return (
            <Box sx={{ p: 4 }}>
                <Typography>Learning path not found</Typography>
            </Box>
        );
    }

    const courseCount = path.courses.length;
    const maxCourses = 25;

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header Section - Dark Navy Blue */}
            <Box
                sx={{
                    bgcolor: '#1e3a5f',
                    color: 'white',
                    py: 4,
                    px: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minHeight: 200,
                }}
            >
                {/* Left Side: Back button and Title */}
                <Box sx={{ flex: 1, pr: 3 }}>
                    <IconButton
                        onClick={() => router.push('/admin/learning-paths')}
                        sx={{
                            color: 'white',
                            mb: 2,
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                        }}
                    >
                        <ArrowBackIcon />
                    </IconButton>

                    {/* Editable Title */}
                    <TextField
                        fullWidth
                        value={path.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        variant="standard"
                        InputProps={{
                            disableUnderline: true,
                            sx: {
                                color: 'white',
                                fontSize: '2rem',
                                fontWeight: 600,
                                '& input': {
                                    padding: 0,
                                },
                            },
                        }}
                        sx={{ mb: 2 }}
                    />

                    {/* Status Badge */}
                    <Box
                        onClick={toggleStatus}
                        sx={{
                            display: 'inline-block',
                            border: '1px solid rgba(255,255,255,0.4)',
                            color: 'white',
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 1,
                            fontSize: '0.75rem',
                            fontWeight: 400,
                            cursor: 'pointer',
                            '&:hover': {
                                bgcolor: 'rgba(255,255,255,0.1)',
                            },
                        }}
                    >
                        {path.isActive ? "Active" : "Inactive"}
                    </Box>

                    {saving && (
                        <Typography variant="caption" sx={{ ml: 2, opacity: 0.8 }}>
                            Saving...
                        </Typography>
                    )}
                </Box>

                {/* Right Side: Image Upload */}
                <Box
                    component="label"
                    htmlFor="image-upload"
                    sx={{
                        width: 280,
                        height: 180,
                        bgcolor: '#f5e6d3',
                        borderRadius: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        '&:hover': {
                            bgcolor: '#eddcc4',
                        },
                    }}
                >
                    <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={handleImageUpload}
                    />
                    {path.image ? (
                        <Image src={path.image} alt="Path" width={280} height={180} loader={({ src }) => src} unoptimized style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                    ) : (
                        <Box sx={{ width: 100, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="80" height="80" viewBox="0 0 100 100">
                                <path d="M20,50 L50,20 L50,50 L70,30 L70,70 L50,50 L50,80 Z" fill="#1e3a5f" />
                                <path d="M50,50 L80,50 L80,80 L50,80 Z" fill="#ff9933" />
                            </svg>
                        </Box>
                    )}
                </Box>
            </Box>

            {/* Main Content */}
            <Box sx={{ flex: 1, bgcolor: 'white', py: 4, px: 4 }}>
                <Box sx={{ maxWidth: 900, mx: 'auto' }}>
                    {/* Description Section */}
                    <Box sx={{ mb: 3, textAlign: 'center' }}>
                        <TextField
                            fullWidth
                            multiline
                            rows={1}
                            placeholder="Add a learning path description up to 5000 characters"
                            value={path.description || ''}
                            onChange={(e) => handleDescriptionChange(e.target.value)}
                            variant="standard"
                            inputProps={{ maxLength: 5000 }}
                            InputProps={{
                                disableUnderline: true,
                                sx: {
                                    fontSize: '0.875rem',
                                    color: '#999',
                                    textAlign: 'center',
                                },
                            }}
                        />
                    </Box>

                    {/* Add Course Button - Centered */}
                    <Box sx={{ textAlign: 'center', mb: 2 }}>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => setShowCourseDialog(true)}
                            disabled={courseCount >= maxCourses}
                            sx={{
                                bgcolor: '#1976d2',
                                textTransform: 'none',
                                px: 3,
                                '&:hover': {
                                    bgcolor: '#1565c0',
                                },
                            }}
                        >
                            Add course
                        </Button>
                    </Box>

                    {/* Helper Text */}
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ textAlign: 'center', mb: 4 }}
                    >
                        Add course here to build your learning path.
                    </Typography>

                    {/* Bottom Icons */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 8 }}>
                        <IconButton
                            sx={{
                                border: '1px solid #e0e0e0',
                                borderRadius: 1,
                                p: 1.5,
                            }}
                        >
                            <PersonOutlineIcon />
                        </IconButton>
                        <IconButton
                            sx={{
                                border: '1px solid #e0e0e0',
                                borderRadius: 1,
                                p: 1.5,
                            }}
                        >
                            <SettingsOutlinedIcon />
                        </IconButton>
                    </Box>

                    {/* Courses List (hidden when no courses) */}
                    {path.courses.length > 0 && (
                        <Box sx={{ mt: 4 }}>
                            <Typography variant="h6" fontWeight={600} gutterBottom>
                                Courses ({courseCount}/{maxCourses})
                            </Typography>
                            <List>
                                {path.courses
                                    .sort((a, b) => a.order - b.order)
                                    .map((pc) => (
                                        <ListItem
                                            key={pc.id}
                                            sx={{
                                                border: '1px solid #e0e0e0',
                                                borderRadius: 1,
                                                mb: 1,
                                                bgcolor: 'white',
                                            }}
                                            secondaryAction={
                                                <IconButton
                                                    edge="end"
                                                    onClick={() => handleRemoveCourse(pc.courseId)}
                                                    sx={{ color: 'error.main' }}
                                                >
                                                    <DeleteOutlineIcon />
                                                </IconButton>
                                            }
                                        >
                                            <DragIndicatorIcon sx={{ mr: 2, color: 'text.secondary', cursor: 'grab' }} />
                                            <ListItemText
                                                primary={pc.course.title}
                                                secondary={`Code: ${pc.course.code} • Order: ${pc.order}`}
                                            />
                                        </ListItem>
                                    ))}
                            </List>
                        </Box>
                    )}
                </Box>
            </Box>

            {/* Course Selection Dialog */}
            <Dialog
                open={showCourseDialog}
                onClose={() => setShowCourseDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Add Course to Learning Path</DialogTitle>
                <DialogContent>
                    <List>
                        {availableCourses
                            .filter(c => !path.courses.some(pc => pc.courseId === c.id))
                            .map((course) => (
                                <ListItem
                                    key={course.id}
                                    disablePadding
                                    sx={{
                                        border: '1px solid #e0e0e0',
                                        borderRadius: 1,
                                        mb: 1,
                                    }}
                                >
                                    <ListItemButton onClick={() => handleAddCourse(course.id)}>
                                        <ListItemText
                                            primary={course.title}
                                            secondary={`Code: ${course.code}`}
                                        />
                                    </ListItemButton>
                                </ListItem>
                            ))}
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowCourseDialog(false)}>Cancel</Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar Notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
