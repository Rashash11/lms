'use client';

import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Button, TextField, InputAdornment, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, IconButton, Menu, MenuItem,
    Stack, Chip, Dialog, DialogTitle, DialogContent, DialogActions, FormControl,
    InputLabel, Select, CircularProgress
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add';
import HistoryIcon from '@mui/icons-material/History';

interface Assignment {
    id: string;
    title: string;
    description: string | null;
    courseId: string | null;
    dueAt: string | null;
    createdAt: string;
    course?: {
        title: string;
        code: string;
    };
}

export default function AssignmentsPage() {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [currentAssignment, setCurrentAssignment] = useState<Assignment | null>(null);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [courses, setCourses] = useState<{ id: string, title: string }[]>([]);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        courseId: '',
        dueAt: '',
    });

    useEffect(() => {
        fetchAssignments();
        fetchCourses();
    }, []);

    const fetchAssignments = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/assignments');
            const data = await res.json();
            setAssignments(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCourses = async () => {
        try {
            const res = await fetch('/api/courses');
            const data = await res.json();
            setCourses(data.courses || []);
        } catch (err) {
            console.error(err);
        }
    };

    const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, assignment: Assignment) => {
        setAnchorEl(event.currentTarget);
        setCurrentAssignment(assignment);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
    };

    const handleAdd = () => {
        setCurrentAssignment(null);
        setFormData({ title: '', description: '', courseId: '', dueAt: '' });
        setDialogOpen(true);
    };

    const handleEdit = () => {
        if (currentAssignment) {
            setFormData({
                title: currentAssignment.title,
                description: currentAssignment.description || '',
                courseId: currentAssignment.courseId || '',
                dueAt: currentAssignment.dueAt ? new Date(currentAssignment.dueAt).toISOString().slice(0, 16) : '',
            });
            setDialogOpen(true);
        }
        handleCloseMenu();
    };

    const handleDelete = () => {
        setDeleteDialogOpen(true);
        handleCloseMenu();
    };

    const handleSubmit = async () => {
        const method = currentAssignment ? 'PUT' : 'POST';
        const url = currentAssignment ? `/api/assignments/${currentAssignment.id}` : '/api/assignments';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    dueAt: formData.dueAt ? new Date(formData.dueAt).toISOString() : null
                }),
            });
            if (res.ok) {
                fetchAssignments();
                setDialogOpen(false);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const confirmDelete = async () => {
        if (!currentAssignment) return;
        try {
            const res = await fetch(`/api/assignments/${currentAssignment.id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchAssignments();
                setDeleteDialogOpen(false);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const filtered = assignments.filter(a =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.description?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <Box>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <HistoryIcon fontSize="large" color="primary" />
                    Assignments
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    href="/admin/assignments/new"
                >
                    Add assignment
                </Button>
            </Box>

            <Paper sx={{ width: '100%', mb: 2 }}>
                <Box sx={{ p: 2 }}>
                    <TextField
                        placeholder="Search assignments..."
                        size="small"
                        fullWidth
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Title</TableCell>
                                <TableCell>Course</TableCell>
                                <TableCell>Due Date</TableCell>
                                <TableCell>Created</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={5} align="center"><CircularProgress /></TableCell></TableRow>
                            ) : filtered.length === 0 ? (
                                <TableRow><TableCell colSpan={5} align="center">No assignments found</TableCell></TableRow>
                            ) : (
                                filtered.map((a) => (
                                    <TableRow key={a.id} hover>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={500}>{a.title}</Typography>
                                            <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 300, display: 'block' }}>
                                                {a.description}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            {a.course ? (
                                                <Chip label={a.course.title} size="small" variant="outlined" />
                                            ) : (
                                                <Typography variant="caption" color="text.secondary">N/A</Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {a.dueAt ? new Date(a.dueAt).toLocaleDateString() : 'No limit'}
                                        </TableCell>
                                        <TableCell>
                                            {new Date(a.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton onClick={(e) => handleOpenMenu(e, a)}>
                                                <MoreVertIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseMenu}>
                <MenuItem onClick={handleEdit}>Edit</MenuItem>
                <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>Delete</MenuItem>
            </Menu>

            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{currentAssignment ? 'Edit Assignment' : 'Add Assignment'}</DialogTitle>
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
                            rows={4}
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
                    <Button variant="contained" onClick={handleSubmit}>
                        {currentAssignment ? 'Save Changes' : 'Create Assignment'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Delete Assignment</DialogTitle>
                <DialogContent>
                    <Typography>Are you sure you want to delete this assignment?</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" color="error" onClick={confirmDelete}>Delete</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
