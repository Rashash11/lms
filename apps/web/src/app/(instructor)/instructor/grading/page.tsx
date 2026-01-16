'use client';

import React, { useState } from 'react';
import {
    Box, Typography, Card, CardContent, Button, Chip, Paper,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TextField, InputAdornment, FormControl, InputLabel, Select, MenuItem,
    IconButton, Avatar, Tabs, Tab, Badge, LinearProgress,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import GradingIcon from '@mui/icons-material/Grading';
import AssignmentIcon from '@mui/icons-material/Assignment';
import QuizIcon from '@mui/icons-material/Quiz';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

interface GradingItem {
    id: string;
    type: 'assignment' | 'essay';
    studentName: string;
    courseName: string;
    title: string;
    submittedAt: string;
    status: 'pending' | 'graded';
    score?: number;
    maxScore: number;
}

const gradingItems: GradingItem[] = [
    { id: '1', type: 'assignment', studentName: 'John Doe', courseName: 'Advanced JavaScript', title: 'Async Patterns Project', submittedAt: '2 hours ago', status: 'pending', maxScore: 100 },
    { id: '2', type: 'essay', studentName: 'Jane Smith', courseName: 'React Fundamentals', title: 'Component Design Essay', submittedAt: '5 hours ago', status: 'pending', maxScore: 50 },
    { id: '3', type: 'assignment', studentName: 'Bob Johnson', courseName: 'Node.js Backend', title: 'REST API Implementation', submittedAt: '1 day ago', status: 'pending', maxScore: 100 },
    { id: '4', type: 'essay', studentName: 'Alice Brown', courseName: 'Advanced JavaScript', title: 'Closure Explanation', submittedAt: '1 day ago', status: 'graded', score: 42, maxScore: 50 },
    { id: '5', type: 'assignment', studentName: 'Charlie Wilson', courseName: 'React Fundamentals', title: 'Todo App Project', submittedAt: '2 days ago', status: 'graded', score: 85, maxScore: 100 },
];

export default function GradingHubPage() {
    const [filter, setFilter] = useState('pending');
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');

    const pendingCount = gradingItems.filter(i => i.status === 'pending').length;
    const gradedCount = gradingItems.filter(i => i.status === 'graded').length;

    const filteredItems = gradingItems.filter(item => {
        const matchesSearch = item.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filter === 'all' || item.status === filter;
        const matchesType = typeFilter === 'all' || item.type === typeFilter;
        return matchesSearch && matchesStatus && matchesType;
    });

    return (
        <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>Grading Hub</Typography>

            {/* Stats */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                    { label: 'Pending', value: pendingCount, color: 'warning', icon: <AccessTimeIcon /> },
                    { label: 'Graded', value: gradedCount, color: 'success', icon: <GradingIcon /> },
                    { label: 'Assignments', value: gradingItems.filter(i => i.type === 'assignment').length, color: 'primary', icon: <AssignmentIcon /> },
                    { label: 'Essays', value: gradingItems.filter(i => i.type === 'essay').length, color: 'info', icon: <QuizIcon /> },
                ].map((stat) => (
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

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth size="small" placeholder="Search students or submissions..."
                            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
                        />
                    </Grid>
                    <Grid item xs={6} md={2}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Type</InputLabel>
                            <Select value={typeFilter} label="Type" onChange={(e) => setTypeFilter(e.target.value)}>
                                <MenuItem value="all">All Types</MenuItem>
                                <MenuItem value="assignment">Assignments</MenuItem>
                                <MenuItem value="essay">Essays</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={6} md={4}>
                        <Tabs value={filter} onChange={(_, v) => setFilter(v)}>
                            <Tab label={<Badge badgeContent={pendingCount} color="warning">Pending</Badge>} value="pending" />
                            <Tab label="Graded" value="graded" />
                            <Tab label="All" value="all" />
                        </Tabs>
                    </Grid>
                </Grid>
            </Paper>

            {/* Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Student</TableCell>
                            <TableCell>Submission</TableCell>
                            <TableCell>Course</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Submitted</TableCell>
                            <TableCell align="center">Score</TableCell>
                            <TableCell align="right">Action</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredItems.map((item) => (
                            <TableRow key={item.id} hover>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Avatar sx={{ width: 32, height: 32, fontSize: 12 }}>
                                            {item.studentName.split(' ').map(n => n[0]).join('')}
                                        </Avatar>
                                        <Typography variant="body2">{item.studentName}</Typography>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" fontWeight={500}>{item.title}</Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="caption" color="text.secondary">{item.courseName}</Typography>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={item.type}
                                        size="small"
                                        color={item.type === 'assignment' ? 'primary' : 'info'}
                                        variant="outlined"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Typography variant="caption">{item.submittedAt}</Typography>
                                </TableCell>
                                <TableCell align="center">
                                    {item.status === 'graded' ? (
                                        <Typography fontWeight={600} color={item.score! / item.maxScore >= 0.7 ? 'success.main' : 'error.main'}>
                                            {item.score}/{item.maxScore}
                                        </Typography>
                                    ) : '-'}
                                </TableCell>
                                <TableCell align="right">
                                    <Button
                                        variant={item.status === 'pending' ? 'contained' : 'outlined'}
                                        size="small"
                                        color={item.status === 'pending' ? 'warning' : 'inherit'}
                                    >
                                        {item.status === 'pending' ? 'Grade' : 'View'}
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}
