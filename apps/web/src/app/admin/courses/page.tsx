'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box, Typography, Button, TextField, InputAdornment, IconButton,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Checkbox, Chip, Menu, MenuItem, Snackbar, Alert,
    CircularProgress, Tooltip, Dialog, DialogTitle, DialogContent,
    DialogActions,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import PreviewIcon from '@mui/icons-material/Preview';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import LinkIcon from '@mui/icons-material/Link';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { usePermissions } from '@/hooks/usePermissions';
import { getCsrfToken } from '@/lib/client-csrf';

interface Course {
    id: string;
    code: string;
    title: string;
    description: string;
    thumbnailUrl: string | null;
    status: string;
    hiddenFromCatalog: boolean;
    createdAt: string;
    updatedAt: string;
}

export default function CoursesPage() {
    const router = useRouter();
    const { can, loading: permissionsLoading } = usePermissions();
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<string[]>([]);

    // Permission checks
    const canCreate = can('course:create');
    const canDelete = can('course:delete_any');

    // Menu states
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [menuCourseId, setMenuCourseId] = useState<string | null>(null);
    const [addMenuAnchor, setAddMenuAnchor] = useState<null | HTMLElement>(null);

    // Snackbar
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [courseToDelete, setCourseToDelete] = useState<string | null>(null);
    const [isBulkDelete, setIsBulkDelete] = useState(false);

    // Fetch courses
    const fetchCourses = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ search });
            const res = await fetch(`/api/courses?${params}`);
            const data = await res.json();
            // Handle both { data: [...] } (standard) and { courses: [...] } (legacy/custom) formats
            setCourses(data.data || data.courses || []);
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
            setSelected(courses.map(c => c.id));
        } else {
            setSelected([]);
        }
    };

    const handleSelectOne = (id: string) => {
        const selectedIndex = selected.indexOf(id);
        let newSelected: string[] = [];

        if (selectedIndex === -1) {
            newSelected = newSelected.concat(selected, id);
        } else if (selectedIndex === 0) {
            newSelected = newSelected.concat(selected.slice(1));
        } else if (selectedIndex === selected.length - 1) {
            newSelected = newSelected.concat(selected.slice(0, -1));
        } else if (selectedIndex > 0) {
            newSelected = newSelected.concat(
                selected.slice(0, selectedIndex),
                selected.slice(selectedIndex + 1),
            );
        }

        setSelected(newSelected);
    };

    const handleCreateCourse = async () => {
        try {
            const res = await fetch('/api/courses', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-csrf-token': getCsrfToken()
                },
                body: JSON.stringify({
                    code: `COURSE-${Date.now()}`,
                    title: 'New course',
                    description: '',
                    status: 'DRAFT',
                    hiddenFromCatalog: false
                })
            });
            if (res.ok) {
                const newCourse = await res.json();
                router.push(`/admin/courses/new/edit?id=${newCourse.id}`);
            }
        } catch (error) {
            console.error('Error creating course:', error);
        }
        setAddMenuAnchor(null);
    };

    const handleDeleteClick = (courseId: string) => {
        setCourseToDelete(courseId);
        setIsBulkDelete(false);
        setDeleteDialogOpen(true);
    };

    const handleBulkDeleteClick = () => {
        setIsBulkDelete(true);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        setLoading(true);
        try {
            if (isBulkDelete) {
                // In a real app we'd have a bulk delete API. For now, sequential or check if route.ts supports array
                // Let's check api/courses/route.ts for DELETE. 
                // Since I don't know for sure if bulk delete exists on API, I'll do individual calls for now if needed, 
                // OR better: check if api/courses route.ts has DELETE handler.
                for (const id of selected) {
                    await fetch(`/api/courses/${id}`, { 
                        method: 'DELETE',
                        headers: { 'x-csrf-token': getCsrfToken() }
                    });
                }
                setSnackbar({ open: true, message: `${selected.length} courses deleted`, severity: 'success' });
                setSelected([]);
            } else if (courseToDelete) {
                const res = await fetch(`/api/courses/${courseToDelete}`, { 
                    method: 'DELETE',
                    headers: { 'x-csrf-token': getCsrfToken() }
                });
                if (res.ok) {
                    setSnackbar({ open: true, message: 'Course deleted successfully', severity: 'success' });
                } else {
                    const error = await res.json();
                    setSnackbar({ open: true, message: error.error || 'Failed to delete course', severity: 'error' });
                }
            }
            fetchCourses();
        } catch (error) {
            console.error('Delete error:', error);
            setSnackbar({ open: true, message: 'An error occurred while deleting', severity: 'error' });
        } finally {
            setLoading(false);
            setDeleteDialogOpen(false);
            setCourseToDelete(null);
        }
    };

    const getTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        if (diffHours < 1) return 'Just now';
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString();
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'hsl(var(--foreground))' }}>Courses</Typography>
                <Box>
                    {canCreate && (
                        <>
                            <Button
                                data-testid="admin-cta-add-course"
                                variant="contained"
                                startIcon={<AddIcon />}
                                endIcon={<ArrowDropDownIcon />}
                                onClick={(e) => setAddMenuAnchor(e.currentTarget)}
                                disabled={permissionsLoading}
                                sx={{
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    bgcolor: 'hsl(var(--primary))',
                                    color: 'hsl(var(--primary-foreground))',
                                    borderRadius: '6px',
                                    '&:hover': { bgcolor: 'hsl(var(--primary) / 0.9)' }
                                }}
                            >
                                Add course
                            </Button>
                            <Menu
                                anchorEl={addMenuAnchor}
                                open={Boolean(addMenuAnchor)}
                                onClose={() => setAddMenuAnchor(null)}
                            >
                                <MenuItem data-testid="menuitem-create-course" onClick={handleCreateCourse}>Create new course</MenuItem>
                                <MenuItem onClick={() => setAddMenuAnchor(null)}>Import course</MenuItem>
                            </Menu>
                        </>
                    )}
                </Box>
            </Box>

            {/* Search Bar */}
            <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
                <TextField
                    placeholder="Search"
                    size="small"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    sx={{ width: 300 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon fontSize="small" />
                            </InputAdornment>
                        ),
                    }}
                />
                <IconButton size="small" sx={{ border: '1px solid rgba(141, 166, 166, 0.2)' }}>
                    <FilterListIcon fontSize="small" />
                </IconButton>
                {selected.length > 0 && canDelete && (
                    <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={handleBulkDeleteClick}
                        size="small"
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                        Delete Selected ({selected.length})
                    </Button>
                )}
            </Box>

            {/* Table */}
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <TableContainer
                    component={Paper}
                    className="glass-card"
                    sx={{
                        boxShadow: 'none',
                        border: '1px solid rgba(141, 166, 166, 0.1)',
                        background: 'rgba(13, 20, 20, 0.4)'
                    }}
                >
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        indeterminate={selected.length > 0 && selected.length < courses.length}
                                        checked={courses.length > 0 && selected.length === courses.length}
                                        onChange={handleSelectAll}
                                    />
                                </TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Course</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Code</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Price</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Last updated on</TableCell>
                                <TableCell align="right"></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {courses.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                        <Typography color="text.secondary">No courses found</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                courses.map((course) => (
                                    <TableRow
                                        key={course.id}
                                        hover
                                        selected={selected.indexOf(course.id) !== -1}
                                        sx={{
                                            '&.Mui-selected': {
                                                bgcolor: 'rgba(26, 84, 85, 0.1)',
                                            }
                                        }}
                                    >
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                checked={selected.indexOf(course.id) !== -1}
                                                onChange={() => handleSelectOne(course.id)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography
                                                    sx={{
                                                        fontWeight: 700,
                                                        color: 'hsl(var(--primary))',
                                                        cursor: 'pointer',
                                                        fontSize: '0.9rem',
                                                        '&:hover': { textDecoration: 'underline' }
                                                    }}
                                                    onClick={() => router.push(`/admin/courses/new/edit?id=${course.id}`)}
                                                >
                                                    {course.title}
                                                </Typography>
                                                <IconButton size="small" sx={{ padding: 0.5, color: 'hsl(var(--muted-foreground))' }}>
                                                    <LinkIcon sx={{ fontSize: 16 }} />
                                                </IconButton>
                                                <Chip
                                                    label={course.status === 'PUBLISHED' ? 'Active' : 'Inactive'}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: course.status === 'PUBLISHED' ? 'rgba(46, 125, 50, 0.1)' : 'rgba(141, 166, 166, 0.1)',
                                                        color: course.status === 'PUBLISHED' ? '#4caf50' : 'hsl(var(--muted-foreground))',
                                                        fontWeight: 600,
                                                        fontSize: '0.7rem',
                                                        height: 20,
                                                        border: `1px solid ${course.status === 'PUBLISHED' ? 'rgba(46, 125, 50, 0.2)' : 'rgba(141, 166, 166, 0.2)'}`
                                                    }}
                                                />
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))' }}>
                                                {course.code || '-'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))' }}>-</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))' }}>-</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))' }}>
                                                {getTimeAgo(course.updatedAt)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Box
                                                className="action-buttons"
                                                sx={{
                                                    display: 'flex',
                                                    gap: 0.5,
                                                    justifyContent: 'flex-end'
                                                }}
                                            >
                                                <Tooltip title="View">
                                                    <IconButton size="small" sx={{ color: 'hsl(var(--foreground))' }}>
                                                        <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Preview">
                                                    <IconButton
                                                        size="small"
                                                        sx={{ color: 'hsl(var(--foreground))' }}
                                                        onClick={() => router.push(`/admin/courses/${course.id}`)}
                                                    >
                                                        <PreviewIcon sx={{ fontSize: 18 }} />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Duplicate">
                                                    <IconButton size="small" sx={{ color: 'hsl(var(--foreground))' }}>
                                                        <ContentCopyIcon sx={{ fontSize: 18 }} />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Edit">
                                                    <IconButton
                                                        size="small"
                                                        sx={{ color: 'hsl(var(--foreground))' }}
                                                        onClick={() => router.push(`/admin/courses/new/edit?id=${course.id}`)}
                                                    >
                                                        <EditIcon sx={{ fontSize: 18 }} />
                                                    </IconButton>
                                                </Tooltip>
                                                {canDelete && (
                                                    <Tooltip title="Delete">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleDeleteClick(course.id)}
                                                            sx={{ color: 'hsl(var(--destructive))' }}
                                                        >
                                                            <DeleteIcon sx={{ fontSize: 18 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                <IconButton
                                                    size="small"
                                                    sx={{ color: 'hsl(var(--foreground))' }}
                                                    onClick={(e) => {
                                                        setAnchorEl(e.currentTarget);
                                                        setMenuCourseId(course.id);
                                                    }}
                                                >
                                                    <MoreHorizIcon sx={{ fontSize: 18 }} />
                                                </IconButton>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Action Menu */}
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                <MenuItem onClick={() => setAnchorEl(null)}>Export</MenuItem>
                <MenuItem onClick={() => setAnchorEl(null)}>Share</MenuItem>
            </Menu>

            {/* Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle sx={{ fontWeight: 600 }}>
                    {isBulkDelete ? 'Delete multiple courses' : 'Delete course'}
                </DialogTitle>
                <DialogContent>
                    <Typography>
                        {isBulkDelete
                            ? `Are you sure you want to delete ${selected.length} courses? This action cannot be undone.`
                            : 'Are you sure you want to delete this course? This action cannot be undone.'}
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDeleteDialogOpen(false)} color="inherit">Cancel</Button>
                    <Button onClick={confirmDelete} color="error" variant="contained">Delete</Button>
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
