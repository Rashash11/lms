'use client';

import React, { useState } from 'react';
import {
    Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TablePagination, TextField, InputAdornment, Button, Chip, Avatar, Typography,
    Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel,
    Select, MenuItem,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import EventIcon from '@mui/icons-material/Event';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

interface ReschedulingRequest {
    id: string;
    candidateName: string;
    candidateEmail: string;
    currentSession: string;
    currentSessionDate: string;
    requestedSession: string;
    requestedSessionDate: string;
    message: string;
    status: 'pending' | 'approved' | 'declined';
    createdAt: string;
    resolvedAt?: string;
    resolvedBy?: string;
}

const mockRequests: ReschedulingRequest[] = [
    { id: '1', candidateName: 'John Doe', candidateEmail: 'john@example.com', currentSession: 'Dec 18 Morning', currentSessionDate: '2024-12-18T09:00:00Z', requestedSession: 'Dec 20 Afternoon', requestedSessionDate: '2024-12-20T14:00:00Z', message: 'I have a doctor appointment on Dec 18th morning. Can I please reschedule to Dec 20th?', status: 'pending', createdAt: '2024-12-15T10:30:00Z' },
    { id: '2', candidateName: 'Jane Smith', candidateEmail: 'jane@example.com', currentSession: 'Dec 19 Morning', currentSessionDate: '2024-12-19T09:00:00Z', requestedSession: 'Dec 21 Morning', requestedSessionDate: '2024-12-21T09:00:00Z', message: 'Family emergency, need to postpone by 2 days.', status: 'pending', createdAt: '2024-12-16T08:15:00Z' },
    { id: '3', candidateName: 'Bob Johnson', candidateEmail: 'bob@example.com', currentSession: 'Dec 17 Afternoon', currentSessionDate: '2024-12-17T14:00:00Z', requestedSession: 'Dec 18 Afternoon', requestedSessionDate: '2024-12-18T14:00:00Z', message: 'Work conflict resolved, can take it a day later.', status: 'approved', createdAt: '2024-12-14T11:00:00Z', resolvedAt: '2024-12-14T14:30:00Z', resolvedBy: 'Admin' },
    { id: '4', candidateName: 'Alice Brown', candidateEmail: 'alice@example.com', currentSession: 'Dec 16 Morning', currentSessionDate: '2024-12-16T09:00:00Z', requestedSession: 'Jan 5 Morning', requestedSessionDate: '2025-01-05T09:00:00Z', message: 'Going on vacation, need to move to next month.', status: 'declined', createdAt: '2024-12-10T09:00:00Z', resolvedAt: '2024-12-11T10:00:00Z', resolvedBy: 'Admin' },
    { id: '5', candidateName: 'Charlie Wilson', candidateEmail: 'charlie@example.com', currentSession: 'Dec 20 Morning', currentSessionDate: '2024-12-20T09:00:00Z', requestedSession: 'Dec 20 Afternoon', requestedSessionDate: '2024-12-20T14:00:00Z', message: 'Prefer afternoon slot if available.', status: 'pending', createdAt: '2024-12-17T16:45:00Z' },
];

const statusColors: Record<string, 'warning' | 'success' | 'error'> = {
    pending: 'warning',
    approved: 'success',
    declined: 'error',
};

export default function ReschedulingTab() {
    const [requests, setRequests] = useState<ReschedulingRequest[]>(mockRequests);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<ReschedulingRequest | null>(null);
    const [resolution, setResolution] = useState<'approved' | 'declined'>('approved');
    const [resolutionMessage, setResolutionMessage] = useState('');

    const handleResolve = (request: ReschedulingRequest) => {
        setSelectedRequest(request);
        setDialogOpen(true);
    };

    const handleConfirmResolution = () => {
        if (selectedRequest) {
            setRequests(prev => prev.map(r =>
                r.id === selectedRequest.id
                    ? { ...r, status: resolution, resolvedAt: new Date().toISOString(), resolvedBy: 'Admin' }
                    : r
            ));
        }
        setDialogOpen(false);
        setSelectedRequest(null);
        setResolutionMessage('');
    };

    const filteredRequests = requests.filter(r => {
        const matchesSearch = r.candidateName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const pendingCount = requests.filter(r => r.status === 'pending').length;

    return (
        <Box>
            {/* Stats */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h5" fontWeight="bold" color="warning.main">{pendingCount}</Typography>
                        <Typography variant="caption" color="text.secondary">Pending</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h5" fontWeight="bold" color="success.main">{requests.filter(r => r.status === 'approved').length}</Typography>
                        <Typography variant="caption" color="text.secondary">Approved</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h5" fontWeight="bold" color="error.main">{requests.filter(r => r.status === 'declined').length}</Typography>
                        <Typography variant="caption" color="text.secondary">Declined</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h5" fontWeight="bold">{requests.length}</Typography>
                        <Typography variant="caption" color="text.secondary">Total</Typography>
                    </Paper>
                </Grid>
            </Grid>

            {/* Toolbar */}
            <Paper sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth size="small" placeholder="Search candidates..."
                            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Status</InputLabel>
                            <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
                                <MenuItem value="all">All Statuses</MenuItem>
                                <MenuItem value="pending">Pending</MenuItem>
                                <MenuItem value="approved">Approved</MenuItem>
                                <MenuItem value="declined">Declined</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </Paper>

            {/* Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Candidate</TableCell>
                            <TableCell>Current Session</TableCell>
                            <TableCell><SwapHorizIcon sx={{ verticalAlign: 'middle', mr: 1 }} />Requested Session</TableCell>
                            <TableCell>Message</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredRequests.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((request) => (
                            <TableRow key={request.id} hover>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Avatar sx={{ width: 32, height: 32, fontSize: 12 }}>{request.candidateName.split(' ').map(n => n[0]).join('')}</Avatar>
                                        <Box>
                                            <Typography variant="body2" fontWeight={500}>{request.candidateName}</Typography>
                                            <Typography variant="caption" color="text.secondary">{request.candidateEmail}</Typography>
                                        </Box>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <EventIcon fontSize="small" color="action" />
                                        <Typography variant="body2">{request.currentSession}</Typography>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <EventIcon fontSize="small" color="primary" />
                                        <Typography variant="body2" color="primary.main" fontWeight={500}>{request.requestedSession}</Typography>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {request.message}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Chip label={request.status} size="small" color={statusColors[request.status]} sx={{ textTransform: 'capitalize' }} />
                                </TableCell>
                                <TableCell align="right">
                                    {request.status === 'pending' ? (
                                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                            <Button size="small" color="success" startIcon={<CheckCircleIcon />} onClick={() => { setResolution('approved'); handleResolve(request); }}>
                                                Approve
                                            </Button>
                                            <Button size="small" color="error" startIcon={<CancelIcon />} onClick={() => { setResolution('declined'); handleResolve(request); }}>
                                                Decline
                                            </Button>
                                        </Box>
                                    ) : (
                                        <Typography variant="caption" color="text.secondary">
                                            {request.resolvedBy} • {new Date(request.resolvedAt!).toLocaleDateString()}
                                        </Typography>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <TablePagination
                    rowsPerPageOptions={[10, 25, 50]}
                    component="div"
                    count={filteredRequests.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(_, newPage) => setPage(newPage)}
                    onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                />
            </TableContainer>

            {/* Resolution Dialog */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{resolution === 'approved' ? 'Approve' : 'Decline'} Rescheduling Request</DialogTitle>
                <DialogContent>
                    {selectedRequest && (
                        <Box sx={{ py: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>Candidate: {selectedRequest.candidateName}</Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                From: {selectedRequest.currentSession} → To: {selectedRequest.requestedSession}
                            </Typography>
                            <Typography variant="body2" sx={{ my: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                                "{selectedRequest.message}"
                            </Typography>
                            <TextField
                                fullWidth multiline rows={3}
                                label="Resolution Message (optional)"
                                value={resolutionMessage}
                                onChange={(e) => setResolutionMessage(e.target.value)}
                                placeholder="Add a message to send to the candidate..."
                            />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" color={resolution === 'approved' ? 'success' : 'error'} onClick={handleConfirmResolution}>
                        Confirm {resolution === 'approved' ? 'Approval' : 'Decline'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
