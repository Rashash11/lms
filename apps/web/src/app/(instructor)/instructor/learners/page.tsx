'use client';

import React from 'react';
import { Box, Typography, Paper, Card, CardContent, Button, Chip, Avatar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, LinearProgress } from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import PeopleIcon from '@mui/icons-material/People';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const learners = [
    { id: '1', name: 'John Doe', email: 'john@example.com', enrolled: 3, completed: 2, progress: 85, lastActive: '2 hours ago' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', enrolled: 2, completed: 1, progress: 65, lastActive: '1 day ago' },
    { id: '3', name: 'Bob Johnson', email: 'bob@example.com', enrolled: 4, completed: 3, progress: 92, lastActive: '30 min ago' },
    { id: '4', name: 'Alice Brown', email: 'alice@example.com', enrolled: 2, completed: 0, progress: 25, lastActive: '3 days ago' },
];

export default function InstructorLearnersPage() {
    return (
        <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>My Learners</Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                    { label: 'Total Learners', value: learners.length, icon: <PeopleIcon />, color: 'primary' },
                    { label: 'Avg. Progress', value: '67%', icon: <TrendingUpIcon />, color: 'info' },
                    { label: 'Completed', value: learners.filter(l => l.progress === 100).length, icon: <CheckCircleIcon />, color: 'success' },
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
                        <TableCell>Learner</TableCell>
                        <TableCell align="center">Enrolled</TableCell>
                        <TableCell align="center">Completed</TableCell>
                        <TableCell>Progress</TableCell>
                        <TableCell>Last Active</TableCell>
                        <TableCell align="right">Action</TableCell>
                    </TableRow></TableHead>
                    <TableBody>
                        {learners.map((learner) => (
                            <TableRow key={learner.id}>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Avatar sx={{ width: 32, height: 32, fontSize: 12 }}>
                                            {learner.name.split(' ').map(n => n[0]).join('')}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="body2" fontWeight={500}>{learner.name}</Typography>
                                            <Typography variant="caption" color="text.secondary">{learner.email}</Typography>
                                        </Box>
                                    </Box>
                                </TableCell>
                                <TableCell align="center">{learner.enrolled}</TableCell>
                                <TableCell align="center">{learner.completed}</TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <LinearProgress variant="determinate" value={learner.progress} sx={{ flex: 1, height: 6, borderRadius: 3 }} />
                                        <Typography variant="caption" fontWeight={600}>{learner.progress}%</Typography>
                                    </Box>
                                </TableCell>
                                <TableCell>{learner.lastActive}</TableCell>
                                <TableCell align="right"><Button size="small">View Details</Button></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}
