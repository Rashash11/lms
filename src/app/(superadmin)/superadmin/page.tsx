'use client';

import React from 'react';
import { Box, Typography, Paper, Card, CardContent, Chip, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, LinearProgress } from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import BusinessIcon from '@mui/icons-material/Business';
import PeopleIcon from '@mui/icons-material/People';
import StorageIcon from '@mui/icons-material/Storage';
import SpeedIcon from '@mui/icons-material/Speed';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

const mockTenants = [
    { id: 1, name: 'Acme Corp', domain: 'acme.lms.com', users: 1250, status: 'active', plan: 'Enterprise' },
    { id: 2, name: 'TechStart Inc', domain: 'techstart.lms.com', users: 85, status: 'active', plan: 'Pro' },
    { id: 3, name: 'EduLearn', domain: 'edulearn.lms.com', users: 3400, status: 'active', plan: 'Enterprise' },
    { id: 4, name: 'Demo Tenant', domain: 'demo.lms.com', users: 10, status: 'trial', plan: 'Free' },
];

const stats = [
    { label: 'Total Tenants', value: 4, icon: <BusinessIcon />, color: 'primary' },
    { label: 'Total Users', value: '4,745', icon: <PeopleIcon />, color: 'success' },
    { label: 'Storage Used', value: '128 GB', icon: <StorageIcon />, color: 'warning' },
    { label: 'System Load', value: '23%', icon: <SpeedIcon />, color: 'info' },
];

export default function SuperAdminDashboard() {
    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" fontWeight={700}>SuperAdmin Dashboard</Typography>
                <Button variant="contained" color="error" startIcon={<AddIcon />}>New Tenant</Button>
            </Box>

            {/* Stats */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {stats.map((stat) => (
                    <Grid item xs={6} md={3} key={stat.label}>
                        <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${stat.color}.lighter`, color: `${stat.color}.main` }}>
                                {stat.icon}
                            </Box>
                            <Box>
                                <Typography variant="h5" fontWeight={700}>{stat.value}</Typography>
                                <Typography variant="body2" color="text.secondary">{stat.label}</Typography>
                            </Box>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {/* System Health */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>System Health</Typography>
                            {[
                                { name: 'Database', status: 'healthy', latency: '12ms' },
                                { name: 'Redis', status: 'healthy', latency: '2ms' },
                                { name: 'Job Queue', status: 'healthy', jobs: '23 pending' },
                                { name: 'Storage', status: 'healthy', usage: '128/500 GB' },
                            ].map((service) => (
                                <Box key={service.name} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CheckCircleIcon color="success" fontSize="small" />
                                        <Typography>{service.name}</Typography>
                                    </Box>
                                    <Typography variant="body2" color="text.secondary">
                                        {service.latency || service.jobs || service.usage}
                                    </Typography>
                                </Box>
                            ))}
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Recent Activity</Typography>
                            {[
                                { action: 'Tenant "Acme Corp" upgraded to Enterprise', time: '2 hours ago' },
                                { action: 'New tenant "Demo Tenant" created', time: '1 day ago' },
                                { action: 'User limit increased for TechStart Inc', time: '2 days ago' },
                                { action: 'System backup completed', time: '3 days ago' },
                            ].map((activity, i) => (
                                <Box key={i} sx={{ py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
                                    <Typography variant="body2">{activity.action}</Typography>
                                    <Typography variant="caption" color="text.secondary">{activity.time}</Typography>
                                </Box>
                            ))}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Tenants Table */}
            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>All Tenants</Typography>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Tenant</TableCell>
                                    <TableCell>Domain</TableCell>
                                    <TableCell>Users</TableCell>
                                    <TableCell>Plan</TableCell>
                                    <TableCell>Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {mockTenants.map((tenant) => (
                                    <TableRow key={tenant.id} hover sx={{ cursor: 'pointer' }}>
                                        <TableCell><Typography fontWeight={500}>{tenant.name}</Typography></TableCell>
                                        <TableCell>{tenant.domain}</TableCell>
                                        <TableCell>{tenant.users.toLocaleString()}</TableCell>
                                        <TableCell><Chip label={tenant.plan} size="small" variant="outlined" /></TableCell>
                                        <TableCell><Chip label={tenant.status} size="small" color={tenant.status === 'active' ? 'success' : 'warning'} /></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>
        </Box>
    );
}
