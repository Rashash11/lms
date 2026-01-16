'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
    Box, Typography, Paper, Button, TextField, CircularProgress,
    Alert, Stack, Divider, Chip
} from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import SendIcon from '@mui/icons-material/Send';
import { getCsrfToken } from '@/lib/client-csrf';

interface Submission {
    id: string;
    assignmentId: string;
    userId: string;
    content: string | null;
    attachments: any[];
    submittedAt: string;
    status: string;
    score: number | null;
    comment: string | null;
    learnerComment: string | null;
    assignment: {
        id: string;
        title: string;
        maxScore?: number;
    };
    user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
}

export default function SubmissionGradingPage() {
    const params = useParams();
    const router = useRouter();
    const submissionId = params?.id as string;

    const [submission, setSubmission] = useState<Submission | null>(null);
    const [loading, setLoading] = useState(true);
    const [grading, setGrading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [score, setScore] = useState('');
    const [comment, setComment] = useState('');

    const fetchSubmission = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/submissions/${submissionId}`);
            if (res.ok) {
                const data = await res.json();
                setSubmission(data);
                setScore(data.score?.toString() || '');
                setComment(data.comment || '');
            } else {
                setError('Failed to load submission');
            }
        } catch (err) {
            setError('Error loading submission');
        } finally {
            setLoading(false);
        }
    }, [submissionId]);

    useEffect(() => {
        if (submissionId) {
            void fetchSubmission();
        }
    }, [fetchSubmission, submissionId]);

    const handleGrade = async () => {
        if (!submission) return;

        const scoreNum = parseInt(score);
        if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
            setError('Please enter a valid score between 0-100');
            return;
        }

        setGrading(true);
        setError('');

        try {
            const res = await fetch('/api/submissions', {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-csrf-token': getCsrfToken()
                },
                body: JSON.stringify({
                    id: submissionId,
                    score: scoreNum,
                    comment,
                    status: 'GRADED'
                }),
            });

            if (res.ok) {
                setSuccess('Submission graded successfully!');
                setTimeout(() => router.push('/super-instructor/grading-hub'), 2000);
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to grade submission');
            }
        } catch (err) {
            setError('Error grading submission');
        } finally {
            setGrading(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!submission) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">Submission not found</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>
            <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => router.back()}
                sx={{ mb: 3 }}
            >
                Back to Grading Hub
            </Button>

            <Paper sx={{ p: 4 }}>
                <Typography variant="h4" fontWeight={600} gutterBottom>
                    Grade Submission
                </Typography>

                <Stack spacing={2} sx={{ mb: 4 }}>
                    <Box>
                        <Typography variant="body2" color="text.secondary">Student</Typography>
                        <Typography variant="h6">
                            {submission.user.firstName} {submission.user.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {submission.user.email}
                        </Typography>
                    </Box>

                    <Box>
                        <Typography variant="body2" color="text.secondary">Assignment</Typography>
                        <Typography variant="h6">{submission.assignment.title}</Typography>
                    </Box>

                    <Box>
                        <Typography variant="body2" color="text.secondary">Submitted</Typography>
                        <Typography>{new Date(submission.submittedAt).toLocaleString()}</Typography>
                    </Box>

                    <Box>
                        <Typography variant="body2" color="text.secondary">Status</Typography>
                        <Chip
                            label={submission.status}
                            size="small"
                            color={submission.status === 'GRADED' ? 'success' : 'warning'}
                        />
                    </Box>
                </Stack>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" gutterBottom>Student Response</Typography>

                {submission.content && (
                    <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                            {submission.content}
                        </Typography>
                    </Box>
                )}

                {submission.attachments && submission.attachments.filter((f: any) => f !== null).length > 0 && (
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="subtitle2" gutterBottom>Submitted Files</Typography>
                        <Stack spacing={1}>
                            {submission.attachments.filter((f: any) => f !== null).map((file: any, idx: number) => {
                                // Handle both string URLs and objects with url/name
                                const fileUrl = typeof file === 'string' ? file : (file?.url || file);
                                const fileName = typeof file === 'string'
                                    ? `Attachment ${idx + 1}`
                                    : (file?.name || file?.url || `Attachment ${idx + 1}`);

                                if (!fileUrl) return null;

                                return (
                                    <Button
                                        key={idx}
                                        variant="outlined"
                                        component="a"
                                        startIcon={<DownloadIcon />}
                                        href={fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        download
                                        sx={{ justifyContent: 'flex-start' }}
                                    >
                                        {fileName}
                                    </Button>
                                );
                            })}
                        </Stack>
                    </Box>
                )}

                <Divider sx={{ my: 3 }} />

                {submission.learnerComment && (
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" color="primary" gutterBottom>Learner's Comment</Typography>
                        <Paper sx={{ p: 2, bgcolor: 'rgba(var(--primary-rgb), 0.05)', borderLeft: '4px solid', borderLeftColor: 'primary.main', borderRadius: 1 }}>
                            <Typography variant="body1">{submission.learnerComment}</Typography>
                        </Paper>
                        <Divider sx={{ my: 3 }} />
                    </Box>
                )}

                <Typography variant="h6" gutterBottom>Grade & Feedback</Typography>

                <Stack spacing={3}>
                    {error && <Alert severity="error">{error}</Alert>}
                    {success && <Alert severity="success">{success}</Alert>}

                    <TextField
                        label="Score (0-100)"
                        type="number"
                        value={score}
                        onChange={(e) => setScore(e.target.value)}
                        fullWidth
                        required
                        inputProps={{ min: 0, max: 100 }}
                    />

                    <TextField
                        label="Feedback / Comments"
                        multiline
                        rows={4}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        fullWidth
                        placeholder="Provide feedback to the student..."
                    />

                    <Button
                        variant="contained"
                        size="large"
                        onClick={handleGrade}
                        disabled={grading || !score}
                        startIcon={grading ? <CircularProgress size={20} /> : <SendIcon />}
                    >
                        {grading ? 'Grading...' : submission.status === 'GRADED' ? 'Update Grade' : 'Submit Grade'}
                    </Button>
                </Stack>
            </Paper>
        </Box>
    );
}
