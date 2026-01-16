'use client';

import React, { useState } from 'react';
import {
    Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TablePagination, TextField, InputAdornment, Button, IconButton, Chip, Avatar,
    Menu, MenuItem, ListItemIcon, ListItemText, Divider, Checkbox, Select,
    FormControl, InputLabel, Typography, Tooltip, Badge, LinearProgress,
    Dialog, DialogTitle, DialogContent, DialogActions, Collapse, FormControlLabel, Switch,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import UndoIcon from '@mui/icons-material/Undo';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import HistoryIcon from '@mui/icons-material/History';
import EditIcon from '@mui/icons-material/Edit';
import CommentIcon from '@mui/icons-material/Comment';
import ZeroIcon from '@mui/icons-material/Remove';
import FlagIcon from '@mui/icons-material/Flag';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import BlockIcon from '@mui/icons-material/Block';
import EventIcon from '@mui/icons-material/Event';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import EmailIcon from '@mui/icons-material/Email';
import SendIcon from '@mui/icons-material/Send';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

interface Attempt {
    id: string;
    candidateName: string;
    candidateEmail: string;
    testName: string;
    sessionName: string;
    status: 'completed' | 'in_progress' | 'not_started' | 'paused' | 'expired';
    score: number | null;
    passingScore: number;
    grade: string | null;
    startedAt: string | null;
    completedAt: string | null;
    duration: string | null;
    verified: boolean;
    markedForReview: boolean;
    graderProgress: { graded: number; total: number };
}

const mockAttempts: Attempt[] = [
    { id: '1', candidateName: 'John Doe', candidateEmail: 'john@example.com', testName: 'Advanced JavaScript', sessionName: 'Dec 18 Morning', status: 'completed', score: 85, passingScore: 70, grade: 'Pass', startedAt: '2024-12-18T09:00:00Z', completedAt: '2024-12-18T10:30:00Z', duration: '1h 30m', verified: true, markedForReview: false, graderProgress: { graded: 20, total: 20 } },
    { id: '2', candidateName: 'Jane Smith', candidateEmail: 'jane@example.com', testName: 'React Fundamentals', sessionName: 'Dec 18 Morning', status: 'completed', score: 62, passingScore: 70, grade: 'Fail', startedAt: '2024-12-18T09:15:00Z', completedAt: '2024-12-18T10:45:00Z', duration: '1h 30m', verified: false, markedForReview: true, graderProgress: { graded: 18, total: 25 } },
    { id: '3', candidateName: 'Bob Johnson', candidateEmail: 'bob@example.com', testName: 'TypeScript Mastery', sessionName: 'Dec 18 Morning', status: 'in_progress', score: null, passingScore: 75, grade: null, startedAt: '2024-12-18T08:30:00Z', completedAt: null, duration: null, verified: false, markedForReview: false, graderProgress: { graded: 0, total: 30 } },
    { id: '4', candidateName: 'Alice Brown', candidateEmail: 'alice@example.com', testName: 'Node.js Backend', sessionName: 'Dec 17 Afternoon', status: 'completed', score: 91, passingScore: 70, grade: 'Pass', startedAt: '2024-12-17T14:00:00Z', completedAt: '2024-12-17T15:20:00Z', duration: '1h 20m', verified: true, markedForReview: false, graderProgress: { graded: 15, total: 15 } },
    { id: '5', candidateName: 'Charlie Wilson', candidateEmail: 'charlie@example.com', testName: 'Advanced JavaScript', sessionName: 'Dec 17 Afternoon', status: 'not_started', score: null, passingScore: 70, grade: null, startedAt: null, completedAt: null, duration: null, verified: false, markedForReview: false, graderProgress: { graded: 0, total: 20 } },
    { id: '6', candidateName: 'Diana Martinez', candidateEmail: 'diana@example.com', testName: 'Python Basics', sessionName: 'Dec 18 Morning', status: 'expired', score: null, passingScore: 60, grade: null, startedAt: '2024-12-18T09:00:00Z', completedAt: null, duration: null, verified: false, markedForReview: false, graderProgress: { graded: 0, total: 20 } },
];

const statusColors: Record<string, 'success' | 'warning' | 'error' | 'default' | 'info'> = {
    completed: 'success',
    in_progress: 'info',
    not_started: 'default',
    paused: 'warning',
    expired: 'error',
};

export default function TestAttemptsTab() {
    const [attempts, setAttempts] = useState<Attempt[]>(mockAttempts);
    const [selected, setSelected] = useState<string[]>([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    const [viewMode, setViewMode] = useState<'overview' | 'progress'>('overview');
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [currentAttempt, setCurrentAttempt] = useState<string | null>(null);
    const [bulkAnchorEl, setBulkAnchorEl] = useState<null | HTMLElement>(null);

    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            setSelected(attempts.map(a => a.id));
        } else {
            setSelected([]);
        }
    };

    const handleSelect = (id: string) => {
        setSelected(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleAction = (action: string, attemptId: string) => {
        setAnchorEl(null);
        switch (action) {
            case 'verify':
                setAttempts(prev => prev.map(a => a.id === attemptId ? { ...a, verified: true } : a));
                break;
            case 'revertVerify':
                setAttempts(prev => prev.map(a => a.id === attemptId ? { ...a, verified: false } : a));
                break;
            case 'markReview':
                setAttempts(prev => prev.map(a => a.id === attemptId ? { ...a, markedForReview: true } : a));
                break;
            default:
                if (process.env.NEXT_PUBLIC_CLIENT_DEBUG === '1') {
                    console.log(`Action: ${action} for attempt: ${attemptId}`);
                }
        }
    };

    const handleBulkAction = (action: string) => {
        setBulkAnchorEl(null);
        switch (action) {
            case 'verify':
                setAttempts(prev => prev.map(a => selected.includes(a.id) ? { ...a, verified: true } : a));
                break;
            case 'markReview':
                setAttempts(prev => prev.map(a => selected.includes(a.id) ? { ...a, markedForReview: true } : a));
                break;
        }
        setSelected([]);
    };

    const filteredAttempts = attempts.filter(a => {
        const matchesSearch = a.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.testName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const stats = {
        total: attempts.length,
        completed: attempts.filter(a => a.status === 'completed').length,
        inProgress: attempts.filter(a => a.status === 'in_progress').length,
        needsGrading: attempts.filter(a => a.graderProgress.graded < a.graderProgress.total).length,
        verified: attempts.filter(a => a.verified).length,
        forReview: attempts.filter(a => a.markedForReview).length,
    };

    return (
        <Box>
            {/* Stats bar */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                    { label: 'Total', value: stats.total, color: 'primary' },
                    { label: 'Completed', value: stats.completed, color: 'success' },
                    { label: 'In Progress', value: stats.inProgress, color: 'info' },
                    { label: 'Needs Grading', value: stats.needsGrading, color: 'warning' },
                    { label: 'Verified', value: stats.verified, color: 'success' },
                    { label: 'For Review', value: stats.forReview, color: 'error' },
                ].map((stat) => (
                    <Grid item xs={6} sm={4} md={2} key={stat.label}>
                        <Paper sx={{ p: 2, textAlign: 'center', cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
                            <Typography variant="h5" fontWeight="bold" color={`${stat.color}.main`}>{stat.value}</Typography>
                            <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {/* Toolbar */}
            <Paper sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth size="small" placeholder="Search candidates or tests..."
                            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
                        />
                    </Grid>
                    <Grid item xs={6} md={2}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Status</InputLabel>
                            <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
                                <MenuItem value="all">All Statuses</MenuItem>
                                <MenuItem value="completed">Completed</MenuItem>
                                <MenuItem value="in_progress">In Progress</MenuItem>
                                <MenuItem value="not_started">Not Started</MenuItem>
                                <MenuItem value="expired">Expired</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={6} md={2}>
                        <Button fullWidth variant="outlined" startIcon={<FilterListIcon />} onClick={() => setShowFilters(!showFilters)}>
                            {showFilters ? 'Hide Filters' : 'More Filters'}
                        </Button>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            <Button variant={viewMode === 'overview' ? 'contained' : 'outlined'} size="small" onClick={() => setViewMode('overview')}>Overview</Button>
                            <Button variant={viewMode === 'progress' ? 'contained' : 'outlined'} size="small" startIcon={<TrendingUpIcon />} onClick={() => setViewMode('progress')}>Progress</Button>
                            <Button variant="outlined" startIcon={<DownloadIcon />}>Export</Button>
                        </Box>
                    </Grid>
                </Grid>

                <Collapse in={showFilters}>
                    <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                        <Grid container spacing={2}>
                            <Grid item xs={6} md={3}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Test</InputLabel>
                                    <Select label="Test" defaultValue="all">
                                        <MenuItem value="all">All Tests</MenuItem>
                                        <MenuItem value="1">Advanced JavaScript</MenuItem>
                                        <MenuItem value="2">React Fundamentals</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={6} md={3}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Session</InputLabel>
                                    <Select label="Session" defaultValue="all">
                                        <MenuItem value="all">All Sessions</MenuItem>
                                        <MenuItem value="1">Dec 18 Morning</MenuItem>
                                        <MenuItem value="2">Dec 17 Afternoon</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={6} md={3}>
                                <FormControlLabel control={<Switch />} label="Show suspended" />
                            </Grid>
                            <Grid item xs={6} md={3}>
                                <FormControlLabel control={<Switch />} label="Needs grading only" />
                            </Grid>
                        </Grid>
                    </Box>
                </Collapse>
            </Paper>

            {/* Bulk actions */}
            {selected.length > 0 && (
                <Paper sx={{ p: 2, mb: 2, bgcolor: 'primary.lighter', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography>{selected.length} selected</Typography>
                    <Button size="small" startIcon={<CheckCircleIcon />} onClick={(e) => setBulkAnchorEl(e.currentTarget)}>Bulk Actions</Button>
                    <Button size="small" onClick={() => setSelected([])}>Clear Selection</Button>
                    <Menu anchorEl={bulkAnchorEl} open={Boolean(bulkAnchorEl)} onClose={() => setBulkAnchorEl(null)}>
                        <MenuItem onClick={() => handleBulkAction('verify')}><ListItemIcon><CheckCircleIcon fontSize="small" /></ListItemIcon>Verify Selected</MenuItem>
                        <MenuItem onClick={() => handleBulkAction('markReview')}><ListItemIcon><FlagIcon fontSize="small" /></ListItemIcon>Mark for Review</MenuItem>
                        <Divider />
                        <MenuItem onClick={() => handleBulkAction('email')}><ListItemIcon><EmailIcon fontSize="small" /></ListItemIcon>Send Email</MenuItem>
                        <MenuItem onClick={() => handleBulkAction('export')}><ListItemIcon><DownloadIcon fontSize="small" /></ListItemIcon>Export Results</MenuItem>
                    </Menu>
                </Paper>
            )}

            {/* Table */}
            <TableContainer component={Paper}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell padding="checkbox">
                                <Checkbox checked={selected.length === attempts.length} indeterminate={selected.length > 0 && selected.length < attempts.length} onChange={handleSelectAll} />
                            </TableCell>
                            <TableCell>Candidate</TableCell>
                            <TableCell>Test</TableCell>
                            <TableCell>Status</TableCell>
                            {viewMode === 'overview' ? (
                                <>
                                    <TableCell align="center">Score</TableCell>
                                    <TableCell align="center">Grade</TableCell>
                                    <TableCell>Duration</TableCell>
                                </>
                            ) : (
                                <>
                                    <TableCell>Grading Progress</TableCell>
                                    <TableCell align="center">Verified</TableCell>
                                    <TableCell align="center">Review</TableCell>
                                </>
                            )}
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredAttempts.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((attempt) => (
                            <TableRow key={attempt.id} hover selected={selected.includes(attempt.id)}>
                                <TableCell padding="checkbox">
                                    <Checkbox checked={selected.includes(attempt.id)} onChange={() => handleSelect(attempt.id)} />
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Avatar sx={{ width: 32, height: 32, fontSize: 12 }}>{attempt.candidateName.split(' ').map(n => n[0]).join('')}</Avatar>
                                        <Box>
                                            <Typography variant="body2" fontWeight={500}>{attempt.candidateName}</Typography>
                                            <Typography variant="caption" color="text.secondary">{attempt.candidateEmail}</Typography>
                                        </Box>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">{attempt.testName}</Typography>
                                    <Typography variant="caption" color="text.secondary">{attempt.sessionName}</Typography>
                                </TableCell>
                                <TableCell>
                                    <Chip label={attempt.status.replace('_', ' ')} size="small" color={statusColors[attempt.status]} sx={{ textTransform: 'capitalize' }} />
                                </TableCell>
                                {viewMode === 'overview' ? (
                                    <>
                                        <TableCell align="center">
                                            {attempt.score !== null ? (
                                                <Typography fontWeight={600} color={attempt.score >= attempt.passingScore ? 'success.main' : 'error.main'}>{attempt.score}%</Typography>
                                            ) : '-'}
                                        </TableCell>
                                        <TableCell align="center">
                                            {attempt.grade ? <Chip label={attempt.grade} size="small" color={attempt.grade === 'Pass' ? 'success' : 'error'} /> : '-'}
                                        </TableCell>
                                        <TableCell>{attempt.duration || '-'}</TableCell>
                                    </>
                                ) : (
                                    <>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <LinearProgress variant="determinate" value={(attempt.graderProgress.graded / attempt.graderProgress.total) * 100} sx={{ flexGrow: 1, height: 8, borderRadius: 4 }} />
                                                <Typography variant="caption">{attempt.graderProgress.graded}/{attempt.graderProgress.total}</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell align="center">
                                            {attempt.verified ? <CheckCircleIcon color="success" fontSize="small" /> : '-'}
                                        </TableCell>
                                        <TableCell align="center">
                                            {attempt.markedForReview ? <FlagIcon color="warning" fontSize="small" /> : '-'}
                                        </TableCell>
                                    </>
                                )}
                                <TableCell align="right">
                                    <Tooltip title="View Report"><IconButton size="small"><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
                                    <IconButton size="small" onClick={(e) => { setCurrentAttempt(attempt.id); setAnchorEl(e.currentTarget); }}><MoreVertIcon fontSize="small" /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <TablePagination
                    rowsPerPageOptions={[10, 25, 50]}
                    component="div"
                    count={filteredAttempts.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(_, newPage) => setPage(newPage)}
                    onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                />
            </TableContainer>

            {/* Row actions menu */}
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                <MenuItem onClick={() => handleAction('report', currentAttempt!)}><ListItemIcon><VisibilityIcon fontSize="small" /></ListItemIcon>Open Report</MenuItem>
                <Divider />
                <MenuItem onClick={() => handleAction('verify', currentAttempt!)}><ListItemIcon><CheckCircleIcon fontSize="small" /></ListItemIcon>Verify</MenuItem>
                <MenuItem onClick={() => handleAction('revertVerify', currentAttempt!)}><ListItemIcon><UndoIcon fontSize="small" /></ListItemIcon>Revert Verification</MenuItem>
                <MenuItem onClick={() => handleAction('continue', currentAttempt!)}><ListItemIcon><PlayArrowIcon fontSize="small" /></ListItemIcon>Allow Continue</MenuItem>
                <MenuItem onClick={() => handleAction('reset', currentAttempt!)}><ListItemIcon><RestartAltIcon fontSize="small" /></ListItemIcon>Reset Attempt</MenuItem>
                <MenuItem onClick={() => handleAction('previous', currentAttempt!)}><ListItemIcon><HistoryIcon fontSize="small" /></ListItemIcon>Previous Attempts</MenuItem>
                <Divider />
                <MenuItem onClick={() => handleAction('modify', currentAttempt!)}><ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>Allow Modification</MenuItem>
                <MenuItem onClick={() => handleAction('comment', currentAttempt!)}><ListItemIcon><CommentIcon fontSize="small" /></ListItemIcon>Add Comment</MenuItem>
                <MenuItem onClick={() => handleAction('zeroGrade', currentAttempt!)}><ListItemIcon><ZeroIcon fontSize="small" /></ListItemIcon>Set Zero Grade</MenuItem>
                <MenuItem onClick={() => handleAction('markReview', currentAttempt!)}><ListItemIcon><FlagIcon fontSize="small" /></ListItemIcon>Mark for Review</MenuItem>
                <Divider />
                <MenuItem onClick={() => handleAction('changeVersion', currentAttempt!)}><ListItemIcon><SwapHorizIcon fontSize="small" /></ListItemIcon>Change Version</MenuItem>
                <MenuItem onClick={() => handleAction('suspend', currentAttempt!)} sx={{ color: 'warning.main' }}><ListItemIcon><BlockIcon fontSize="small" color="warning" /></ListItemIcon>Suspend</MenuItem>
                <MenuItem onClick={() => handleAction('changeSession', currentAttempt!)}><ListItemIcon><EventIcon fontSize="small" /></ListItemIcon>Change Session</MenuItem>
                <MenuItem onClick={() => handleAction('finish', currentAttempt!)}><ListItemIcon><DoneAllIcon fontSize="small" /></ListItemIcon>Finish Attempt</MenuItem>
                <Divider />
                <MenuItem onClick={() => handleAction('delete', currentAttempt!)} sx={{ color: 'error.main' }}><ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>Delete</MenuItem>
            </Menu>
        </Box>
    );
}
