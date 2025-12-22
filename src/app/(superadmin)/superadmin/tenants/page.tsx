'use client';

import React, { useState } from 'react';
import {
    Box, Typography, Paper, Card, CardContent, Button, TextField,
    InputAdornment, Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
    Switch, FormControlLabel, Tabs, Tab,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DomainIcon from '@mui/icons-material/Domain';
import PeopleIcon from '@mui/icons-material/People';
import StorageIcon from '@mui/icons-material/Storage';
import SettingsIcon from '@mui/icons-material/Settings';

interface Tenant {
    id: string;
    name: string;
    domain: string;
    subdomain: string;
    users: number;
    storage: string;
    plan: string;
    status: 'active' | 'trial' | 'suspended';
    createdAt: string;
}

const mockTenants: Tenant[] = [
    { id: '1', name: 'Acme Corporation', domain: 'acme.lms.com', subdomain: 'acme', users: 1250, storage: '45 GB', plan: 'Enterprise', status: 'active', createdAt: 'Jan 2024' },
    { id: '2', name: 'TechStart Inc', domain: 'techstart.lms.com', subdomain: 'techstart', users: 85, storage: '5 GB', plan: 'Pro', status: 'active', createdAt: 'Mar 2024' },
    { id: '3', name: 'EduLearn Academy', domain: 'edulearn.lms.com', subdomain: 'edulearn', users: 3400, storage: '120 GB', plan: 'Enterprise', status: 'active', createdAt: 'Nov 2023' },
    { id: '4', name: 'Demo Company', domain: 'demo.lms.com', subdomain: 'demo', users: 10, storage: '500 MB', plan: 'Free', status: 'trial', createdAt: 'Dec 2024' },
];

export default function TenantsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [addDialogOpen, setAddDialogOpen] = useState(false);

    const filteredTenants = mockTenants.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.domain.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const stats = [
        { label: 'Total Tenants', value: mockTenants.length, icon: <DomainIcon />, color: 'primary' },
        { label: 'Total Users', value: mockTenants.reduce((sum, t) => sum + t.users, 0).toLocaleString(), icon: <PeopleIcon />, color: 'success' },
        { label: 'Active', value: mockTenants.filter(t => t.status === 'active').length, icon: <SettingsIcon />, color: 'info' },
        { label: 'Trial', value: mockTenants.filter(t => t.status === 'trial').length, icon: <StorageIcon />, color: 'warning' },
    ];

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight="bold">Tenants</Typography>
                <Button variant="contained" color="error" startIcon={<AddIcon />} onClick={() => setAddDialogOpen(true)}>
                    New Tenant
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
                    size="small" placeholder="Search tenants..."
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
                            <TableCell>Tenant</TableCell>
                            <TableCell>Domain</TableCell>
                            <TableCell align="center">Users</TableCell>
                            <TableCell>Storage</TableCell>
                            <TableCell>Plan</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Created</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredTenants.map((tenant) => (
                            <TableRow key={tenant.id} hover>
                                <TableCell><Typography fontWeight={500}>{tenant.name}</Typography></TableCell>
                                <TableCell>{tenant.domain}</TableCell>
                                <TableCell align="center">{tenant.users.toLocaleString()}</TableCell>
                                <TableCell>{tenant.storage}</TableCell>
                                <TableCell><Chip label={tenant.plan} size="small" variant="outlined" /></TableCell>
                                <TableCell>
                                    <Chip
                                        label={tenant.status}
                                        size="small"
                                        color={tenant.status === 'active' ? 'success' : tenant.status === 'trial' ? 'warning' : 'error'}
                                    />
                                </TableCell>
                                <TableCell>{tenant.createdAt}</TableCell>
                                <TableCell align="right">
                                    <IconButton size="small"><EditIcon fontSize="small" /></IconButton>
                                    <IconButton size="small"><SettingsIcon fontSize="small" /></IconButton>
                                    <IconButton size="small" color="error"><DeleteIcon fontSize="small" /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Add Dialog */}
            <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Create New Tenant</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}><TextField fullWidth label="Tenant Name" /></Grid>
                        <Grid item xs={6}><TextField fullWidth label="Subdomain" /></Grid>
                        <Grid item xs={6}><TextField fullWidth label="Custom Domain (optional)" /></Grid>
                        <Grid item xs={12}><TextField fullWidth label="Admin Email" type="email" /></Grid>
                        <Grid item xs={12}>
                            <FormControlLabel control={<Switch defaultChecked />} label="Enable Trial Period" />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" color="error" onClick={() => setAddDialogOpen(false)}>Create Tenant</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
