'use client';

import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, TextField, InputAdornment, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Chip, CircularProgress,
    Button
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import WarningIcon from '@mui/icons-material/Warning';

interface Assignment {
    id: string;
    title: string;
    description: string | null;
    courseId: string | null;
    dueAt: string | null;
    course?: {
        title: string;
        code: string;
    };
}

interface Submission {
    id: string;
    assignmentId: string;
    assignmentTitle?: string;
    status: string;
    score: number | null;
}

export default function LearnerAssignmentsPage() {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            if (process.env.NEXT_PUBLIC_CLIENT_DEBUG === '1') {
                console.log('[Learner Assignments] Fetching assignments...');
            }
            const [assignmentsRes, submissionsRes] = await Promise.all([
                fetch('/api/assignments'),
                fetch('/api/submissions') // Returns own submissions
            ]);

            if (assignmentsRes.ok) {
                const data = await assignmentsRes.json();
                if (process.env.NEXT_PUBLIC_CLIENT_DEBUG === '1') {
                    console.log('[Learner Assignments] Assignments received:', data);
                }
            } else {
                console.error('[Learner Assignments] Failed to fetch assignments:', assignmentsRes.status);
            }

            if (submissionsRes.ok) {
                const data = await submissionsRes.json();
                if (process.env.NEXT_PUBLIC_CLIENT_DEBUG === '1') {
                    console.log('[Learner Assignments] Submissions received:', data);
                }
                setSubmissions(data);
            }
        } catch (err) {
            console.error('[Learner Assignments] Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const getSubmissionStatus = (assignmentId: string) => {
        // Match submissions by assignment ID
        const sub = submissions.find(s => s.assignmentId === assignmentId);
        if (sub) {
            return { status: sub.status, score: sub.score };
        }
        return null;
    };

    const filtered = assignments.filter(a =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.course?.title.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <AssignmentOutlinedIcon fontSize="large" color="primary" />
                    My Assignments
                </Typography>
            </Box>

            <Paper sx={{ width: '100%', mb: 2 }}>
                <Box sx={{ p: 2 }}>
                    <TextField
                        placeholder="Search assignments..."
                        size="small"
                        fullWidth
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Assignment</TableCell>
                                <TableCell>Course</TableCell>
                                <TableCell>Due Date</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Score</TableCell>
                                <TableCell align="right">Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={6} align="center"><CircularProgress /></TableCell></TableRow>
                            ) : filtered.length === 0 ? (
                                <TableRow><TableCell colSpan={6} align="center">No assignments found</TableCell></TableRow>
                            ) : (
                                filtered.map((a) => {
                                    const subInfo = getSubmissionStatus(a.id);
                                    const status = subInfo ? subInfo.status : 'PENDING';
                                    const isLate = a.dueAt && new Date(a.dueAt) < new Date() && status === 'PENDING';

                                    return (
                                        <TableRow key={a.id} hover>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={500}>{a.title}</Typography>
                                                {a.description && (
                                                    <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 300, display: 'block' }}>
                                                        {a.description}
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {a.course ? (
                                                    <Chip label={a.course.title} size="small" variant="outlined" />
                                                ) : (
                                                    <Typography variant="caption" color="text.secondary">N/A</Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Typography color={isLate ? 'error' : 'inherit'}>
                                                    {a.dueAt ? new Date(a.dueAt).toLocaleDateString() : 'No limit'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                {status === 'GRADED' && <Chip icon={<CheckCircleIcon />} label="Graded" color="success" size="small" />}
                                                {status === 'SUBMITTED' && <Chip icon={<CheckCircleIcon />} label="Submitted" color="primary" size="small" />}
                                                {status === 'PENDING' && isLate && <Chip icon={<WarningIcon />} label="Overdue" color="error" size="small" />}
                                                {status === 'PENDING' && !isLate && <Chip icon={<PendingIcon />} label="Pending" size="small" />}
                                            </TableCell>
                                            <TableCell>
                                                {subInfo?.score !== undefined && subInfo.score !== null ? (
                                                    <Typography fontWeight="bold">{subInfo.score} / 100</Typography>
                                                ) : '-'}
                                            </TableCell>
                                            <TableCell align="right">
                                                <Button
                                                    size="small"
                                                    variant={status === 'PENDING' ? 'contained' : 'outlined'}
                                                    href={`/learner/assignments/${a.id}`}
                                                >
                                                    {status === 'PENDING' ? 'Submit' : 'View'}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
}
