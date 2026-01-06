'use client';

import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Button, TextField, CircularProgress,
    Alert, Chip, Stack, Divider
} from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface Assignment {
    id: string;
    title: string;
    description: string | null;
    dueAt: string | null;
    allowText: boolean;
    allowFile: boolean;
    maxFiles: number;
    maxSizeMb: number;
    attachments?: any[];
    course?: {
        title: string;
    };
    submission?: {
        id: string;
        content: string | null;
        attachments: any;
        status: string;
        score: number | null;
        comment: string | null;
        learnerComment: string | null;
        submittedAt: string;
    } | null;
}

export default function LearnerAssignmentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const assignmentId = params?.id as string;

    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Submission form
    const [textResponse, setTextResponse] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [learnerComment, setLearnerComment] = useState('');
    const [savingComment, setSavingComment] = useState(false);

    useEffect(() => {
        if (assignmentId) {
            fetchAssignment();
        }
    }, [assignmentId]);

    const fetchAssignment = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/assignments/${assignmentId}`);
            if (res.ok) {
                const data = await res.json();
                setAssignment(data);
                if (data.submission) {
                    setLearnerComment(data.submission.learnerComment || '');
                }
            } else {
                setError('Failed to load assignment');
            }
        } catch (err) {
            setError('Error loading assignment');
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selectedFiles = Array.from(e.target.files);

            // Check total file count (existing + new)
            const totalFiles = files.length + selectedFiles.length;
            if (assignment && totalFiles > assignment.maxFiles) {
                setError(`You can only upload up to ${assignment.maxFiles} files total. Currently ${files.length} uploaded.`);
                e.target.value = ''; // Reset input
                return;
            }

            // Check file sizes
            if (assignment) {
                const maxSizeBytes = assignment.maxSizeMb * 1024 * 1024;
                const oversized = selectedFiles.find(f => f.size > maxSizeBytes);
                if (oversized) {
                    setError(`File "${oversized.name}" exceeds the ${assignment.maxSizeMb}MB limit`);
                    e.target.value = ''; // Reset input
                    return;
                }
            }

            // Add new files to existing files
            setFiles([...files, ...selectedFiles]);
            setError('');
            e.target.value = ''; // Reset input so same file can be selected again if needed
        }
    };

    const handleSubmit = async () => {
        if (!assignment) return;

        // Validation
        if (!assignment.allowText && files.length === 0) {
            setError('Please upload at least one file');
            return;
        }
        if (!assignment.allowFile && !textResponse.trim()) {
            setError('Please enter a text response');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            // Upload files first if any
            const uploadedFiles: { url: string, name: string }[] = [];
            if (files.length > 0) {
                for (const file of files) {
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('context', 'assignment'); // Use 'assignment' context for disk storage
                    formData.append('contextId', assignmentId);

                    const uploadRes = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData,
                    });

                    if (uploadRes.ok) {
                        const uploadData = await uploadRes.json();
                        // The upload API returns { file: { url, name, ... } }
                        const fileInfo = uploadData.file;
                        uploadedFiles.push({
                            url: fileInfo.url,
                            name: fileInfo.name || file.name
                        });
                    } else {
                        console.error('[Submission] Upload failed:', await uploadRes.text());
                        throw new Error('File upload failed');
                    }
                }
            }

            // Create/Update submission
            const submissionPayload = {
                content: textResponse || null,
                attachments: uploadedFiles,
            };

            const submissionRes = await fetch(`/api/assignments/${assignmentId}/submissions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submissionPayload),
            });

            if (submissionRes.ok) {
                const result = await submissionRes.json();
                setSuccess('Assignment submitted successfully!');
                setTimeout(() => router.push('/learner/assignments'), 2000);
            } else {
                const data = await submissionRes.json();
                console.error('[Submission] Failed:', data);
                setError(data.error || 'Failed to submit assignment');
            }
        } catch (err) {
            console.error('[Submission] Error:', err);
            setError('Error submitting assignment');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSaveComment = async () => {
        if (!assignment?.submission) return;

        setSavingComment(true);
        setError('');
        try {
            const res = await fetch('/api/submissions', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: assignment.submission.id,
                    learnerComment
                }),
            });

            if (res.ok) {
                setSuccess('Comment saved successfully!');
                // Update local state
                setAssignment({
                    ...assignment,
                    submission: {
                        ...assignment.submission,
                        learnerComment
                    }
                });
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to save comment');
            }
        } catch (err) {
            setError('Error saving comment');
        } finally {
            setSavingComment(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!assignment) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">Assignment not found</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
            <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => router.back()}
                sx={{ mb: 3 }}
            >
                Back to Assignments
            </Button>

            <Paper sx={{ p: 4 }}>
                <Typography variant="h4" fontWeight={600} gutterBottom>
                    {assignment.title}
                </Typography>

                {assignment.course && (
                    <Chip label={assignment.course.title} size="small" sx={{ mb: 2 }} />
                )}

                {assignment.dueAt && (
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        Due: {new Date(assignment.dueAt).toLocaleString()}
                    </Typography>
                )}

                <Divider sx={{ my: 3 }} />

                {assignment.description && (
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" gutterBottom>Instructions</Typography>
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                            {assignment.description}
                        </Typography>
                    </Box>
                )}

                {assignment.attachments && assignment.attachments.length > 0 && (
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" gutterBottom>Assignment Files</Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Download the files below to complete your assignment:
                        </Typography>
                        <Stack spacing={1} sx={{ mt: 2 }}>
                            {assignment.attachments.map((file: any, idx: number) => (
                                <Button
                                    key={idx}
                                    variant="outlined"
                                    startIcon={<UploadFileIcon />}
                                    href={file.url || file}
                                    target="_blank"
                                    download
                                    sx={{ justifyContent: 'flex-start' }}
                                >
                                    {file.name || file.url || `Attachment ${idx + 1}`}
                                </Button>
                            ))}
                        </Stack>
                    </Box>
                )}

                <Divider sx={{ my: 3 }} />

                {assignment.submission ? (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="h5" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <CheckCircleIcon color="success" />
                            Submission Details
                            <Chip
                                label={assignment.submission.status}
                                size="small"
                                color={assignment.submission.status === 'GRADED' ? 'success' : 'primary'}
                                sx={{ fontWeight: 700 }}
                            />
                        </Typography>

                        <Paper variant="outlined" sx={{ p: 4, bgcolor: 'rgba(var(--primary-rgb), 0.02)', borderRadius: 3, border: '1px solid rgba(var(--primary-rgb), 0.1)' }}>
                            <Stack spacing={4}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: 1 }}>Submitted At</Typography>
                                        <Typography variant="body1" fontWeight={500}>{new Date(assignment.submission.submittedAt).toLocaleString()}</Typography>
                                    </Box>

                                    {assignment.submission.status === 'GRADED' && (
                                        <Box sx={{
                                            textAlign: 'center',
                                            p: 2,
                                            bgcolor: 'success.main',
                                            color: 'white',
                                            borderRadius: 2,
                                            minWidth: 120,
                                            boxShadow: '0 8px 16px rgba(46, 125, 50, 0.2)'
                                        }}>
                                            <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 700, opacity: 0.9 }}>Final Grade</Typography>
                                            <Typography variant="h3" fontWeight={900}>{assignment.submission.score}</Typography>
                                            <Typography variant="caption" sx={{ fontWeight: 700 }}>out of 100</Typography>
                                        </Box>
                                    )}
                                </Box>

                                {assignment.submission.status === 'GRADED' && assignment.submission.comment && (
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight={700} color="primary" gutterBottom>Instructor Feedback</Typography>
                                        <Paper sx={{
                                            p: 3,
                                            bgcolor: 'background.paper',
                                            borderLeft: '5px solid',
                                            borderLeftColor: 'primary.main',
                                            borderRadius: 1,
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                        }}>
                                            <Typography variant="body1" sx={{ fontStyle: 'italic', color: 'text.primary', lineHeight: 1.6 }}>
                                                "{assignment.submission.comment}"
                                            </Typography>
                                        </Paper>
                                    </Box>
                                )}

                                <Divider />

                                <Box>
                                    <Typography variant="subtitle1" fontWeight={700} gutterBottom>Your Conversation with Instructor</Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        You can leave a comment or ask a question about your grade here.
                                    </Typography>
                                    <TextField
                                        multiline
                                        rows={4}
                                        fullWidth
                                        variant="outlined"
                                        placeholder="Type your message to the instructor..."
                                        value={learnerComment}
                                        onChange={(e) => setLearnerComment(e.target.value)}
                                        sx={{
                                            bgcolor: 'background.paper',
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2
                                            }
                                        }}
                                    />
                                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                        <Button
                                            variant="contained"
                                            onClick={handleSaveComment}
                                            disabled={savingComment || learnerComment === (assignment.submission.learnerComment || '')}
                                            startIcon={savingComment ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
                                            sx={{ borderRadius: 2, px: 4 }}
                                        >
                                            {savingComment ? 'Saving...' : 'Send Comment'}
                                        </Button>
                                    </Box>

                                    {success && <Alert severity="success" sx={{ mt: 2, borderRadius: 2 }}>{success}</Alert>}
                                </Box>
                            </Stack>
                        </Paper>
                    </Box>
                ) : (
                    <>
                        <Typography variant="h6" gutterBottom fontWeight={700}>Submit Your Work</Typography>

                        <Stack spacing={3}>
                            {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}
                            {success && <Alert severity="success" sx={{ borderRadius: 2 }}>{success}</Alert>}

                            {assignment.allowText && (
                                <TextField
                                    label="Your Response"
                                    multiline
                                    rows={6}
                                    fullWidth
                                    value={textResponse}
                                    onChange={(e) => setTextResponse(e.target.value)}
                                    placeholder="Enter your answer here..."
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                />
                            )}

                            {assignment.allowFile && (
                                <Box>
                                    <Button
                                        variant="outlined"
                                        component="label"
                                        startIcon={<UploadFileIcon />}
                                        fullWidth
                                        disabled={files.length >= assignment.maxFiles}
                                        sx={{ py: 2, borderRadius: 2, borderStyle: 'dashed', borderWidth: 2 }}
                                    >
                                        {files.length >= assignment.maxFiles
                                            ? `Maximum ${assignment.maxFiles} files reached`
                                            : `Add Files (${files.length}/${assignment.maxFiles}) - ${assignment.maxSizeMb}MB each`
                                        }
                                        <input
                                            type="file"
                                            hidden
                                            multiple
                                            onChange={handleFileChange}
                                            disabled={files.length >= assignment.maxFiles}
                                        />
                                    </Button>
                                    {files.length > 0 && (
                                        <Box sx={{ mt: 2 }}>
                                            <Typography variant="caption" color="text.secondary" fontWeight={700}>
                                                Selected files ({files.length}/{assignment.maxFiles}):
                                            </Typography>
                                            <Box sx={{ mt: 1 }}>
                                                {files.map((file, idx) => (
                                                    <Chip
                                                        key={idx}
                                                        label={`${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`}
                                                        onDelete={() => setFiles(files.filter((_, i) => i !== idx))}
                                                        sx={{ mr: 1, mb: 1, borderRadius: 1 }}
                                                    />
                                                ))}
                                            </Box>
                                        </Box>
                                    )}
                                </Box>
                            )}

                            <Button
                                variant="contained"
                                size="large"
                                onClick={handleSubmit}
                                disabled={submitting || (!textResponse.trim() && files.length === 0)}
                                startIcon={submitting ? <CircularProgress size={24} color="inherit" /> : <SendIcon />}
                                sx={{ py: 1.5, borderRadius: 2, fontWeight: 700 }}
                            >
                                {submitting ? 'Submitting...' : 'Submit Assignment'}
                            </Button>
                        </Stack>
                    </>
                )}
            </Paper>
        </Box>
    );
}
