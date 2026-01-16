'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    Chip,
    TextField,
    InputAdornment,
    Avatar,
    Switch,
    FormControlLabel,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Snackbar,
    Alert,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { usePermissions } from '@/hooks/usePermissions';
import { useApiError } from '@/hooks/useApiError';
import AccessDenied from '@shared/ui/components/AccessDenied';
import AddIcon from '@mui/icons-material/Add';
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import QuizIcon from '@mui/icons-material/Quiz';
import { apiFetch } from '@shared/http/apiFetch';

export default function SkillsPage() {
    const [search, setSearch] = useState('');
    const [skillsData, setSkillsData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { can, loading: permissionsLoading } = usePermissions();
    const { handleResponse } = useApiError();
    const [forbidden, setForbidden] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    const fetchSkills = useCallback(async () => {
        try {
            const res = await fetch('/api/skills');
            if (res.status === 403) {
                setForbidden(true);
                return;
            }
            if (handleResponse(res)) return;
            const data = await res.json();
            setSkillsData(data.data || []);
        } catch (error) {
            console.error('Failed to fetch skills:', error);
        } finally {
            setLoading(false);
        }
    }, [handleResponse]);

    useEffect(() => {
        if (!permissionsLoading && can('skills:read')) {
            void fetchSkills();
        }
    }, [can, fetchSkills, permissionsLoading]);

    if (permissionsLoading) return null;
    if (!can('skills:read') || forbidden) {
        return <AccessDenied requiredPermission="skills:read" />;
    }
    if (loading) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 6 }}>
                <CircularProgress />
            </Box>
        );
    }

    const filteredSkills = skillsData.filter(skill =>
        skill.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleCreate = async () => {
        if (!newName.trim()) {
            setSnackbar({ open: true, message: 'Name is required', severity: 'error' });
            return;
        }

        setCreating(true);
        try {
            await apiFetch('/api/skills', {
                method: 'POST',
                credentials: 'include',
                body: {
                    name: newName.trim(),
                    description: newDescription.trim() || undefined,
                },
            });
            setSnackbar({ open: true, message: 'Skill created', severity: 'success' });
            setCreateOpen(false);
            setNewName('');
            setNewDescription('');
            setLoading(true);
            await fetchSkills();
        } catch (e) {
            setSnackbar({ open: true, message: e instanceof Error ? e.message : 'Failed to create skill', severity: 'error' });
        } finally {
            setCreating(false);
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h5" fontWeight={600}>Skills</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Define skills and let AI assess your learners
                    </Typography>
                </Box>
                {can('skills:create') && (
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
                        Add skill
                    </Button>
                )}
            </Box>

            {/* Info Banner */}
            <Paper sx={{ p: 2, mb: 3, bgcolor: '#e3f2fd', border: '1px solid #90caf9' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <AutoFixHighIcon sx={{ color: '#1976d2', fontSize: 32 }} />
                    <Box>
                        <Typography variant="subtitle1" fontWeight={600} color="#1976d2">
                            AI-Powered Skills Assessment
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Enable AI to automatically generate questions and assess learner proficiency
                        </Typography>
                    </Box>
                </Box>
            </Paper>

            {/* Search */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <TextField
                    placeholder="Search skills..."
                    size="small"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    sx={{ width: 300 }}
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>
                    }}
                />
            </Paper>

            {/* Skills List */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {filteredSkills.map((skill) => (
                    <Paper key={skill.id} sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Avatar sx={{ bgcolor: '#1976d2', width: 48, height: 48 }}>
                                    <EmojiObjectsIcon />
                                </Avatar>
                                <Box>
                                    <Typography variant="h6" fontWeight={600}>{skill.name}</Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                        {skill.description}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                        <Chip
                                            icon={<QuizIcon sx={{ fontSize: 16 }} />}
                                            label={`${skill.questionCount ?? skill.questions ?? 0} questions`}
                                            size="small"
                                            variant="outlined"
                                        />
                                        <Typography variant="caption" color="text.secondary">
                                            {skill.userCount ?? skill.users ?? 0} users assessed
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <FormControlLabel
                                    control={<Switch checked={Boolean(skill.aiEnabled)} size="small" disabled />}
                                    label={<Typography variant="caption">AI enabled</Typography>}
                                    labelPlacement="start"
                                />
                                <Button variant="outlined" size="small" disabled>Manage</Button>
                                <Button variant="contained" size="small" startIcon={<PlayCircleOutlineIcon />} disabled>
                                    Test
                                </Button>
                            </Box>
                        </Box>
                    </Paper>
                ))}
            </Box>

            {filteredSkills.length === 0 && (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <EmojiObjectsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">No skills found</Typography>
                    <Button variant="contained" startIcon={<AddIcon />} sx={{ mt: 2 }} onClick={() => setCreateOpen(true)}>
                        Create your first skill
                    </Button>
                </Paper>
            )}

            <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>Create skill</DialogTitle>
                <DialogContent sx={{ pt: 1 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        <TextField label="Name" value={newName} onChange={(e) => setNewName(e.target.value)} fullWidth autoFocus />
                        <TextField
                            label="Description"
                            value={newDescription}
                            onChange={(e) => setNewDescription(e.target.value)}
                            fullWidth
                            multiline
                            minRows={3}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateOpen(false)} disabled={creating}>Cancel</Button>
                    <Button onClick={handleCreate} disabled={creating} variant="contained">
                        {creating ? 'Creating…' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
