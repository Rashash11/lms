'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box,
    Typography,
    Paper,
    Button,
    TextField,
    InputAdornment,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Avatar,
    IconButton,
    Menu,
    MenuItem,
    Checkbox,
    TableSortLabel,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Select,
    FormControl,
    InputLabel,
    CircularProgress,
    Stack,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { getCsrfToken } from '@/lib/client-csrf';

interface User {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    activeRole: string;
    status: string;
    createdAt: string;
    lastLoginAt: string | null;
    avatar?: string;
}

type OrderDirection = 'asc' | 'desc';

export default function UsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [orderBy, setOrderBy] = useState<keyof User>('firstName');
    const [order, setOrder] = useState<OrderDirection>('asc');
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
    const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [addUserMenuAnchor, setAddUserMenuAnchor] = useState<null | HTMLElement>(null);
    const [activeUserRole, setActiveUserRole] = useState<string>('');
    const [activeUserId, setActiveUserId] = useState<string>('');

    // Form state
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        username: '',
        password: '',
        activeRole: 'LEARNER',
    });

    useEffect(() => {
        fetchUsers();
        fetch('/api/me', { credentials: 'include' }).then(res => res.json()).then(data => {
            if (data.user) {
                setActiveUserRole(data.user.activeRole);
                setActiveUserId(data.user.id);
            }
        });
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/users');
            const data = await response.json();
            setUsers(data.data || []);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRequestSort = (property: keyof User) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            setSelectedUsers(users.map(u => u.id));
        } else {
            setSelectedUsers([]);
        }
    };

    const handleSelectUser = (userId: string) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, user: User) => {
        setAnchorEl(event.currentTarget);
        setCurrentUser(user);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
    };

    const handleEdit = () => {
        if (currentUser) {
            router.push(`/admin/users/${currentUser.id}/edit`);
        }
        handleCloseMenu();
    };

    const handleDelete = () => {
        setDeleteDialogOpen(true);
        handleCloseMenu();
    };

    const handleAddUser = async () => {
        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-csrf-token': getCsrfToken()
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                fetchUsers();
                setAddUserDialogOpen(false);
                setFormData({
                    firstName: '',
                    lastName: '',
                    email: '',
                    username: '',
                    password: '',
                    activeRole: 'LEARNER',
                });
            }
        } catch (error) {
            console.error('Failed to add user:', error);
        }
    };

    const handleUpdateUser = async () => {
        if (!currentUser) return;

        try {
            const response = await fetch(`/api/users/${currentUser.id}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-csrf-token': getCsrfToken()
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                fetchUsers();
                setEditUserDialogOpen(false);
                setCurrentUser(null);
            }
        } catch (error) {
            console.error('Failed to update user:', error);
        }
    };

    const handleDeleteUser = async () => {
        if (!currentUser) return;

        try {
            const response = await fetch(`/api/users/${currentUser.id}`, {
                method: 'DELETE',
                headers: { 'x-csrf-token': getCsrfToken() },
            });

            if (response.ok) {
                fetchUsers();
                setDeleteDialogOpen(false);
                setCurrentUser(null);
            }
        } catch (error) {
            console.error('Failed to delete user:', error);
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Never';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        return date.toLocaleDateString();
    };

    const getTypeColor = (role: string) => {
        switch (role) {
            case 'ADMIN':
                return 'error';
            case 'SUPER_INSTRUCTOR':
                return 'secondary';
            case 'INSTRUCTOR':
                return 'warning';
            case 'LEARNER':
                return 'success';
            default:
                return 'default';
        }
    };

    const filteredUsers = users
        .filter(user =>
            user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.username.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
            const aValue = a[orderBy];
            const bValue = b[orderBy];
            if (aValue == null) return 1;
            if (bValue == null) return -1;
            if (aValue < bValue) return order === 'asc' ? -1 : 1;
            if (aValue > bValue) return order === 'asc' ? 1 : -1;
            return 0;
        });

    return (
        <Box>
            {/* Header */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" fontWeight={600} sx={{ color: 'hsl(var(--foreground))' }}>
                    Users
                </Typography>
            </Box>

            {/* Table Container */}
            <Paper
                className="glass-card"
                sx={{
                    width: '100%',
                    overflow: 'hidden',
                    bgcolor: 'rgba(13, 20, 20, 0.4)',
                    border: '1px solid rgba(141, 166, 166, 0.1)',
                    boxShadow: 'none'
                }}
            >
                {/* Search & Actions Bar */}
                <Box
                    sx={{
                        p: 2,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderBottom: '1px solid rgba(141, 166, 166, 0.1)',
                    }}
                >
                    <TextField
                        placeholder="Search"
                        size="small"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" sx={{ color: 'hsl(var(--muted-foreground))' }} />
                                </InputAdornment>
                            ),
                        }}
                        sx={{
                            width: 300,
                        }}
                    />
                    <Stack direction="row" spacing={1}>
                        <IconButton size="small">
                            <FilterListIcon />
                        </IconButton>
                        <Button
                            variant="contained"
                            startIcon={<PersonAddIcon />}
                            endIcon={<KeyboardArrowDownIcon />}
                            onClick={(e) => setAddUserMenuAnchor(e.currentTarget)}
                            sx={{
                                textTransform: 'none',
                                bgcolor: 'hsl(var(--primary))',
                                color: 'hsl(var(--primary-foreground))',
                                '&:hover': { bgcolor: 'hsl(var(--primary) / 0.9)' }
                            }}
                        >
                            Add user
                        </Button>
                        <Menu
                            anchorEl={addUserMenuAnchor}
                            open={Boolean(addUserMenuAnchor)}
                            onClose={() => setAddUserMenuAnchor(null)}
                        >
                            <MenuItem onClick={() => router.push('/admin/users/new')}>
                                Add user manually
                            </MenuItem>
                            <MenuItem onClick={() => setAddUserMenuAnchor(null)}>
                                Import users from file
                            </MenuItem>
                        </Menu>
                    </Stack>
                </Box>

                {/* Table */}
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        checked={selectedUsers.length === users.length && users.length > 0}
                                        indeterminate={selectedUsers.length > 0 && selectedUsers.length < users.length}
                                        onChange={handleSelectAll}
                                    />
                                </TableCell>
                                <TableCell>
                                    <TableSortLabel
                                        active={orderBy === 'firstName'}
                                        direction={orderBy === 'firstName' ? order : 'asc'}
                                        onClick={() => handleRequestSort('firstName')}
                                        sx={{
                                            fontWeight: 700,
                                            color: 'hsl(var(--foreground)) !important',
                                            '& .MuiTableSortLabel-icon': { color: 'hsl(var(--primary)) !important' }
                                        }}
                                    >
                                        User
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell>
                                    <TableSortLabel
                                        active={orderBy === 'email'}
                                        direction={orderBy === 'email' ? order : 'asc'}
                                        onClick={() => handleRequestSort('email')}
                                        sx={{
                                            fontWeight: 700,
                                            color: 'hsl(var(--foreground)) !important',
                                            '& .MuiTableSortLabel-icon': { color: 'hsl(var(--primary)) !important' }
                                        }}
                                    >
                                        Email
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell sx={{ fontWeight: 700, color: 'hsl(var(--foreground))' }}>Type</TableCell>
                                <TableCell>
                                    <TableSortLabel
                                        active={orderBy === 'createdAt'}
                                        direction={orderBy === 'createdAt' ? order : 'asc'}
                                        onClick={() => handleRequestSort('createdAt')}
                                        sx={{
                                            fontWeight: 700,
                                            color: 'hsl(var(--foreground)) !important',
                                            '& .MuiTableSortLabel-icon': { color: 'hsl(var(--primary)) !important' }
                                        }}
                                    >
                                        Registration
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell>
                                    <TableSortLabel
                                        active={orderBy === 'lastLoginAt'}
                                        direction={orderBy === 'lastLoginAt' ? order : 'asc'}
                                        onClick={() => handleRequestSort('lastLoginAt')}
                                        sx={{
                                            fontWeight: 700,
                                            color: 'hsl(var(--foreground)) !important',
                                            '& .MuiTableSortLabel-icon': { color: 'hsl(var(--primary)) !important' }
                                        }}
                                    >
                                        Last login
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell align="right"></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                                        <CircularProgress />
                                    </TableCell>
                                </TableRow>
                            ) : filteredUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                                        <Typography color="text.secondary">
                                            No users found
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUsers.map((user) => (
                                    <TableRow
                                        key={user.id}
                                        hover
                                        sx={{
                                            '&:hover': { backgroundColor: 'rgba(141, 166, 166, 0.05) !important' },
                                            '&.Mui-selected': { bgcolor: 'rgba(26, 84, 85, 0.1)' }
                                        }}
                                    >
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                checked={selectedUsers.includes(user.id)}
                                                onChange={() => handleSelectUser(user.id)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Avatar
                                                    sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}
                                                >
                                                    {user.firstName.charAt(0)}
                                                </Avatar>
                                                <Typography variant="body2" fontWeight={500}>
                                                    {user.firstName} {user.lastName}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">
                                                {user.email}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={user.activeRole}
                                                size="small"
                                                color={getTypeColor(user.activeRole)}
                                                sx={{ fontWeight: 500, fontSize: '0.75rem' }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">
                                                {formatDate(user.createdAt)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">
                                                {formatDate(user.lastLoginAt)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton
                                                size="small"
                                                onClick={(e) => handleOpenMenu(e, user)}
                                                sx={{ color: 'hsl(var(--muted-foreground))' }}
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
            </Paper>

            {/* Actions Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleCloseMenu}
            >
                <MenuItem
                    onClick={handleEdit}
                    disabled={activeUserRole === 'SUPER_INSTRUCTOR' && currentUser?.activeRole === 'ADMIN'}
                >
                    Edit
                </MenuItem>
                <MenuItem
                    onClick={handleDelete}
                    sx={{ color: 'error.main' }}
                    disabled={
                        (activeUserRole === 'SUPER_INSTRUCTOR' && (currentUser?.activeRole === 'ADMIN' || currentUser?.id === activeUserId)) ||
                        (currentUser?.id === activeUserId)
                    }
                >
                    Delete
                </MenuItem>
            </Menu>

            {/* Add User Dialog */}
            <Dialog open={addUserDialogOpen} onClose={() => setAddUserDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add New User</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="First Name"
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Last Name"
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Username"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Password"
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Role</InputLabel>
                                <Select
                                    value={formData.activeRole}
                                    label="Role"
                                    onChange={(e) => setFormData({ ...formData, activeRole: e.target.value })}
                                >
                                    <MenuItem value="LEARNER">Learner</MenuItem>
                                    <MenuItem value="INSTRUCTOR">Instructor</MenuItem>
                                    <MenuItem value="SUPER_INSTRUCTOR">Super instructor</MenuItem>
                                    {activeUserRole === 'ADMIN' && <MenuItem value="ADMIN">Administrator</MenuItem>}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAddUserDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleAddUser}>
                        Add User
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit User Dialog */}
            <Dialog open={editUserDialogOpen} onClose={() => setEditUserDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Edit User</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="First Name"
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Last Name"
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Role</InputLabel>
                                <Select
                                    value={formData.activeRole}
                                    label="Role"
                                    onChange={(e) => setFormData({ ...formData, activeRole: e.target.value })}
                                    disabled={activeUserRole === 'SUPER_INSTRUCTOR' && currentUser?.activeRole === 'ADMIN'}
                                >
                                    <MenuItem value="LEARNER">Learner</MenuItem>
                                    <MenuItem value="INSTRUCTOR">Instructor</MenuItem>
                                    <MenuItem value="SUPER_INSTRUCTOR">Super instructor</MenuItem>
                                    {activeUserRole === 'ADMIN' && <MenuItem value="ADMIN">Administrator</MenuItem>}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditUserDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleUpdateUser}>
                        Save Changes
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Delete User</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete {currentUser?.firstName} {currentUser?.lastName}? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" color="error" onClick={handleDeleteUser}>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
