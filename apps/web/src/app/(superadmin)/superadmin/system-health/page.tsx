'use client';

import React from 'react';
import { Box, Typography, Paper, Card, CardContent, Chip, LinearProgress, Button } from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import StorageIcon from '@mui/icons-material/Storage';
import SpeedIcon from '@mui/icons-material/Speed';
import MemoryIcon from '@mui/icons-material/Memory';
import RefreshIcon from '@mui/icons-material/Refresh';

interface ServiceStatus {
    name: string;
    status: 'healthy' | 'warning' | 'error';
    details: string;
    latency?: string;
    uptime?: string;
}

const services: ServiceStatus[] = [
    { name: 'PostgreSQL Database', status: 'healthy', details: 'Connected, 23 active connections', latency: '12ms', uptime: '99.99%' },
    { name: 'Redis Cache', status: 'healthy', details: 'Memory: 256MB / 1GB', latency: '2ms', uptime: '99.99%' },
    { name: 'BullMQ Job Queue', status: 'healthy', details: '23 pending, 156 completed today', latency: 'N/A', uptime: '99.95%' },
    { name: 'File Storage', status: 'healthy', details: '128 GB / 500 GB used', latency: '45ms', uptime: '99.99%' },
    { name: 'Email Service', status: 'warning', details: 'Rate limit approaching (85%)', latency: '120ms', uptime: '99.50%' },
    { name: 'External APIs', status: 'healthy', details: 'All integrations responding', latency: '89ms', uptime: '99.80%' },
];

const metrics = [
    { label: 'CPU Usage', value: 23, max: 100, unit: '%', color: 'success' },
    { label: 'Memory', value: 4.2, max: 8, unit: 'GB', color: 'info' },
    { label: 'Disk I/O', value: 45, max: 100, unit: '%', color: 'success' },
    { label: 'Network', value: 12, max: 100, unit: 'Mbps', color: 'success' },
];

export default function SystemHealthPage() {
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'healthy': return <CheckCircleIcon color="success" />;
            case 'warning': return <WarningIcon color="warning" />;
            case 'error': return <ErrorIcon color="error" />;
            default: return null;
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight="bold">System Health</Typography>
                <Button variant="outlined" startIcon={<RefreshIcon />}>Refresh</Button>
            </Box>

            {/* Overall Status */}
            <Paper sx={{ p: 3, mb: 3, bgcolor: 'success.lighter', display: 'flex', alignItems: 'center', gap: 2 }}>
                <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main' }} />
                <Box>
                    <Typography variant="h5" fontWeight={600} color="success.main">All Systems Operational</Typography>
                    <Typography variant="body2">Last checked: Just now</Typography>
                </Box>
            </Paper>

            {/* Resource Metrics */}
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Resource Metrics</Typography>
            <Grid container spacing={2} sx={{ mb: 4 }}>
                {metrics.map((metric) => (
                    <Grid item xs={6} md={3} key={metric.label}>
                        <Paper sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2" color="text.secondary">{metric.label}</Typography>
                                <Typography variant="body2" fontWeight={600}>{metric.value}{metric.unit}</Typography>
                            </Box>
                            <LinearProgress
                                variant="determinate"
                                value={(metric.value / metric.max) * 100}
                                sx={{ height: 8, borderRadius: 4 }}
                                color={metric.color as any}
                            />
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {/* Services */}
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Services</Typography>
            <Grid container spacing={2}>
                {services.map((service) => (
                    <Grid item xs={12} md={6} key={service.name}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                    {getStatusIcon(service.status)}
                                    <Typography variant="h6">{service.name}</Typography>
                                    <Chip
                                        label={service.status}
                                        size="small"
                                        color={service.status === 'healthy' ? 'success' : service.status === 'warning' ? 'warning' : 'error'}
                                        sx={{ ml: 'auto' }}
                                    />
                                </Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{service.details}</Typography>
                                <Box sx={{ display: 'flex', gap: 3 }}>
                                    <Typography variant="caption">Latency: <strong>{service.latency}</strong></Typography>
                                    <Typography variant="caption">Uptime: <strong>{service.uptime}</strong></Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}
