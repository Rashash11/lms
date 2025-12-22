'use client';

import React, { useState } from 'react';
import {
    Box, Typography, Button, TextField, InputAdornment, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, Chip, IconButton, Card, CardContent,
    Dialog, DialogTitle, DialogContent, DialogActions, Switch, FormControlLabel,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import SettingsIcon from '@mui/icons-material/Settings';

interface Branch {
    id: string;
    name: string;
    slug: string;
    users: number;
    courses: number;
    status: 'active' | 'inactive';
    customBranding: boolean;
}

const mockBranches: Branch[] = [
    { id: '1', name: 'Main Branch', slug: 'main', users: 1247, courses: 45, status: 'active', customBranding: false },
    { id: '2', name: 'New York Office', slug: 'nyc', users: 342, courses: 28, status: 'active', customBranding: true },
    { id: '3', name: 'Los Angeles', slug: 'la', users: 189, courses: 15, status: 'active', customBranding: true },
    { id: '4', name: 'Chicago Hub', slug: 'chicago', users: 95, courses: 12, status: 'active', customBranding: false },
    { id: '5', name: 'Training Center', slug: 'training', users: 0, courses: 5, status: 'inactive', customBranding: false },
];

const stats = [
    { label: 'Total Branches', value: mockBranches.length, icon: <AccountTreeIcon />, color: 'primary' },
    { label: 'Total Users', value: mockBranches.reduce((sum, b) => sum + b.users, 0).toLocaleString(), icon: <PeopleIcon />, color: 'success' },
    { label: 'Total Courses', value: mockBranches.reduce((sum, b) => sum + b.courses, 0), icon: <SchoolIcon />, color: 'info' },
    { label: 'Custom Branded', value: mockBranches.filter(b => b.customBranding).length, icon: <SettingsIcon />, color: 'warning' },
];

export default function BranchesPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [addDialogOpen, setAddDialogOpen] = useState(false);

    const filteredBranches = mockBranches.filter(branch =>
        branch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        branch.slug.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight="bold">Branches</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddDialogOpen(true)}>
                    Add Branch
                </Button>
            </Box>

            {/* Stats */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {stats.map((stat) => (
                    <Grid item xs={6} md={3} key={stat.label}>
                        <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ p: 1, borderRadius: 1, bgcolor: `${stat.color}.lighter`, color: `${stat.color}.main` }}>
                                {stat.icon}
                            </Box>
                            <Box>
                                <Typography variant="h5" fontWeight={700}>{stat.value}</Typography>
                                <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
                            </Box>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {/* Search */}
            <Paper sx={{ p: 2, mb: 2 }}>
                <TextField
                    size="small" placeholder="Search branches..."
                    value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
                    sx={{ width: 300 }}
                />
            </Paper>

            {/* Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead sx={{ bgcolor: 'grey.50' }}>
                        <TableRow>
                            <TableCell>Branch Name</TableCell>
                            <TableCell>Slug</TableCell>
                            <TableCell align="center">Users</TableCell>
                            <TableCell align="center">Courses</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Branding</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredBranches.map((branch) => (
                            <TableRow key={branch.id} hover>
                                <TableCell><Typography fontWeight={500}>{branch.name}</Typography></TableCell>
                                <TableCell><Chip label={branch.slug} size="small" variant="outlined" /></TableCell>
                                <TableCell align="center">{branch.users.toLocaleString()}</TableCell>
                                <TableCell align="center">{branch.courses}</TableCell>
                                <TableCell>
                                    <Chip label={branch.status} size="small" color={branch.status === 'active' ? 'success' : 'default'} />
                                </TableCell>
                                <TableCell>
                                    {branch.customBranding ? <Chip label="Custom" size="small" color="info" /> : '-'}
                                </TableCell>
                                <TableCell align="right">
                                    <IconButton size="small"><EditIcon fontSize="small" /></IconButton>
                                    <IconButton size="small" color="error"><DeleteIcon fontSize="small" /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Add Branch Dialog */}
            <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add New Branch</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}><TextField fullWidth label="Branch Name" /></Grid>
                        <Grid item xs={12}><TextField fullWidth label="Slug" helperText="URL-friendly identifier (e.g., 'new-york')" /></Grid>
                        <Grid item xs={12}>
                            <FormControlLabel control={<Switch />} label="Enable Custom Branding" />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={() => setAddDialogOpen(false)}>Create Branch</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
