'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box, Typography, Paper, Button, TextField, InputAdornment, Card,
    CardContent, CardActions, Chip, IconButton, Menu, MenuItem, Dialog, DialogTitle,
    DialogContent, DialogActions, FormControl, InputLabel, Select, Snackbar, Alert,
    CircularProgress, Switch, FormControlLabel,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PeopleIcon from '@mui/icons-material/People';

interface Course {
    id: string;
    code: string;
    title: string;
    description: string;
    image: string | null;
    status: string;
    hiddenFromCatalog: boolean;
    createdAt: string;
}

export default function InstructorCoursesPage() {
    const router = useRouter();
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Dialog states
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

    // Form states
    const [formData, setFormData] = useState({
        code: '',
        title: '',
        description: '',
        status: 'DRAFT',
        hiddenFromCatalog: false,
    });

    // Menu state
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [menuCourseId, setMenuCourseId] = useState<string | null>(null);

    // Snackbar
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    // Fetch instructor courses
    const fetchCourses = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ search, status: statusFilter });
            const res = await fetch(`/api/instructor/courses?${params}`);
            const data = await res.json();
            setCourses(data.courses || []);
        } catch (error) {
            console.error('Error fetching courses:', error);
            setSnackbar({ open: true, message: 'Failed to fetch courses', severity: 'error' });
        } finally {
            setLoading(false);
        }
    }, [search, statusFilter]);

    useEffect(() => {
        fetchCourses();
    }, [fetchCourses]);

    // Handle edit course
    const handleEditCourse = async () => {
        if (!selectedCourse) return;
        try {
            const res = await fetch(`/api/courses/${selectedCourse.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setSnackbar({ open: true, message: 'Course updated successfully', severity: 'success' });
                setEditDialogOpen(false);
                fetchCourses();
            } else {
                setSnackbar({ open: true, message: 'Failed to update course', severity: 'error' });
            }
        } catch (error) {
            setSnackbar({ open: true, message: 'Failed to update course', severity: 'error' });
        }
    };

    // Handle delete course
    const handleDeleteCourse = async () => {
        if (!selectedCourse) return;
        try {
            const res = await fetch(`/api/courses/${selectedCourse.id}`, { method: 'DELETE' });

            if (res.ok) {
                setSnackbar({ open: true, message: 'Course deleted successfully', severity: 'success' });
                setDeleteDialogOpen(false);
                fetchCourses();
            } else {
                setSnackbar({ open: true, message: 'Failed to delete course', severity: 'error' });
            }
        } catch (error) {
            setSnackbar({ open: true, message: 'Failed to delete course', severity: 'error' });
        }
    };

    const openEditDialog = (course: Course) => {
        setSelectedCourse(course);
        setFormData({
            code: course.code,
            title: course.title,
            description: course.description || '',
            status: course.status,
            hiddenFromCatalog: course.hiddenFromCatalog,
        });
        setEditDialogOpen(true);
        setAnchorEl(null);
    };

    const openDeleteDialog = (course: Course) => {
        setSelectedCourse(course);
        setDeleteDialogOpen(true);
        setAnchorEl(null);
    };

    const getDefaultImage = (title: string) => {
        const colors = ['#1976d2', '#2e7d32', '#ed6c02', '#9c27b0', '#d32f2f'];
        const index = title.charCodeAt(0) % colors.length;
        return colors[index];
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight={600}>My Courses</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => router.push('/instructor/courses/new/edit')}
                    sx={{ bgcolor: '#1976d2' }}
                >
                    Add course
                </Button>
            </Box>

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <TextField
                        placeholder="Search courses..."
                        size="small"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        sx={{ flex: 1, maxWidth: 400 }}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>
                        }}
                    />
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Status</InputLabel>
                        <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
                            <MenuItem value="all">All</MenuItem>
                            <MenuItem value="draft">Draft</MenuItem>
                            <MenuItem value="published">Published</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            </Paper>

            {/* Courses Grid */}
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            ) : courses.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary">No courses found</Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        sx={{ mt: 2 }}
                        onClick={() => router.push('/instructor/courses/new/edit')}
                    >
                        Create your first course
                    </Button>
                </Paper>
            ) : (
                <Grid container spacing={3}>
                    {courses.map((course) => (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={course.id}>
                            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <Box
                                    sx={{
                                        height: 140,
                                        bgcolor: getDefaultImage(course.title),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        position: 'relative',
                                    }}
                                >
                                    <Typography variant="h3" sx={{ color: 'white', opacity: 0.3 }}>
                                        {course.title.charAt(0)}
                                    </Typography>
                                    <IconButton
                                        sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'white' }}
                                        size="small"
                                        onClick={(e) => {
                                            setAnchorEl(e.currentTarget);
                                            setMenuCourseId(course.id);
                                        }}
                                    >
                                        <MoreVertIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                                <CardContent sx={{ flex: 1 }}>
                                    <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                        <Chip
                                            label={course.status}
                                            size="small"
                                            color={course.status === 'PUBLISHED' ? 'success' : 'default'}
                                        />
                                        {course.hiddenFromCatalog && (
                                            <Chip label="Hidden" size="small" variant="outlined" />
                                        )}
                                    </Box>
                                    <Typography variant="subtitle1" fontWeight={600} noWrap>
                                        {course.title}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {course.code}
                                    </Typography>
                                    {course.description && (
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{ mt: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                                        >
                                            {course.description}
                                        </Typography>
                                    )}
                                </CardContent>
                                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <PeopleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                        <Typography variant="caption" color="text.secondary">0 enrolled</Typography>
                                    </Box>
                                    <Button size="small" onClick={() => openEditDialog(course)}>Edit</Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Action Menu */}
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                <MenuItem onClick={() => {
                    const course = courses.find(c => c.id === menuCourseId);
                    if (course) openEditDialog(course);
                }}>
                    <EditIcon sx={{ mr: 1, fontSize: 18 }} /> Edit
                </MenuItem>
                <MenuItem onClick={() => {
                    const course = courses.find(c => c.id === menuCourseId);
                    if (course) openDeleteDialog(course);
                }} sx={{ color: 'error.main' }}>
                    <DeleteIcon sx={{ mr: 1, fontSize: 18 }} /> Delete
                </MenuItem>
            </Menu>

            {/* Edit Course Dialog */}
            <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Edit Course</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <TextField
                            label="Title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            fullWidth
                        />
                        <TextField
                            label="Description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            fullWidth
                            multiline
                            rows={3}
                        />
                        <FormControl fullWidth>
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={formData.status}
                                label="Status"
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            >
                                <MenuItem value="DRAFT">Draft</MenuItem>
                                <MenuItem value="PUBLISHED">Published</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.hiddenFromCatalog}
                                    onChange={(e) => setFormData({ ...formData, hiddenFromCatalog: e.target.checked })}
                                />
                            }
                            label="Hide from catalog"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleEditCourse} variant="contained">Save Changes</Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Delete Course</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete "{selectedCourse?.title}"?
                        This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleDeleteCourse} variant="contained" color="error">Delete</Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
