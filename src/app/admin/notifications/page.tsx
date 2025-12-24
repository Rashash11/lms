'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Tabs,
    Tab,
    Button,
    TextField,
    InputAdornment,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Menu,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Alert,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import NotificationDrawer from './components/NotificationDrawer';

interface Notification {
    id: string;
    name: string;
    eventKey: string;
    isActive: boolean;
    recipientType: string;
    messageSubject: string;
    createdAt: string;
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div role="tabpanel" hidden={value !== index} {...other}>
            {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
        </div>
    );
}

export default function NotificationsPage() {
    const [currentTab, setCurrentTab] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [historyData, setHistoryData] = useState<any[]>([]);
    const [pendingData, setPendingData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [notificationToDelete, setNotificationToDelete] = useState<string | null>(null);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

    const tabs = ['Overview', 'History', 'Pending', 'System notifications'];

    useEffect(() => {
        fetchData();
    }, [currentTab, searchQuery]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const tabMap = ['overview', 'history', 'pending', 'system'];
            const response = await fetch(
                `/api/admin/notifications?tab=${tabMap[currentTab]}&search=${searchQuery}`
            );
            const data = await response.json();

            if (currentTab === 0) {
                setNotifications(data.data || []);
            } else if (currentTab === 1) {
                setHistoryData(data.data || []);
            } else if (currentTab === 2) {
                setPendingData(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setCurrentTab(newValue);
    };

    const handleAddNotification = () => {
        setEditingNotification(null);
        setDrawerOpen(true);
    };

    const handleEditNotification = (notification: Notification) => {
        setEditingNotification(notification);
        setDrawerOpen(true);
        handleMenuClose();
    };

    const handleToggleActive = async (notification: Notification) => {
        try {
            await fetch(`/api/admin/notifications/${notification.id}/toggle`, {
                method: 'PATCH',
            });
            fetchData();
            handleMenuClose();
        } catch (error) {
            console.error('Error toggling notification:', error);
        }
    };

    const handleDuplicate = async (notification: Notification) => {
        try {
            await fetch(`/api/admin/notifications/${notification.id}/duplicate`, {
                method: 'POST',
            });
            fetchData();
            handleMenuClose();
        } catch (error) {
            console.error('Error duplicating notification:', error);
        }
    };

    const handleDeleteClick = (notificationId: string) => {
        setNotificationToDelete(notificationId);
        setDeleteDialogOpen(true);
        handleMenuClose();
    };

    const handleDeleteConfirm = async () => {
        if (!notificationToDelete) return;

        try {
            await fetch(`/api/admin/notifications/${notificationToDelete}`, {
                method: 'DELETE',
            });
            fetchData();
            setDeleteDialogOpen(false);
            setNotificationToDelete(null);
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>, notification: Notification) => {
        setAnchorEl(event.currentTarget);
        setSelectedNotification(notification);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedNotification(null);
    };

    const handleDrawerClose = () => {
        setDrawerOpen(false);
        setEditingNotification(null);
    };

    const handleDrawerSave = () => {
        setDrawerOpen(false);
        fetchData();
    };

    const formatEventLabel = (eventKey: string) => {
        return eventKey.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    };

    const formatRecipient = (recipientType: string) => {
        return recipientType.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    };

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight="bold">
                    Notifications
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddNotification}>
                    Add notification
                </Button>
            </Box>

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={currentTab} onChange={handleTabChange}>
                    {tabs.map((tab, index) => (
                        <Tab key={index} label={tab} />
                    ))}
                </Tabs>
            </Box>

            {/* Tab Content */}
            <TabPanel value={currentTab} index={0}>
                {/* Overview Tab */}
                <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
                    <TextField
                        size="small"
                        placeholder="Search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ width: 300 }}
                    />
                    <IconButton size="small">
                        <FilterListIcon />
                    </IconButton>
                </Box>

                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell><strong>Name</strong></TableCell>
                                <TableCell><strong>Event</strong></TableCell>
                                <TableCell><strong>Recipient</strong></TableCell>
                                <TableCell align="right" width={50}></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {notifications.map((notification) => (
                                <TableRow key={notification.id} hover>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {notification.name}
                                            {!notification.isActive && (
                                                <Chip label="Inactive" size="small" color="default" sx={{ height: 20 }} />
                                            )}
                                        </Box>
                                    </TableCell>
                                    <TableCell>{formatEventLabel(notification.eventKey)}</TableCell>
                                    <TableCell>{formatRecipient(notification.recipientType)}</TableCell>
                                    <TableCell align="right">
                                        <IconButton size="small" onClick={(e) => handleMenuClick(e, notification)}>
                                            <MoreVertIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </TabPanel>

            <TabPanel value={currentTab} index={1}>
                {/* History Tab */}
                <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
                    <TextField
                        size="small"
                        placeholder="Search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ width: 300 }}
                    />
                    <IconButton size="small">
                        <FilterListIcon />
                    </IconButton>
                </Box>

                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell><strong>Notification</strong></TableCell>
                                <TableCell><strong>Recipient</strong></TableCell>
                                <TableCell><strong>Sent Time</strong></TableCell>
                                <TableCell><strong>Status</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {historyData.map((item) => (
                                <TableRow key={item.id} hover>
                                    <TableCell>{item.notification?.name || 'Unknown'}</TableCell>
                                    <TableCell>{item.recipientEmail}</TableCell>
                                    <TableCell>{new Date(item.sentAt).toLocaleString()}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={item.status}
                                            size="small"
                                            color={item.status === 'SENT' ? 'success' : 'error'}
                                            sx={{ height: 20 }}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </TabPanel>

            <TabPanel value={currentTab} index={2}>
                {/* Pending Tab */}
                <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
                    <TextField
                        size="small"
                        placeholder="Search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ width: 300 }}
                    />
                </Box>

                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell><strong>Notification</strong></TableCell>
                                <TableCell><strong>Recipient</strong></TableCell>
                                <TableCell><strong>Scheduled Time</strong></TableCell>
                                <TableCell><strong>Event</strong></TableCell>
                                <TableCell align="right" width={100}><strong>Actions</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {pendingData.map((item) => (
                                <TableRow key={item.id} hover>
                                    <TableCell>{item.notification?.name || 'Unknown'}</TableCell>
                                    <TableCell>{item.recipientEmail}</TableCell>
                                    <TableCell>{new Date(item.scheduledFor).toLocaleString()}</TableCell>
                                    <TableCell>{formatEventLabel(item.notification?.eventKey || '')}</TableCell>
                                    <TableCell align="right">
                                        <Button size="small" color="error" variant="outlined">
                                            Cancel
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </TabPanel>

            <TabPanel value={currentTab} index={3}>
                {/* System Notifications Tab */}
                <Alert severity="info">
                    System notifications are predefined email templates managed by the system.
                </Alert>
            </TabPanel>

            {/* Actions Menu */}
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                <MenuItem onClick={() => selectedNotification && handleEditNotification(selectedNotification)}>
                    Edit
                </MenuItem>
                <MenuItem onClick={() => selectedNotification && handleToggleActive(selectedNotification)}>
                    {selectedNotification?.isActive ? 'Deactivate' : 'Activate'}
                </MenuItem>
                <MenuItem onClick={() => selectedNotification && handleDuplicate(selectedNotification)}>
                    Duplicate
                </MenuItem>
                <MenuItem onClick={() => selectedNotification && handleDeleteClick(selectedNotification.id)}>
                    Delete
                </MenuItem>
            </Menu>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Delete Notification</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this notification? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleDeleteConfirm} color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Notification Drawer */}
            <NotificationDrawer
                open={drawerOpen}
                notification={editingNotification}
                onClose={handleDrawerClose}
                onSave={handleDrawerSave}
            />
        </Box>
    );
}
