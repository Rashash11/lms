'use client';

import React from 'react';
import { Box, Typography, Paper, Button, Card, CardContent, Chip, Avatar } from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import VideoCallIcon from '@mui/icons-material/VideoCall';

const sessions = [
    { id: '1', title: 'JavaScript Workshop', course: 'Advanced JavaScript', date: 'Dec 20, 2024', time: '10:00 AM - 12:00 PM', instructor: 'Dr. Jane Smith', type: 'online', status: 'upcoming' },
    { id: '2', title: 'React Q&A Session', course: 'React Fundamentals', date: 'Dec 22, 2024', time: '2:00 PM - 3:30 PM', instructor: 'Prof. Bob Johnson', type: 'online', status: 'upcoming' },
    { id: '3', title: 'Node.js Live Coding', course: 'Node.js Backend', date: 'Dec 10, 2024', time: '11:00 AM - 1:00 PM', instructor: 'Dr. Jane Smith', type: 'online', status: 'completed' },
];

export default function LearnerILTPage() {
    const upcoming = sessions.filter(s => s.status === 'upcoming');
    const past = sessions.filter(s => s.status === 'completed');

    return (
        <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>ILT Sessions</Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                    <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ p: 1, borderRadius: 1, bgcolor: 'primary.lighter', color: 'primary.main' }}>
                            <EventIcon />
                        </Box>
                        <Box>
                            <Typography variant="h5" fontWeight={700}>{upcoming.length}</Typography>
                            <Typography variant="caption" color="text.secondary">Upcoming Sessions</Typography>
                        </Box>
                    </Paper>
                </Grid>
                <Grid item xs={6}>
                    <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ p: 1, borderRadius: 1, bgcolor: 'success.lighter', color: 'success.main' }}>
                            <AccessTimeIcon />
                        </Box>
                        <Box>
                            <Typography variant="h5" fontWeight={700}>{past.length}</Typography>
                            <Typography variant="caption" color="text.secondary">Attended</Typography>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {upcoming.length > 0 && (
                <>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Upcoming Sessions</Typography>
                    <Grid container spacing={2} sx={{ mb: 4 }}>
                        {upcoming.map((session) => (
                            <Grid item xs={12} md={6} key={session.id}>
                                <Card>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                            <Typography variant="h6">{session.title}</Typography>
                                            <Chip label={session.type} size="small" color="info" />
                                        </Box>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>{session.course}</Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                            <EventIcon fontSize="small" color="action" />
                                            <Typography variant="body2">{session.date}</Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                            <AccessTimeIcon fontSize="small" color="action" />
                                            <Typography variant="body2">{session.time}</Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                            <Avatar sx={{ width: 24, height: 24, fontSize: 10 }}>
                                                {session.instructor.split(' ').map(n => n[0]).join('')}
                                            </Avatar>
                                            <Typography variant="body2">{session.instructor}</Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Button variant="contained" startIcon={<VideoCallIcon />} fullWidth>Join Session</Button>
                                            <Button variant="outlined" fullWidth>Add to Calendar</Button>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </>
            )}

            {past.length > 0 && (
                <>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Past Sessions</Typography>
                    {past.map((session) => (
                        <Paper key={session.id} sx={{ p: 2, mb: 1, bgcolor: 'grey.50' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography fontWeight={500}>{session.title}</Typography>
                                    <Typography variant="caption" color="text.secondary">{session.date} • {session.course}</Typography>
                                </Box>
                                <Chip label="Attended" size="small" color="success" />
                            </Box>
                        </Paper>
                    ))}
                </>
            )}
        </Box>
    );
}
