'use client';

import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Button, TextField, InputAdornment, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, IconButton, Menu, MenuItem,
    Stack, Chip, Dialog, DialogTitle, DialogContent, DialogActions, FormControl,
    InputLabel, Select, CircularProgress, Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';

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

export default function InstructorAssignmentsPage() {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [currentAssignment, setCurrentAssignment] = useState<Assignment | null>(null);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [courses, setCourses] = useState<{ id: string, title: string }[]>([]);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        courseId: '',
        dueAt: '',
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [assignmentsRes, coursesRes] = await Promise.all([
                fetch('/api/assignments'),
                fetch('/api/courses') // This should return only instructor's courses
            ]);

            if (assignmentsRes.ok) {
                const data = await assignmentsRes.json();
                setAssignments(data);
            }

            if (coursesRes.ok) {
                const data = await coursesRes.json();
                setCourses(data.courses || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
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
        setError(null);
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
            setError(null);
            setDialogOpen(true);
        }
        handleCloseMenu();
    };

    const handleSubmit = async () => {
        const method = currentAssignment ? 'PUT' : 'POST';
        const url = currentAssignment ? `/api/assignments/${currentAssignment.id}` : '/api/assignments';

        // Basic client-side validation
        if (!formData.title) {
            setError('Title is required');
            return;
        }
        if (!formData.courseId) {
            setError('Course is required');
            return;
        }

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
                fetchData(); // Refresh list
                setDialogOpen(false);
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to save assignment');
            }
        } catch (err) {
            console.error(err);
            setError('An error occurred');
        }
    };

    const filtered = assignments.filter(a =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.description?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <AssignmentOutlinedIcon fontSize="large" color="primary" />
                    My Assignments
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    href="/instructor/assignments/new"
                >
                    Create Assignment
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
                                <TableRow><TableCell colSpan={5} align="center">No assignments found for your courses</TableCell></TableRow>
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
                {/* Delete option intentionally omitted for Instructors */}
            </Menu>

            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{currentAssignment ? 'Edit Assignment' : 'Create Assignment'}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        {error && <Alert severity="error">{error}</Alert>}
                        <TextField
                            label="Title"
                            required
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
                        <FormControl fullWidth required>
                            <InputLabel>Course</InputLabel>
                            <Select
                                value={formData.courseId}
                                label="Course"
                                onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                            >
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
        </Box>
    );
}
