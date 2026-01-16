'use client';

import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Button, TextField, InputAdornment, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, IconButton, Menu, MenuItem,
    Chip, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
    FormControl, InputLabel, Select, Stack,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import { apiFetch } from '@shared/http/apiFetch';

interface Assignment {
    id: string;
    title: string;
    description: string | null;
    courseId: string | null;
    dueAt: string | null;
    createdAt: string;
    course?: { title: string };
}

export default function SuperInstructorAssignmentsPage() {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
    const [formData, setFormData] = useState({ title: '', description: '', courseId: '', dueAt: '' });

    useEffect(() => {
        fetchAssignments();
        fetchCourses();
    }, []);

    const fetchAssignments = async () => {
        setLoading(true);
        try {
            const data = await apiFetch<unknown>('/api/assignments');
            const list =
                Array.isArray(data)
                    ? data
                    : (data && typeof data === 'object' && !Array.isArray(data))
                        ? ((data as Record<string, unknown>).data || (data as Record<string, unknown>).assignments || [])
                        : [];
            setAssignments(Array.isArray(list) ? list : []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCourses = async () => {
        try {
            const data = await apiFetch<unknown>('/api/courses');
            const list =
                data && typeof data === 'object' && !Array.isArray(data)
                    ? ((data as Record<string, unknown>).data || (data as Record<string, unknown>).courses || [])
                    : [];
            setCourses(Array.isArray(list) ? list : []);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async () => {
        const method = selectedAssignment ? 'PUT' : 'POST';
        const url = selectedAssignment ? `/api/assignments/${selectedAssignment.id}` : '/api/assignments';

        try {
            await apiFetch(url, {
                method,
                body: {
                    ...formData,
                    dueAt: formData.dueAt ? new Date(formData.dueAt).toISOString() : null,
                },
            });
            fetchAssignments();
            setDialogOpen(false);
            setFormData({ title: '', description: '', courseId: '', dueAt: '' });
            setSelectedAssignment(null);
        } catch (err) {
            console.error(err);
        }
    };

    const handleEdit = () => {
        if (selectedAssignment) {
            setFormData({
                title: selectedAssignment.title,
                description: selectedAssignment.description || '',
                courseId: selectedAssignment.courseId || '',
                dueAt: selectedAssignment.dueAt ? new Date(selectedAssignment.dueAt).toISOString().slice(0, 16) : '',
            });
            setDialogOpen(true);
        }
        setAnchorEl(null);
    };

    const handleDelete = async () => {
        if (!selectedAssignment) return;
        try {
            await apiFetch(`/api/assignments/${selectedAssignment.id}`, { method: 'DELETE' });
            fetchAssignments();
        } catch (err) {
            console.error(err);
        }
        setAnchorEl(null);
    };

    const filtered = assignments.filter(a =>
        a.title.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Box className="animate-fade-in" sx={{ p: { xs: 2, md: 3 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                    <Box sx={{
                        p: 1.5,
                        borderRadius: 3,
                        bgcolor: 'hsl(var(--primary) / 0.1)',
                        color: 'hsl(var(--primary))',
                        display: 'flex',
                        boxShadow: '0 0 20px hsl(var(--primary) / 0.15)'
                    }}>
                        <AssignmentOutlinedIcon sx={{ fontSize: 32 }} />
                    </Box>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: 'hsl(var(--foreground))', letterSpacing: '-0.02em' }}>Assignments</Typography>
                        <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))' }}>Track learner tasks and submissions</Typography>
                    </Box>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    href="/super-instructor/assignments/new"
                    sx={{
                        bgcolor: 'hsl(var(--primary))',
                        color: 'white',
                        px: 3,
                        py: 1.2,
                        borderRadius: 2.5,
                        fontWeight: 700,
                        boxShadow: '0 8px 16px hsl(var(--primary) / 0.25)',
                        '&:hover': {
                            bgcolor: 'hsl(var(--primary))',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 12px 20px hsl(var(--primary) / 0.35)',
                        },
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                >
                    Add Assignment
                </Button>
            </Box>

            <Box className="glass-card" sx={{ p: 2, mb: 3, display: 'flex', gap: 2 }}>
                <TextField
                    placeholder="Search assignments by title..."
                    size="small"
                    fullWidth
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: 'hsl(var(--primary))', mr: 1 }} />
                            </InputAdornment>
                        ),
                    }}
                    sx={{
                        maxWidth: 500,
                        '& .MuiOutlinedInput-root': {
                            bgcolor: 'rgba(141, 166, 166, 0.05)',
                            borderRadius: 2.5,
                            '& fieldset': { borderColor: 'rgba(141, 166, 166, 0.1)' },
                            '&:hover fieldset': { borderColor: 'rgba(141, 166, 166, 0.2)' },
                            '&.Mui-focused fieldset': { borderColor: 'hsl(var(--primary) / 0.5)' },
                        }
                    }}
                />
            </Box>

            <TableContainer className="glass-card" sx={{ borderRadius: 4, overflow: 'hidden' }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'rgba(141, 166, 166, 0.05)' }}>
                            <TableCell sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Title</TableCell>
                            <TableCell sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Course</TableCell>
                            <TableCell sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Due Date</TableCell>
                            <TableCell sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Created</TableCell>
                            <TableCell align="right" sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                                    <CircularProgress sx={{ color: 'hsl(var(--primary))' }} />
                                </TableCell>
                            </TableRow>
                        ) : filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <AssignmentOutlinedIcon sx={{ fontSize: 48, color: 'hsl(var(--muted-foreground))', opacity: 0.5, mb: 2 }} />
                                        <Typography sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 500 }}>No assignments found</Typography>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((a) => (
                                <TableRow key={a.id} sx={{ '&:hover': { bgcolor: 'rgba(141, 166, 166, 0.03)' } }}>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'hsl(var(--foreground))' }}>{a.title}</Typography>
                                        <Typography variant="caption" noWrap sx={{ color: 'hsl(var(--muted-foreground))', maxWidth: 300, display: 'block', fontWeight: 500 }}>
                                            {a.description}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        {a.course ? <Chip
                                            label={a.course.title}
                                            size="small"
                                            sx={{
                                                bgcolor: 'rgba(141, 166, 166, 0.08)',
                                                color: 'hsl(var(--foreground))',
                                                border: '1px solid rgba(141, 166, 166, 0.2)',
                                                fontWeight: 500
                                            }}
                                        /> : '-'}
                                    </TableCell>
                                    <TableCell sx={{ color: 'hsl(var(--muted-foreground))', fontSize: 13, fontWeight: 500 }}>{a.dueAt ? new Date(a.dueAt).toLocaleDateString() : 'No limit'}</TableCell>
                                    <TableCell sx={{ color: 'hsl(var(--muted-foreground))', fontSize: 13, fontWeight: 500 }}>{new Date(a.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell align="right">
                                        <IconButton onClick={(e) => { setAnchorEl(e.currentTarget); setSelectedAssignment(a); }} sx={{ color: 'hsl(var(--muted-foreground))', '&:hover': { color: 'hsl(var(--primary))' } }}>
                                            <MoreVertIcon sx={{ fontSize: 20 }} />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                PaperProps={{
                    sx: {
                        bgcolor: 'rgba(13, 20, 20, 0.95)',
                        backdropFilter: 'blur(16px)',
                        border: '1px solid rgba(141, 166, 166, 0.1)',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                        borderRadius: 3,
                        mt: 1
                    }
                }}
            >
                <MenuItem onClick={handleEdit} sx={{ fontSize: 13, py: 1, px: 2, fontWeight: 500 }}>Edit</MenuItem>
                <MenuItem onClick={handleDelete} sx={{ fontSize: 13, py: 1, px: 2, fontWeight: 600, color: 'hsl(0 72% 51%)' }}>Delete</MenuItem>
            </Menu>

            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{selectedAssignment ? 'Edit Assignment' : 'Add Assignment'}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            label="Title"
                            fullWidth
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                        <TextField
                            label="Description"
                            fullWidth
                            multiline
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                        <FormControl fullWidth>
                            <InputLabel>Course (Optional)</InputLabel>
                            <Select
                                value={formData.courseId}
                                label="Course (Optional)"
                                onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                            >
                                <MenuItem value=""><em>None</em></MenuItem>
                                {courses.map(c => (
                                    <MenuItem key={c.id} value={c.id}>{c.title}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            label="Due Date"
                            type="datetime-local"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            value={formData.dueAt}
                            onChange={(e) => setFormData({ ...formData, dueAt: e.target.value })}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSubmit} sx={{ bgcolor: '#D97706' }}>
                        {selectedAssignment ? 'Save' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
