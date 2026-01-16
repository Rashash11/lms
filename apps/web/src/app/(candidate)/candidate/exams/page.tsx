'use client';

import React from 'react';
import {
    Box, Typography, Card, CardContent, Button, Chip, Paper,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, LinearProgress,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import QuizIcon from '@mui/icons-material/Quiz';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import VisibilityIcon from '@mui/icons-material/Visibility';

interface Exam {
    id: string;
    title: string;
    duration: string;
    questions: number;
    attempts: { used: number; max: number };
    status: 'available' | 'in_progress' | 'completed' | 'expired';
    score?: number;
    grade?: string;
    completedAt?: string;
    window?: { start: string; end: string };
    proctored: boolean;
}

const myExams: Exam[] = [
    { id: '1', title: 'Advanced JavaScript Certification', duration: '90 min', questions: 50, attempts: { used: 0, max: 2 }, status: 'available', window: { start: 'Dec 18', end: 'Dec 25' }, proctored: true },
    { id: '2', title: 'React Developer Assessment', duration: '60 min', questions: 40, attempts: { used: 1, max: 3 }, status: 'available', window: { start: 'Dec 15', end: 'Dec 22' }, proctored: true },
    { id: '3', title: 'Node.js Backend Exam', duration: '120 min', questions: 60, attempts: { used: 1, max: 1 }, status: 'completed', score: 85, grade: 'Pass', completedAt: 'Dec 10', proctored: false },
    { id: '4', title: 'Python Basics Test', duration: '45 min', questions: 30, attempts: { used: 1, max: 1 }, status: 'completed', score: 72, grade: 'Pass', completedAt: 'Nov 28', proctored: false },
    { id: '5', title: 'SQL Fundamentals', duration: '60 min', questions: 40, attempts: { used: 0, max: 1 }, status: 'expired', window: { start: 'Nov 1', end: 'Nov 15' }, proctored: false },
];

export default function ExamsPage() {
    const availableExams = myExams.filter(e => e.status === 'available');
    const completedExams = myExams.filter(e => e.status === 'completed');
    const expiredExams = myExams.filter(e => e.status === 'expired');

    return (
        <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>My Exams</Typography>

            {/* Stats */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                    { label: 'Available', value: availableExams.length, color: 'primary', icon: <QuizIcon /> },
                    { label: 'Completed', value: completedExams.length, color: 'success', icon: <CheckCircleIcon /> },
                    { label: 'Expired', value: expiredExams.length, color: 'error', icon: <AccessTimeIcon /> },
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

            {/* Available Exams */}
            {availableExams.length > 0 && (
                <>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Available Exams</Typography>
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        {availableExams.map((exam) => (
                            <Grid item xs={12} md={6} key={exam.id}>
                                <Card>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                            <Typography variant="h6" fontWeight={600}>{exam.title}</Typography>
                                            {exam.proctored && <Chip label="Proctored" size="small" color="secondary" />}
                                        </Box>
                                        <Grid container spacing={2} sx={{ mb: 2 }}>
                                            <Grid item xs={4}>
                                                <Typography variant="caption" color="text.secondary">Duration</Typography>
                                                <Typography variant="body2" fontWeight={500}>{exam.duration}</Typography>
                                            </Grid>
                                            <Grid item xs={4}>
                                                <Typography variant="caption" color="text.secondary">Questions</Typography>
                                                <Typography variant="body2" fontWeight={500}>{exam.questions}</Typography>
                                            </Grid>
                                            <Grid item xs={4}>
                                                <Typography variant="caption" color="text.secondary">Attempts</Typography>
                                                <Typography variant="body2" fontWeight={500}>{exam.attempts.used}/{exam.attempts.max}</Typography>
                                            </Grid>
                                        </Grid>
                                        <Box sx={{ bgcolor: 'grey.100', p: 1.5, borderRadius: 1, mb: 2 }}>
                                            <Typography variant="caption" color="text.secondary">Available: {exam.window?.start} - {exam.window?.end}</Typography>
                                        </Box>
                                        <Button variant="contained" fullWidth startIcon={<PlayArrowIcon />} color="secondary">
                                            {exam.attempts.used > 0 ? 'Retake Exam' : 'Start Exam'}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </>
            )}

            {/* Completed Exams */}
            {completedExams.length > 0 && (
                <>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Completed Exams</Typography>
                    <TableContainer component={Paper} sx={{ mb: 4 }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Exam</TableCell>
                                    <TableCell>Completed</TableCell>
                                    <TableCell align="center">Score</TableCell>
                                    <TableCell align="center">Grade</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {completedExams.map((exam) => (
                                    <TableRow key={exam.id}>
                                        <TableCell><Typography fontWeight={500}>{exam.title}</Typography></TableCell>
                                        <TableCell>{exam.completedAt}</TableCell>
                                        <TableCell align="center">
                                            <Typography fontWeight={600} color={exam.score! >= 70 ? 'success.main' : 'error.main'}>
                                                {exam.score}%
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip label={exam.grade} size="small" color={exam.grade === 'Pass' ? 'success' : 'error'} />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Button size="small" startIcon={<VisibilityIcon />}>View Results</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </>
            )}

            {/* Expired */}
            {expiredExams.length > 0 && (
                <>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }} color="text.secondary">Expired</Typography>
                    <Paper sx={{ p: 2, bgcolor: 'grey.100' }}>
                        {expiredExams.map((exam) => (
                            <Box key={exam.id} sx={{ py: 1 }}>
                                <Typography color="text.secondary">{exam.title}</Typography>
                                <Typography variant="caption" color="text.secondary">Expired on {exam.window?.end}</Typography>
                            </Box>
                        ))}
                    </Paper>
                </>
            )}
        </Box>
    );
}
