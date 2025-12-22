'use client';

import React, { useState } from 'react';
import {
    Box, Typography, Paper, Card, CardContent, Button, Chip,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TextField, InputAdornment, FormControl, InputLabel, Select, MenuItem,
    IconButton, Tabs, Tab,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import RefreshIcon from '@mui/icons-material/Refresh';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import QuizIcon from '@mui/icons-material/Quiz';
import CardMembershipIcon from '@mui/icons-material/CardMembership';

const reportTypes = [
    { id: 'user-progress', name: 'User Progress', icon: <PeopleIcon />, description: 'Track learner progress across courses' },
    { id: 'course-progress', name: 'Course Progress', icon: <SchoolIcon />, description: 'Course completion rates and statistics' },
    { id: 'quiz-results', name: 'Quiz Results', icon: <QuizIcon />, description: 'Test and quiz performance data' },
    { id: 'certificates', name: 'Certificates', icon: <CardMembershipIcon />, description: 'Issued certificates report' },
    { id: 'survey-results', name: 'Survey Results', icon: <AssessmentIcon />, description: 'Survey response analytics' },
];

const recentExports = [
    { name: 'User Progress - December 2024', date: 'Dec 18, 2024', format: 'XLSX', status: 'completed' },
    { name: 'Course Completions Q4', date: 'Dec 15, 2024', format: 'CSV', status: 'completed' },
    { name: 'Quiz Results - JavaScript', date: 'Dec 10, 2024', format: 'XLSX', status: 'completed' },
];

export default function ReportsPage() {
    const [selectedReport, setSelectedReport] = useState<string | null>(null);

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight="bold">Reports</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="outlined" startIcon={<CalendarMonthIcon />}>Schedule</Button>
                    <Button variant="contained" startIcon={<DownloadIcon />}>Export</Button>
                </Box>
            </Box>

            {/* Report Types */}
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Available Reports</Typography>
            <Grid container spacing={2} sx={{ mb: 4 }}>
                {reportTypes.map((report) => (
                    <Grid item xs={12} sm={6} md={4} key={report.id}>
                        <Card
                            sx={{
                                cursor: 'pointer',
                                border: selectedReport === report.id ? 2 : 1,
                                borderColor: selectedReport === report.id ? 'primary.main' : 'divider',
                                '&:hover': { borderColor: 'primary.main' }
                            }}
                            onClick={() => setSelectedReport(report.id)}
                        >
                            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'primary.lighter', color: 'primary.main' }}>
                                    {report.icon}
                                </Box>
                                <Box>
                                    <Typography variant="subtitle1" fontWeight={600}>{report.name}</Typography>
                                    <Typography variant="caption" color="text.secondary">{report.description}</Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Filters */}
            {selectedReport && (
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>Report Filters</Typography>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Date Range</InputLabel>
                                <Select defaultValue="last30" label="Date Range">
                                    <MenuItem value="last7">Last 7 Days</MenuItem>
                                    <MenuItem value="last30">Last 30 Days</MenuItem>
                                    <MenuItem value="last90">Last 90 Days</MenuItem>
                                    <MenuItem value="custom">Custom Range</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Branch</InputLabel>
                                <Select defaultValue="all" label="Branch">
                                    <MenuItem value="all">All Branches</MenuItem>
                                    <MenuItem value="main">Main</MenuItem>
                                    <MenuItem value="nyc">NYC</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Format</InputLabel>
                                <Select defaultValue="xlsx" label="Format">
                                    <MenuItem value="xlsx">Excel (XLSX)</MenuItem>
                                    <MenuItem value="csv">CSV</MenuItem>
                                    <MenuItem value="pdf">PDF</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Button variant="contained" fullWidth startIcon={<DownloadIcon />}>
                                Generate Report
                            </Button>
                        </Grid>
                    </Grid>
                </Paper>
            )}

            {/* Recent Exports */}
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Recent Exports</Typography>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Report Name</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell>Format</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="right">Action</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {recentExports.map((exp, i) => (
                            <TableRow key={i}>
                                <TableCell><Typography fontWeight={500}>{exp.name}</Typography></TableCell>
                                <TableCell>{exp.date}</TableCell>
                                <TableCell><Chip label={exp.format} size="small" variant="outlined" /></TableCell>
                                <TableCell><Chip label={exp.status} size="small" color="success" /></TableCell>
                                <TableCell align="right">
                                    <Button size="small" startIcon={<DownloadIcon />}>Download</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}
