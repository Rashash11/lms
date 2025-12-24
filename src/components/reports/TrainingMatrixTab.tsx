'use client';

import React, { useEffect, useState } from 'react';
import {
    Box,
    TextField,
    IconButton,
    Button,
    Menu,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Avatar,
    CircularProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

interface TrainingMatrixData {
    users: Array<{
        userId: string;
        userName: string;
        userEmail: string;
        courses: Array<{
            courseId: string;
            courseName: string;
            progress: number;
            status: string;
        }>;
    }>;
    courses: Array<{
        id: string;
        title: string;
    }>;
}

export default function TrainingMatrixTab() {
    const [data, setData] = useState<TrainingMatrixData | null>(null);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [viewAnchor, setViewAnchor] = useState<null | HTMLElement>(null);
    const [exportAnchor, setExportAnchor] = useState<null | HTMLElement>(null);

    useEffect(() => {
        fetchData();
    }, [search]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (search) params.append('search', search);

            const res = await fetch(`/api/reports/training-matrix?${params}`);
            const json = await res.json();
            setData(json);
        } catch (error) {
            console.error('Error fetching training matrix:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const res = await fetch('/api/reports/export/training-matrix', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ search }),
            });

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'Training_matrix.xlsx';
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exporting matrix:', error);
        }
        setExportAnchor(null);
    };

    const getProgressColor = (progress: number) => {
        if (progress === 0) return '#e0e0e0';
        if (progress < 50) return '#ff9800';
        if (progress < 100) return '#2196f3';
        return '#4caf50';
    };

    if (loading || !data) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            {/* Controls */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <TextField
                    placeholder="Search users"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    size="small"
                    sx={{ flex: 1 }}
                    InputProps={{
                        startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                />
                <IconButton>
                    <FilterListIcon />
                </IconButton>
                <Button
                    variant="outlined"
                    endIcon={<KeyboardArrowDownIcon />}
                    onClick={(e) => setViewAnchor(e.currentTarget)}
                >
                    View
                </Button>
                <Button
                    variant="contained"
                    endIcon={<KeyboardArrowDownIcon />}
                    onClick={(e) => setExportAnchor(e.currentTarget)}
                >
                    Export in Excel
                </Button>
            </Box>

            {/* View Menu */}
            <Menu anchorEl={viewAnchor} open={Boolean(viewAnchor)} onClose={() => setViewAnchor(null)}>
                <MenuItem onClick={() => setViewAnchor(null)}>Default view</MenuItem>
                <MenuItem onClick={() => setViewAnchor(null)}>Compact view</MenuItem>
            </Menu>

            {/* Export Menu */}
            <Menu anchorEl={exportAnchor} open={Boolean(exportAnchor)} onClose={() => setExportAnchor(null)}>
                <MenuItem onClick={handleExport}>Export current view</MenuItem>
            </Menu>

            {/* Matrix Table */}
            <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Users</TableCell>
                            {data.courses.map((course) => (
                                <TableCell key={course.id} align="center" sx={{ minWidth: 60 }}>
                                    <Box
                                        sx={{
                                            transform: 'rotate(-45deg)',
                                            whiteSpace: 'nowrap',
                                            fontSize: '0.75rem',
                                        }}
                                    >
                                        {course.title}
                                    </Box>
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data.users.map((user) => (
                            <TableRow key={user.userId} hover>
                                <TableCell sx={{ fontWeight: 500 }}>{user.userName}</TableCell>
                                {user.courses.map((course) => (
                                    <TableCell key={course.courseId} align="center">
                                        <Box
                                            sx={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                width: 32,
                                                height: 32,
                                                borderRadius: '50%',
                                                bgcolor: getProgressColor(course.progress),
                                                color: course.progress > 0 ? 'white' : 'text.disabled',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                            }}
                                        >
                                            {course.progress > 0 ? `${course.progress}%` : ''}
                                        </Box>
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {data.users.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                        No users found
                    </Typography>
                </Box>
            )}
        </Box>
    );
}
