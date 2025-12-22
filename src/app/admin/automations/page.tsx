'use client';

import React from 'react';
import { Box, Typography, Paper, Button, Card, CardContent, Chip, Switch, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import AddIcon from '@mui/icons-material/Add';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import HistoryIcon from '@mui/icons-material/History';

const automations = [
    { id: '1', name: 'Inactivity Warning', trigger: '30 days inactive', action: 'Send reminder email', status: 'active', runs: 156 },
    { id: '2', name: 'Auto-Enroll New Hires', trigger: 'User created with role', action: 'Enroll in Onboarding path', status: 'active', runs: 45 },
    { id: '3', name: 'Certificate Expiry', trigger: '30 days before expiry', action: 'Send reminder + re-enroll', status: 'active', runs: 23 },
    { id: '4', name: 'Completion Reward', trigger: 'Course completed', action: 'Assign badge', status: 'disabled', runs: 0 },
];

export default function AutomationsPage() {
    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight="bold">Automations</Typography>
                <Button variant="contained" startIcon={<AddIcon />}>Create Automation</Button>
            </Box>

            <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                    { label: 'Total Rules', value: automations.length, icon: <AutoFixHighIcon />, color: 'primary' },
                    { label: 'Active', value: automations.filter(a => a.status === 'active').length, icon: <PlayArrowIcon />, color: 'success' },
                    { label: 'Total Runs', value: automations.reduce((s, a) => s + a.runs, 0), icon: <HistoryIcon />, color: 'info' },
                ].map((stat) => (
                    <Grid item xs={4} key={stat.label}>
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

            <TableContainer component={Paper}>
                <Table>
                    <TableHead><TableRow>
                        <TableCell>Automation</TableCell>
                        <TableCell>Trigger</TableCell>
                        <TableCell>Action</TableCell>
                        <TableCell align="center">Runs</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Enabled</TableCell>
                    </TableRow></TableHead>
                    <TableBody>
                        {automations.map((rule) => (
                            <TableRow key={rule.id}>
                                <TableCell><Typography fontWeight={500}>{rule.name}</Typography></TableCell>
                                <TableCell>{rule.trigger}</TableCell>
                                <TableCell>{rule.action}</TableCell>
                                <TableCell align="center">{rule.runs}</TableCell>
                                <TableCell><Chip label={rule.status} size="small" color={rule.status === 'active' ? 'success' : 'default'} /></TableCell>
                                <TableCell align="right"><Switch checked={rule.status === 'active'} /></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}
