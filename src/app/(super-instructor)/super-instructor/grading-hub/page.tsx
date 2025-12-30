'use client';

import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, TextField, InputAdornment, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Chip, CircularProgress,
    Button, IconButton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import GradingIcon from '@mui/icons-material/Grading';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface Submission {
    id: string;
    studentName: string;
    assignmentTitle: string;
    courseName: string;
    submittedAt: string;
    status: string;
}

export default function SuperInstructorGradingHubPage() {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchSubmissions();
    }, []);

    const fetchSubmissions = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/submissions?status=SUBMITTED&search=${search}`);
            if (res.ok) {
                const data = await res.json();
                setSubmissions(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchSubmissions();
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    return (
        <Box className="animate-fade-in" sx={{ p: { xs: 2, md: 3 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                    <Box sx={{
                        p: 1.5,
                        borderRadius: 3,
                        bgcolor: 'hsl(var(--primary) / 0.1)',
                        color: 'hsl(var(--primary))',
                        display: 'flex',
                        boxShadow: '0 0 20px hsl(var(--primary) / 0.15)'
                    }}>
                        <GradingIcon sx={{ fontSize: 32 }} />
                    </Box>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: 'hsl(var(--foreground))', letterSpacing: '-0.02em' }}>Grading Hub</Typography>
                        <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))' }}>Review and grade learner submissions</Typography>
                    </Box>
                </Box>
            </Box>

            <Box className="glass-card" sx={{ p: 2, mb: 3, display: 'flex', gap: 2 }}>
                <TextField
                    placeholder="Search submissions by student or assignment..."
                    size="small"
                    fullWidth
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: 'hsl(var(--primary))', mr: 1 }} />
                            </InputAdornment>
                        ),
                    }}
                    sx={{
                        maxWidth: 500,
                        '& .MuiOutlinedInput-root': {
                            bgcolor: 'rgba(141, 166, 166, 0.05)',
                            borderRadius: 2.5,
                            '& fieldset': { borderColor: 'rgba(141, 166, 166, 0.1)' },
                            '&:hover fieldset': { borderColor: 'rgba(141, 166, 166, 0.2)' },
                            '&.Mui-focused fieldset': { borderColor: 'hsl(var(--primary) / 0.5)' },
                        }
                    }}
                />
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                    <CircularProgress sx={{ color: 'hsl(var(--primary))' }} />
                </Box>
            ) : submissions.length === 0 ? (
                <Box className="glass-card" sx={{ p: 8, textAlign: 'center', borderRadius: 4 }}>
                    <Box sx={{
                        width: 80, height: 80, borderRadius: '50%',
                        bgcolor: 'hsl(var(--primary) / 0.05)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        mx: 'auto', mb: 2
                    }}>
                        <CheckCircleIcon sx={{ fontSize: 40, color: 'hsl(var(--muted-foreground))', opacity: 0.5 }} />
                    </Box>
                    <Typography sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 500 }}>All caught up! No pending submissions to grade</Typography>
                </Box>
            ) : (
                <TableContainer className="glass-card" sx={{ borderRadius: 4, overflow: 'hidden' }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'rgba(141, 166, 166, 0.05)' }}>
                                <TableCell sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Student</TableCell>
                                <TableCell sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assignment</TableCell>
                                <TableCell sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Course</TableCell>
                                <TableCell sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Submitted</TableCell>
                                <TableCell sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</TableCell>
                                <TableCell align="right" sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {submissions.map((sub) => (
                                <TableRow key={sub.id} sx={{ '&:hover': { bgcolor: 'rgba(141, 166, 166, 0.03)' } }}>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'hsl(var(--foreground))' }}>{sub.studentName}</Typography>
                                    </TableCell>
                                    <TableCell sx={{ color: 'hsl(var(--muted-foreground))', fontSize: 13, fontWeight: 500 }}>{sub.assignmentTitle}</TableCell>
                                    <TableCell sx={{ color: 'hsl(var(--muted-foreground))', fontSize: 13, fontWeight: 500 }}>{sub.courseName}</TableCell>
                                    <TableCell sx={{ color: 'hsl(var(--muted-foreground))', fontSize: 13, fontWeight: 500 }}>{new Date(sub.submittedAt).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={sub.status}
                                            size="small"
                                            sx={{
                                                bgcolor: 'hsl(var(--warning) / 0.1)',
                                                color: 'hsl(var(--warning))',
                                                border: '1px solid hsl(var(--warning) / 0.2)',
                                                fontWeight: 600,
                                                fontSize: 11
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Button
                                            size="small"
                                            variant="contained"
                                            startIcon={<CheckCircleIcon />}
                                            href={`/super-instructor/grading-hub/${sub.id}`}
                                            sx={{
                                                bgcolor: 'hsl(var(--primary))',
                                                color: 'white',
                                                textTransform: 'none',
                                                fontWeight: 600,
                                                boxShadow: '0 4px 10px hsl(var(--primary) / 0.2)',
                                                '&:hover': {
                                                    bgcolor: 'hsl(var(--primary))',
                                                    boxShadow: '0 6px 12px hsl(var(--primary) / 0.3)',
                                                    transform: 'translateY(-1px)'
                                                }
                                            }}
                                        >
                                            Grade
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
}
