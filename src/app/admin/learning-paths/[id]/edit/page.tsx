'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, IconButton, TextField, Button,
    Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem,
    ListItemText, ListItemButton, CircularProgress, Snackbar, Alert, Tooltip, Drawer,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import LockIcon from '@mui/icons-material/Lock';
import { useRouter, useParams } from 'next/navigation';
import AddCourseModal from './components/AddCourseModal';
import LearningPathOptionsPanel from './components/LearningPathOptionsPanel';
import UsersPanel from './components/UsersPanel';

interface Course {
    id: string;
    title: string;
    code: string;
}

interface LearningPathCourse {
    id: string;
    courseId: string;
    order: number;
    sectionId: string | null;
    unlockType: string;
    unlockCourseId: string | null;
    minScore: number | null;
    course: Course;
}

interface Section {
    id: string;
    name: string;
    order: number;
    courses: LearningPathCourse[];
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
    sections?: Section[];
}

export default function EditLearningPathPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [path, setPath] = useState<LearningPath | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showCourseDialog, setShowCourseDialog] = useState(false);
    const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
    const [showUsersDrawer, setShowUsersDrawer] = useState(false);
    const [selectedSection, setSelectedSection] = useState<string | null>(null);
    const [editingSection, setEditingSection] = useState<string | null>(null);
    const [editingSectionName, setEditingSectionName] = useState('');
    const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
    const [refreshKey, setRefreshKey] = useState(0);

    // Fetch learning path
    const fetchPath = useCallback(async () => {
        try {
            const response = await fetch(`/api/learning-paths/${id}`);
            if (response.ok) {
                const data = await response.json();
                setPath(data);
                setRefreshKey(prev => prev + 1); // Force re-render
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
                setAvailableCourses(Array.isArray(data) ? data : (data.courses || []));
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
        if (!path) return;

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
    }, [id, path]);

    // Handle name change
    const handleNameChange = (value: string) => {
        if (!path) return;
        setPath({ ...path, name: value });
    };

    useEffect(() => {
        if (!path || !path.id) return;
        const timeout = setTimeout(() => {
            saveField('name', path.name);
        }, 1000);
        return () => clearTimeout(timeout);
    }, [path?.name]);

    // Handle description change
    const handleDescriptionChange = (value: string) => {
        if (!path) return;
        if (value.length > 5000) return;
        setPath({ ...path, description: value });
    };

    useEffect(() => {
        if (!path || !path.id) return;
        const timeout = setTimeout(() => {
            saveField('description', path.description);
        }, 1000);
        return () => clearTimeout(timeout);
    }, [path?.description]);

    // Toggle status
    const toggleStatus = async () => {
        if (!path) return;
        const newIsActive = !path.isActive;
        await saveField('isActive', newIsActive);
    };

    // Add course callback
    const handleCourseAdded = async () => {
        // If there are no sections yet, create a default one
        if (!path?.sections || path.sections.length === 0) {
            try {
                await fetch(`/api/learning-paths/${id}/sections`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: 'Main Section',
                        order: 1
                    }),
                });
            } catch (error) {
                console.error('Failed to create default section:', error);
            }
        }

        await fetchPath();
        setShowCourseDialog(false);
        setSnackbar({ open: true, message: 'Course added', severity: 'success' });
    };

    // Get unlock tooltip text
    const getUnlockTooltip = (pc: LearningPathCourse): string => {
        if (pc.unlockType === 'NONE') return '';

        const depCourse = path?.courses.find(c => c.courseId === pc.unlockCourseId);
        if (!depCourse) return 'Locked';

        if (pc.unlockType === 'AFTER_COURSE') {
            return `Available after completing "${depCourse.course.title}"`;
        } else if (pc.unlockType === 'AFTER_SCORE') {
            return `Available after passing "${depCourse.course.title}" with ${pc.minScore}%`;
        }
        return 'Locked';
    };

    // Remove course
    const handleRemoveCourse = async (courseId: string) => {
        if (!confirm('Remove this course from the learning path?')) return;

        try {
            const response = await fetch(`/api/learning-paths/${id}/courses?courseId=${courseId}`, {
                method: 'DELETE',
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

    // Add section
    const handleAddSection = async () => {
        const newSectionNumber = (path?.sections?.length || 0) + 1;
        try {
            const response = await fetch(`/api/learning-paths/${id}/sections`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: `section ${newSectionNumber}`,
                    order: newSectionNumber
                }),
            });

            if (response.ok) {
                await fetchPath();
                setSnackbar({ open: true, message: 'Section added', severity: 'success' });
            }
        } catch (error) {
            console.error('Failed to add section:', error);
            setSnackbar({ open: true, message: 'Failed to add section', severity: 'error' });
        }
    };

    // Update section name
    const handleUpdateSectionName = async (sectionId: string, name: string) => {
        try {
            const response = await fetch(`/api/learning-paths/${id}/sections/${sectionId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });

            if (response.ok) {
                await fetchPath();
                setSnackbar({ open: true, message: 'Section updated', severity: 'success' });
            }
        } catch (error) {
            console.error('Failed to update section:', error);
            setSnackbar({ open: true, message: 'Failed to update section', severity: 'error' });
        }
    };

    // Delete section
    const handleDeleteSection = async (sectionId: string) => {
        if (!confirm('Delete this section? Courses will be ungrouped.')) return;

        try {
            const response = await fetch(`/api/learning-paths/${id}/sections/${sectionId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                await fetchPath();
                setSnackbar({ open: true, message: 'Section deleted', severity: 'success' });
            }
        } catch (error) {
            console.error('Failed to delete section:', error);
            setSnackbar({ open: true, message: 'Failed to delete section', severity: 'error' });
        }
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
            {/* Header Section */}
            <Box
                className="hero-glass-card"
                sx={{
                    py: 4,
                    px: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minHeight: 200,
                    m: 2,
                    borderRadius: 2,
                    border: '1px solid rgba(141, 166, 166, 0.2)',
                    background: 'rgba(13, 20, 20, 0.4)',
                }}
            >
                {/* Left Side: Back button and Title */}
                <Box sx={{ flex: 1, pr: 3 }}>
                    <IconButton
                        onClick={() => router.push('/admin/learning-paths')}
                        sx={{
                            color: 'hsl(var(--foreground))',
                            mb: 2,
                            border: '1px solid rgba(141, 166, 166, 0.2)',
                            '&:hover': { bgcolor: 'rgba(141, 166, 166, 0.1)' }
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
                                color: 'hsl(var(--foreground))',
                                fontSize: '2.5rem',
                                fontWeight: 800,
                                bgcolor: 'transparent !important',
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
                            border: '1px solid rgba(141, 166, 166, 0.2)',
                            color: 'hsl(var(--foreground))',
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 1,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            bgcolor: 'rgba(141, 166, 166, 0.1)',
                            '&:hover': {
                                bgcolor: 'rgba(141, 166, 166, 0.2)',
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
                        bgcolor: 'rgba(141, 166, 166, 0.1)',
                        borderRadius: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        border: '1px solid rgba(141, 166, 166, 0.2)',
                        '&:hover': {
                            bgcolor: 'rgba(141, 166, 166, 0.15)',
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
                        <img src={path.image} alt="Path" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                    ) : (
                        <Box sx={{ width: 100, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="80" height="80" viewBox="0 0 100 100">
                                <path d="M20,50 L50,20 L50,50 L70,30 L70,70 L50,50 L50,80 Z" fill="hsl(var(--primary))" />
                                <path d="M50,50 L80,50 L80,80 L50,80 Z" fill="hsl(var(--secondary))" />
                            </svg>
                        </Box>
                    )}
                </Box>
            </Box>

            {/* Main Content */}
            <Box sx={{ flex: 1, py: 4, px: 4 }}>
                <Box sx={{ maxWidth: 900, mx: 'auto' }}>
                    {/* Description Section */}
                    <Box sx={{ mb: 3, textAlign: 'center', p: 2, borderRadius: 2, bgcolor: 'rgba(13, 20, 20, 0.4)', border: '1px solid rgba(141, 166, 166, 0.1)' }}>
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
                                    color: 'hsl(var(--muted-foreground))',
                                    textAlign: 'center',
                                    bgcolor: 'transparent !important',
                                    '& textarea': {
                                        textAlign: 'center',
                                    }
                                },
                            }}
                        />
                    </Box>

                    {/* Add Course Button - Centered */}
                    <Box sx={{ textAlign: 'center', mb: 2 }}>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={async () => {
                                // Create default section if none exist
                                if (!path?.sections || path.sections.length === 0) {
                                    try {
                                        const response = await fetch(`/api/learning-paths/${id}/sections`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                name: 'Main Section',
                                                order: 1
                                            }),
                                        });
                                        if (response.ok) {
                                            await fetchPath(); // Refresh to get the new section
                                        }
                                    } catch (error) {
                                        console.error('Failed to create default section:', error);
                                    }
                                }
                                setShowCourseDialog(true);
                            }}
                            disabled={courseCount >= maxCourses}
                            sx={{
                                bgcolor: 'hsl(var(--primary))',
                                color: 'hsl(var(--primary-foreground))',
                                textTransform: 'none',
                                px: 3,
                                '&:hover': {
                                    bgcolor: 'hsl(var(--primary) / 0.9)',
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
                        <Tooltip title="Manage Users">
                            <IconButton
                                onClick={() => setShowUsersDrawer(true)}
                                sx={{
                                    border: '1px solid rgba(141, 166, 166, 0.2)',
                                    borderRadius: 2,
                                    width: 48,
                                    height: 48,
                                    color: 'hsl(var(--foreground))',
                                    bgcolor: 'rgba(13, 20, 20, 0.4)',
                                    '&:hover': { bgcolor: 'rgba(141, 166, 166, 0.1)', transform: 'translateY(-2px)' }
                                }}
                            >
                                <PersonOutlineIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="General Settings">
                            <IconButton
                                onClick={() => setShowSettingsDrawer(true)}
                                sx={{
                                    border: '1px solid rgba(141, 166, 166, 0.2)',
                                    borderRadius: 2,
                                    width: 48,
                                    height: 48,
                                    color: 'hsl(var(--foreground))',
                                    bgcolor: 'rgba(13, 20, 20, 0.4)',
                                    '&:hover': { bgcolor: 'rgba(141, 166, 166, 0.1)', transform: 'translateY(-2px)' }
                                }}
                            >
                                <SettingsOutlinedIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>

                    {/* Sections and Courses */}
                    {(path.sections && path.sections.length > 0) || path.courses.length > 0 ? (
                        <Box key={refreshKey} sx={{ mt: 4 }}>
                            {/* Display sections with their courses */}
                            {path.sections?.sort((a, b) => a.order - b.order).map((section) => (
                                <Box key={section.id} sx={{ mb: 4 }}>
                                    {/* Section Header */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                        <Typography variant="body1" sx={{ color: 'hsl(var(--muted-foreground))' }}>
                                            ❝
                                        </Typography>
                                        {editingSection === section.id ? (
                                            <TextField
                                                autoFocus
                                                value={editingSectionName}
                                                onChange={(e) => setEditingSectionName(e.target.value)}
                                                onBlur={() => {
                                                    handleUpdateSectionName(section.id, editingSectionName);
                                                    setEditingSection(null);
                                                }}
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter') {
                                                        handleUpdateSectionName(section.id, editingSectionName);
                                                        setEditingSection(null);
                                                    }
                                                }}
                                                size="small"
                                                variant="standard"
                                                sx={{
                                                    flex: 1,
                                                    '& .MuiInput-root': { color: 'hsl(var(--foreground))' }
                                                }}
                                            />
                                        ) : (
                                            <Typography
                                                variant="body1"
                                                onClick={() => {
                                                    setEditingSection(section.id);
                                                    setEditingSectionName(section.name);
                                                }}
                                                sx={{
                                                    flex: 1,
                                                    cursor: 'pointer',
                                                    color: 'hsl(var(--foreground))',
                                                    '&:hover': { color: 'hsl(var(--primary))' }
                                                }}
                                            >
                                                {section.name}
                                            </Typography>
                                        )}
                                        <IconButton
                                            size="small"
                                            onClick={() => handleDeleteSection(section.id)}
                                            sx={{ color: 'hsl(var(--destructive))' }}
                                        >
                                            <DeleteOutlineIcon fontSize="small" />
                                        </IconButton>
                                    </Box>

                                    {/* Courses in section */}
                                    <Box className="glass-card" sx={{
                                        p: 2,
                                        bgcolor: 'rgba(13, 20, 20, 0.4)',
                                        border: '1px solid rgba(141, 166, 166, 0.1)'
                                    }}>
                                        {section.courses.length > 0 ? (
                                            <List sx={{ p: 0 }}>
                                                {section.courses
                                                    .sort((a, b) => a.order - b.order)
                                                    .map((pc, index) => (
                                                        <ListItem
                                                            key={pc.id}
                                                            className="glass-card"
                                                            sx={{
                                                                bgcolor: 'rgba(13, 20, 20, 0.2)',
                                                                mb: index < section.courses.length - 1 ? 1 : 0,
                                                                borderRadius: 1,
                                                                border: '1px solid rgba(141, 166, 166, 0.1)',
                                                            }}
                                                            secondaryAction={
                                                                <IconButton
                                                                    edge="end"
                                                                    onClick={() => handleRemoveCourse(pc.courseId)}
                                                                    sx={{ color: 'hsl(var(--destructive))' }}
                                                                >
                                                                    <DeleteOutlineIcon />
                                                                </IconButton>
                                                            }
                                                        >
                                                            <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                                                                <Typography variant="body2" color="text.secondary">
                                                                    {index + 1}
                                                                </Typography>
                                                            </Box>
                                                            <ListItemText
                                                                primary={
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                        <span>{pc.course.title}</span>
                                                                        {pc.unlockType !== 'NONE' && (
                                                                            <Tooltip title={getUnlockTooltip(pc)} arrow>
                                                                                <LockIcon sx={{ fontSize: 18, color: 'warning.main' }} />
                                                                            </Tooltip>
                                                                        )}
                                                                    </Box>
                                                                }
                                                                secondary={`Code: ${pc.course.code}`}
                                                            />
                                                        </ListItem>
                                                    ))}
                                            </List>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                                                No courses in this section
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>
                            ))}

                            {/* Ungrouped courses (courses without a section) */}
                            {path.courses.filter(c => !c.sectionId).length > 0 && (
                                <Box sx={{ mt: 4 }}>
                                    <List>
                                        {path.courses
                                            .filter(c => !c.sectionId)
                                            .sort((a, b) => a.order - b.order)
                                            .map((pc) => (
                                                <ListItem
                                                    key={pc.id}
                                                    className="glass-card"
                                                    sx={{
                                                        border: '1px solid rgba(141, 166, 166, 0.1)',
                                                        borderRadius: 1,
                                                        mb: 1,
                                                        bgcolor: 'rgba(13, 20, 20, 0.4)',
                                                    }}
                                                    secondaryAction={
                                                        <IconButton
                                                            edge="end"
                                                            onClick={() => handleRemoveCourse(pc.courseId)}
                                                            sx={{ color: 'hsl(var(--destructive))' }}
                                                        >
                                                            <DeleteOutlineIcon />
                                                        </IconButton>
                                                    }
                                                >
                                                    <DragIndicatorIcon sx={{ mr: 2, color: 'text.secondary', cursor: 'grab' }} />
                                                    <ListItemText
                                                        primary={
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <span>{pc.course.title}</span>
                                                                {pc.unlockType !== 'NONE' && (
                                                                    <Tooltip title={getUnlockTooltip(pc)} arrow>
                                                                        <LockIcon sx={{ fontSize: 18, color: 'warning.main' }} />
                                                                    </Tooltip>
                                                                )}
                                                            </Box>
                                                        }
                                                        secondary={`Code: ${pc.course.code} • Order: ${pc.order}`}
                                                    />
                                                </ListItem>
                                            ))}
                                    </List>
                                </Box>
                            )}

                            {/* Add Section Button */}
                            <Box sx={{ mt: 3, textAlign: 'center' }}>
                                <Button
                                    variant="outlined"
                                    startIcon={<AddIcon />}
                                    onClick={handleAddSection}
                                    sx={{
                                        textTransform: 'none',
                                        borderColor: 'rgba(141, 166, 166, 0.2)',
                                        color: 'hsl(var(--muted-foreground))',
                                        '&:hover': {
                                            borderColor: 'hsl(var(--primary))',
                                            color: 'hsl(var(--primary))',
                                            bgcolor: 'rgba(141, 166, 166, 0.1)',
                                        },
                                    }}
                                >
                                    Add section
                                </Button>
                            </Box>
                        </Box>
                    ) : null}
                </Box>
            </Box>

            {/* Course Selection Modal */}
            <AddCourseModal
                open={showCourseDialog}
                onClose={() => setShowCourseDialog(false)}
                pathId={id}
                existingCourses={path.courses}
                availableCourses={availableCourses}
                sections={path.sections}
                onCourseAdded={handleCourseAdded}
            />

            {/* Learning Path Options Panel */}
            <LearningPathOptionsPanel
                open={showSettingsDrawer}
                pathId={id}
                onClose={() => setShowSettingsDrawer(false)}
                onSaved={async () => {
                    await fetchPath();
                    setSnackbar({ open: true, message: 'Settings saved', severity: 'success' });
                }}
            />

            {/* Users Panel */}
            <UsersPanel
                open={showUsersDrawer}
                pathId={id}
                onClose={() => setShowUsersDrawer(false)}
            />

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
