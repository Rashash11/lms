'use client';

import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, TextField, InputAdornment,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, IconButton, Skeleton, Snackbar, Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { usePermissions } from '@/hooks/usePermissions';
import { useApiError } from '@/hooks/useApiError';
import AccessDenied from '@/components/AccessDenied';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AddIcon from '@mui/icons-material/Add';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';

interface Conference {
    id: string;
    title: string;
    description: string | null;
    startTime: string;
    endTime: string;
    duration: number;
    meetingUrl: string | null;
}

export default function ConferencesPage() {
    const [search, setSearch] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [conferences, setConferences] = useState<Conference[]>([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
    const [newConference, setNewConference] = useState({
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        duration: 60,
        meetingUrl: ''
    });
    const { can, loading: permissionsLoading } = usePermissions();
    const { handleResponse } = useApiError();
    const [forbidden, setForbidden] = useState(false);

    useEffect(() => {
        if (!permissionsLoading && can('conference:read')) {
            fetchConferences();
        }
    }, [search, fromDate, toDate, permissionsLoading]);

    const fetchConferences = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set('search', search);
            if (fromDate) params.set('from', fromDate);
            if (toDate) params.set('to', toDate);

            const res = await fetch(`/api/conferences?${params.toString()}`);
            if (res.status === 403) {
                setForbidden(true);
                return;
            }
            if (handleResponse(res)) return;
            const data = await res.json();
            if (data.conferences) {
                setConferences(data.conferences);
            }
        } catch (error) {
            console.error('Failed to fetch conferences:', error);
        } finally {
            setLoading(false);
        }
    };

    if (permissionsLoading) return null;
    if (!can('conference:read') || forbidden) {
        return <AccessDenied requiredPermission="conference:read" />;
    }

    const handleAddConference = async () => {
        try {
            const res = await fetch('/api/instructor/conferences', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newConference)
            });
            const data = await res.json();
            if (data.success) {
                setSnackbar({ open: true, message: 'Conference created successfully', severity: 'success' });
                setOpenDialog(false);
                setNewConference({
                    title: '',
                    description: '',
                    startTime: '',
                    endTime: '',
                    duration: 60,
                    meetingUrl: ''
                });
                fetchConferences();
            }
        } catch (error) {
            setSnackbar({ open: true, message: 'Failed to create conference', severity: 'error' });
        }
    };

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight={600} color="#172B4D">
                    Conferences
                </Typography>
                {can('conference:create') && (
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setOpenDialog(true)}
                        sx={{
                            bgcolor: '#0052CC',
                            textTransform: 'none',
                            fontWeight: 600,
                            '&:hover': { bgcolor: '#0747A6' }
                        }}
                    >
                        Add conference
                    </Button>
                )}
            </Box>

            {/* Controls */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
                <TextField
                    placeholder="Search"
                    size="small"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: '#6B778C', fontSize: 20 }} />
                            </InputAdornment>
                        ),
                    }}
                    sx={{
                        width: 240,
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 3,
                            bgcolor: '#F4F5F7',
                            border: 'none',
                            '& fieldset': { border: 'none' }
                        }
                    }}
                />

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Typography variant="body2" color="#6B778C">From</Typography>
                    <TextField
                        size="small"
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        sx={{ width: 140 }}
                    />
                    <Typography variant="body2" color="#6B778C">To</Typography>
                    <TextField
                        size="small"
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        sx={{ width: 140 }}
                    />
                </Box>
            </Box>

            {/* Content */}
            {loading ? (
                <Box>
                    {[1, 2, 3].map(i => (
                        <Skeleton key={i} variant="rectangular" height={60} sx={{ mb: 1, borderRadius: 1 }} />
                    ))}
                </Box>
            ) : conferences.length > 0 ? (
                <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #DFE1E6' }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#FAFBFC' }}>
                                <TableCell sx={{ fontWeight: 600, color: '#172B4D' }}>Title</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: '#172B4D' }}>Start Time</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: '#172B4D' }}>Duration</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: '#172B4D' }}>Meeting URL</TableCell>
                                <TableCell sx={{ width: 50 }}></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {conferences.map((conf, index) => (
                                <TableRow
                                    key={conf.id}
                                    sx={{
                                        bgcolor: index % 2 === 1 ? '#FAFBFC' : 'white',
                                        '&:hover': { bgcolor: '#F4F5F7' }
                                    }}
                                >
                                    <TableCell sx={{ color: '#172B4D', fontWeight: 500 }}>
                                        {conf.title}
                                    </TableCell>
                                    <TableCell sx={{ color: '#6B778C' }}>
                                        {formatDateTime(conf.startTime)}
                                    </TableCell>
                                    <TableCell sx={{ color: '#6B778C' }}>
                                        {conf.duration} min
                                    </TableCell>
                                    <TableCell sx={{ color: '#0052CC', cursor: 'pointer' }}>
                                        {conf.meetingUrl ? (
                                            <a href={conf.meetingUrl} target="_blank" rel="noopener noreferrer">
                                                Join
                                            </a>
                                        ) : '-'}
                                    </TableCell>
                                    <TableCell>
                                        <IconButton size="small">
                                            <MoreHorizIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            ) : (
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        py: 8,
                        textAlign: 'center'
                    }}
                >
                    <Box
                        sx={{
                            width: 250,
                            height: 200,
                            bgcolor: '#F4F5F7',
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mb: 3,
                            position: 'relative'
                        }}
                    >
                        {/* Video Call Illustration */}
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Box
                                sx={{
                                    width: 100,
                                    height: 120,
                                    bgcolor: 'white',
                                    borderRadius: 1,
                                    border: '2px solid #DFE1E6',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 50,
                                        height: 50,
                                        bgcolor: '#0052CC',
                                        borderRadius: '50%'
                                    }}
                                />
                            </Box>
                            <Box
                                sx={{
                                    width: 80,
                                    height: 100,
                                    bgcolor: 'white',
                                    borderRadius: 1,
                                    border: '2px solid #DFE1E6',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        bgcolor: '#0052CC',
                                        borderRadius: '50%'
                                    }}
                                />
                            </Box>
                        </Box>
                    </Box>
                    <Typography variant="h6" fontWeight={600} color="#172B4D" gutterBottom>
                        No conferences have been created yet!
                    </Typography>
                    <Typography variant="body2" color="#6B778C" sx={{ mb: 3 }}>
                        Create a new conference below.
                    </Typography>
                    <Button
                        variant="contained"
                        onClick={() => setOpenDialog(true)}
                        sx={{
                            bgcolor: '#0052CC',
                            textTransform: 'none',
                            fontWeight: 600,
                            '&:hover': { bgcolor: '#0747A6' }
                        }}
                    >
                        Add conference
                    </Button>
                </Box>
            )}

            {/* Add Conference Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add Conference</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        <TextField
                            label="Title"
                            fullWidth
                            value={newConference.title}
                            onChange={(e) => setNewConference({ ...newConference, title: e.target.value })}
                        />
                        <TextField
                            label="Description"
                            fullWidth
                            multiline
                            rows={3}
                            value={newConference.description}
                            onChange={(e) => setNewConference({ ...newConference, description: e.target.value })}
                        />
                        <TextField
                            label="Start Time"
                            type="datetime-local"
                            fullWidth
                            value={newConference.startTime}
                            onChange={(e) => setNewConference({ ...newConference, startTime: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            label="End Time"
                            type="datetime-local"
                            fullWidth
                            value={newConference.endTime}
                            onChange={(e) => setNewConference({ ...newConference, endTime: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            label="Duration (minutes)"
                            type="number"
                            fullWidth
                            value={newConference.duration}
                            onChange={(e) => setNewConference({ ...newConference, duration: parseInt(e.target.value) })}
                        />
                        <TextField
                            label="Meeting URL"
                            fullWidth
                            value={newConference.meetingUrl}
                            onChange={(e) => setNewConference({ ...newConference, meetingUrl: e.target.value })}
                            placeholder="https://meet.google.com/..."
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleAddConference}
                        disabled={!newConference.title || !newConference.startTime || !newConference.endTime}
                    >
                        Create Conference
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
}
