'use client';

import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Tabs, Tab,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Skeleton, Chip, CircularProgress
} from '@mui/material';
import { usePermissions } from '@/hooks/usePermissions';
import { useApiError } from '@/hooks/useApiError';
import AccessDenied from '@/components/AccessDenied';

interface Submission {
    id: string;
    learnerId: string;
    courseId: string;
    unitId: string;
    content: any;
    submittedAt: string;
    status: string;
}

interface ILTSession {
    id: string;
    userId: string;
    sessionId: string;
    status: string;
}

export default function GradingHubPage() {
    const { can, loading: permissionsLoading } = usePermissions();
    const { handleResponse } = useApiError();
    const [accessDenied, setAccessDenied] = useState(false);

    const [tab, setTab] = useState(0);
    const [loading, setLoading] = useState(true);
    const [assignments, setAssignments] = useState<Submission[]>([]);
    const [iltSessions, setILTSessions] = useState<ILTSession[]>([]);

    useEffect(() => {
        fetchGradingData();
    }, [tab]);

    const fetchGradingData = async () => {
        setLoading(true);
        try {
            const tabType = tab === 0 ? 'assignments' : 'ilt';
            const res = await fetch(`/api/instructor/grading-hub?tab=${tabType}`);

            if (handleResponse(res)) {
                if (res.status === 403) setAccessDenied(true);
                return;
            }

            const data = await res.json();

            if (tab === 0 && data.submissions) {
                setAssignments(data.submissions);
            } else if (tab === 1 && data.iltSessions) {
                setILTSessions(data.iltSessions);
            }
        } catch (error) {
            console.error('Failed to fetch grading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const renderAssignments = () => {
        if (loading) {
            return (
                <Box>
                    {[1, 2, 3].map(i => (
                        <Skeleton key={i} variant="rectangular" height={60} sx={{ mb: 1, borderRadius: 1 }} />
                    ))}
                </Box>
            );
        }

        if (assignments.length === 0) {
            return renderEmptyState();
        }

        return (
            <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #DFE1E6' }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#FAFBFC' }}>
                            <TableCell sx={{ fontWeight: 600, color: '#172B4D' }}>Student</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#172B4D' }}>Assignment</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#172B4D' }}>Submitted</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#172B4D' }}>Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {assignments.map((assignment, index) => (
                            <TableRow
                                key={assignment.id}
                                sx={{
                                    bgcolor: index % 2 === 1 ? '#FAFBFC' : 'white',
                                    '&:hover': { bgcolor: '#F4F5F7', cursor: 'pointer' }
                                }}
                            >
                                <TableCell sx={{ color: '#172B4D', fontWeight: 500 }}>
                                    Student {assignment.learnerId.substring(0, 8)}
                                </TableCell>
                                <TableCell sx={{ color: '#6B778C' }}>
                                    Unit {assignment.unitId.substring(0, 8)}
                                </TableCell>
                                <TableCell sx={{ color: '#6B778C' }}>
                                    {formatDate(assignment.submittedAt)}
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={assignment.status}
                                        size="small"
                                        sx={{ bgcolor: '#FFF4E5', color: '#FF991F', fontWeight: 600 }}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        );
    };

    const renderILTSessions = () => {
        if (loading) {
            return (
                <Box>
                    {[1, 2, 3].map(i => (
                        <Skeleton key={i} variant="rectangular" height={60} sx={{ mb: 1, borderRadius: 1 }} />
                    ))}
                </Box>
            );
        }

        if (iltSessions.length === 0) {
            return renderEmptyState();
        }

        return (
            <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #DFE1E6' }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#FAFBFC' }}>
                            <TableCell sx={{ fontWeight: 600, color: '#172B4D' }}>Student</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#172B4D' }}>Session</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#172B4D' }}>Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {iltSessions.map((session, index) => (
                            <TableRow
                                key={session.id}
                                sx={{
                                    bgcolor: index % 2 === 1 ? '#FAFBFC' : 'white',
                                    '&:hover': { bgcolor: '#F4F5F7', cursor: 'pointer' }
                                }}
                            >
                                <TableCell sx={{ color: '#172B4D', fontWeight: 500 }}>
                                    Student {session.userId.substring(0, 8)}
                                </TableCell>
                                <TableCell sx={{ color: '#6B778C' }}>
                                    Session {session.sessionId.substring(0, 8)}
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={session.status}
                                        size="small"
                                        sx={{ bgcolor: '#FFF4E5', color: '#FF991F', fontWeight: 600 }}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        );
    };

    const renderEmptyState = () => (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 8,
                textAlign: 'center'
            }}
        >
            <Box
                sx={{
                    width: 250,
                    height: 250,
                    bgcolor: '#F4F5F7',
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 3,
                    position: 'relative'
                }}
            >
                {/* Illustration Placeholder */}
                <Box
                    sx={{
                        width: 180,
                        height: 180,
                        bgcolor: 'white',
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                    }}
                >
                    <Box
                        sx={{
                            width: 120,
                            height: 120,
                            bgcolor: '#0052CC',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative'
                        }}
                    >
                        <Box
                            sx={{
                                width: 80,
                                height: 100,
                                bgcolor: '#E6F2FF',
                                borderRadius: 1,
                                position: 'relative'
                            }}
                        />
                    </Box>
                </Box>
            </Box>
            <Typography variant="h6" fontWeight={600} color="#172B4D">
                Nothing available to grade yet
            </Typography>
        </Box>
    );

    if (accessDenied || (!permissionsLoading && !can('submission:read'))) {
        return <AccessDenied />;
    }

    return (
        <Box>
            {/* Header */}
            <Typography variant="h5" fontWeight={600} color="#172B4D" sx={{ mb: 3 }}>
                Grading Hub
            </Typography>

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
                <Tabs
                    value={tab}
                    onChange={(e, val) => { setTab(val); }}
                    sx={{
                        '& .MuiTab-root': {
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: 15,
                            minWidth: 120
                        },
                        '& .Mui-selected': { color: '#0052CC' },
                        '& .MuiTabs-indicator': { backgroundColor: '#0052CC' }
                    }}
                >
                    <Tab label="Assignments" />
                    <Tab label="ILT sessions" />
                </Tabs>
            </Box>

            {/* Content */}
            {tab === 0 ? renderAssignments() : renderILTSessions()}
        </Box>
    );
}
