'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Box,
    Typography,
    Tabs,
    Tab,
    List,
    ListItem,
    IconButton,
    Snackbar,
    Alert,
    CircularProgress,
    Button,
    TextField,
    Tooltip,
    Paper,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    ListItemButton,
    ListItemIcon as MuiListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Drawer
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import FolderIcon from '@mui/icons-material/Folder';
import SettingsIcon from '@mui/icons-material/Settings';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LinkIcon from '@mui/icons-material/Link';
import DescriptionIcon from '@mui/icons-material/Description';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import MovieIcon from '@mui/icons-material/Movie';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import DownloadIcon from '@mui/icons-material/Download';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { getCsrfToken } from '@/lib/client-csrf';

// Custom components
import Header from '@modules/courses/editor/Header';
import AddMenuGrouped from '@modules/courses/editor/AddMenu';
import CurriculumBuilder from '@modules/courses/editor/CurriculumBuilder';
import CloneLinkDialog from '@modules/courses/editor/CloneLinkDialog';
import GenericUnitModal from '@modules/courses/editor/GenericUnitModal';

// Unit Editors
import TextUnitEditor from '@modules/courses/unit-editors/TextUnitEditor';
import VideoUnitEditor from '@modules/courses/unit-editors/VideoUnitEditor';
import AudioUnitEditor from '@modules/courses/unit-editors/AudioUnitEditor';
import DocumentUnitEditor from '@modules/courses/unit-editors/DocumentUnitEditor';
import IframeUnitEditor from '@modules/courses/unit-editors/IframeUnitEditor';
import ILTUnitEditor from '@modules/courses/unit-editors/ILTUnitEditor';
import TestUnitEditor from '@modules/courses/unit-editors/TestUnitEditor';
import SurveyUnitEditor from '@modules/courses/unit-editors/SurveyUnitEditor';
import AssignmentUnitEditor from '@modules/courses/unit-editors/AssignmentUnitEditor';
import ScormUnitEditor from '@modules/courses/unit-editors/ScormUnitEditor';

// Existing Modals
import TextUnitModal from '@modules/courses/editor/TextUnitModal';
import FileUnitModal from '@modules/courses/editor/FileUnitModal';
import VideoUnitModal from '@modules/courses/editor/VideoUnitModal';
import EmbedUnitModal from '@modules/courses/editor/EmbedUnitModal';
import TestUnitModal from '@modules/courses/editor/TestUnitModal';
import SurveyUnitModal from '@modules/courses/editor/SurveyUnitModal';
import SectionUnitModal from '@modules/courses/editor/SectionUnitModal';

// Drawers
import CourseSettingsDrawer from '@modules/courses/editor/CourseSettingsDrawer';
import CourseEnrollmentDrawer from '@modules/courses/editor/CourseEnrollmentDrawer';

// New Components
import CourseOutlineSidebar from '@modules/courses/editor/CourseOutlineSidebar';
import CourseOptionsTab from '@modules/courses/editor/CourseOptionsTab';
import CourseUsersTab from '@modules/courses/editor/CourseUsersTab';
import UnitOptionsDrawer from '@modules/courses/editor/UnitOptionsDrawer';

function CourseEditorContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const courseId = searchParams.get('id');

    // State
    const [course, setCourse] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saveState, setSaveState] = useState<'saving' | 'saved' | 'error'>('saved');
    const [currentTab, setCurrentTab] = useState(0);
    const [addMenuAnchor, setAddMenuAnchor] = useState<null | HTMLElement>(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
    const [cloneLinkMode, setCloneLinkMode] = useState<'clone' | 'link' | null>(null);
    const [creatingCourse, setCreatingCourse] = useState(false);

    // Files State
    const [files, setFiles] = useState<any[]>([]);
    const [loadingFiles, setLoadingFiles] = useState(false);

    // Modals
    const [activeModal, setActiveModal] = useState<string | null>(null);
    const [editingUnitId, setEditingUnitId] = useState<string | null>(null);

    // Drawers
    const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false);
    const [enrollmentDrawerOpen, setEnrollmentDrawerOpen] = useState(false);
    const [unitOptionsDrawerOpen, setUnitOptionsDrawerOpen] = useState(false);
    const [optionsUnitId, setOptionsUnitId] = useState<string | null>(null);
    const [moveUnitId, setMoveUnitId] = useState<string | null>(null);
    const [moveUnitDialogOpen, setMoveUnitDialogOpen] = useState(false);
    const [courseSettings, setCourseSettings] = useState<any>({});
    const [usersRefreshTrigger, setUsersRefreshTrigger] = useState(0);

    // Auto-create course if no ID
    useEffect(() => {
        const createNewCourse = async () => {
            if (!courseId && !creatingCourse) {
                setCreatingCourse(true);
                setLoading(true);
                try {
                    const res = await fetch('/api/courses', {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'x-csrf-token': getCsrfToken()
                        },
                        body: JSON.stringify({
                            title: 'New Course',
                            code: `COURSE-${Date.now()}`,
                            status: 'DRAFT',
                        }),
                    });

                    if (res.ok) {
                        const newCourse = await res.json();
                        // Redirect with the new course ID  
                        router.replace(`/super-instructor/courses/new?id=${newCourse.id}`);
                    } else {
                        console.error('Failed to create course:', res.status);
                        setSnackbar({ open: true, message: 'Failed to create course', severity: 'error' });
                        setLoading(false);
                    }
                } catch (error) {
                    console.error('Error creating course:', error);
                    setSnackbar({ open: true, message: 'Error creating course', severity: 'error' });
                    setLoading(false);
                }
            }
        };

        createNewCourse();
    }, [courseId, router, creatingCourse]);

    // Initial Fetch
    const fetchCourse = useCallback(async () => {
        if (!courseId) return;
        try {
            const res = await fetch(`/api/courses/${courseId}`);
            if (res.ok) {
                const data = await res.json();
                setCourse(data);
                setCourseSettings(typeof data.settings === 'string' ? JSON.parse(data.settings) : (data.settings || {}));
            } else {
                const errorData = await res.json().catch(() => ({}));
                console.error('Failed to fetch course', res.status, errorData);
                setSnackbar({
                    open: true,
                    message: `Course not found or access denied (Error ${res.status})`,
                    severity: 'error'
                });
            }
        } catch (err) {
            console.error('Failed to fetch course', err);
        }
    }, [courseId]);

    const fetchFiles = useCallback(async () => {
        if (!courseId) return;
        setLoadingFiles(true);
        try {
            const res = await fetch(`/api/courses/${courseId}/files`);
            if (res.ok) {
                const data = await res.json();
                setFiles(data);
            }
        } catch (err) {
            console.error('Failed to fetch files', err);
        } finally {
            setLoadingFiles(false);
        }
    }, [courseId]);

    useEffect(() => {
        const loadAllData = async () => {
            if (courseId) {
                setLoading(true);
                await fetchCourse();
                await fetchFiles();
                setLoading(false);
            } else {
                setLoading(false);
            }
        };
        loadAllData();
    }, [courseId, fetchCourse, fetchFiles]);

    const handleReorder = async (sections: any[], units: any[]) => {
        if (!courseId) return;
        setSaveState('saving');
        try {
            const res = await fetch(`/api/courses/${courseId}/reorder`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-csrf-token': getCsrfToken()
                },
                body: JSON.stringify({ sections, units })
            });
            if (res.ok) {
                await fetchCourse();
                setSaveState('saved');
            } else {
                throw new Error();
            }
        } catch (err) {
            setSaveState('error');
            setSnackbar({ open: true, message: 'Failed to save order', severity: 'error' });
        }
    };

    const handleAutoSave = useCallback(async (data: any) => {
        if (!courseId) return;
        setSaveState('saving');
        try {
            const res = await fetch(`/api/courses/${courseId}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-csrf-token': getCsrfToken()
                },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error();
            setSaveState('saved');
        } catch (err) {
            setSaveState('error');
        }
    }, [courseId]);

    const saveTimeout = useRef<any>(null);
    const onFieldChange = (field: string, value: any) => {
        setCourse((prev: any) => ({ ...prev, [field]: value }));
        if (saveTimeout.current) clearTimeout(saveTimeout.current);
        saveTimeout.current = setTimeout(() => handleAutoSave({ [field]: value }), 1000);
    };

    // Unit Type Select
    const handleUnitTypeSelect = async (type: string) => {
        setAddMenuAnchor(null);
        const upperType = type.toUpperCase();
        if (['TEXT', 'CONTENT', 'VIDEO', 'AUDIO', 'DOCUMENT', 'IFRAME', 'ILT', 'TEST', 'SURVEY', 'ASSIGNMENT', 'SCORM'].includes(upperType)) {
            setSaveState('saving');
            // Convert CONTENT to TEXT since the API only accepts TEXT
            const apiType = upperType === 'CONTENT' ? 'TEXT' : upperType;
            try {
                const response = await fetch(`/api/courses/${courseId}/units`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'x-csrf-token': getCsrfToken()
                    },
                    body: JSON.stringify({
                        type: apiType,
                        title: upperType === 'TEXT' || upperType === 'CONTENT' ? 'Content unit' :
                            upperType === 'IFRAME' ? 'Iframe unit' :
                                upperType === 'ILT' ? 'ILT unit' :
                                    upperType === 'SCORM' ? 'Scorm unit' : `New ${type.toLowerCase()} unit`,
                        config: { completion: { mode: 'button' } },
                        status: 'DRAFT'
                    }),
                });
                if (response.ok) {
                    const newUnit = await response.json();
                    setCourse((prev: any) => ({
                        ...prev,
                        unassignedUnits: [...(prev.unassignedUnits || []), newUnit]
                    }));
                    setEditingUnitId(newUnit.id);
                    setSaveState('saved');
                } else {
                    setSaveState('error');
                }
            } catch (err) {
                console.error('Failed to create unit:', err);
                setSaveState('error');
            }
        } else if (upperType === 'SECTION') {
            setSaveState('saving');
            try {
                const nextSectionNumber = (course?.sections?.length || 0) + 1;
                const response = await fetch(`/api/courses/${courseId}/sections`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'x-csrf-token': getCsrfToken()
                    },
                    body: JSON.stringify({
                        title: `Section ${nextSectionNumber}`,
                    }),
                });

                if (response.ok) {
                    const newSection = await response.json();
                    setCourse((prev: any) => ({
                        ...prev,
                        sections: [...(prev.sections || []), { ...newSection, units: [] }]
                    }));
                    setSnackbar({ open: true, message: 'Section created successfully', severity: 'success' });
                    setSaveState('saved');
                } else {
                    setSaveState('error');
                    setSnackbar({ open: true, message: 'Failed to create section', severity: 'error' });
                }
            } catch (err) {
                console.error('Failed to create section:', err);
                setSaveState('error');
                setSnackbar({ open: true, message: 'Failed to create section', severity: 'error' });
            }
        } else {
            setActiveModal(type);
            setEditingUnitId(null);
        }
    };

    const handleImport = async (sourceUnitId: string, mode: 'clone' | 'link') => {
        if (!courseId) return;
        try {
            const res = await fetch(`/api/courses/${courseId}/import-unit`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-csrf-token': getCsrfToken()
                },
                body: JSON.stringify({ sourceUnitId, mode })
            });
            if (res.ok) {
                await fetchCourse();
                setSnackbar({ open: true, message: `Unit ${mode === 'clone' ? 'cloned' : 'linked'} successfully`, severity: 'success' });
            }
        } catch (err) {
            setSnackbar({ open: true, message: 'Failed to import unit', severity: 'error' });
        } finally {
            setCloneLinkMode(null);
        }
    };

    const handleEditUnit = (unitId: string) => {
        setEditingUnitId(unitId);
    };

    const handleConfigChange = async (unitId: string, newConfig: any) => {
        if (!courseId) return;
        setSaveState('saving');
        try {
            const res = await fetch(`/api/courses/${courseId}/units/${unitId}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-csrf-token': getCsrfToken()
                },
                body: JSON.stringify({ config: newConfig })
            });
            if (res.ok) {
                // Update local course state with the new config
                setCourse((prev: any) => {
                    const updateUnitInList = (list: any[]) =>
                        list.map(u => u.id === unitId ? { ...u, config: newConfig } : u);

                    return {
                        ...prev,
                        sections: prev.sections?.map((s: any) => ({
                            ...s,
                            units: updateUnitInList(s.units || [])
                        })),
                        unassignedUnits: updateUnitInList(prev.unassignedUnits || [])
                    };
                });
                setSaveState('saved');
            } else {
                throw new Error();
            }
        } catch (err) {
            setSaveState('error');
        }
    };

    const handleUnitTitleChange = async (unitId: string, newTitle: string) => {
        if (!courseId) return;
        setSaveState('saving');
        try {
            const res = await fetch(`/api/courses/${courseId}/units/${unitId}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-csrf-token': getCsrfToken()
                },
                body: JSON.stringify({ title: newTitle })
            });
            if (res.ok) {
                setCourse((prev: any) => {
                    const updateUnitInList = (list: any[]) =>
                        list.map(u => u.id === unitId ? { ...u, title: newTitle } : u);

                    return {
                        ...prev,
                        sections: prev.sections?.map((s: any) => ({
                            ...s,
                            units: updateUnitInList(s.units || [])
                        })),
                        unassignedUnits: updateUnitInList(prev.unassignedUnits || [])
                    };
                });
                setSaveState('saved');
            } else {
                throw new Error();
            }
        } catch (err) {
            setSaveState('error');
        }
    };

    const handlePublish = async () => {
        if (!courseId) return;
        setSaveState('saving');
        try {
            const res = await fetch(`/api/courses/${courseId}`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-csrf-token': getCsrfToken()
                },
                body: JSON.stringify({ action: 'publish' })
            });
            if (res.ok) {
                await fetchCourse();
                setSnackbar({ open: true, message: 'Course published', severity: 'success' });
            }
        } catch (err) {
            setSaveState('error');
        } finally {
            setSaveState('saved');
        }
    };

    const handleUnpublish = async () => {
        if (!courseId) return;
        setSaveState('saving');
        try {
            const res = await fetch(`/api/courses/${courseId}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-csrf-token': getCsrfToken()
                },
                body: JSON.stringify({ status: 'DRAFT' })
            });
            if (res.ok) {
                await fetchCourse();
                setSnackbar({ open: true, message: 'Course unpublished', severity: 'success' });
            }
        } catch (err) {
            setSaveState('error');
        } finally {
            setSaveState('saved');
        }
    };


    const handleDuplicate = async () => {
        if (!courseId) return;
        if (!confirm('Duplicate this course?')) return;
        setSaveState('saving');
        try {
            const res = await fetch(`/api/courses/${courseId}`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-csrf-token': getCsrfToken()
                },
                body: JSON.stringify({ action: 'clone' })
            });
            if (res.ok) {
                const cloned = await res.json();
                router.push(`/super-instructor/courses/new?id=${cloned.id}`);
                setSnackbar({ open: true, message: 'Course duplicated', severity: 'success' });
            }
        } catch (err) {
            setSaveState('error');
        } finally {
            setSaveState('saved');
        }
    };

    const handleDelete = async () => {
        if (!courseId) return;
        if (!confirm('Are you sure you want to delete this course?')) return;
        try {
            const res = await fetch(`/api/courses/${courseId}`, { 
                method: 'DELETE',
                headers: { 'x-csrf-token': getCsrfToken() }
            });
            if (res.ok) {
                router.push('/super-instructor/courses');
            }
        } catch (err) {
            setSnackbar({ open: true, message: 'Failed to delete course', severity: 'error' });
        }
    };

    const handlePublishUnit = async (unitId: string) => {
        if (!courseId) return;
        try {
            const res = await fetch(`/api/courses/${courseId}/units/${unitId}`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-csrf-token': getCsrfToken()
                },
                body: JSON.stringify({ action: 'publish' })
            });
            if (res.ok) await fetchCourse();
        } catch (err) { }
    };

    const handleUnpublishUnit = async (unitId: string) => {
        if (!courseId) return;
        try {
            const res = await fetch(`/api/courses/${courseId}/units/${unitId}`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-csrf-token': getCsrfToken()
                },
                body: JSON.stringify({ action: 'unpublish' })
            });
            if (res.ok) await fetchCourse();
        } catch (err) { }
    };

    const handleDuplicateUnit = async (unitId: string) => {
        if (!courseId) return;
        try {
            const res = await fetch(`/api/courses/${courseId}/units/${unitId}`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-csrf-token': getCsrfToken()
                },
                body: JSON.stringify({ action: 'duplicate' })
            });
            if (res.ok) await fetchCourse();
        } catch (err) { }
    };

    const handleDeleteUnit = async (uId: string) => {
        if (!courseId || !confirm('Delete unit?')) return;
        try {
            const res = await fetch(`/api/courses/${courseId}/units/${uId}`, { 
                method: 'DELETE',
                headers: { 'x-csrf-token': getCsrfToken() }
            });
            if (res.ok) {
                if (uId === editingUnitId) setEditingUnitId(null);
                await fetchCourse();
            }
        } catch (err) { }
    };

    const handleMoveUnit = async (unitId: string, sectionId: string | null) => {
        if (!courseId) return;
        try {
            const res = await fetch(`/api/courses/${courseId}/units/${unitId}`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-csrf-token': getCsrfToken()
                },
                body: JSON.stringify({ action: 'move', sectionId })
            });
            if (res.ok) {
                await fetchCourse();
                setMoveUnitDialogOpen(false);
            }
        } catch (err) { }
    };

    const handleSaveUnitOptions = async (unitId: string, options: any) => {
        if (!courseId) return;
        try {
            const res = await fetch(`/api/courses/${courseId}/units/${unitId}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-csrf-token': getCsrfToken()
                },
                body: JSON.stringify({ ...findUnitById(unitId), ...options })
            });
            if (res.ok) await fetchCourse();
        } catch (err) { }
    };

    const findUnitById = (unitId: string): any => {
        if (!course) return null;
        for (const section of course.sections || []) {
            const unit = section.units.find((u: any) => u.id === unitId);
            if (unit) return unit;
        }
        for (const unit of course.unassignedUnits || []) {
            if (unit.id === unitId) return unit;
        }
        return null;
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !courseId) return;
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await fetch(`/api/courses/${courseId}/files`, { 
                method: 'POST', 
                headers: { 'x-csrf-token': getCsrfToken() },
                body: formData 
            });
            if (res.ok) await fetchFiles();
        } catch (err) { }
    };

    const handleFileDownload = (fileUrl: string, fileName: string) => {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = fileName;
        link.click();
    };

    const handleFileDelete = async (fileId: string) => {
        if (!confirm('Delete file?')) return;
        try {
            const res = await fetch(`/api/files/${fileId}`, { 
                method: 'DELETE',
                headers: { 'x-csrf-token': getCsrfToken() }
            });
            if (res.ok) await fetchFiles();
        } catch (err) { }
    };

    const handleImageUpload = async (file: File) => {
        if (!courseId) return;
        setSaveState('saving');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch(`/api/courses/${courseId}/image`, {
                method: 'POST',
                headers: { 'x-csrf-token': getCsrfToken() },
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                setCourse((prev: any) => ({ ...prev, thumbnailUrl: data.imageUrl }));
                setSnackbar({ open: true, message: 'Course image uploaded successfully', severity: 'success' });
                setSaveState('saved');
            } else {
                throw new Error('Upload failed');
            }
        } catch (err) {
            setSnackbar({ open: true, message: 'Failed to upload image', severity: 'error' });
            setSaveState('error');
        }
    };

    const handleImageGenerate = async () => {
        if (!courseId) return;
        setSaveState('saving');

        try {
            const prompt = course.title ?
                `Educational course cover image for: ${course.title}` :
                'Generic educational course cover image';

            const res = await fetch(`/api/courses/${courseId}/generate-image`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-csrf-token': getCsrfToken()
                },
                body: JSON.stringify({ prompt })
            });

            if (res.ok) {
                const data = await res.json();
                setCourse((prev: any) => ({ ...prev, thumbnailUrl: data.imageUrl }));
                setSnackbar({ open: true, message: 'Course image generated successfully', severity: 'success' });
                setSaveState('saved');
            } else {
                throw new Error('Generation failed');
            }
        } catch (err) {
            setSnackbar({ open: true, message: 'Failed to generate image', severity: 'error' });
            setSaveState('error');
        }
    };


    if (loading) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!course) return <Box sx={{ p: 4 }}><Typography>Course not found</Typography></Box>;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: 'hsl(var(--background))', overflow: 'hidden', paddingTop: '60px' }}>
            {/* Top Navigation Bar */}
            <Box sx={{
                height: 60,
                bgcolor: 'rgba(13, 20, 20, 0.6)',
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid rgba(141, 166, 166, 0.1)',
                display: 'flex',
                alignItems: 'center',
                px: 3,
                justifyContent: 'space-between',
                color: 'hsl(var(--foreground))',
                zIndex: 1200,
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton size="small" sx={{ color: 'hsl(var(--foreground))', bgcolor: 'rgba(255,255,255,0.05)', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
                        <MenuIcon />
                    </IconButton>
                    <Button
                        variant="contained"
                        size="small"
                        onClick={() => {
                            if (editingUnitId) {
                                const u = findUnitById(editingUnitId);
                                if (u?.status === 'PUBLISHED') handleUnpublishUnit(editingUnitId);
                                else handlePublishUnit(editingUnitId);
                            } else {
                                if (course.status === 'DRAFT') handlePublish();
                                else handleUnpublish();
                            }
                        }}
                        sx={{
                            bgcolor: 'hsl(var(--primary))',
                            color: 'white',
                            textTransform: 'none',
                            fontWeight: 700,
                            borderRadius: '8px',
                            px: 3,
                            height: 36,
                            fontSize: '0.875rem',
                            boxShadow: '0 4px 12px hsl(var(--primary) / 0.3)',
                            '&:hover': {
                                bgcolor: 'hsl(var(--primary))',
                                boxShadow: '0 6px 16px hsl(var(--primary) / 0.4)',
                                transform: 'translateY(-1px)'
                            },
                            transition: 'all 0.2s ease'
                        }}
                    >
                        {editingUnitId ? (
                            findUnitById(editingUnitId)?.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'
                        ) : (
                            course.status === 'DRAFT' ? 'Publish' : 'Unpublish'
                        )}
                    </Button>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {saveState === 'saving' && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CircularProgress size={14} thickness={5} sx={{ color: 'hsl(var(--muted-foreground))' }} />
                            <Typography sx={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', fontWeight: 600 }}>
                                Saving...
                            </Typography>
                        </Box>
                    )}
                    {saveState === 'saved' && (
                        <Typography sx={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', fontWeight: 600, opacity: 0.7 }}>
                            Saved
                        </Typography>
                    )}
                </Box>
            </Box>

            <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Sidebar Navigation - Full Height */}
                <Box sx={{
                    width: 300,
                    display: 'flex',
                    flexDirection: 'column',
                    borderRight: '1px solid rgba(141, 166, 166, 0.1)',
                    bgcolor: 'rgba(13, 20, 20, 0.3)',
                    backdropFilter: 'blur(12px)'
                }}>
                    <Box sx={{ px: 2, pt: 2, pb: 0 }}>
                        <Button
                            startIcon={<ArrowBackIcon sx={{ fontSize: '1rem' }} />}
                            sx={{
                                textTransform: 'none',
                                color: 'hsl(var(--muted-foreground))',
                                p: 1,
                                width: '100%',
                                justifyContent: 'flex-start',
                                minWidth: 0,
                                fontWeight: 600,
                                mb: 2,
                                borderRadius: 2,
                                fontSize: '0.85rem',
                                '&:hover': {
                                    bgcolor: 'rgba(141, 166, 166, 0.1)',
                                    color: 'hsl(var(--foreground))'
                                }
                            }}
                            onClick={() => {
                                if (editingUnitId) {
                                    setEditingUnitId(null);
                                } else {
                                    router.push('/super-instructor/courses');
                                }
                            }}
                        >
                            Back
                        </Button>
                    </Box>

                    <CourseOutlineSidebar
                        sections={course.sections || []}
                        unassignedUnits={course.unassignedUnits || []}
                        onAddClick={(e: any) => setAddMenuAnchor(e.currentTarget)}
                        onUnitClick={handleEditUnit}
                        onSectionClick={() => { }}
                        onPublishUnit={handlePublishUnit}
                        onUnpublishUnit={handleUnpublishUnit}
                        onDuplicateUnit={handleDuplicateUnit}
                        onDeleteUnit={handleDeleteUnit}
                        onOptionsUnit={(id: string) => { setOptionsUnitId(id); setUnitOptionsDrawerOpen(true); }}
                        onMoveUnit={(id: string) => { setMoveUnitId(id); setMoveUnitDialogOpen(true); }}
                        courseTitle={course.title}
                        onOpenSettings={() => setSettingsDrawerOpen(true)}
                        onOpenUsers={() => setEnrollmentDrawerOpen(true)}
                        activeUnitId={editingUnitId}
                    />
                    <AddMenuGrouped
                        anchorEl={addMenuAnchor}
                        open={Boolean(addMenuAnchor)}
                        onClose={() => setAddMenuAnchor(null)}
                        onSelectType={handleUnitTypeSelect}
                    />
                </Box>

                {/* Main Content Area */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {!editingUnitId ? (
                        <>
                            <Header
                                courseId={courseId!}
                                title={course.title}
                                description={course.description}
                                courseImage={course.thumbnailUrl}
                                status={course.status}
                                onTitleChange={(title) => onFieldChange('title', title)}
                                onDescriptionChange={(desc) => onFieldChange('description', desc)}
                                onImageUpload={handleImageUpload}
                                onImageGenerate={handleImageGenerate}
                                saveState={saveState}
                                onPublish={handlePublish}
                                onUnpublish={handleUnpublish}
                                onDuplicate={handleDuplicate}
                                onDelete={handleDelete}
                                isPublishing={saveState === 'saving'}
                                publishDisabled={false}
                                hidePublishButton={true}
                            />

                            <Box sx={{ flex: 1, overflowY: 'auto', px: 4, pt: 2, pb: 4 }}>
                                <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
                                    <Paper
                                        className="glass-card"
                                        sx={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            borderRadius: '16px',
                                            border: '1px solid rgba(141, 166, 166, 0.1)',
                                            bgcolor: 'rgba(13, 20, 20, 0.3)',
                                            backdropFilter: 'blur(12px)',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        {/* Internal Tabs Header */}
                                        <Box sx={{ borderBottom: '1px solid rgba(141, 166, 166, 0.1)', px: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 48 }}>
                                            <Tabs
                                                value={currentTab}
                                                onChange={(e, v) => setCurrentTab(v)}
                                                sx={{
                                                    minHeight: 48,
                                                    '& .MuiTab-root': {
                                                        textTransform: 'none',
                                                        fontWeight: 700,
                                                        fontSize: '0.85rem',
                                                        minWidth: 80,
                                                        height: 48,
                                                        color: '#718096',
                                                        '&.Mui-selected': { color: '#004282' }
                                                    },
                                                    '& .MuiTabs-indicator': { bgcolor: '#004282', height: 3 }
                                                }}
                                            >
                                                <Tab label="Content" />
                                                <Tab label="Files" />
                                                <Tab label="Course options" sx={{ display: 'none' }} />
                                                <Tab label="Users" sx={{ display: 'none' }} />
                                            </Tabs>
                                            <Typography variant="caption" sx={{ color: '#a0aec0', fontWeight: 600, mr: 2 }}>
                                                All units must be completed
                                            </Typography>
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            {currentTab === 0 && (
                                                <CurriculumBuilder
                                                    sections={course.sections || []}
                                                    unassignedUnits={course.unassignedUnits || []}
                                                    onReorder={handleReorder}
                                                    onEditSection={() => { }}
                                                    onDeleteSection={() => { }}
                                                    onEditUnit={handleEditUnit}
                                                    onDeleteUnit={handleDeleteUnit}
                                                    onPublishUnit={handlePublishUnit}
                                                    onUnpublishUnit={handleUnpublishUnit}
                                                    onDuplicateUnit={handleDuplicateUnit}
                                                    onOptionsUnit={(id) => { setOptionsUnitId(id); setUnitOptionsDrawerOpen(true); }}
                                                    onMoveUnit={(id) => { setMoveUnitId(id); setMoveUnitDialogOpen(true); }}
                                                />
                                            )}
                                            {currentTab === 1 && (
                                                <Box sx={{ p: 4 }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                                        <Typography variant="h6" sx={{ fontWeight: 700 }}>Course Files</Typography>
                                                        <Button
                                                            variant="contained"
                                                            component="label"
                                                            startIcon={<CloudUploadIcon />}
                                                            sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#004282' }}
                                                        >
                                                            Upload File
                                                            <input type="file" hidden onChange={handleFileUpload} />
                                                        </Button>
                                                    </Box>
                                                    <List>
                                                        {files.map((file) => (
                                                            <ListItem
                                                                key={file.id}
                                                                sx={{ border: '1px solid #e2e8f0', mb: 1, borderRadius: 1 }}
                                                                secondaryAction={
                                                                    <Box>
                                                                        <IconButton onClick={() => handleFileDownload(file.url, file.name)}><DownloadIcon /></IconButton>
                                                                        <IconButton onClick={() => handleFileDelete(file.id)} sx={{ color: '#e53e3e' }}><DeleteIcon /></IconButton>
                                                                    </Box>
                                                                }
                                                            >
                                                                <MuiListItemIcon>
                                                                    {file.type.startsWith('image/') ? <ImageIcon /> :
                                                                        file.type.includes('pdf') ? <PictureAsPdfIcon /> :
                                                                            file.type.startsWith('video/') ? <MovieIcon /> :
                                                                                <DescriptionIcon />}
                                                                </MuiListItemIcon>
                                                                <ListItemText primary={file.name} secondary={`${(file.size / 1024).toFixed(1)} KB`} />
                                                            </ListItem>
                                                        ))}
                                                        {files.length === 0 && (
                                                            <Typography sx={{ color: '#a0aec0', p: 4, textAlign: 'center' }}>No files uploaded yet</Typography>
                                                        )}
                                                    </List>
                                                </Box>
                                            )}
                                            {currentTab === 2 && (
                                                <Box sx={{ p: 4 }}>
                                                    <CourseOptionsTab course={course} onUpdate={(data) => handleAutoSave(data)} />
                                                </Box>
                                            )}

                                        </Box>
                                    </Paper>
                                </Box>
                            </Box>
                        </>
                    ) : (
                        <Box sx={{ flex: 1, overflowY: 'auto', p: 8, pt: 4, bgcolor: 'transparent' }}>
                            <Box sx={{ maxWidth: 800, mx: 'auto' }}>
                                {(() => {
                                    const unit = findUnitById(editingUnitId);
                                    if (!unit) return null;
                                    const editorProps = {
                                        unitId: unit.id,
                                        courseId: unit.courseId,
                                        config: unit.config || {},
                                        onConfigChange: (newConfig: any) => handleConfigChange(unit.id, newConfig),
                                        onTitleChange: (newTitle: string) => handleUnitTitleChange(unit.id, newTitle),
                                        title: unit.title,
                                    };

                                    switch (unit.type.toLowerCase()) {
                                        case 'text':
                                        case 'content':
                                            return <TextUnitEditor key={unit.id} {...editorProps} />;
                                        case 'video':
                                            return <VideoUnitEditor key={unit.id} {...editorProps} />;
                                        case 'audio':
                                            return <AudioUnitEditor key={unit.id} {...editorProps} />;
                                        case 'document':
                                            return <DocumentUnitEditor key={unit.id} {...editorProps} />;
                                        case 'iframe':
                                            return <IframeUnitEditor key={unit.id} {...editorProps} />;
                                        case 'ilt':
                                            return <ILTUnitEditor key={unit.id} {...editorProps} />;
                                        case 'test':
                                            return <TestUnitEditor key={unit.id} {...editorProps} />;
                                        case 'survey':
                                            return <SurveyUnitEditor key={unit.id} {...editorProps} />;
                                        case 'assignment':
                                            return <AssignmentUnitEditor key={unit.id} {...editorProps} />;
                                        case 'scorm':
                                            return <ScormUnitEditor key={unit.id} {...editorProps} />;
                                        default:
                                            return null;
                                    }
                                })()}
                            </Box>
                        </Box>
                    )}
                </Box>
            </Box>

            {/* Modals and Drawers */}
            <AddMenuGrouped
                anchorEl={addMenuAnchor}
                open={!!addMenuAnchor}
                onClose={() => setAddMenuAnchor(null)}
                onSelectType={handleUnitTypeSelect}
            />

            <GenericUnitModal
                open={!!activeModal}
                type={activeModal || ''}
                onClose={() => setActiveModal(null)}
                courseId={courseId!}
                onSave={fetchCourse}
            />

            <Dialog open={moveUnitDialogOpen} onClose={() => setMoveUnitDialogOpen(false)}>
                <DialogTitle>Move Unit</DialogTitle>
                <DialogContent>
                    <List>
                        <ListItemButton onClick={() => moveUnitId && handleMoveUnit(moveUnitId, null)}>
                            <ListItemText primary="Unassigned" />
                        </ListItemButton>
                        {course.sections?.map((s: any) => (
                            <ListItemButton key={s.id} onClick={() => moveUnitId && handleMoveUnit(moveUnitId, s.id)}>
                                <ListItemText primary={s.title} />
                            </ListItemButton>
                        ))}
                    </List>
                </DialogContent>
            </Dialog>

            <UnitOptionsDrawer
                open={unitOptionsDrawerOpen}
                onClose={() => setUnitOptionsDrawerOpen(false)}
                unit={optionsUnitId ? findUnitById(optionsUnitId) : null}
                onSave={(options) => optionsUnitId && handleSaveUnitOptions(optionsUnitId, options)}
            />

            <CourseSettingsDrawer
                open={settingsDrawerOpen}
                onClose={() => setSettingsDrawerOpen(false)}
                courseId={courseId!}
                settings={courseSettings}
                onSave={(settings) => {
                    setCourseSettings(settings);
                    handleAutoSave({ settings: JSON.stringify(settings) });
                }}
            />

            <CourseEnrollmentDrawer
                open={enrollmentDrawerOpen}
                onClose={() => setEnrollmentDrawerOpen(false)}
                courseId={courseId!}
            />

            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default function Page() {
    return (
        <Suspense fallback={<CircularProgress />}>
            <CourseEditorContent />
        </Suspense>
    );
}
