'use client';

import React from 'react';
import { Box, Typography, Paper, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, TextField, InputAdornment, IconButton } from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import SearchIcon from '@mui/icons-material/Search';
import ForumIcon from '@mui/icons-material/Forum';
import PeopleIcon from '@mui/icons-material/People';
import ReportIcon from '@mui/icons-material/Report';
import DeleteIcon from '@mui/icons-material/Delete';
import LockIcon from '@mui/icons-material/Lock';
import PushPinIcon from '@mui/icons-material/PushPin';

const discussions = [
    { id: '1', title: 'JavaScript Best Practices', author: 'John Doe', course: 'Advanced JavaScript', replies: 23, status: 'active' },
    { id: '2', title: 'React vs Vue debate', author: 'Jane Smith', course: 'React Fundamentals', replies: 56, status: 'active' },
    { id: '3', title: 'Question about homework', author: 'Bob Johnson', course: 'Node.js Backend', replies: 5, status: 'locked' },
    { id: '4', title: 'Important Announcement', author: 'Admin', course: 'General', replies: 0, status: 'pinned' },
];

export default function DiscussionsPage() {
    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight="bold">Discussions</Typography>
            </Box>

            <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                    { label: 'Total Threads', value: discussions.length, icon: <ForumIcon />, color: 'primary' },
                    { label: 'Active', value: discussions.filter(d => d.status === 'active').length, icon: <PeopleIcon />, color: 'success' },
                    { label: 'Reported', value: 0, icon: <ReportIcon />, color: 'error' },
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

            <Paper sx={{ p: 2, mb: 2 }}>
                <TextField
                    size="small"
                    placeholder="Search discussions..."
                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
                    sx={{ width: 300 }}
                />
            </Paper>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead><TableRow>
                        <TableCell>Thread</TableCell>
                        <TableCell>Course</TableCell>
                        <TableCell>Author</TableCell>
                        <TableCell align="center">Replies</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Actions</TableCell>
                    </TableRow></TableHead>
                    <TableBody>
                        {discussions.map((thread) => (
                            <TableRow key={thread.id}>
                                <TableCell><Typography fontWeight={500}>{thread.title}</Typography></TableCell>
                                <TableCell>{thread.course}</TableCell>
                                <TableCell>{thread.author}</TableCell>
                                <TableCell align="center">{thread.replies}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={thread.status}
                                        size="small"
                                        color={thread.status === 'active' ? 'success' : thread.status === 'pinned' ? 'info' : 'default'}
                                    />
                                </TableCell>
                                <TableCell align="right">
                                    <IconButton size="small"><PushPinIcon fontSize="small" /></IconButton>
                                    <IconButton size="small"><LockIcon fontSize="small" /></IconButton>
                                    <IconButton size="small" color="error"><DeleteIcon fontSize="small" /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}
