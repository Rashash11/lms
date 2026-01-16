'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
    Box, Typography, Button, TextField, InputAdornment,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, IconButton, Menu, MenuItem, Skeleton, Dialog, DialogTitle,
    DialogContent, DialogActions, Select
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import GroupsIcon from '@mui/icons-material/Groups';
import { apiFetch } from '@shared/http/apiFetch';

interface Group {
    id: string;
    name: string;
    description: string | null;
    price: number | null;
    _count: {
        members: number;
        courses: number;
    };
}

export default function GroupsPage() {
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [newGroup, setNewGroup] = useState({ name: '', description: '', price: '' });

    const fetchGroups = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set('search', search);

            const res = await fetch(`/api/instructor/groups?${params.toString()}`);
            const data = await res.json();
            if (data.data) {
                setGroups(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch groups:', error);
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        void fetchGroups();
    }, [fetchGroups]);

    const handleAddGroup = async () => {
        try {
            const data = await apiFetch<{ success: boolean }>('/api/instructor/groups', {
                method: 'POST',
                body: newGroup,
            });
            if (data.success) {
                setOpenAddDialog(false);
                setNewGroup({ name: '', description: '', price: '' });
                fetchGroups();
            }
        } catch (error) {
            console.error('Failed to create group:', error);
        }
    };

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight={600} color="#172B4D">
                    Groups
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenAddDialog(true)}
                    sx={{
                        bgcolor: '#0052CC',
                        textTransform: 'none',
                        fontWeight: 600,
                        '&:hover': { bgcolor: '#0747A6' }
                    }}
                >
                    Add group
                </Button>
            </Box>

            {/* Controls */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
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
                <Select
                    size="small"
                    defaultValue="mass-actions"
                    endAdornment={<KeyboardArrowDownIcon sx={{ mr: 1, color: '#6B778C' }} />}
                    sx={{
                        minWidth: 160,
                        borderRadius: 1.5,
                        bgcolor: '#F4F5F7',
                        '& fieldset': { border: 'none' }
                    }}
                >
                    <MenuItem value="mass-actions">Mass actions</MenuItem>
                    <MenuItem value="delete">Delete selected</MenuItem>
                    <MenuItem value="export">Export selected</MenuItem>
                </Select>
            </Box>

            {/* Table */}
            {loading ? (
                <Box>
                    {[1, 2, 3].map(i => (
                        <Skeleton key={i} variant="rectangular" height={60} sx={{ mb: 1, borderRadius: 1 }} />
                    ))}
                </Box>
            ) : groups.length > 0 ? (
                <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #DFE1E6' }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#FAFBFC' }}>
                                <TableCell sx={{ fontWeight: 600, color: '#172B4D', py: 2 }}>Group</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: '#172B4D' }}>Description</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: '#172B4D', textAlign: 'right' }}>Price</TableCell>
                                <TableCell sx={{ width: 50 }}></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {groups.map((group, index) => (
                                <TableRow
                                    key={group.id}
                                    sx={{
                                        bgcolor: index % 2 === 1 ? '#FAFBFC' : 'white',
                                        '&:hover': { bgcolor: '#F4F5F7' }
                                    }}
                                >
                                    <TableCell sx={{ color: '#172B4D', fontWeight: 500 }}>
                                        {group.name}
                                    </TableCell>
                                    <TableCell sx={{ color: '#6B778C' }}>
                                        {group.description || '-'}
                                    </TableCell>
                                    <TableCell sx={{ color: '#172B4D', textAlign: 'right' }}>
                                        {group.price ? `$${group.price}` : '-'}
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
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <GroupsIcon sx={{ fontSize: 64, color: '#DFE1E6', mb: 2 }} />
                    <Typography variant="h6" color="#172B4D" gutterBottom>
                        No groups found
                    </Typography>
                    <Typography variant="body2" color="#6B778C">
                        Create your first group to get started
                    </Typography>
                </Box>
            )}

            {/* Add Group Dialog */}
            <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add Group</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        <TextField
                            label="Group Name"
                            fullWidth
                            value={newGroup.name}
                            onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                        />
                        <TextField
                            label="Description"
                            fullWidth
                            multiline
                            rows={3}
                            value={newGroup.description}
                            onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                        />
                        <TextField
                            label="Price"
                            fullWidth
                            type="number"
                            value={newGroup.price}
                            onChange={(e) => setNewGroup({ ...newGroup, price: e.target.value })}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleAddGroup}
                        disabled={!newGroup.name}
                    >
                        Add Group
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
