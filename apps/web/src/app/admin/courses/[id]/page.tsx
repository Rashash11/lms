'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Box, Typography, Button, TextField, InputAdornment, IconButton,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Checkbox, Tabs, Tab, Menu, MenuItem, Select, FormControl,
    Snackbar, Alert, CircularProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import DownloadIcon from '@mui/icons-material/Download';
import UserEnrollmentDialog from './UserEnrollmentDialog';
import { getCsrfToken } from '@/lib/client-csrf';

interface CourseUser {
    id: string;
    userId: string;
    user: {
        firstName: string;
        lastName: string;
        email: string;
    };
    role: string;
    progress: number;
    enrolledAt: string;
    completedAt: string | null;
    expiresAt: string | null;
}

export default function CourseDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const courseId = params.id as string;

    const [course, setCourse] = useState<any>(null);
    const [users, setUsers] = useState<CourseUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentTab, setCurrentTab] = useState(0);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<string[]>([]);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);

    const fetchUsers = useCallback(async () => {
        try {
            // Only set loading on initial fetch or full refresh if desired, 
            // but for smooth UX maybe we don't need to unset/set loading every time if we just want to update data.
            // However, existing logic used loading state for the whole page.
            // Let's keep it simply reusing the logic but maybe guard loading state if needed.
            // For now, simple refactoring.
            const res = await fetch(`/api/courses/${courseId}/enrollments`);
            if (res.ok) {
                const data = await res.json();
                // API returns { enrollments, total, page, limit }
                const formattedUsers = (data.enrollments || []).map((e: any) => ({
                    id: e.id,
                    userId: e.userId,
                    user: {
                        firstName: e.user?.name?.split(' ')[0] || 'Unknown',
                        lastName: e.user?.name?.split(' ').slice(1).join(' ') || '',
                        email: e.user?.email || 'unknown@example.com'
                    },
                    role: 'LEARNER',
                    progress: e.progress || 0,
                    enrolledAt: e.enrolledAt,
                    completedAt: e.completedAt,
                    expiresAt: e.expiresAt
                }));
                setUsers(formattedUsers);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    }, [courseId]);

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const res = await fetch(`/api/courses/${courseId}`);
                if (res.ok) {
                    const data = await res.json();
                    setCourse(data);
                }
            } catch (error) {
                console.error('Error fetching course:', error);
            }
        };

        if (courseId) {
            fetchCourse();
            void fetchUsers();
        }
    }, [courseId, fetchUsers]);

    const handleEnrollUsers = async (userIds: string[]) => {
        try {
            const res = await fetch(`/api/courses/${courseId}/enrollments`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-csrf-token': getCsrfToken()
                },
                body: JSON.stringify({ userIds }),
            });

            if (res.ok) {
                const data = await res.json();
                setSnackbar({
                    open: true,
                    message: `Successfully enrolled ${data.enrolled} users` + (data.skipped ? ` (${data.skipped} skipped)` : ''),
                    severity: 'success'
                });
                fetchUsers();
            } else {
                const error = await res.json();
                setSnackbar({ open: true, message: error.error || 'Failed to enroll users', severity: 'error' });
                throw new Error(error.error);
            }
        } catch (err) {
            console.error(err);
            setSnackbar({ open: true, message: 'Failed to enroll users', severity: 'error' });
            throw err;
        }
    };

    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            setSelected(users.map(u => u.id));
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

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString();
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box>
                        <Typography variant="caption" color="text.secondary">Courses</Typography>
                        <Typography variant="h5" fontWeight={600}>{course?.title || 'New course'}</Typography>
                    </Box>
                    <Button
                        variant="contained"
                        onClick={() => router.push(`/admin/courses/new/edit?id=${courseId}`)}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                        Edit course
                    </Button>
                </Box>
            </Box>

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)}>
                    <Tab label="Users" sx={{ textTransform: 'none', fontWeight: 600 }} />
                    <Tab label="Groups" sx={{ textTransform: 'none', fontWeight: 600 }} />
                    <Tab label="Branches" sx={{ textTransform: 'none', fontWeight: 600 }} />
                    <Tab label="Files" sx={{ textTransform: 'none', fontWeight: 600 }} />
                </Tabs>
            </Box>

            {/* Search and Actions */}
            <Box sx={{ mb: 2, display: 'flex', gap: 1, justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
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
                    <IconButton size="small" sx={{ border: '1px solid #e0e0e0' }}>
                        <FilterListIcon fontSize="small" />
                    </IconButton>
                </Box>
                <Button
                    variant="outlined"
                    startIcon={<PersonAddIcon />}
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                    onClick={() => setEnrollDialogOpen(true)}
                >
                    Enroll to course
                </Button>
            </Box>

            {/* Users Table */}
            {currentTab === 0 && (
                <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #e0e0e0' }}>
                    <Table>
                        <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                            <TableRow>
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        indeterminate={selected.length > 0 && selected.length < users.length}
                                        checked={users.length > 0 && selected.length === users.length}
                                        onChange={handleSelectAll}
                                    />
                                </TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>User</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Progress status</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Enrollment date</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Completion date</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Expiration date</TableCell>
                                <TableCell align="right"></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                                        <Typography color="text.secondary">No users enrolled yet</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users.map((enrollment) => (
                                    <TableRow
                                        key={enrollment.id}
                                        hover
                                        selected={selected.indexOf(enrollment.id) !== -1}
                                    >
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                checked={selected.indexOf(enrollment.id) !== -1}
                                                onChange={() => handleSelectOne(enrollment.id)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={500}>
                                                {enrollment.user.firstName} {enrollment.user.lastName}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <FormControl size="small" sx={{ minWidth: 120 }}>
                                                <Select value={enrollment.role} displayEmpty>
                                                    <MenuItem value="LEARNER">Learner</MenuItem>
                                                    <MenuItem value="INSTRUCTOR">Instructor</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">-</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">
                                                {formatDate(enrollment.enrolledAt)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">
                                                {formatDate(enrollment.completedAt)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">
                                                {formatDate(enrollment.expiresAt)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton size="small">
                                                <MoreHorizIcon sx={{ fontSize: 18 }} />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Other tabs placeholders */}
            {currentTab === 1 && (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary">Groups tab - Coming soon</Typography>
                </Paper>
            )}
            {currentTab === 2 && (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary">Branches tab - Coming soon</Typography>
                </Paper>
            )}
            {currentTab === 3 && (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary">Files tab - Coming soon</Typography>
                </Paper>
            )}

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

            <UserEnrollmentDialog
                open={enrollDialogOpen}
                onClose={() => setEnrollDialogOpen(false)}
                onEnroll={handleEnrollUsers}
                enrolledUserIds={users.map(u => u.userId)}
            />
        </Box>
    );
}
