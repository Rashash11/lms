'use client';

import React from 'react';
import { Box, Typography, Paper, Button, Card, CardContent, Chip, Avatar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import EventIcon from '@mui/icons-material/Event';
import PeopleIcon from '@mui/icons-material/People';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const sessions = [
    { id: '1', title: 'JavaScript Workshop', course: 'Advanced JavaScript', date: 'Dec 20, 2024', time: '10:00 AM', attendees: 15, maxAttendees: 25, status: 'upcoming' },
    { id: '2', title: 'React Q&A Session', course: 'React Fundamentals', date: 'Dec 22, 2024', time: '2:00 PM', attendees: 28, maxAttendees: 30, status: 'upcoming' },
    { id: '3', title: 'Node.js Live Coding', course: 'Node.js Backend', date: 'Dec 10, 2024', time: '11:00 AM', attendees: 18, maxAttendees: 20, status: 'completed' },
];

export default function InstructorILTPage() {
    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight="bold">ILT Sessions</Typography>
                <Button variant="contained" color="success" startIcon={<AddIcon />}>Create Session</Button>
            </Box>

            <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                    { label: 'Upcoming', value: sessions.filter(s => s.status === 'upcoming').length, icon: <EventIcon />, color: 'primary' },
                    { label: 'Total Attendees', value: sessions.reduce((s, sess) => s + sess.attendees, 0), icon: <PeopleIcon />, color: 'success' },
                    { label: 'Completed', value: sessions.filter(s => s.status === 'completed').length, icon: <CheckCircleIcon />, color: 'info' },
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
                        <TableCell>Session</TableCell>
                        <TableCell>Course</TableCell>
                        <TableCell>Date & Time</TableCell>
                        <TableCell align="center">Attendees</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Actions</TableCell>
                    </TableRow></TableHead>
                    <TableBody>
                        {sessions.map((session) => (
                            <TableRow key={session.id}>
                                <TableCell><Typography fontWeight={500}>{session.title}</Typography></TableCell>
                                <TableCell>{session.course}</TableCell>
                                <TableCell>{session.date} at {session.time}</TableCell>
                                <TableCell align="center">{session.attendees}/{session.maxAttendees}</TableCell>
                                <TableCell>
                                    <Chip label={session.status} size="small" color={session.status === 'upcoming' ? 'primary' : 'success'} />
                                </TableCell>
                                <TableCell align="right">
                                    {session.status === 'upcoming' ? (
                                        <Button size="small" startIcon={<EditIcon />}>Manage</Button>
                                    ) : (
                                        <Button size="small">Attendance</Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}
