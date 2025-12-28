import React, { useState, useEffect } from 'react';
import {
    Drawer,
    Box,
    Typography,
    IconButton,
    Button,
    TextField,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Autocomplete,
    LinearProgress,
    Menu,
    MenuItem,
    Divider,
    Alert,
    Tab,
    Tabs,
    CircularProgress,
    Snackbar,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SearchIcon from '@mui/icons-material/Search';

import LinkIcon from '@mui/icons-material/Link';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RefreshIcon from '@mui/icons-material/Refresh';

interface Enrollment {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    role: string;
    status: string;
    progress: number;
    enrolledAt: string;
}

interface EnrollmentRequest {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    requestedAt: string;
}

interface CourseEnrollmentDrawerProps {
    open: boolean;
    onClose: () => void;
    courseId: string;
}

export default function CourseEnrollmentDrawer({
    open,
    onClose,
    courseId,
}: CourseEnrollmentDrawerProps) {
    const [currentTab, setCurrentTab] = useState(0);
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [requests, setRequests] = useState<EnrollmentRequest[]>([]);
    const [loading, setLoading] = useState(false);
    const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
    const [linkDialogOpen, setLinkDialogOpen] = useState(false);
    const [enrollmentKey, setEnrollmentKey] = useState<string | null>(null);
    const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement; enrollment: Enrollment } | null>(null);

    const [availableUsers, setAvailableUsers] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    const fetchEnrollments = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/courses/${courseId}/enrollments`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();

            setEnrollments((data.enrollments || []).map((e: any) => ({
                id: e.id,
                userId: e.userId,
                userName: e.user?.name || 'Unknown',
                userEmail: e.user?.email || '',
                role: 'Learner',
                status: e.status,
                progress: e.progress || 0,
                enrolledAt: new Date(e.enrolledAt).toISOString().split('T')[0],
            })));
        } catch (error) {
            console.error('Error fetching enrollments:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/courses/${courseId}/enrollment-requests`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setRequests(data.requests || []);
        } catch (error) {
            console.error('Error fetching requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const searchUsers = async (query: string) => {
        console.log('Searching for users with query:', query);
        setSearching(true);
        try {
            const url = `/api/users/search?q=${encodeURIComponent(query)}&excludeCourseId=${courseId}`;
            console.log('Fetching search results from:', url);
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                console.log('Search results received:', data.users?.length || 0, 'users');
                setAvailableUsers(data.users || []);
            } else {
                const errorText = await res.text();
                console.error('Search API error:', res.status, errorText);
            }
        } catch (error) {
            console.error('Error searching users:', error);
        } finally {
            setSearching(false);
        }
    };

    const fetchCourse = async () => {
        try {
            const res = await fetch(`/api/courses/${courseId}`);
            if (res.ok) {
                const data = await res.json();
                setEnrollmentKey(data.settings?.enrollmentKey || null);
            }
        } catch (error) {
            console.error('Error fetching course:', error);
        }
    };

    const handleGenerateLink = async () => {
        const newKey = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        setLoading(true);
        try {
            const res = await fetch(`/api/courses/${courseId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    settings: {
                        enrollmentKey: newKey
                    }
                }),
            });

            if (res.ok) {
                setEnrollmentKey(newKey);
                setSnackbar({ open: true, message: 'Enrollment link generated!', severity: 'success' });
            }
        } catch (error) {
            console.error('Error generating link:', error);
            setSnackbar({ open: true, message: 'Failed to generate link', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const toggleLinkEnrollment = async () => {
        const action = enrollmentKey ? 'disable' : 'enable';
        const newKey = action === 'enable'
            ? Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
            : null;

        setLoading(true);
        try {
            const res = await fetch(`/api/courses/${courseId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    settings: {
                        enrollmentKey: newKey
                    }
                }),
            });

            if (res.ok) {
                setEnrollmentKey(newKey);
                setSnackbar({
                    open: true,
                    message: action === 'enable' ? 'Enrollment link enabled!' : 'Enrollment link disabled!',
                    severity: 'success'
                });
            }
        } catch (error) {
            console.error('Error toggling link:', error);
            setSnackbar({ open: true, message: 'Action failed', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            fetchEnrollments();
            fetchRequests();
            fetchCourse();
            searchUsers(''); // Load initial users
        }
    }, [open, courseId]);

    const handleEnroll = async () => {
        if (selectedUsers.length === 0) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/courses/${courseId}/enrollments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userIds: selectedUsers.map(u => u.id) }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to enroll');
            }

            await fetchEnrollments();
            setSelectedUsers([]);
            setEnrollDialogOpen(false);
        } catch (error) {
            console.error('Error enrolling users:', error);
            alert(error instanceof Error ? error.message : 'Failed to enroll users');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveEnrollment = async (enrollmentId: string) => {
        if (!confirm('Remove this user from the course?')) return;

        setLoading(true);
        try {
            await fetch(`/api/courses/${courseId}/enrollments?enrollmentId=${enrollmentId}`, {
                method: 'DELETE',
            });
            await fetchEnrollments();
        } catch (error) {
            console.error('Error removing enrollment:', error);
        } finally {
            setLoading(false);
            setMenuAnchor(null);
        }
    };

    const handleApproveRequest = async (requestId: string) => {
        setLoading(true);
        try {
            await fetch(`/api/courses/${courseId}/enrollment-requests/${requestId}`, {
                method: 'POST',
            });
            await fetchEnrollments();
            await fetchRequests();
        } catch (error) {
            console.error('Error approving request:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeclineRequest = async (requestId: string) => {
        setLoading(true);
        try {
            await fetch(`/api/courses/${courseId}/enrollment-requests/${requestId}`, {
                method: 'DELETE',
            });
            await fetchRequests();
        } catch (error) {
            console.error('Error declining request:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'success';
            case 'IN_PROGRESS': return 'primary';
            case 'NOT_STARTED': return 'default';
            default: return 'default';
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setSnackbar({ open: true, message: 'Link copied to clipboard!', severity: 'success' });
    };

    return (
        <>
            <Drawer
                anchor="right"
                open={open}
                onClose={onClose}
                PaperProps={{
                    sx: { width: 600 }
                }}
            >
                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {/* Header */}
                    <Box sx={{
                        p: 3,
                        borderBottom: '1px solid #edf2f7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#2d3748' }}>
                            Users & Enrollment
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                variant="outlined"
                                startIcon={<LinkIcon />}
                                onClick={() => setLinkDialogOpen(true)}
                                sx={{
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    borderColor: '#cbd5e0',
                                    color: '#4a5568',
                                    '&:hover': {
                                        borderColor: '#a0aec0',
                                        bgcolor: '#f7fafc'
                                    }
                                }}
                            >
                                Enroll with link
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<PersonAddIcon />}
                                onClick={() => setEnrollDialogOpen(true)}
                                sx={{
                                    textTransform: 'none',
                                    bgcolor: '#3182ce',
                                    fontWeight: 600,
                                }}
                            >
                                Enroll Users
                            </Button>
                            <IconButton onClick={onClose} size="small">
                                <CloseIcon />
                            </IconButton>
                        </Box>
                    </Box>

                    {/* Tabs */}
                    <Tabs
                        value={currentTab}
                        onChange={(e, v) => setCurrentTab(v)}
                        sx={{
                            borderBottom: '1px solid #edf2f7',
                            px: 2,
                            '& .MuiTab-root': {
                                textTransform: 'none',
                                fontWeight: 600,
                            }
                        }}
                    >
                        <Tab label={`Enrolled (${enrollments.length})`} />
                        <Tab label={`Requests (${requests.length})`} />
                    </Tabs>

                    {/* Search */}
                    <Box sx={{ p: 2 }}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: <SearchIcon sx={{ color: '#a0aec0', mr: 1 }} />,
                            }}
                        />
                    </Box>

                    {loading && <LinearProgress />}

                    {/* Content */}
                    <Box sx={{ flex: 1, overflowY: 'auto' }}>
                        {currentTab === 0 && (
                            <List>
                                {enrollments
                                    .filter(e =>
                                        e.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        e.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
                                    )
                                    .map((enrollment) => (
                                        <ListItem
                                            key={enrollment.id}
                                            secondaryAction={
                                                <IconButton
                                                    edge="end"
                                                    onClick={(e) => setMenuAnchor({ el: e.currentTarget, enrollment })}
                                                >
                                                    <MoreVertIcon />
                                                </IconButton>
                                            }
                                        >
                                            <ListItemAvatar>
                                                <Avatar>{enrollment.userName[0]}</Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                                            {enrollment.userName}
                                                        </Typography>
                                                        <Chip
                                                            label={enrollment.role}
                                                            size="small"
                                                            sx={{ height: 20, fontSize: '0.7rem' }}
                                                        />
                                                        <Chip
                                                            label={enrollment.status.replace('_', ' ')}
                                                            size="small"
                                                            color={getStatusColor(enrollment.status)}
                                                            sx={{ height: 20, fontSize: '0.7rem' }}
                                                        />
                                                    </Box>
                                                }
                                                secondary={
                                                    <Box>
                                                        <Typography variant="caption" sx={{ color: '#718096' }}>
                                                            {enrollment.userEmail} • Enrolled {enrollment.enrolledAt}
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                                            <LinearProgress
                                                                variant="determinate"
                                                                value={enrollment.progress}
                                                                sx={{ flex: 1, height: 6, borderRadius: 3 }}
                                                            />
                                                            <Typography variant="caption" sx={{ fontWeight: 600, color: '#2d3748' }}>
                                                                {enrollment.progress}%
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                }
                                            />
                                        </ListItem>
                                    ))}
                                {enrollments.length === 0 && (
                                    <Box sx={{ p: 4, textAlign: 'center' }}>
                                        <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                                            No users enrolled yet
                                        </Typography>
                                    </Box>
                                )}
                            </List>
                        )}

                        {currentTab === 1 && (
                            <List>
                                {requests.map((request) => (
                                    <ListItem key={request.id}>
                                        <ListItemAvatar>
                                            <Avatar>{request.userName[0]}</Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={request.userName}
                                            secondary={`${request.userEmail} • Requested ${request.requestedAt}`}
                                        />
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Button
                                                size="small"
                                                variant="contained"
                                                color="success"
                                                onClick={() => handleApproveRequest(request.id)}
                                                sx={{ textTransform: 'none' }}
                                            >
                                                Approve
                                            </Button>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                color="error"
                                                onClick={() => handleDeclineRequest(request.id)}
                                                sx={{ textTransform: 'none' }}
                                            >
                                                Decline
                                            </Button>
                                        </Box>
                                    </ListItem>
                                ))}
                                {requests.length === 0 && (
                                    <Box sx={{ p: 4, textAlign: 'center' }}>
                                        <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                                            No pending requests
                                        </Typography>
                                    </Box>
                                )}
                            </List>
                        )}
                    </Box>
                </Box>
            </Drawer>

            {/* Enrollment Menu */}
            <Menu
                anchorEl={menuAnchor?.el}
                open={Boolean(menuAnchor)}
                onClose={() => setMenuAnchor(null)}
            >
                <MenuItem onClick={() => menuAnchor && handleRemoveEnrollment(menuAnchor.enrollment.id)}>
                    Remove Enrollment
                </MenuItem>
            </Menu>

            {/* Bulk Enroll Dialog */}
            <Dialog open={enrollDialogOpen} onClose={() => setEnrollDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Enroll Users</DialogTitle>
                <DialogContent>
                    <Autocomplete
                        multiple
                        options={availableUsers}
                        getOptionLabel={(option) => `${option.name} (${option.email})`}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        filterSelectedOptions
                        value={selectedUsers}
                        onChange={(e, newValue) => setSelectedUsers(newValue)}
                        onInputChange={(event, newInputValue) => {
                            searchUsers(newInputValue);
                        }}
                        loading={searching}
                        filterOptions={(x) => x}
                        noOptionsText={searching ? "Searching..." : "No users found"}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                placeholder="Search and select users..."
                                sx={{ mt: 2 }}
                                InputProps={{
                                    ...params.InputProps,
                                    endAdornment: (
                                        <>
                                            {searching ? <CircularProgress color="inherit" size={20} /> : null}
                                            {params.InputProps.endAdornment}
                                        </>
                                    ),
                                }}
                            />
                        )}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEnrollDialogOpen(false)} sx={{ textTransform: 'none' }}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleEnroll}
                        variant="contained"
                        disabled={selectedUsers.length === 0}
                        sx={{ textTransform: 'none', bgcolor: '#3182ce' }}
                    >
                        Enroll {selectedUsers.length > 0 && `(${selectedUsers.length})`}
                    </Button>
                </DialogActions>
            </Dialog>
            {/* Enroll Link Dialog */}
            <Dialog open={linkDialogOpen} onClose={() => setLinkDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Enrollment Link</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ color: '#4a5568', mb: 2 }}>
                        Users can self-enroll in this course by visiting this unique link.
                    </Typography>

                    {enrollmentKey ? (
                        <Box>
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                p: 1.5,
                                bgcolor: '#f7fafc',
                                border: '1px solid #edf2f7',
                                borderRadius: 1,
                                mb: 2
                            }}>
                                <Typography variant="body2" sx={{ flex: 1, wordBreak: 'break-all', fontFamily: 'monospace' }}>
                                    {typeof window !== 'undefined' ? `${window.location.origin}/enroll/${enrollmentKey}` : ''}
                                </Typography>
                                <IconButton size="small" onClick={() => copyToClipboard(`${window.location.origin}/enroll/${enrollmentKey}`)}>
                                    <ContentCopyIcon fontSize="small" />
                                </IconButton>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                    size="small"
                                    startIcon={<RefreshIcon />}
                                    onClick={handleGenerateLink}
                                    sx={{ textTransform: 'none' }}
                                >
                                    Reset Link
                                </Button>
                                <Button
                                    size="small"
                                    color="error"
                                    onClick={toggleLinkEnrollment}
                                    sx={{ textTransform: 'none' }}
                                >
                                    Disable Link
                                </Button>
                            </Box>
                        </Box>
                    ) : (
                        <Box sx={{ textAlign: 'center', py: 2 }}>
                            <Button
                                variant="contained"
                                startIcon={<LinkIcon />}
                                onClick={toggleLinkEnrollment}
                                sx={{ textTransform: 'none', bgcolor: '#3182ce' }}
                            >
                                Enable Enrollment Link
                            </Button>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setLinkDialogOpen(false)} sx={{ textTransform: 'none' }}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
}
