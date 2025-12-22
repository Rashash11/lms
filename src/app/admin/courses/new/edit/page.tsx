'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Box,
    Typography,
    Button,
    IconButton,
    Tabs,
    Tab,
    Drawer,
    Menu,
    MenuItem,
    TextField,
    Switch,
    FormControlLabel,
    Chip,
    Card,
    CardContent,
    Snackbar,
    Alert,
    Select,
    FormControl,
    InputLabel,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    ListItemSecondaryAction,
    Avatar,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Checkbox,
    InputAdornment,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ArticleIcon from '@mui/icons-material/Article';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import CodeIcon from '@mui/icons-material/Code';
import FolderIcon from '@mui/icons-material/Folder';
import QuizIcon from '@mui/icons-material/Quiz';
import PollIcon from '@mui/icons-material/Poll';

// Modal components
import TextUnitModal from '@/components/admin/course-editor/TextUnitModal';
import FileUnitModal from '@/components/admin/course-editor/FileUnitModal';
import VideoUnitModal from '@/components/admin/course-editor/VideoUnitModal';
import EmbedUnitModal from '@/components/admin/course-editor/EmbedUnitModal';
import SectionUnitModal from '@/components/admin/course-editor/SectionUnitModal';
import TestUnitModal from '@/components/admin/course-editor/TestUnitModal';
import SurveyUnitModal from '@/components/admin/course-editor/SurveyUnitModal';

interface CourseUnit {
    id: string;
    type: 'TEXT' | 'FILE' | 'VIDEO' | 'EMBED' | 'SECTION' | 'TEST' | 'SURVEY' | 'ASSIGNMENT' | 'ILT' | 'SCORM' | 'XAPI' | 'CMI5' | 'TALENTCRAFT';
    title: string;
    content?: any;
    status?: 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED_CHANGES';
    order?: number;
}

interface CourseData {
    id?: string;
    code: string;
    title: string;
    description?: string;
    image?: string;
    status: 'DRAFT' | 'PUBLISHED';
    // Info tab
    isActive: boolean;
    coachEnabled: boolean;
    categoryId?: string | null;
    introVideoType?: string | null;
    introVideoUrl?: string | null;
    price?: number | null;
    contentLocked: boolean;
    // Availability tab
    showInCatalog: boolean;
    capacity?: number | null;
    publicSharingEnabled: boolean;
    enrollmentRequestEnabled: boolean;
    // Limits tab
    timeLimitType?: string | null;
    timeLimit?: number | null;
    accessRetentionEnabled: boolean;
    requiredLevel?: number | null;
    // Completion tab
    unitsOrdering: 'sequential' | 'any';
    completionRule: 'all' | 'any';
    scoreCalculation: 'all' | 'tests' | 'assignments';
    certificateTemplateId?: string | null;
}

interface EnrollmentUser {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
}

interface Enrollment {
    id: string;
    userId: string;
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'EXPIRED';
    progress: number;
    enrolledAt: string;
    user: EnrollmentUser | null;
}

interface SearchUser {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
}

const createEmptyCourseData = (): CourseData => ({
    code: `COURSE-${Date.now()}`,
    title: 'New course',
    status: 'DRAFT',
    isActive: false,
    coachEnabled: false,
    contentLocked: false,
    showInCatalog: true,
    publicSharingEnabled: false,
    enrollmentRequestEnabled: false,
    accessRetentionEnabled: false,
    unitsOrdering: 'sequential',
    completionRule: 'all',
    scoreCalculation: 'all',
});

function CourseEditorContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [courseId, setCourseId] = useState<string | null | undefined>(undefined);

    // Detect if we're in instructor or admin area based on current path
    const [isInstructorArea, setIsInstructorArea] = useState(false);

    useEffect(() => {
        setIsInstructorArea(window.location.pathname.startsWith('/instructor'));
    }, []);

    // Course state
    const [course, setCourse] = useState<CourseData>(() => createEmptyCourseData());

    const [units, setUnits] = useState<CourseUnit[]>([]);
    const [currentTab, setCurrentTab] = useState(0);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    // Drawer states
    const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false);
    const [enrollmentsDrawerOpen, setEnrollmentsDrawerOpen] = useState(false);
    const [settingsTab, setSettingsTab] = useState(0);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Menu states
    const [addMenuAnchor, setAddMenuAnchor] = useState<null | HTMLElement>(null);
    const [unitMenuAnchor, setUnitMenuAnchor] = useState<null | HTMLElement>(null);
    const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

    // Enrollment state
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);
    const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
    const [searchUsers, setSearchUsers] = useState<SearchUser[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchLoading, setSearchLoading] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [enrolling, setEnrolling] = useState(false);

    // Unit modal states
    const [activeModal, setActiveModal] = useState<CourseUnit['type'] | null>(null);
    const [editingUnit, setEditingUnit] = useState<CourseUnit | null>(null);

    const createNewCourse = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/courses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(createEmptyCourseData()),
            });

            if (!response.ok) {
                const errorBody = await response.json().catch(() => null);
                throw new Error(errorBody?.error || 'Failed to create course');
            }

            const newCourse = await response.json();
            setCourse(newCourse);
            setCourseId(newCourse.id);

            const basePath = window.location.pathname.startsWith('/instructor') ? '/instructor' : '/admin';
            router.replace(`${basePath}/courses/new/edit?id=${newCourse.id}`);

            setSnackbar({ open: true, message: 'Course created', severity: 'success' });
        } catch (error) {
            console.error('Error creating course:', error);
            const message = error instanceof Error ? error.message : 'Failed to create course';
            setSnackbar({ open: true, message, severity: 'error' });
        } finally {
            setLoading(false);
        }
    }, [router]);

    const loadCourse = useCallback(async (id: string) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/courses/${id}`);

            if (!response.ok) throw new Error('Failed to load course');

            const data = await response.json();
            setCourse(data);
            setUnits(data.units || []);
        } catch (error) {
            console.error('Error loading course:', error);
            setSnackbar({ open: true, message: 'Failed to load course', severity: 'error' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        setCourseId(searchParams.get('id') ?? null);
    }, [searchParams]);

    useEffect(() => {
        if (courseId === undefined) return;
        if (courseId) {
            if (course.id !== courseId) {
                loadCourse(courseId);
            }
        } else {
            createNewCourse();
        }
    }, [courseId, course.id, loadCourse, createNewCourse]);

    // Debounced save function
    const saveCourse = useCallback(
        async (updates: Partial<CourseData>) => {
            if (!course.id) return;

            try {
                setSaving(true);
                const response = await fetch(`/api/courses/${course.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updates),
                });

                if (!response.ok) {
                    const errorBody = await response.json().catch(() => null);
                    throw new Error(errorBody?.error || 'Failed to save course');
                }

                const updated = await response.json();
                setCourse(prev => ({ ...prev, ...updated }));
            } catch (error) {
                console.error('Error saving course:', error);
                const message = error instanceof Error ? error.message : 'Failed to save changes';
                setSnackbar({ open: true, message, severity: 'error' });
            } finally {
                setSaving(false);
            }
        },
        [course.id]
    );

    // Auto-save with debouncing
    const autosaveUpdates = useMemo(
        () => ({ title: course.title, description: course.description }),
        [course.title, course.description]
    );

    useEffect(() => {
        if (!course.id) return;

        const timeoutId = setTimeout(() => {
            saveCourse(autosaveUpdates);
        }, 1500);

        return () => clearTimeout(timeoutId);
    }, [course.id, autosaveUpdates, saveCourse]);

    const handlePublish = async () => {
        if (!course.id) return;

        try {
            const response = await fetch(`/api/courses/${course.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'publish' }),
            });

            if (!response.ok) throw new Error('Failed to publish course');

            const updated = await response.json();
            setCourse(updated);
            setSnackbar({ open: true, message: 'Course published successfully', severity: 'success' });
        } catch (error) {
            console.error('Error publishing course:', error);
            setSnackbar({ open: true, message: 'Failed to publish course', severity: 'error' });
        }
    };

    const handleAddUnit = (type: CourseUnit['type']) => {
        if (!course.id) return;
        setEditingUnit(null);
        setActiveModal(type);
        setAddMenuAnchor(null);
    };

    const handleEditUnit = (unit: CourseUnit) => {
        setEditingUnit(unit);
        setActiveModal(unit.type);
    };

    const handleUnitSaved = (unit: CourseUnit) => {
        if (editingUnit) {
            // Update existing unit
            setUnits(prev => prev.map(u => u.id === unit.id ? unit : u));
            setSnackbar({ open: true, message: 'Unit updated', severity: 'success' });
        } else {
            // Add new unit
            setUnits(prev => [...prev, unit]);
            setSnackbar({ open: true, message: 'Unit added', severity: 'success' });
        }
        setEditingUnit(null);
        setActiveModal(null);
    };

    const getUnitIcon = (type: CourseUnit['type']) => {
        const iconProps = { fontSize: 'small' as const, sx: { mr: 1 } };
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

    const handleDeleteUnit = async (id: string) => {
        if (!course.id) return;

        try {
            const response = await fetch(`/api/courses/${course.id}/units/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Failed to delete unit');

            setUnits(prev => prev.filter(u => u.id !== id));
            setUnitMenuAnchor(null);
            setSnackbar({ open: true, message: 'Unit deleted', severity: 'success' });
        } catch (error) {
            console.error('Error deleting unit:', error);
            setSnackbar({ open: true, message: 'Failed to delete unit', severity: 'error' });
        }
    };

    const handleDuplicate = async () => {
        if (!course.id) return;

        try {
            const response = await fetch(`/api/courses/${course.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'clone' }),
            });

            if (!response.ok) throw new Error('Failed to duplicate course');

            const cloned = await response.json();
            const basePath = isInstructorArea ? '/instructor' : '/admin';
            router.push(`${basePath}/courses/new/edit?id=${cloned.id}`);
            setSnackbar({ open: true, message: 'Course duplicated', severity: 'success' });
        } catch (error) {
            console.error('Error duplicating course:', error);
            setSnackbar({ open: true, message: 'Failed to duplicate course', severity: 'error' });
        }
    };

    const handleSettingsSave = async () => {
        if (!course.id) return;

        try {
            await saveCourse(course);
            setSettingsDrawerOpen(false);
            setSnackbar({ open: true, message: 'Settings saved', severity: 'success' });
        } catch (error) {
            setSnackbar({ open: true, message: 'Failed to save settings', severity: 'error' });
        }
    };

    // Fetch enrollments when drawer opens
    const fetchEnrollments = useCallback(async () => {
        if (!course.id) return;
        setEnrollmentsLoading(true);
        try {
            const response = await fetch(`/api/courses/${course.id}/enrollments`);
            if (response.ok) {
                const data = await response.json();
                setEnrollments(data.enrollments || []);
            }
        } catch (error) {
            console.error('Error fetching enrollments:', error);
        } finally {
            setEnrollmentsLoading(false);
        }
    }, [course.id]);

    useEffect(() => {
        if (enrollmentsDrawerOpen && course.id) {
            fetchEnrollments();
        }
    }, [enrollmentsDrawerOpen, course.id, fetchEnrollments]);

    // Search users for enrollment
    const searchUsersForEnrollment = useCallback(async (query: string) => {
        if (!course.id) return;
        setSearchLoading(true);
        try {
            const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}&excludeCourseId=${course.id}&limit=20`);
            if (response.ok) {
                const data = await response.json();
                setSearchUsers(data.users || []);
            }
        } catch (error) {
            console.error('Error searching users:', error);
        } finally {
            setSearchLoading(false);
        }
    }, [course.id]);

    useEffect(() => {
        if (enrollDialogOpen) {
            const timeoutId = setTimeout(() => {
                searchUsersForEnrollment(searchQuery);
            }, 300);
            return () => clearTimeout(timeoutId);
        }
    }, [enrollDialogOpen, searchQuery, searchUsersForEnrollment]);

    const handleEnrollUsers = async () => {
        if (!course.id || selectedUsers.length === 0) return;
        setEnrolling(true);
        try {
            const response = await fetch(`/api/courses/${course.id}/enrollments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userIds: selectedUsers }),
            });
            if (response.ok) {
                const data = await response.json();
                setSnackbar({ open: true, message: `Enrolled ${data.enrolled} user(s)`, severity: 'success' });
                setEnrollDialogOpen(false);
                setSelectedUsers([]);
                setSearchQuery('');
                fetchEnrollments();
            } else {
                const error = await response.json();
                setSnackbar({ open: true, message: error.error || 'Failed to enroll users', severity: 'error' });
            }
        } catch (error) {
            setSnackbar({ open: true, message: 'Failed to enroll users', severity: 'error' });
        } finally {
            setEnrolling(false);
        }
    };

    const handleRemoveEnrollment = async (enrollmentId: string) => {
        if (!course.id) return;
        try {
            const response = await fetch(`/api/courses/${course.id}/enrollments?enrollmentId=${enrollmentId}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                setEnrollments(prev => prev.filter(e => e.id !== enrollmentId));
                setSnackbar({ open: true, message: 'User removed from course', severity: 'success' });
            }
        } catch (error) {
            setSnackbar({ open: true, message: 'Failed to remove user', severity: 'error' });
        }
    };

    if (loading && !course.id) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        // Full screen container
        <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', bgcolor: '#f5f5f5', zIndex: 1300 }}>
            {/* Top Bar */}
            <Box
                sx={{
                    height: 56,
                    bgcolor: '#003d82',
                    display: 'flex',
                    alignItems: 'center',
                    px: 2,
                    gap: 2,
                    flexShrink: 0,
                }}
            >
                <IconButton
                    sx={{ color: 'white' }}
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                    <MenuIcon />
                </IconButton>
                <Button
                    variant="contained"
                    sx={{
                        bgcolor: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                        textTransform: 'none',
                    }}
                    onClick={handlePublish}
                    disabled={!course.id || saving}
                >
                    Publish
                </Button>
                {saving && <CircularProgress size={20} sx={{ color: 'white' }} />}
            </Box>

            {/* Content Container */}
            <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Left Panel */}
                <Box
                    sx={{
                        width: sidebarOpen ? 266 : 0,
                        bgcolor: 'white',
                        borderRight: sidebarOpen ? '1px solid #e0e0e0' : 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        flexShrink: 0,
                        transition: 'width 0.3s ease-in-out',
                    }}
                >
                    {/* Back Link */}
                    <Box sx={{ p: 2, pb: 1 }}>
                        <Typography
                            variant="body2"
                            sx={{ color: '#1976d2', cursor: 'pointer', '&:hover': { textDecoration: ' underline' } }}
                            onClick={() => router.push(isInstructorArea ? '/instructor/courses' : '/admin/courses')}
                        >
                            Back
                        </Typography>
                    </Box>

                    {/* Title */}
                    <Box sx={{ px: 2, pb: 2 }}>
                        <Typography variant="h6" fontWeight={600} sx={{ fontSize: '1.1rem' }}>
                            {course.title}
                        </Typography>
                    </Box>

                    {/* Action Buttons */}
                    <Box sx={{ px: 2, pb: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={(e) => setAddMenuAnchor(e.currentTarget)}
                            size="small"
                            sx={{ textTransform: 'none', fontSize: '0.875rem' }}
                            disabled={!course.id}
                        >
                            Add
                        </Button>
                        <IconButton
                            size="small"
                            sx={{ border: '1px solid #e0e0e0', width: 32, height: 32 }}
                            onClick={() => setEnrollmentsDrawerOpen(true)}
                            disabled={!course.id}
                        >
                            <PeopleOutlineIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                        <IconButton
                            size="small"
                            sx={{ border: '1px solid #e0e0e0', width: 32, height: 32 }}
                            onClick={handleDuplicate}
                            disabled={!course.id}
                        >
                            <ContentCopyIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                        <IconButton
                            size="small"
                            sx={{ border: '1px solid #e0e0e0', width: 32, height: 32 }}
                            onClick={() => setSettingsDrawerOpen(true)}
                            disabled={!course.id}
                        >
                            <SettingsIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Box>

                    {/* Empty State / Units List */}
                    {units.length === 0 ? (
                        <Box
                            sx={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                p: 3,
                                textAlign: 'center',
                            }}
                        >
                            <FolderOpenOutlinedIcon sx={{ fontSize: 48, color: '#615e61ff', mb: 2 }} />
                            <Typography
                                variant="body2"
                                sx={{ color: '#1976d23f', cursor: 'pointer', mb: 1, fontWeight: 500 }}
                                onClick={(e) => setAddMenuAnchor(e.currentTarget)}
                            >
                                Add content to your course
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                                Drag and drop files here, or click the Add button above, to build your course.
                            </Typography>
                        </Box>
                    ) : (
                        <List sx={{ px: 2, flex: 1 }}>
                            {units.map((unit) => (
                                <Card
                                    key={unit.id}
                                    sx={{
                                        mb: 1,
                                        cursor: 'pointer',
                                        '&:hover': { bgcolor: 'action.hover' },
                                    }}
                                    onClick={() => handleEditUnit(unit)}
                                >
                                    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                        <DragIndicatorIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                                        {getUnitIcon(unit.type)}
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="body2" fontWeight={500}>
                                                {unit.title}
                                            </Typography>
                                            <Chip
                                                label={unit.type}
                                                size="small"
                                                sx={{ mt: 0.5, height: 20, fontSize: '0.7rem' }}
                                            />
                                        </Box>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setUnitMenuAnchor(e.currentTarget);
                                                setSelectedUnitId(unit.id);
                                            }}
                                        >
                                            <MoreVertIcon fontSize="small" />
                                        </IconButton>
                                    </CardContent>
                                </Card>
                            ))}
                        </List>
                    )}
                </Box>

                {/* Main Content Area */}
                <Box sx={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
                    {/* Hero Section */}
                    <Box
                        sx={{
                            bgcolor: '#003d82',
                            p: 4,
                            display: 'flex',
                            gap: 4,
                            alignItems: 'center',
                            flexShrink: 0,
                        }}
                    >
                        <Box sx={{ flex: 1 }}>
                            <TextField
                                value={course.title}
                                onChange={(e) => setCourse(prev => ({ ...prev, title: e.target.value }))}
                                variant="standard"
                                fullWidth
                                InputProps={{
                                    disableUnderline: true,
                                    sx: {
                                        color: 'white',
                                        fontSize: '2rem',
                                        fontWeight: 600,
                                    },
                                }}
                            />
                        </Box>
                        <Box
                            sx={{
                                width: 270,
                                height: 200,
                                bgcolor: '#f5e6d3',
                                borderRadius: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            {/* TalentLMS-style abstract logo */}
                            <svg width="120" height="120" viewBox="0 0 100 100">
                                <path d="M30 20 L50 40 L30 60 Z" fill="#003d82" />
                                <path d="M50 40 L70 20 L70 60 Z" fill="#ff8c42" />
                            </svg>
                        </Box>
                    </Box>

                    {/* Description Helper */}
                    <Box sx={{ px: 4, py: 2, bgcolor: 'white', flexShrink: 0 }}>
                        <Typography variant="body2" color="text.secondary">
                            Add a course description up to 5000 characters
                        </Typography>
                    </Box>

                    {/* Tabs */}
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'white', px: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                        <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)}>
                            <Tab label="Content" />
                            <Tab label="Files" />
                        </Tabs>
                        <Typography variant="caption" color="text.secondary">
                            All units must be completed
                        </Typography>
                    </Box>

                    {/* Tab Content */}
                    <Box sx={{ p: 4, flex: 1, overflow: 'auto' }}>
                        {currentTab === 0 && (
                            <Card
                                sx={{
                                    minHeight: 400,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '2px dashed #e0e0e0',
                                    cursor: 'pointer',
                                    '&:hover': {
                                        bgcolor: '#f5f5f5',
                                        borderColor: '#1976d2'
                                    }
                                }}
                                onClick={(e) => setAddMenuAnchor(e.currentTarget)}
                            >
                                <Box sx={{ textAlign: 'center', p: 4 }}>
                                    <FolderOpenOutlinedIcon sx={{ fontSize: 64, color: '#1976d2', mb: 2 }} />
                                    <Typography variant="h6" color="primary" gutterBottom fontWeight={600}>
                                        This course is empty
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Click here or the Add button to the left to build your course.
                                    </Typography>
                                </Box>
                            </Card>
                        )}
                        {currentTab === 1 && (
                            <Card sx={{ minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Box sx={{ textAlign: 'center', p: 4 }}>
                                    <UploadFileOutlinedIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                                    <Typography variant="h6" gutterBottom>
                                        No files uploaded yet
                                    </Typography>
                                    <Button variant="outlined" sx={{ mt: 2 }}>
                                        Upload files
                                    </Button>
                                </Box>
                            </Card>
                        )}
                    </Box>
                </Box>
            </Box>

            {/* Add Menu */}
            <Menu anchorEl={addMenuAnchor} open={Boolean(addMenuAnchor)} onClose={() => setAddMenuAnchor(null)}>
                <MenuItem onClick={() => handleAddUnit('TEXT')}>
                    <ArticleIcon fontSize="small" sx={{ mr: 1 }} /> Text
                </MenuItem>
                <MenuItem onClick={() => handleAddUnit('FILE')}>
                    <AttachFileIcon fontSize="small" sx={{ mr: 1 }} /> File
                </MenuItem>
                <MenuItem onClick={() => handleAddUnit('VIDEO')}>
                    <PlayCircleIcon fontSize="small" sx={{ mr: 1 }} /> Video
                </MenuItem>
                <MenuItem onClick={() => handleAddUnit('EMBED')}>
                    <CodeIcon fontSize="small" sx={{ mr: 1 }} /> Embed
                </MenuItem>
                <MenuItem onClick={() => handleAddUnit('SECTION')}>
                    <FolderIcon fontSize="small" sx={{ mr: 1 }} /> Section
                </MenuItem>
                <MenuItem onClick={() => handleAddUnit('TEST')}>
                    <QuizIcon fontSize="small" sx={{ mr: 1 }} /> Test
                </MenuItem>
                <MenuItem onClick={() => handleAddUnit('SURVEY')}>
                    <PollIcon fontSize="small" sx={{ mr: 1 }} /> Survey
                </MenuItem>
            </Menu>

            {/* Unit Menu */}
            <Menu anchorEl={unitMenuAnchor} open={Boolean(unitMenuAnchor)} onClose={() => setUnitMenuAnchor(null)}>
                <MenuItem onClick={() => {
                    const unit = units.find(u => u.id === selectedUnitId);
                    if (unit) handleEditUnit(unit);
                    setUnitMenuAnchor(null);
                }}>Edit</MenuItem>
                <MenuItem
                    onClick={() => selectedUnitId && handleDeleteUnit(selectedUnitId)}
                    sx={{ color: 'error.main' }}
                >
                    Delete
                </MenuItem>
            </Menu>

            {/* Unit Modals */}
            <TextUnitModal
                open={activeModal === 'TEXT'}
                onClose={() => { setActiveModal(null); setEditingUnit(null); }}
                courseId={course.id || ''}
                onSave={handleUnitSaved}
                editUnit={editingUnit}
            />
            <FileUnitModal
                open={activeModal === 'FILE'}
                onClose={() => { setActiveModal(null); setEditingUnit(null); }}
                courseId={course.id || ''}
                onSave={handleUnitSaved}
                editUnit={editingUnit}
            />
            <VideoUnitModal
                open={activeModal === 'VIDEO'}
                onClose={() => { setActiveModal(null); setEditingUnit(null); }}
                courseId={course.id || ''}
                onSave={handleUnitSaved}
                editUnit={editingUnit}
            />
            <EmbedUnitModal
                open={activeModal === 'EMBED'}
                onClose={() => { setActiveModal(null); setEditingUnit(null); }}
                courseId={course.id || ''}
                onSave={handleUnitSaved}
                editUnit={editingUnit}
            />
            <SectionUnitModal
                open={activeModal === 'SECTION'}
                onClose={() => { setActiveModal(null); setEditingUnit(null); }}
                courseId={course.id || ''}
                onSave={handleUnitSaved}
                editUnit={editingUnit}
            />
            <TestUnitModal
                open={activeModal === 'TEST'}
                onClose={() => { setActiveModal(null); setEditingUnit(null); }}
                courseId={course.id || ''}
                onSave={handleUnitSaved}
                editUnit={editingUnit}
            />
            <SurveyUnitModal
                open={activeModal === 'SURVEY'}
                onClose={() => { setActiveModal(null); setEditingUnit(null); }}
                courseId={course.id || ''}
                onSave={handleUnitSaved}
                editUnit={editingUnit}
            />

            {/* Settings Drawer */}
            <Drawer
                anchor="right"
                open={settingsDrawerOpen}
                onClose={() => setSettingsDrawerOpen(false)}
                PaperProps={{ sx: { width: 800 } }}
                sx={{ zIndex: 1400 }}
            >
                <Box sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Course options
                    </Typography>
                    <Tabs value={settingsTab} onChange={(e, v) => setSettingsTab(v)} sx={{ mb: 3 }}>
                        <Tab label="Info" />
                        <Tab label="Availability" />
                        <Tab label="Limits" />
                        <Tab label="Completion" />
                        <Tab label="Clone and translate with AI" />
                    </Tabs>

                    {settingsTab === 0 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <Box>
                                <Typography variant="subtitle2" gutterBottom>
                                    Activation status
                                </Typography>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Activate course to publish it and allow learners to enroll.
                                </Typography>
                                <FormControlLabel
                                    control={<Switch checked={course.isActive} onChange={(e) => setCourse(prev => ({ ...prev, isActive: e.target.checked }))} />}
                                    label="Activate course"
                                />
                            </Box>
                            <Divider />
                            <Box>
                                <Typography variant="subtitle2" gutterBottom>
                                    Coach
                                </Typography>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Activate to enhance learning with AI.
                                </Typography>
                                <FormControlLabel
                                    control={<Switch checked={course.coachEnabled} onChange={(e) => setCourse(prev => ({ ...prev, coachEnabled: e.target.checked }))} />}
                                    label="Activate Coach"
                                />
                            </Box>
                            <Divider />
                            <Box>
                                <Typography variant="subtitle2" gutterBottom>
                                    Code
                                </Typography>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Assign a unique identifier to sort courses in an alphabetical order.
                                </Typography>
                                <TextField
                                    fullWidth
                                    size="small"
                                    value={course.code}
                                    onChange={(e) => setCourse(prev => ({ ...prev, code: e.target.value }))}
                                    sx={{ maxWidth: 400 }}
                                />
                            </Box>
                            <Divider />
                            <Box>
                                <Typography variant="subtitle2" gutterBottom>
                                    Category
                                </Typography>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Add the course to a suitable category (e.g., Programming, Marketing, etc.).
                                </Typography>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Select a category</InputLabel>
                                    <Select
                                        label="Select a category"
                                        value={course.categoryId || ''}
                                        onChange={(e) => setCourse(prev => ({ ...prev, categoryId: e.target.value || null }))}
                                    >
                                        <MenuItem value="">Select a category</MenuItem>
                                        <MenuItem value="programming">Programming</MenuItem>
                                        <MenuItem value="marketing">Marketing</MenuItem>
                                        <MenuItem value="design">Design</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                            <Divider />
                            <Box>
                                <Typography variant="subtitle2" gutterBottom>
                                    Intro video
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                    <Button
                                        variant={course.introVideoType === 'youtube' ? "contained" : "outlined"}
                                        fullWidth
                                        sx={{ bgcolor: course.introVideoType === 'youtube' ? '#d4e3f7' : 'transparent', color: '#1976d2', textTransform: 'none' }}
                                        onClick={() => setCourse(prev => ({ ...prev, introVideoType: 'youtube' }))}
                                    >
                                        Youtube Video
                                    </Button>
                                    <Button
                                        variant={course.introVideoType === 'custom' ? "contained" : "outlined"}
                                        fullWidth
                                        sx={{ textTransform: 'none' }}
                                        onClick={() => setCourse(prev => ({ ...prev, introVideoType: 'custom' }))}
                                    >
                                        Custom Video
                                    </Button>
                                </Box>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Display a YouTube video preview video as part of the course description.
                                </Typography>
                                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                                    URL
                                </Typography>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Insert URL"
                                    value={course.introVideoUrl || ''}
                                    onChange={(e) => setCourse(prev => ({ ...prev, introVideoUrl: e.target.value || null }))}
                                    sx={{ bgcolor: '#f5f5f5' }}
                                />
                            </Box>
                            <Divider />
                            <Box>
                                <Typography variant="subtitle2" gutterBottom>
                                    Price
                                </Typography>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Set a selling price for the course. You must set up a payment method or activate the Credits feature before entering your price. Otherwise, the listed price will only be indicative.
                                </Typography>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Set price"
                                    type="number"
                                    value={course.price || ''}
                                    onChange={(e) => setCourse(prev => ({ ...prev, price: e.target.value ? parseFloat(e.target.value) : null }))}
                                    InputProps={{
                                        endAdornment: <Typography variant="body2" sx={{ color: 'text.secondary', pr: 1 }}>$</Typography>
                                    }}
                                    sx={{ bgcolor: '#f5f5f5', maxWidth: 400 }}
                                />
                            </Box>
                            <Divider />
                            <Box>
                                <Typography variant="subtitle2" gutterBottom>
                                    Content lock
                                </Typography>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Lock the content of the course to prevent any editing.
                                </Typography>
                                <FormControlLabel
                                    control={<Switch checked={course.contentLocked} onChange={(e) => setCourse(prev => ({ ...prev, contentLocked: e.target.checked }))} />}
                                    label="Lock content"
                                />
                            </Box>
                        </Box>
                    )}

                    {settingsTab === 1 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <Box>
                                <Typography variant="subtitle2" gutterBottom>
                                    Catalog visibility
                                </Typography>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Set whether learners can see this course in the catalog.
                                </Typography>
                                <FormControlLabel
                                    control={<Switch checked={course.showInCatalog} onChange={(e) => setCourse(prev => ({ ...prev, showInCatalog: e.target.checked }))} />}
                                    label="Show in catalog"
                                />
                            </Box>
                            <Divider />
                            <Box>
                                <Typography variant="subtitle2" gutterBottom>
                                    Capacity
                                </Typography>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Set a maximum number of learners allowed to self-enroll in the course. Once maximum enrollment is reached, the course will be automatically hidden from the catalog without restricting you from manually enrolling additional learners.
                                </Typography>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Set maximum number"
                                    type="number"
                                    value={course.capacity || ''}
                                    onChange={(e) => setCourse(prev => ({ ...prev, capacity: e.target.value ? parseInt(e.target.value) : null }))}
                                    sx={{ bgcolor: '#f5f5f5', maxWidth: 400 }}
                                />
                            </Box>
                            <Divider />
                            <Box>
                                <Typography variant="subtitle2" gutterBottom>
                                    Public sharing
                                </Typography>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Make this course public and share it with non-registered users with a link. Users can complete the course anonymously and save their progress upon signing up.
                                </Typography>
                                <FormControlLabel
                                    control={<Switch checked={course.publicSharingEnabled} onChange={(e) => setCourse(prev => ({ ...prev, publicSharingEnabled: e.target.checked }))} />}
                                    label="Enable public sharing"
                                />
                            </Box>
                            <Divider />
                            <Box>
                                <Typography variant="subtitle2" gutterBottom>
                                    Enrollment request
                                </Typography>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Learners must wait for Instructor's approval before gaining access to the course.
                                </Typography>
                                <FormControlLabel
                                    control={<Switch checked={course.enrollmentRequestEnabled} onChange={(e) => setCourse(prev => ({ ...prev, enrollmentRequestEnabled: e.target.checked }))} />}
                                    label="Enable enrollment request"
                                />
                            </Box>
                        </Box>
                    )}

                    {settingsTab === 2 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <Box>
                                <Typography variant="subtitle2" gutterBottom>
                                    Time
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                    <Button
                                        variant={course.timeLimitType === 'limit' ? "contained" : "outlined"}
                                        fullWidth
                                        sx={{ bgcolor: course.timeLimitType === 'limit' ? '#d4e3f7' : 'transparent', color: '#1976d2', textTransform: 'none', '&:hover': { bgcolor: '#c2d8f5' } }}
                                        onClick={() => setCourse(prev => ({ ...prev, timeLimitType: 'limit' }))}
                                    >
                                        Time limit
                                    </Button>
                                    <Button
                                        variant={course.timeLimitType === 'timeframe' ? "contained" : "outlined"}
                                        fullWidth
                                        sx={{ textTransform: 'none' }}
                                        onClick={() => setCourse(prev => ({ ...prev, timeLimitType: 'timeframe' }))}
                                    >
                                        Timeframe
                                    </Button>
                                </Box>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Set a specific number of days in which learners have to complete the course after enrollment.
                                </Typography>
                                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                                    Number of days
                                </Typography>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Set number of days"
                                    type="number"
                                    value={course.timeLimit || ''}
                                    onChange={(e) => setCourse(prev => ({ ...prev, timeLimit: e.target.value ? parseInt(e.target.value) : null }))}
                                    sx={{ bgcolor: '#f5f5f5', maxWidth: 400 }}
                                />
                            </Box>
                            <Divider />
                            <Box>
                                <Typography variant="subtitle2" gutterBottom>
                                    Access retention
                                </Typography>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Set if users retain access to course materials after completing the course.
                                </Typography>
                                <FormControlLabel
                                    control={<Switch checked={course.accessRetentionEnabled} onChange={(e) => setCourse(prev => ({ ...prev, accessRetentionEnabled: e.target.checked }))} />}
                                    label="Activate access retention"
                                />
                            </Box>
                            <Divider />
                            <Box>
                                <Typography variant="subtitle2" gutterBottom>
                                    Level
                                </Typography>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Set the gamification level learners must reach to unlock this course.
                                </Typography>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Level"
                                    type="number"
                                    value={course.requiredLevel || ''}
                                    onChange={(e) => setCourse(prev => ({ ...prev, requiredLevel: e.target.value ? parseInt(e.target.value) : null }))}
                                    sx={{ bgcolor: '#f5f5f5', maxWidth: 400 }}
                                />
                            </Box>
                        </Box>
                    )}

                    {settingsTab === 3 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <Box>
                                <Typography variant="subtitle2" gutterBottom>
                                    Units ordering
                                </Typography>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Set the order in which course units must be completed.
                                </Typography>
                                <FormControl fullWidth size="small" sx={{ mt: 2 }}>
                                    <Select
                                        value={course.unitsOrdering}
                                        displayEmpty
                                        onChange={(e) => setCourse(prev => ({ ...prev, unitsOrdering: e.target.value as 'sequential' | 'any' }))}
                                    >
                                        <MenuItem value="sequential">In a sequential order</MenuItem>
                                        <MenuItem value="any">In any order</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                            <Divider />
                            <Box>
                                <Typography variant="subtitle2" gutterBottom>
                                    Completion rules
                                </Typography>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Define the conditions required for the course to be marked as completed.
                                </Typography>
                                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                                    Course is completed when
                                </Typography>
                                <FormControl fullWidth size="small">
                                    <Select
                                        value={course.completionRule}
                                        displayEmpty
                                        onChange={(e) => setCourse(prev => ({ ...prev, completionRule: e.target.value as 'all' | 'any' }))}
                                    >
                                        <MenuItem value="all">All units are completed</MenuItem>
                                        <MenuItem value="any">Any unit is completed</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                            <Divider />
                            <Box>
                                <Typography variant="subtitle2" gutterBottom>
                                    Score calculation
                                </Typography>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Choose how the average course score is calculated.
                                </Typography>
                                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                                    Calculate score by
                                </Typography>
                                <FormControl fullWidth size="small">
                                    <Select
                                        value={course.scoreCalculation}
                                        displayEmpty
                                        onChange={(e) => setCourse(prev => ({ ...prev, scoreCalculation: e.target.value as 'all' | 'tests' | 'assignments' }))}
                                    >
                                        <MenuItem value="all">All tests & assignments</MenuItem>
                                        <MenuItem value="tests">Tests only</MenuItem>
                                        <MenuItem value="assignments">Assignments only</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                            <Divider />
                            <Box>
                                <Typography variant="subtitle2" gutterBottom>
                                    Certificate
                                </Typography>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Assign a certificate to be issued upon course completion.
                                </Typography>
                                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                                    Type
                                </Typography>
                                <FormControl fullWidth size="small">
                                    <Select
                                        value={course.certificateTemplateId || ''}
                                        displayEmpty
                                        onChange={(e) => setCourse(prev => ({ ...prev, certificateTemplateId: e.target.value || null }))}
                                    >
                                        <MenuItem value="">Select a certificate type</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                        </Box>
                    )}

                    {settingsTab === 4 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <Typography variant="body2" color="text.secondary">
                                Translate this course and a copy of it will be created in your selected language
                            </Typography>
                            <Divider />
                            <Box>
                                <Typography variant="subtitle2" gutterBottom>
                                    Language
                                </Typography>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Translate your course into another language with AI for a more personalised learning experience.
                                </Typography>
                                <FormControl fullWidth size="small" sx={{ mt: 2 }}>
                                    <Select defaultValue="" displayEmpty>
                                        <MenuItem value="">Select language</MenuItem>
                                        <MenuItem value="es">Spanish</MenuItem>
                                        <MenuItem value="fr">French</MenuItem>
                                        <MenuItem value="de">German</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                            <Divider />
                            <Box>
                                <Typography variant="subtitle2" gutterBottom>
                                    Writing style
                                </Typography>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Choose the writing style that best suits your learning preferences.
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                                    <Button
                                        variant="contained"
                                        startIcon={<span>[  ]</span>}
                                        sx={{
                                            flex: 1,
                                            bgcolor: '#d4e3f7',
                                            color: '#1976d2',
                                            textTransform: 'none',
                                            '&:hover': { bgcolor: '#c2d8f5' }
                                        }}
                                    >
                                        Original
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        startIcon={<span>🎓</span>}
                                        sx={{ flex: 1, textTransform: 'none' }}
                                    >
                                        Academic
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        startIcon={<span>{'//'}</span>}
                                        sx={{ flex: 1, textTransform: 'none' }}
                                    >
                                        Simple
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        startIcon={<span>🎨</span>}
                                        sx={{ flex: 1, textTransform: 'none' }}
                                    >
                                        Creative
                                    </Button>
                                </Box>
                            </Box>
                            <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                                <Button
                                    variant="outlined"
                                    startIcon={<span>🔄</span>}
                                    sx={{ textTransform: 'none' }}
                                >
                                    Clone and Translate
                                </Button>
                                <Button variant="outlined" onClick={() => setSettingsDrawerOpen(false)} sx={{ textTransform: 'none' }}>
                                    Cancel
                                </Button>
                            </Box>
                        </Box>
                    )}

                    {/* Save/Cancel buttons for tabs other than Clone */}
                    {settingsTab !== 4 && (
                        <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                            <Button variant="contained" fullWidth onClick={handleSettingsSave}>
                                Save
                            </Button>
                            <Button variant="outlined" fullWidth onClick={() => setSettingsDrawerOpen(false)}>
                                Cancel
                            </Button>
                        </Box>
                    )}
                </Box>
            </Drawer>

            {/* Enrollments Drawer */}
            <Drawer
                anchor="right"
                open={enrollmentsDrawerOpen}
                onClose={() => setEnrollmentsDrawerOpen(false)}
                PaperProps={{ sx: { width: 600 } }}
                sx={{ zIndex: 1400 }}
            >
                <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h6">
                            Course Enrollments
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<PersonAddIcon />}
                            onClick={() => setEnrollDialogOpen(true)}
                            size="small"
                        >
                            Enroll Users
                        </Button>
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        Manage users enrolled in this course ({enrollments.length} enrolled)
                    </Typography>
                    <Divider sx={{ my: 2 }} />

                    {enrollmentsLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : enrollments.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <PeopleOutlineIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                            <Typography variant="body1" color="text.secondary">
                                No users enrolled yet
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                Click &quot;Enroll Users&quot; to add learners to this course
                            </Typography>
                        </Box>
                    ) : (
                        <List sx={{ flex: 1, overflow: 'auto' }}>
                            {enrollments.map((enrollment) => (
                                <ListItem
                                    key={enrollment.id}
                                    sx={{
                                        bgcolor: 'background.paper',
                                        mb: 1,
                                        borderRadius: 1,
                                        border: '1px solid #e0e0e0',
                                    }}
                                >
                                    <ListItemAvatar>
                                        <Avatar src={enrollment.user?.avatar || undefined}>
                                            {enrollment.user?.name?.charAt(0) || '?'}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={enrollment.user?.name || 'Unknown User'}
                                        secondary={
                                            <Box>
                                                <Typography variant="body2" color="text.secondary">
                                                    {enrollment.user?.email}
                                                </Typography>
                                                <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                                    <Chip
                                                        label={enrollment.status.replace('_', ' ')}
                                                        size="small"
                                                        color={
                                                            enrollment.status === 'COMPLETED' ? 'success' :
                                                                enrollment.status === 'IN_PROGRESS' ? 'primary' :
                                                                    enrollment.status === 'FAILED' ? 'error' : 'default'
                                                        }
                                                        sx={{ height: 20, fontSize: '0.7rem' }}
                                                    />
                                                    <Typography variant="caption" color="text.secondary">
                                                        {enrollment.progress}% complete
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        }
                                    />
                                    <ListItemSecondaryAction>
                                        <IconButton
                                            edge="end"
                                            onClick={() => handleRemoveEnrollment(enrollment.id)}
                                            color="error"
                                            size="small"
                                        >
                                            <DeleteOutlineIcon />
                                        </IconButton>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            ))}
                        </List>
                    )}
                </Box>
            </Drawer>

            {/* Enroll Users Dialog */}
            <Dialog
                open={enrollDialogOpen}
                onClose={() => {
                    setEnrollDialogOpen(false);
                    setSelectedUsers([]);
                    setSearchQuery('');
                }}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Enroll Users</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        placeholder="Search users by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        sx={{ mb: 2, mt: 1 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                    />
                    {searchLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                            <CircularProgress size={24} />
                        </Box>
                    ) : searchUsers.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                            {searchQuery ? 'No users found' : 'Start typing to search users'}
                        </Typography>
                    ) : (
                        <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                            {searchUsers.map((user) => (
                                <ListItem
                                    key={user.id}
                                    dense
                                    onClick={() => {
                                        setSelectedUsers(prev =>
                                            prev.includes(user.id)
                                                ? prev.filter(id => id !== user.id)
                                                : [...prev, user.id]
                                        );
                                    }}
                                    sx={{ cursor: 'pointer', borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}
                                >
                                    <Checkbox
                                        checked={selectedUsers.includes(user.id)}
                                        tabIndex={-1}
                                    />
                                    <ListItemAvatar>
                                        <Avatar src={user.avatar || undefined} sx={{ width: 32, height: 32 }}>
                                            {user.name?.charAt(0)}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={user.name}
                                        secondary={user.email}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    )}
                    {selectedUsers.length > 0 && (
                        <Typography variant="body2" color="primary" sx={{ mt: 2 }}>
                            {selectedUsers.length} user(s) selected
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {
                        setEnrollDialogOpen(false);
                        setSelectedUsers([]);
                        setSearchQuery('');
                    }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleEnrollUsers}
                        disabled={selectedUsers.length === 0 || enrolling}
                    >
                        {enrolling ? <CircularProgress size={20} /> : `Enroll ${selectedUsers.length} User(s)`}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default function CourseEditorPage() {
    return (
        <Suspense fallback={
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#f5f5f5' }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Loading editor...</Typography>
            </Box>
        }>
            <CourseEditorContent />
        </Suspense>
    );
}
