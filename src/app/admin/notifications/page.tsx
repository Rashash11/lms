'use client';

import React from 'react';
import { Box, Typography, Paper, Button, Card, CardContent, Alert, Chip } from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import AddIcon from '@mui/icons-material/Add';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import EmailIcon from '@mui/icons-material/Email';
import ScheduleIcon from '@mui/icons-material/Schedule';

const templates = [
    { id: '1', name: 'Welcome Email', trigger: 'User Registration', status: 'active' },
    { id: '2', name: 'Course Enrollment', trigger: 'Enrollment', status: 'active' },
    { id: '3', name: 'Completion Notification', trigger: 'Course Completion', status: 'active' },
    { id: '4', name: 'Expiration Reminder', trigger: 'Before Expiration', status: 'active' },
    { id: '5', name: 'Certificate Issued', trigger: 'Certificate Issue', status: 'draft' },
];

export default function NotificationsPage() {
    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight="bold">Notifications</Typography>
                <Button variant="contained" startIcon={<AddIcon />}>Create Template</Button>
            </Box>

            <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                    { label: 'Templates', value: templates.length, icon: <EmailIcon />, color: 'primary' },
                    { label: 'Active', value: templates.filter(t => t.status === 'active').length, icon: <NotificationsActiveIcon />, color: 'success' },
                    { label: 'Scheduled', value: 3, icon: <ScheduleIcon />, color: 'info' },
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

            <Alert severity="info" sx={{ mb: 3 }}>
                Notification templates use smart tags like {'{{user.name}}'}, {'{{course.title}}'}, and {'{{enrollment.expiresAt}}'}.
            </Alert>

            <Grid container spacing={2}>
                {templates.map((template) => (
                    <Grid item xs={12} sm={6} md={4} key={template.id}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="h6">{template.name}</Typography>
                                    <Chip label={template.status} size="small" color={template.status === 'active' ? 'success' : 'default'} />
                                </Box>
                                <Typography variant="body2" color="text.secondary" gutterBottom>Trigger: {template.trigger}</Typography>
                                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                                    <Button size="small" fullWidth>Edit</Button>
                                    <Button size="small" fullWidth variant="outlined">Preview</Button>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}
