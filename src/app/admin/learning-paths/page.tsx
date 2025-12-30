'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Button, TextField, InputAdornment, IconButton,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Chip, Menu, MenuItem, ToggleButtonGroup, ToggleButton, CircularProgress,
    Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import AddIcon from '@mui/icons-material/Add';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { useRouter } from 'next/navigation';

interface LearningPath {
    id: string;
    name: string;
    code: string;
    category: string;
    courseCount: number;
    status: string;
    updatedAt: string;
    createdAt: string;
}

type SortField = 'name' | 'code' | 'category' | 'courses' | 'updatedAt';

export default function LearningPathsPage() {
    const router = useRouter();
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState<SortField>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
    const [loading, setLoading] = useState(true);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const fetchLearningPaths = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                search: searchQuery,
                status: statusFilter,
                sortBy,
                sortOrder,
            });
            const response = await fetch(`/api/learning-paths?${params}`);
            if (response.ok) {
                const data = await response.json();
                setLearningPaths(data);
            }
        } catch (error) {
            console.error('Failed to fetch learning paths:', error);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, statusFilter, sortBy, sortOrder]);

    useEffect(() => {
        fetchLearningPaths();
    }, [fetchLearningPaths]);

    const handleSort = (field: SortField) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, path: LearningPath) => {
        setAnchorEl(event.currentTarget);
        setSelectedPath(path);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedPath(null);
    };

    const handleEdit = () => {
        if (selectedPath) {
            router.push(`/admin/learning-paths/${selectedPath.id}/edit`);
        }
        handleMenuClose();
    };

    const handleManage = () => {
        if (selectedPath) {
            router.push(`/admin/learning-paths/${selectedPath.id}/manage`);
        }
        handleMenuClose();
    };

    const handleDelete = () => {
        // Don't close menu or clear selectedPath yet - need it for the dialog
        setAnchorEl(null); // Close menu only
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!selectedPath) return;

        setDeleting(true);
        try {
            const response = await fetch(`/api/learning-paths/${selectedPath.id}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                await fetchLearningPaths();
                setDeleteDialogOpen(false);
                setSelectedPath(null);
            } else {
                const error = await response.json();
                alert(error.error || 'Failed to delete learning path');
            }
        } catch (error) {
            console.error('Failed to delete learning path:', error);
            alert('Failed to delete learning path');
        } finally {
            setDeleting(false);
        }
    };

    const cancelDelete = () => {
        setDeleteDialogOpen(false);
        setSelectedPath(null);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) {
            return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
        } else if (diffHours < 24) {
            return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        } else if (diffDays < 30) {
            return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleDateString();
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'published':
                return 'success';
            case 'draft':
                return 'warning';
            case 'inactive':
                return 'default';
            default:
                return 'default';
        }
    };

    const renderSortIcon = (field: SortField) => {
        if (sortBy !== field) return null;
        return sortOrder === 'asc' ? (
            <ArrowUpwardIcon sx={{ fontSize: 16, ml: 0.5 }} />
        ) : (
            <ArrowDownwardIcon sx={{ fontSize: 16, ml: 0.5 }} />
        );
    };

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'hsl(var(--foreground))' }}>Learning paths</Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    {/* Search */}
                    <TextField
                        size="small"
                        placeholder="Search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        sx={{ width: 250 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                    />

                    {/* Filter */}
                    <IconButton
                        size="small"
                        sx={{
                            border: '1px solid rgba(141, 166, 166, 0.2)',
                            borderRadius: 1,
                            width: 40,
                            height: 40,
                        }}
                    >
                        <FilterListIcon fontSize="small" />
                    </IconButton>

                    {/* View Toggle */}
                    <ToggleButtonGroup
                        value={viewMode}
                        exclusive
                        onChange={(e, newMode) => newMode && setViewMode(newMode)}
                        size="small"
                        sx={{
                            height: 40,
                            bgcolor: 'rgba(13, 20, 20, 0.4)',
                            border: '1px solid rgba(141, 166, 166, 0.1)',
                            '& .MuiToggleButton-root': {
                                color: 'hsl(var(--muted-foreground))',
                                border: 'none',
                                px: 1.5,
                                '&.Mui-selected': {
                                    bgcolor: 'rgba(141, 166, 166, 0.1)',
                                    color: 'hsl(var(--primary))',
                                    '&:hover': { bgcolor: 'rgba(141, 166, 166, 0.2)' }
                                },
                                '&:hover': { bgcolor: 'rgba(141, 166, 166, 0.05)' }
                            }
                        }}
                    >
                        <ToggleButton value="list">
                            <ViewListIcon fontSize="small" />
                        </ToggleButton>
                        <ToggleButton value="grid">
                            <ViewModuleIcon fontSize="small" />
                        </ToggleButton>
                    </ToggleButtonGroup>

                    {/* Add Button */}
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        disabled={loading}
                        sx={{
                            bgcolor: 'hsl(var(--primary))',
                            color: 'hsl(var(--primary-foreground))',
                            fontWeight: 700,
                            textTransform: 'none',
                            borderRadius: '6px',
                            height: 40,
                            '&:hover': { bgcolor: 'hsl(var(--primary) / 0.9)' }
                        }}
                        onClick={async () => {
                            setLoading(true);
                            try {
                                const response = await fetch('/api/learning-paths', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        name: 'New learning path',
                                        status: 'inactive',
                                    }),
                                });
                                if (response.ok) {
                                    const newPath = await response.json();
                                    router.push(`/admin/learning-paths/${newPath.id}/edit`);
                                } else {
                                    console.error('Failed to create learning path');
                                }
                            } catch (error) {
                                console.error('Error creating learning path:', error);
                            } finally {
                                setLoading(false);
                            }
                        }}
                    >
                        Add learning path
                    </Button>
                </Box>
            </Box>

            {/* Table View */}
            {viewMode === 'list' && (
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
                                <TableCell
                                    sx={{ cursor: 'pointer', fontWeight: 600 }}
                                    onClick={() => handleSort('name')}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        Name
                                        {renderSortIcon('name')}
                                    </Box>
                                </TableCell>
                                <TableCell
                                    sx={{ cursor: 'pointer', fontWeight: 600 }}
                                    onClick={() => handleSort('code')}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        Code
                                        {renderSortIcon('code')}
                                    </Box>
                                </TableCell>
                                <TableCell
                                    sx={{ cursor: 'pointer', fontWeight: 600 }}
                                    onClick={() => handleSort('category')}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        Category
                                        {renderSortIcon('category')}
                                    </Box>
                                </TableCell>
                                <TableCell
                                    sx={{ cursor: 'pointer', fontWeight: 600 }}
                                    onClick={() => handleSort('courses')}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        Number of courses
                                        {renderSortIcon('courses')}
                                    </Box>
                                </TableCell>
                                <TableCell
                                    sx={{ cursor: 'pointer', fontWeight: 600 }}
                                    onClick={() => handleSort('updatedAt')}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        Last updated on
                                        {renderSortIcon('updatedAt')}
                                    </Box>
                                </TableCell>
                                <TableCell sx={{ width: 50 }}></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                        <CircularProgress size={32} />
                                    </TableCell>
                                </TableRow>
                            ) : learningPaths.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                        <Typography color="text.secondary">
                                            No learning paths found
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                learningPaths.map((path) => (
                                    <TableRow
                                        key={path.id}
                                        hover
                                        sx={{ '&.Mui-selected': { bgcolor: 'rgba(26, 84, 85, 0.1)' } }}
                                    >
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                {path.name}
                                                {path.status === 'inactive' && (
                                                    <Chip
                                                        label="Inactive"
                                                        size="small"
                                                        sx={{
                                                            height: 20,
                                                            bgcolor: 'rgba(141, 166, 166, 0.1)',
                                                            color: 'hsl(var(--muted-foreground))',
                                                            fontSize: '0.7rem',
                                                            fontWeight: 600,
                                                            border: '1px solid rgba(141, 166, 166, 0.2)'
                                                        }}
                                                    />
                                                )}
                                            </Box>
                                        </TableCell>
                                        <TableCell>{path.code || '-'}</TableCell>
                                        <TableCell>{path.category || '-'}</TableCell>
                                        <TableCell>{path.courseCount}</TableCell>
                                        <TableCell>{formatDate(path.updatedAt)}</TableCell>
                                        <TableCell align="right">
                                            <IconButton
                                                size="small"
                                                onClick={(e) => handleMenuOpen(e, path)}
                                            >
                                                <MoreVertIcon fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Grid View (placeholder) */}
            {viewMode === 'grid' && (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography color="text.secondary">
                        Grid view not yet implemented
                    </Typography>
                </Box>
            )}

            {/* Actions Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={handleEdit}>Edit</MenuItem>
                <MenuItem onClick={handleManage}>Manage</MenuItem>
                <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>Delete</MenuItem>
            </Menu>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={cancelDelete}
                aria-labelledby="delete-dialog-title"
            >
                <DialogTitle id="delete-dialog-title">
                    Delete Learning Path?
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete "{selectedPath?.name}"? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={cancelDelete} disabled={deleting}>
                        Cancel
                    </Button>
                    <Button
                        onClick={confirmDelete}
                        color="error"
                        variant="contained"
                        disabled={deleting}
                    >
                        {deleting ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
