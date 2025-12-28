import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, InputAdornment, List, ListItem, ListItemButton,
    ListItemText, ListItemAvatar, Avatar, Checkbox,
    Typography, Box, CircularProgress, Chip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';

interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string | null;
    roles: string[];
}

interface UserEnrollmentDialogProps {
    open: boolean;
    onClose: () => void;
    onEnroll: (userIds: string[]) => Promise<void>;
    enrolledUserIds: string[];
}

export default function UserEnrollmentDialog({
    open,
    onClose,
    onEnroll,
    enrolledUserIds
}: UserEnrollmentDialogProps) {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (open) {
            fetchUsers();
            setSelected([]);
            setSearch('');
        }
    }, [open]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            // Fetch all users - in a real app might want pagination handled here or search query passed to API
            const res = await fetch('/api/users?limit=100');
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users || []);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (userId: string) => {
        const currentIndex = selected.indexOf(userId);
        const newChecked = [...selected];

        if (currentIndex === -1) {
            newChecked.push(userId);
        } else {
            newChecked.splice(currentIndex, 1);
        }

        setSelected(newChecked);
    };

    const handleSubmit = async () => {
        if (selected.length === 0) return;

        setSubmitting(true);
        try {
            await onEnroll(selected);
            onClose();
        } catch (error) {
            console.error('Error enrolling users:', error);
        } finally {
            setSubmitting(false);
        }
    };

    // Filter users based on search and exclude already enrolled
    const filteredUsers = users.filter(user => {
        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
        const email = user.email.toLowerCase();
        const searchLower = search.toLowerCase();

        const matchesSearch = fullName.includes(searchLower) || email.includes(searchLower);
        const isNotEnrolled = !enrolledUserIds.includes(user.id);

        return matchesSearch && isNotEnrolled;
    });

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 600 }}>Enroll Users</DialogTitle>
            <DialogContent dividers>
                <Box sx={{ mb: 2 }}>
                    <TextField
                        fullWidth
                        placeholder="Search users..."
                        size="small"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon color="action" />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress size={30} />
                    </Box>
                ) : (
                    <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                        {filteredUsers.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                                <Typography>No eligible users found</Typography>
                            </Box>
                        ) : (
                            filteredUsers.map((user) => {
                                const labelId = `checkbox-list-label-${user.id}`;
                                return (
                                    <ListItem
                                        key={user.id}
                                        disablePadding
                                    >
                                        <ListItemButton onClick={() => handleToggle(user.id)} dense>
                                            <ListItemAvatar>
                                                <Avatar src={user.avatar || undefined}>
                                                    <PersonIcon />
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                id={labelId}
                                                primary={`${user.firstName} ${user.lastName}`}
                                                primaryTypographyProps={{ fontWeight: 500 }}
                                                secondary={user.email}
                                            />
                                            <Checkbox
                                                edge="end"
                                                checked={selected.indexOf(user.id) !== -1}
                                                tabIndex={-1}
                                                disableRipple
                                                inputProps={{ 'aria-labelledby': labelId }}
                                            />
                                        </ListItemButton>
                                    </ListItem>
                                );
                            })
                        )}
                    </List>
                )}
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} disabled={submitting}>Cancel</Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={selected.length === 0 || submitting}
                >
                    {submitting ? 'Enrolling...' : `Enroll ${selected.length > 0 ? `(${selected.length})` : ''}`}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
