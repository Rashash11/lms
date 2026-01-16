'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    IconButton,
    Avatar,
    Chip,
    LinearProgress,
    TextField,
    InputAdornment,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Divider,
    Badge,
    Tooltip,
    Paper,
    Select,
    FormControl,
    InputLabel,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    Tabs,
    Tab,
    Switch,
    FormControlLabel,
    Slider,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import GridViewIcon from '@mui/icons-material/GridView';
import ViewListIcon from '@mui/icons-material/ViewList';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddIcon from '@mui/icons-material/Add';
import TimerIcon from '@mui/icons-material/Timer';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import RefreshIcon from '@mui/icons-material/Refresh';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import FaceIcon from '@mui/icons-material/Face';
import GradeIcon from '@mui/icons-material/Grade';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew';
import PanToolIcon from '@mui/icons-material/PanTool';
import AssignmentIcon from '@mui/icons-material/Assignment';

// Mock data for proctored candidates
const mockCandidates = [
    {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        avatar: 'JD',
        testName: 'Advanced JavaScript',
        sessionName: 'Morning Session - Dec 18',
        status: 'in_progress',
        progress: 65,
        timeRemaining: '45:23',
        startedAt: '2024-12-18T09:00:00Z',
        flags: { face: true, gaze: false, audio: true, screen: true },
        violations: 2,
        connectionQuality: 'good',
        isRecording: true,
    },
    {
        id: '2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        avatar: 'JS',
        testName: 'React Fundamentals',
        sessionName: 'Morning Session - Dec 18',
        status: 'in_progress',
        progress: 32,
        timeRemaining: '58:10',
        startedAt: '2024-12-18T09:15:00Z',
        flags: { face: true, gaze: true, audio: true, screen: true },
        violations: 0,
        connectionQuality: 'excellent',
        isRecording: true,
    },
    {
        id: '3',
        name: 'Bob Johnson',
        email: 'bob@example.com',
        avatar: 'BJ',
        testName: 'TypeScript Mastery',
        sessionName: 'Morning Session - Dec 18',
        status: 'paused',
        progress: 78,
        timeRemaining: '12:45',
        startedAt: '2024-12-18T08:30:00Z',
        flags: { face: false, gaze: false, audio: true, screen: false },
        violations: 5,
        connectionQuality: 'poor',
        isRecording: false,
    },
    {
        id: '4',
        name: 'Alice Brown',
        email: 'alice@example.com',
        avatar: 'AB',
        testName: 'Node.js Backend',
        sessionName: 'Morning Session - Dec 18',
        status: 'in_progress',
        progress: 90,
        timeRemaining: '05:30',
        startedAt: '2024-12-18T08:45:00Z',
        flags: { face: true, gaze: true, audio: false, screen: true },
        violations: 1,
        connectionQuality: 'good',
        isRecording: true,
    },
];

const mockSessions = [
    { id: '1', name: 'Morning Session - Dec 18', activeCount: 12 },
    { id: '2', name: 'Afternoon Session - Dec 18', activeCount: 0 },
    { id: '3', name: 'Evening Session - Dec 18', activeCount: 3 },
];

interface Candidate {
    id: string;
    name: string;
    email: string;
    avatar: string;
    testName: string;
    sessionName: string;
    status: string;
    progress: number;
    timeRemaining: string;
    startedAt: string;
    flags: { face: boolean; gaze: boolean; audio: boolean; screen: boolean };
    violations: number;
    connectionQuality: string;
    isRecording: boolean;
}

function CandidateVideoCard({ candidate, onAction }: { candidate: Candidate; onAction: (action: string, id: string) => void }) {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'in_progress': return 'success';
            case 'paused': return 'warning';
            case 'prohibited': return 'error';
            default: return 'default';
        }
    };

    const getConnectionColor = (quality: string) => {
        switch (quality) {
            case 'excellent': return '#4caf50';
            case 'good': return '#8bc34a';
            case 'fair': return '#ff9800';
            case 'poor': return '#f44336';
            default: return '#9e9e9e';
        }
    };

    return (
        <Card
            sx={{
                height: '100%',
                border: candidate.violations > 3 ? '2px solid' : '1px solid',
                borderColor: candidate.violations > 3 ? 'error.main' : 'divider',
                position: 'relative',
            }}
        >
            {/* Video Placeholder */}
            <Box
                sx={{
                    height: 180,
                    bgcolor: 'grey.900',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                }}
            >
                {candidate.status === 'paused' ? (
                    <Box sx={{ textAlign: 'center', color: 'grey.500' }}>
                        <PauseIcon sx={{ fontSize: 48 }} />
                        <Typography variant="caption" display="block">Paused</Typography>
                    </Box>
                ) : (
                    <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: 28 }}>
                        {candidate.avatar}
                    </Avatar>
                )}

                {/* Recording indicator */}
                {candidate.isRecording && (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 8,
                            left: 8,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            bgcolor: 'rgba(0,0,0,0.6)',
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                        }}
                    >
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main', animation: 'pulse 1.5s infinite' }} />
                        <Typography variant="caption" sx={{ color: 'white' }}>REC</Typography>
                    </Box>
                )}

                {/* Connection quality */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        display: 'flex',
                        gap: 0.5,
                    }}
                >
                    {[1, 2, 3, 4].map((bar) => (
                        <Box
                            key={bar}
                            sx={{
                                width: 4,
                                height: bar * 4 + 4,
                                bgcolor: bar <= (candidate.connectionQuality === 'excellent' ? 4 : candidate.connectionQuality === 'good' ? 3 : candidate.connectionQuality === 'fair' ? 2 : 1)
                                    ? getConnectionColor(candidate.connectionQuality)
                                    : 'grey.600',
                                borderRadius: 1,
                            }}
                        />
                    ))}
                </Box>

                {/* Time remaining */}
                <Box
                    sx={{
                        position: 'absolute',
                        bottom: 8,
                        right: 8,
                        bgcolor: 'rgba(0,0,0,0.7)',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                    }}
                >
                    <TimerIcon sx={{ fontSize: 16, color: 'white' }} />
                    <Typography variant="caption" sx={{ color: 'white', fontWeight: 600 }}>
                        {candidate.timeRemaining}
                    </Typography>
                </Box>

                {/* Fullscreen button */}
                <IconButton
                    size="small"
                    sx={{
                        position: 'absolute',
                        bottom: 8,
                        left: 8,
                        bgcolor: 'rgba(0,0,0,0.5)',
                        color: 'white',
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                    }}
                    onClick={() => onAction('fullscreen', candidate.id)}
                >
                    <FullscreenIcon fontSize="small" />
                </IconButton>
            </Box>

            <CardContent sx={{ p: 2 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                    <Box>
                        <Typography variant="subtitle2" fontWeight={600}>
                            {candidate.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {candidate.testName}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Chip
                            label={candidate.status.replace('_', ' ')}
                            size="small"
                            color={getStatusColor(candidate.status) as any}
                            sx={{ textTransform: 'capitalize', height: 24 }}
                        />
                        <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}>
                            <MoreVertIcon fontSize="small" />
                        </IconButton>
                    </Box>
                </Box>

                {/* Progress */}
                <Box sx={{ mb: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">Progress</Typography>
                        <Typography variant="caption" fontWeight={600}>{candidate.progress}%</Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={candidate.progress}
                        sx={{ height: 6, borderRadius: 3 }}
                    />
                </Box>

                {/* Detection flags */}
                <Box sx={{ display: 'flex', gap: 0.5, mb: 1.5 }}>
                    <Tooltip title={candidate.flags.face ? 'Face detected' : 'Face not detected'}>
                        <Chip
                            icon={<FaceIcon sx={{ fontSize: '16px !important' }} />}
                            size="small"
                            color={candidate.flags.face ? 'success' : 'error'}
                            variant="outlined"
                            sx={{ height: 24 }}
                        />
                    </Tooltip>
                    <Tooltip title={candidate.flags.gaze ? 'Gaze OK' : 'Looking away'}>
                        <Chip
                            icon={<VisibilityIcon sx={{ fontSize: '16px !important' }} />}
                            size="small"
                            color={candidate.flags.gaze ? 'success' : 'warning'}
                            variant="outlined"
                            sx={{ height: 24 }}
                        />
                    </Tooltip>
                    <Tooltip title={candidate.flags.audio ? 'Audio OK' : 'Audio issue'}>
                        <Chip
                            icon={candidate.flags.audio ? <MicIcon sx={{ fontSize: '16px !important' }} /> : <MicOffIcon sx={{ fontSize: '16px !important' }} />}
                            size="small"
                            color={candidate.flags.audio ? 'success' : 'warning'}
                            variant="outlined"
                            sx={{ height: 24 }}
                        />
                    </Tooltip>
                    <Tooltip title={candidate.flags.screen ? 'Screen share active' : 'Screen share off'}>
                        <Chip
                            icon={<ScreenShareIcon sx={{ fontSize: '16px !important' }} />}
                            size="small"
                            color={candidate.flags.screen ? 'success' : 'error'}
                            variant="outlined"
                            sx={{ height: 24 }}
                        />
                    </Tooltip>
                </Box>

                {/* Violations badge */}
                {candidate.violations > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                            icon={<WarningIcon sx={{ fontSize: '16px !important' }} />}
                            label={`${candidate.violations} violation${candidate.violations > 1 ? 's' : ''}`}
                            size="small"
                            color={candidate.violations > 3 ? 'error' : 'warning'}
                            sx={{ height: 24 }}
                        />
                    </Box>
                )}

                {/* Quick actions */}
                <Box sx={{ display: 'flex', gap: 0.5, mt: 1.5 }}>
                    {candidate.status === 'in_progress' ? (
                        <Tooltip title="Pause">
                            <IconButton size="small" color="warning" onClick={() => onAction('pause', candidate.id)}>
                                <PauseIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    ) : (
                        <Tooltip title="Resume">
                            <IconButton size="small" color="success" onClick={() => onAction('resume', candidate.id)}>
                                <PlayArrowIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                    <Tooltip title="Add 5 minutes">
                        <IconButton size="small" color="info" onClick={() => onAction('addTime', candidate.id)}>
                            <AddIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Prohibit">
                        <IconButton size="small" color="error" onClick={() => onAction('prohibit', candidate.id)}>
                            <BlockIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Grade proctoring">
                        <IconButton size="small" onClick={() => onAction('grade', candidate.id)}>
                            <GradeIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            </CardContent>

            {/* Actions menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
            >
                <MenuItem onClick={() => { onAction('supervise', candidate.id); setAnchorEl(null); }}>
                    <ListItemIcon><VisibilityIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>Open Supervision</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => { onAction('progress', candidate.id); setAnchorEl(null); }}>
                    <ListItemIcon><AssignmentIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>View Progress</ListItemText>
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => { onAction('pause', candidate.id); setAnchorEl(null); }}>
                    <ListItemIcon><PauseIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>Pause Candidate</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => { onAction('addTime', candidate.id); setAnchorEl(null); }}>
                    <ListItemIcon><TimerIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>Add 5 Minutes</ListItemText>
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => { onAction('prohibit', candidate.id); setAnchorEl(null); }} sx={{ color: 'error.main' }}>
                    <ListItemIcon><BlockIcon fontSize="small" color="error" /></ListItemIcon>
                    <ListItemText>Prohibit Candidate</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => { onAction('finish', candidate.id); setAnchorEl(null); }} sx={{ color: 'error.main' }}>
                    <ListItemIcon><StopIcon fontSize="small" color="error" /></ListItemIcon>
                    <ListItemText>Force Finish</ListItemText>
                </MenuItem>
            </Menu>
        </Card>
    );
}

// Grading Dialog Component
function GradingDialog({ open, onClose, candidateName }: { open: boolean; onClose: () => void; candidateName: string }) {
    const [grade, setGrade] = useState<'positive' | 'neutral' | 'negative'>('neutral');
    const [comment, setComment] = useState('');

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Grade Proctoring Report - {candidateName}</DialogTitle>
            <DialogContent>
                <Box sx={{ py: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>Overall Assessment</Typography>
                    <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                        <Button
                            variant={grade === 'positive' ? 'contained' : 'outlined'}
                            color="success"
                            onClick={() => setGrade('positive')}
                            startIcon={<CheckCircleIcon />}
                        >
                            Positive
                        </Button>
                        <Button
                            variant={grade === 'neutral' ? 'contained' : 'outlined'}
                            onClick={() => setGrade('neutral')}
                        >
                            Neutral
                        </Button>
                        <Button
                            variant={grade === 'negative' ? 'contained' : 'outlined'}
                            color="error"
                            onClick={() => setGrade('negative')}
                            startIcon={<ErrorIcon />}
                        >
                            Negative
                        </Button>
                    </Box>
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label="Comments"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Add any observations or notes..."
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button variant="contained" onClick={onClose}>Save Grade</Button>
            </DialogActions>
        </Dialog>
    );
}

// Special Accommodations Sub-tab
function SpecialAccommodationsPanel() {
    const mockAccommodations = [
        { id: '1', candidate: 'Mike Wilson', type: 'Extra Time', details: '50% additional time', status: 'approved' },
        { id: '2', candidate: 'Sarah Lee', type: 'Screen Reader', details: 'JAWS compatible mode', status: 'pending' },
        { id: '3', candidate: 'Tom Davis', type: 'Break Time', details: '10 min break every 30 min', status: 'approved' },
    ];

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Special Accommodations</Typography>
                <Button variant="contained" startIcon={<AddIcon />}>Add Accommodation</Button>
            </Box>
            <Grid container spacing={2}>
                {mockAccommodations.map((acc) => (
                    <Grid item xs={12} md={4} key={acc.id}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="subtitle2">{acc.candidate}</Typography>
                                    <Chip
                                        label={acc.status}
                                        size="small"
                                        color={acc.status === 'approved' ? 'success' : 'warning'}
                                    />
                                </Box>
                                <Typography variant="body2" fontWeight={600} gutterBottom>{acc.type}</Typography>
                                <Typography variant="caption" color="text.secondary">{acc.details}</Typography>
                                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                                    {acc.status === 'pending' && (
                                        <>
                                            <Button size="small" color="success">Approve</Button>
                                            <Button size="small" color="error">Reject</Button>
                                        </>
                                    )}
                                    {acc.status === 'approved' && (
                                        <Button size="small" color="error">Revoke</Button>
                                    )}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}

// Special Requests Sub-tab
function SpecialRequestsPanel() {
    const mockRequests = [
        { id: '1', candidate: 'Emma Clark', request: 'Need bathroom break', time: '10:23 AM', status: 'pending' },
        { id: '2', candidate: 'James Martin', request: 'Question text unclear', time: '10:15 AM', status: 'resolved' },
    ];

    return (
        <Box>
            <Typography variant="h6" gutterBottom>Special Requests</Typography>
            {mockRequests.map((req) => (
                <Paper key={req.id} sx={{ p: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                            <Typography variant="subtitle2">{req.candidate}</Typography>
                            <Typography variant="body2" sx={{ my: 1 }}>{req.request}</Typography>
                            <Typography variant="caption" color="text.secondary">{req.time}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                                label={req.status}
                                size="small"
                                color={req.status === 'resolved' ? 'success' : 'warning'}
                            />
                            {req.status === 'pending' && (
                                <>
                                    <Button size="small" color="success">Satisfactory</Button>
                                    <Button size="small" color="error">Unsatisfactory</Button>
                                </>
                            )}
                        </Box>
                    </Box>
                </Paper>
            ))}
        </Box>
    );
}

export default function LiveProctoringTab() {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSession, setSelectedSession] = useState('all');
    const [subTab, setSubTab] = useState(0);
    const [gradingOpen, setGradingOpen] = useState(false);
    const [selectedCandidate, setSelectedCandidate] = useState<string>('');
    const [candidates, setCandidates] = useState<Candidate[]>(mockCandidates);
    const [isConnected, setIsConnected] = useState(true);

    const handleAction = (action: string, candidateId: string) => {
        const candidate = candidates.find(c => c.id === candidateId);
        if (!candidate) return;

        switch (action) {
            case 'pause':
                setCandidates(prev => prev.map(c =>
                    c.id === candidateId ? { ...c, status: 'paused', isRecording: false } : c
                ));
                break;
            case 'resume':
                setCandidates(prev => prev.map(c =>
                    c.id === candidateId ? { ...c, status: 'in_progress', isRecording: true } : c
                ));
                break;
            case 'grade':
                setSelectedCandidate(candidate.name);
                setGradingOpen(true);
                break;
            case 'addTime':
                alert(`Added 5 minutes for ${candidate.name}`);
                break;
            case 'prohibit':
                if (confirm(`Are you sure you want to prohibit ${candidate.name}?`)) {
                    setCandidates(prev => prev.map(c =>
                        c.id === candidateId ? { ...c, status: 'prohibited' } : c
                    ));
                }
                break;
            default:
                if (process.env.NEXT_PUBLIC_CLIENT_DEBUG === '1') {
                    console.log(`Action: ${action} for candidate: ${candidateId}`);
                }
        }
    };

    const filteredCandidates = candidates.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.testName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Box>
            {/* Connection status */}
            {!isConnected && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    WebSocket connection lost. Attempting to reconnect...
                </Alert>
            )}

            {/* Header with controls */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Search candidates..."
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
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Session</InputLabel>
                            <Select
                                value={selectedSession}
                                label="Session"
                                onChange={(e) => setSelectedSession(e.target.value)}
                            >
                                <MenuItem value="all">All Sessions ({mockSessions.reduce((a, s) => a + s.activeCount, 0)} active)</MenuItem>
                                {mockSessions.map((session) => (
                                    <MenuItem key={session.id} value={session.id}>
                                        {session.name} ({session.activeCount})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={5}>
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            <Button startIcon={<PauseIcon />} color="warning" variant="outlined">
                                Pause All
                            </Button>
                            <Button startIcon={<RefreshIcon />} variant="outlined">
                                Refresh
                            </Button>
                            <Box sx={{ display: 'flex', border: 1, borderColor: 'divider', borderRadius: 1 }}>
                                <IconButton
                                    onClick={() => setViewMode('grid')}
                                    color={viewMode === 'grid' ? 'primary' : 'default'}
                                >
                                    <GridViewIcon />
                                </IconButton>
                                <IconButton
                                    onClick={() => setViewMode('list')}
                                    color={viewMode === 'list' ? 'primary' : 'default'}
                                >
                                    <ViewListIcon />
                                </IconButton>
                            </Box>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            {/* Sub-tabs */}
            <Tabs value={subTab} onChange={(_, v) => setSubTab(v)} sx={{ mb: 2 }}>
                <Tab
                    label={
                        <Badge badgeContent={filteredCandidates.length} color="primary">
                            <Box sx={{ pr: 2 }}>Candidate Monitoring</Box>
                        </Badge>
                    }
                />
                <Tab icon={<AccessibilityNewIcon />} iconPosition="start" label="Special Accommodations" />
                <Tab icon={<PanToolIcon />} iconPosition="start" label="Special Requests" />
            </Tabs>

            {/* Sub-tab content */}
            {subTab === 0 && (
                <Grid container spacing={2}>
                    {filteredCandidates.length === 0 ? (
                        <Grid item xs={12}>
                            <Paper sx={{ p: 4, textAlign: 'center' }}>
                                <VideocamOffIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                                <Typography variant="h6" color="text.secondary">No active proctoring sessions</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Candidates will appear here when they start their proctored tests
                                </Typography>
                            </Paper>
                        </Grid>
                    ) : (
                        filteredCandidates.map((candidate) => (
                            <Grid item xs={12} sm={6} md={4} lg={3} key={candidate.id}>
                                <CandidateVideoCard candidate={candidate} onAction={handleAction} />
                            </Grid>
                        ))
                    )}
                </Grid>
            )}

            {subTab === 1 && <SpecialAccommodationsPanel />}
            {subTab === 2 && <SpecialRequestsPanel />}

            {/* Grading Dialog */}
            <GradingDialog
                open={gradingOpen}
                onClose={() => setGradingOpen(false)}
                candidateName={selectedCandidate}
            />
        </Box>
    );
}
