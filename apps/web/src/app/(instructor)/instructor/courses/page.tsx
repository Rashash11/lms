'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box, Typography, Button, TextField, InputAdornment,
    IconButton, Menu, MenuItem, Checkbox,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Chip, ButtonGroup, Skeleton, Tooltip, Snackbar, Alert,
    CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
    Switch, FormControlLabel, FormControl, InputLabel, Select
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import FilterListIcon from '@mui/icons-material/FilterList';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { apiFetch } from '@shared/http/apiFetch';

interface Course {
    id: string;
    code: string;
    title: string;
    description: string;
    image: string | null;
    status: string;
    category?: { name: string };
    price?: number;
    updatedAt: string;
}

export default function InstructorCoursesPage() {
    const router = useRouter();
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<string[]>([]);
    const [sortConfig, setSortConfig] = useState<{ key: keyof Course, direction: 'asc' | 'desc' }>({ key: 'title', direction: 'asc' });

    // Menu state
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [menuCourse, setMenuCourse] = useState<Course | null>(null);

    // Split button state
    const [splitAnchorEl, setSplitAnchorEl] = useState<null | HTMLElement>(null);

    // Dialog & Feedback
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    const fetchCourses = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ search });
            const res = await fetch(`/api/instructor/courses?${params}`);
            const data = await res.json();
            setCourses(data.data || []);
        } catch (error) {
            console.error('Error fetching courses:', error);
            setSnackbar({ open: true, message: 'Failed to fetch courses', severity: 'error' });
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        fetchCourses();
    }, [fetchCourses]);

    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            setSelected(courses.map(n => n.id));
            return;
        }
        setSelected([]);
    };

    const handleSelect = (id: string) => {
        const selectedIndex = selected.indexOf(id);
        let newSelected: string[] = [];

        if (selectedIndex === -1) {
            newSelected = [...selected, id];
        } else {
            newSelected = selected.filter(item => item !== id);
        }
        setSelected(newSelected);
    };

    const handleSort = (key: keyof Course) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedCourses = [...courses].sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        if (!valA || !valB) return 0;
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const formatLastUpdated = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

        if (diffHours < 24) {
            return diffHours === 0 ? 'Just now' : `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        }
        if (diffHours < 48) return 'Yesterday';
        return date.toLocaleDateString('en-GB'); // DD/MM/YYYY
    };

    const handleDelete = async () => {
        if (!menuCourse) return;
        try {
            await apiFetch(`/api/courses/${menuCourse.id}`, { method: 'DELETE' });
            setSnackbar({ open: true, message: 'Course deleted successfully', severity: 'success' });
            fetchCourses();
        } catch {
            setSnackbar({ open: true, message: 'Failed to delete course', severity: 'error' });
        } finally {
            setDeleteDialogOpen(false);
            setAnchorEl(null);
        }
    };

    return (
        <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight={700} color="#172B4D">Courses</Typography>
                <ButtonGroup variant="contained" sx={{ boxShadow: 'none' }}>
                    <Button
                        onClick={() => router.push('/instructor/courses/new/edit')}
                        sx={{
                            bgcolor: '#0052CC',
                            textTransform: 'none',
                            fontWeight: 600,
                            px: 3,
                            '&:hover': { bgcolor: '#0747A6' }
                        }}
                    >
                        Add course
                    </Button>
                    <Button
                        size="small"
                        sx={{ bgcolor: '#0052CC', p: 0, minWidth: 32, '&:hover': { bgcolor: '#0747A6' } }}
                        onClick={(e) => setSplitAnchorEl(e.currentTarget)}
                    >
                        <ArrowDropDownIcon />
                    </Button>
                </ButtonGroup>
            </Box>

            {/* Split Button Menu */}
            <Menu anchorEl={splitAnchorEl} open={Boolean(splitAnchorEl)} onClose={() => setSplitAnchorEl(null)}>
                <MenuItem onClick={() => router.push('/instructor/courses/new/edit')}>Create new</MenuItem>
                <MenuItem onClick={() => setSplitAnchorEl(null)}>Import from CSV</MenuItem>
            </Menu>

            {/* Constraints / Controls */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
                <TextField
                    placeholder="Search"
                    size="small"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    sx={{
                        width: 250,
                        '& .MuiOutlinedInput-root': {
                            bgcolor: '#F4F5F7',
                            border: 'none',
                            borderRadius: 1,
                            '& fieldset': { border: 'none' }
                        }
                    }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: '#6B778C', fontSize: 20 }} />
                            </InputAdornment>
                        ),
                    }}
                />
                <IconButton sx={{ color: '#6B778C' }}>
                    <FilterListIcon />
                </IconButton>
            </Box>

            {/* Table */}
            <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #DFE1E6', borderRadius: 2 }}>
                <Table>
                    <TableHead sx={{ bgcolor: '#FAFBFC' }}>
                        <TableRow>
                            <TableCell padding="checkbox" sx={{ borderBottom: '1px solid #DFE1E6' }}>
                                <Checkbox
                                    size="small"
                                    indeterminate={selected.length > 0 && selected.length < courses.length}
                                    checked={courses.length > 0 && selected.length === courses.length}
                                    onChange={handleSelectAll}
                                />
                            </TableCell>
                            <TableCell
                                sx={{ fontWeight: 700, color: '#172B4D', cursor: 'pointer', borderBottom: '1px solid #DFE1E6' }}
                                onClick={() => handleSort('title')}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    Course
                                    {sortConfig.key === 'title' && (
                                        sortConfig.direction === 'asc' ? <ArrowUpwardIcon sx={{ fontSize: 14 }} /> : <ArrowDownwardIcon sx={{ fontSize: 14 }} />
                                    )}
                                </Box>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#172B4D', borderBottom: '1px solid #DFE1E6' }}>Code</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#172B4D', borderBottom: '1px solid #DFE1E6' }}>Category</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#172B4D', borderBottom: '1px solid #DFE1E6' }}>Price</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#172B4D', borderBottom: '1px solid #DFE1E6' }}>Last updated on</TableCell>
                            <TableCell align="right" sx={{ borderBottom: '1px solid #DFE1E6' }} />
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            [1, 2, 3, 4, 5].map((i) => (
                                <TableRow key={i}>
                                    <TableCell padding="checkbox"><Skeleton variant="rectangular" width={20} height={20} /></TableCell>
                                    <TableCell><Skeleton variant="text" width={150} /></TableCell>
                                    <TableCell><Skeleton variant="text" width={50} /></TableCell>
                                    <TableCell><Skeleton variant="text" width={80} /></TableCell>
                                    <TableCell><Skeleton variant="text" width={40} /></TableCell>
                                    <TableCell><Skeleton variant="text" width={100} /></TableCell>
                                    <TableCell align="right"><Skeleton variant="circular" width={24} height={24} /></TableCell>
                                </TableRow>
                            ))
                        ) : sortedCourses.length > 0 ? (
                            sortedCourses.map((course, index) => (
                                <TableRow
                                    key={course.id}
                                    hover
                                    sx={{
                                        '&:nth-of-type(even)': { bgcolor: '#FAFBFC' },
                                        '&:hover': { bgcolor: '#F4F5F7 !important' }
                                    }}
                                >
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            size="small"
                                            checked={selected.indexOf(course.id) !== -1}
                                            onChange={() => handleSelect(course.id)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="body2" fontWeight={600} color="#0052CC" sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                                                {course.title}
                                            </Typography>
                                            {course.status !== 'PUBLISHED' && (
                                                <Chip
                                                    label="Inactive"
                                                    size="small"
                                                    sx={{
                                                        height: 20,
                                                        fontSize: 10,
                                                        fontWeight: 700,
                                                        bgcolor: '#DFE1E6',
                                                        color: '#172B4D',
                                                        borderRadius: 1
                                                    }}
                                                />
                                            )}
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ color: '#42526E', fontSize: 13 }}>{course.code || '-'}</TableCell>
                                    <TableCell sx={{ color: '#42526E', fontSize: 13 }}>{course.category?.name || '-'}</TableCell>
                                    <TableCell sx={{ color: '#42526E', fontSize: 13 }}>{course.price ? `$${course.price}` : '-'}</TableCell>
                                    <TableCell sx={{ color: '#42526E', fontSize: 13 }}>{formatLastUpdated(course.updatedAt)}</TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                setAnchorEl(e.currentTarget);
                                                setMenuCourse(course);
                                            }}
                                        >
                                            <MoreHorizIcon fontSize="small" sx={{ color: '#6B778C' }} />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} sx={{ py: 6, textAlign: 'center' }}>
                                    <Typography color="text.secondary">No courses found matching your criteria.</Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Row Action Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                PaperProps={{ sx: { minWidth: 150, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' } }}
            >
                <MenuItem onClick={() => {
                    if (menuCourse) router.push(`/instructor/courses/${menuCourse.id}`);
                    setAnchorEl(null);
                }}>
                    <EditIcon sx={{ mr: 1, fontSize: 18, color: '#6B778C' }} /> Edit
                </MenuItem>
                <MenuItem onClick={() => setDeleteDialogOpen(true)} sx={{ color: 'error.main' }}>
                    <DeleteIcon sx={{ mr: 1, fontSize: 18 }} /> Delete
                </MenuItem>
            </Menu>

            {/* Delete Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle sx={{ fontWeight: 700 }}>Delete Course</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="#172B4D">
                        Are you sure you want to delete <strong>{menuCourse?.title}</strong>? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDeleteDialogOpen(false)} sx={{ textTransform: 'none', color: '#6B778C' }}>Cancel</Button>
                    <Button onClick={handleDelete} variant="contained" color="error" sx={{ textTransform: 'none' }}>Delete</Button>
                </DialogActions>
            </Dialog>

            {/* Feedback */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert severity={snackbar.severity} sx={{ borderRadius: 2 }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
