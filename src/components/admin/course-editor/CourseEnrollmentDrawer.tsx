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
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SearchIcon from '@mui/icons-material/Search';

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
    const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement; enrollment: Enrollment } | null>(null);

    // Mock users for autocomplete (replace with actual API)
    const availableUsers = [
        { id: '1', name: 'John Doe', email: 'john@example.com' },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
        { id: '3', name: 'Bob Johnson', email: 'bob@example.com' },
    ];

    const fetchEnrollments = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/courses/${courseId}/enrollments`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();

            setEnrollments(data.enrollments.map((e: any) => ({
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

    useEffect(() => {
        if (open) {
            fetchEnrollments();
            fetchRequests();
        }
    }, [open, courseId]);

    const handleEnroll = async () => {
        if (selectedUsers.length === 0) return;

        setLoading(true);
        try {
            await fetch(`/api/courses/${courseId}/enrollments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userIds: selectedUsers.map(u => u.id) }),
            });

            await fetchEnrollments();
            setSelectedUsers([]);
            setEnrollDialogOpen(false);
        } catch (error) {
            console.error('Error enrolling users:', error);
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
                        value={selectedUsers}
                        onChange={(e, newValue) => setSelectedUsers(newValue)}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                placeholder="Search and select users..."
                                sx={{ mt: 2 }}
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
        </>
    );
}
