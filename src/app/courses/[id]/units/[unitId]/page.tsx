'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
    Box,
    CircularProgress,
    Typography,
    IconButton,
    Button,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon as MuiListItemIcon,
    ListItemText,
    Divider,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Snackbar
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SettingsIcon from '@mui/icons-material/Settings';
import FolderIcon from '@mui/icons-material/Folder';

import VideoUnitEditor from '@/components/admin/unit-editors/VideoUnitEditor';
import AudioUnitEditor from '@/components/admin/unit-editors/AudioUnitEditor';
import DocumentUnitEditor from '@/components/admin/unit-editors/DocumentUnitEditor';
import TextUnitEditor from '@/components/admin/unit-editors/TextUnitEditor';
import AddMenuGrouped from '@/components/admin/course-editor/AddMenu';
import CourseOutlineSidebar from '@/components/admin/course-editor/CourseOutlineSidebar';
import UnitOptionsDrawer from '@/components/admin/course-editor/UnitOptionsDrawer';

interface UnitData {
    id: string;
    courseId: string;
    type: string;
    title: string;
    config: any;
    status: 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED_CHANGES';
}

function UnitEditorContent() {
    const router = useRouter();
    const params = useParams();
    const courseId = params.id as string;
    const unitId = params.unitId as string;

    const [unit, setUnit] = useState<UnitData | null>(null);
    const [course, setCourse] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saveState, setSaveState] = useState<'saving' | 'saved' | 'error'>('saved');
    const [addMenuAnchor, setAddMenuAnchor] = useState<null | HTMLElement>(null);

    // Drawers & Modals State
    const [unitOptionsDrawerOpen, setUnitOptionsDrawerOpen] = useState(false);
    const [optionsUnitId, setOptionsUnitId] = useState<string | null>(null);
    const [moveUnitId, setMoveUnitId] = useState<string | null>(null);
    const [moveUnitDialogOpen, setMoveUnitDialogOpen] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    useEffect(() => {
        if (courseId && unitId) {
            loadData();
        }
    }, [courseId, unitId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [unitRes, courseRes] = await Promise.all([
                fetch(`/api/courses/${courseId}/units/${unitId}`),
                fetch(`/api/courses/${courseId}`)
            ]);

            if (unitRes.ok) setUnit(await unitRes.json());
            if (courseRes.ok) setCourse(await courseRes.json());
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCourse = async () => {
        try {
            const res = await fetch(`/api/courses/${courseId}`);
            if (res.ok) setCourse(await res.json());
        } catch (err) { }
    };

    const handleConfigChange = async (newConfig: any) => {
        if (!unit) return;
        setUnit({ ...unit, config: newConfig });
        setSaveState('saving');
        try {
            const response = await fetch(`/api/courses/${courseId}/units/${unitId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ config: newConfig }),
            });
            if (!response.ok) throw new Error('Failed to save');
            setSaveState('saved');
        } catch (error) {
            console.error('Error saving unit:', error);
            setSaveState('error');
        }
    };

    const handleUnitTypeSelect = async (type: string) => {
        setAddMenuAnchor(null);
        // Convert CONTENT to TEXT since the API only accepts TEXT
        const apiType = type.toUpperCase() === 'CONTENT' ? 'TEXT' : type;
        try {
            const response = await fetch(`/api/courses/${courseId}/units`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: apiType,
                    title: type === 'TEXT' || type.toUpperCase() === 'CONTENT' ? 'Content unit' : `${type.charAt(0) + type.slice(1).toLowerCase()} unit`,
                    config: { completion: { mode: 'button' } }
                }),
            });

            if (response.ok) {
                const newUnit = await response.json();
                router.push(`/courses/${courseId}/units/${newUnit.id}?courseId=${courseId}&unitId=${newUnit.id}`);
            }
        } catch (error) {
            console.error('Error creating unit:', error);
        }
    };

    const handlePublish = async () => {
        setSaveState('saving');
        try {
            const response = await fetch(`/api/courses/${courseId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'publish' }),
            });
            if (response.ok) {
                await fetchCourse();
                setSaveState('saved');
            }
        } catch (error) {
            setSaveState('error');
        }
    };

    const handleUnpublish = async () => {
        setSaveState('saving');
        try {
            const response = await fetch(`/api/courses/${courseId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'DRAFT' }),
            });
            if (response.ok) {
                await fetchCourse();
                setSaveState('saved');
            }
        } catch (error) {
            setSaveState('error');
        }
    };

    // Unit Actions
    const handlePublishUnit = async (id: string) => {
        try {
            const res = await fetch(`/api/courses/${courseId}/units/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'publish' })
            });
            if (res.ok) {
                const updatedUnit = await res.json();
                if (id === unitId) setUnit(updatedUnit);
                await fetchCourse();
            }
        } catch (err) { }
    };

    const handleUnpublishUnit = async (id: string) => {
        try {
            const res = await fetch(`/api/courses/${courseId}/units/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'unpublish' })
            });
            if (res.ok) {
                const updatedUnit = await res.json();
                if (id === unitId) setUnit(updatedUnit);
                await fetchCourse();
            }
        } catch (err) { }
    };

    const handleDuplicateUnit = async (id: string) => {
        try {
            const res = await fetch(`/api/courses/${courseId}/units/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'duplicate' })
            });
            if (res.ok) await fetchCourse();
        } catch (err) { }
    };

    const handleDeleteUnit = async (id: string) => {
        if (!confirm('Delete this unit?')) return;
        try {
            const res = await fetch(`/api/courses/${courseId}/units/${id}`, { method: 'DELETE' });
            if (res.ok) {
                if (id === unitId) {
                    router.push(`/courses/edit?id=${courseId}`);
                } else {
                    await fetchCourse();
                }
            }
        } catch (err) { }
    };

    const handleMoveUnit = async (unitId: string, sectionId: string | null) => {
        try {
            const res = await fetch(`/api/courses/${courseId}/units/${unitId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'move', sectionId })
            });
            if (res.ok) {
                await fetchCourse();
                setMoveUnitDialogOpen(false);
            }
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

    const handleSaveUnitOptions = async (uId: string, options: any) => {
        if (!courseId) return;
        try {
            const res = await fetch(`/api/courses/${courseId}/units/${uId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...findUnitById(uId), ...options })
            });
            if (res.ok) await fetchCourse();
        } catch (err) { }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', bgcolor: '#f7f9fc' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!unit) {
        return <Box sx={{ p: 4 }}><Typography variant="h6">Unit not found</Typography></Box>;
    }

    const renderEditor = () => {
        const editorProps = {
            unitId: unit.id,
            courseId: unit.courseId,
            config: unit.config || {},
            onConfigChange: handleConfigChange,
            title: unit.title,
        };

        switch (unit.type.toLowerCase()) {
            case 'text':
            case 'content':
                return <TextUnitEditor {...editorProps} />;
            case 'video':
                return <VideoUnitEditor {...editorProps} />;
            case 'audio':
                return <AudioUnitEditor {...editorProps} />;
            case 'document':
                return <DocumentUnitEditor {...editorProps} />;
            default:
                return (
                    <Box sx={{ p: 4 }}>
                        <Typography variant="h6">Editor for type "{unit.type}" not yet implemented</Typography>
                    </Box>
                );
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: '#fff', overflow: 'hidden' }}>
            {/* Top Navigation Bar */}
            <Box sx={{
                height: 50,
                bgcolor: '#00264d',
                display: 'flex',
                alignItems: 'center',
                px: 2,
                justifyContent: 'space-between',
                color: '#fff',
                zIndex: 1200
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton size="small" sx={{ color: '#fff' }}>
                        <MenuIcon />
                    </IconButton>
                    <Button
                        variant="contained"
                        size="small"
                        onClick={unit.status === 'PUBLISHED' ? () => handleUnpublishUnit(unit.id) : () => handlePublishUnit(unit.id)}
                        sx={{
                            bgcolor: '#fff',
                            color: '#4a5568',
                            textTransform: 'none',
                            fontWeight: 700,
                            borderRadius: '4px',
                            px: 2,
                            height: 32,
                            fontSize: '0.875rem',
                            '&:hover': { bgcolor: '#f7fafc' }
                        }}
                    >
                        {unit.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                    </Button>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {saveState === 'saving' && (
                        <Typography sx={{ fontSize: '0.75rem', color: '#cbd5e0', fontWeight: 600 }}>
                            Saving...
                        </Typography>
                    )}
                    {saveState === 'saved' && (
                        <Typography sx={{ fontSize: '0.75rem', color: '#cbd5e0', fontWeight: 600 }}>
                            Saved
                        </Typography>
                    )}
                </Box>
            </Box>

            <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Sidebar Navigation - Full Height */}
                <Box sx={{ width: 300, display: 'flex', flexDirection: 'column', borderRight: '1px solid #e2e8f0', bgcolor: '#fff' }}>
                    <Box sx={{ p: 2, pb: 0 }}>
                        <Button
                            startIcon={<ArrowBackIcon sx={{ fontSize: '1rem' }} />}
                            sx={{
                                textTransform: 'none',
                                color: '#3182ce',
                                p: 0,
                                minWidth: 0,
                                fontWeight: 600,
                                mb: 2,
                                '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' }
                            }}
                            onClick={() => router.push(`/courses/edit?id=${courseId}`)}
                        >
                            Back
                        </Button>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#2d3748', mb: 1 }}>
                            {course?.title || 'Course'}
                        </Typography>
                    </Box>

                    <CourseOutlineSidebar
                        sections={course?.sections || []}
                        unassignedUnits={course?.unassignedUnits || []}
                        onAddClick={(e: any) => setAddMenuAnchor(e.currentTarget)}
                        onUnitClick={(id) => router.push(`/courses/${courseId}/units/${id}?courseId=${courseId}&unitId=${id}`)}
                        onSectionClick={() => { }}
                        onPublishUnit={handlePublishUnit}
                        onUnpublishUnit={handleUnpublishUnit}
                        onDuplicateUnit={handleDuplicateUnit}
                        onDeleteUnit={handleDeleteUnit}
                        onOptionsUnit={(id) => { setOptionsUnitId(id); setUnitOptionsDrawerOpen(true); }}
                        onMoveUnit={(id) => { setMoveUnitId(id); setMoveUnitDialogOpen(true); }}
                        courseTitle={course?.title}
                        activeUnitId={unitId}
                    />
                </Box>

                {/* Main Content Area */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: '#fff' }}>
                    <Box sx={{ flex: 1, overflowY: 'auto', p: 8, pt: 4 }}>
                        <Box sx={{ maxWidth: 800, mx: 'auto' }}>
                            {renderEditor()}
                        </Box>
                    </Box>
                </Box>
            </Box>

            <AddMenuGrouped
                anchorEl={addMenuAnchor}
                open={Boolean(addMenuAnchor)}
                onClose={() => setAddMenuAnchor(null)}
                onSelectType={handleUnitTypeSelect}
            />

            <UnitOptionsDrawer
                open={unitOptionsDrawerOpen}
                onClose={() => setUnitOptionsDrawerOpen(false)}
                unit={optionsUnitId ? findUnitById(optionsUnitId) : null}
                onSave={handleSaveUnitOptions}
            />

            <Dialog open={moveUnitDialogOpen} onClose={() => setMoveUnitDialogOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle>Move unit to section</DialogTitle>
                <DialogContent>
                    <List>
                        <ListItemButton onClick={() => handleMoveUnit(moveUnitId!, null)}>
                            <MuiListItemIcon><FolderIcon /></MuiListItemIcon>
                            <ListItemText primary="-- No Section (Unassigned) --" />
                        </ListItemButton>
                        {course?.sections?.map((section: any) => (
                            <ListItemButton key={section.id} onClick={() => handleMoveUnit(moveUnitId!, section.id)}>
                                <MuiListItemIcon><FolderIcon /></MuiListItemIcon>
                                <ListItemText primary={section.title} />
                            </ListItemButton>
                        ))}
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setMoveUnitDialogOpen(false)}>Cancel</Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                sx={{ mb: 4, ml: 2 }}
            >
                <Box sx={{
                    bgcolor: snackbar.severity === 'error' ? '#f56565' : '#48bb78',
                    color: '#fff',
                    p: 1.2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    borderRadius: '24px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    minWidth: 200
                }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{snackbar.message}</Typography>
                </Box>
            </Snackbar>
        </Box>
    );
}

export default function UnitEditorPage() {
    return (
        <Suspense fallback={<CircularProgress />}>
            <UnitEditorContent />
        </Suspense>
    );
}
