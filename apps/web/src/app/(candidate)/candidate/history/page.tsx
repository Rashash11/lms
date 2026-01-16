'use client';

import React from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

const history = [
    { id: '1', exam: 'Node.js Backend Exam', date: 'Dec 10, 2024', score: 85, grade: 'Pass', duration: '95 min' },
    { id: '2', exam: 'Python Basics Test', date: 'Nov 28, 2024', score: 72, grade: 'Pass', duration: '40 min' },
    { id: '3', exam: 'SQL Fundamentals', date: 'Nov 10, 2024', score: 58, grade: 'Fail', duration: '55 min' },
];

export default function CandidateHistoryPage() {
    return (
        <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>Exam History</Typography>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead><TableRow>
                        <TableCell>Exam</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell align="center">Score</TableCell>
                        <TableCell>Grade</TableCell>
                        <TableCell>Duration</TableCell>
                    </TableRow></TableHead>
                    <TableBody>
                        {history.map((exam) => (
                            <TableRow key={exam.id}>
                                <TableCell><Typography fontWeight={500}>{exam.exam}</Typography></TableCell>
                                <TableCell>{exam.date}</TableCell>
                                <TableCell align="center">
                                    <Typography fontWeight={600} color={exam.score >= 70 ? 'success.main' : 'error.main'}>
                                        {exam.score}%
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={exam.grade}
                                        size="small"
                                        color={exam.grade === 'Pass' ? 'success' : 'error'}
                                        icon={exam.grade === 'Pass' ? <CheckCircleIcon /> : <CancelIcon />}
                                    />
                                </TableCell>
                                <TableCell>{exam.duration}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}
