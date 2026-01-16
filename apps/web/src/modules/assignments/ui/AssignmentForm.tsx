'use client';

import React, { useState, useEffect } from 'react';
import {
    Box, Button, TextField, Stack, FormControl, InputLabel, Select, MenuItem,
    Alert, CircularProgress, Paper, Typography, Tabs, Tab, Switch, FormControlLabel,
    InputAdornment, Chip, Divider, IconButton, List, ListItem, ListItemIcon, ListItemText, Grid
} from '@mui/material';
import { useRouter } from 'next/navigation';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DeleteIcon from '@mui/icons-material/Delete';
import { getCsrfToken } from '@/lib/client-csrf';

interface Course {
    id: string;
    title: string;
}

interface AssignmentFormProps {
    role: 'ADMIN' | 'INSTRUCTOR' | 'SUPER_INSTRUCTOR';
    initialData?: any; // Using any for now due to complex shape
    onSuccess?: () => void;
}

function TabPanel(props: { children?: React.ReactNode; index: number; value: number }) {
    const { children, value, index, ...other } = props;
    return (
        <div role="tabpanel" hidden={value !== index} {...other}>
            {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
        </div>
    );
}

export default function AssignmentForm({ role, initialData, onSuccess }: AssignmentFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [courses, setCourses] = useState<Course[]>([]);
    const [tabValue, setTabValue] = useState(0);

    const [attachments, setAttachments] = useState<any[]>(initialData?.attachments || []);
    const [uploading, setUploading] = useState(false);

    // Learner assignment
    const [courseLearners, setCourseLearners] = useState<any[]>([]);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [allInstructors, setAllInstructors] = useState<any[]>([]);
    const [assignedLearnerIds, setAssignedLearnerIds] = useState<string[]>(initialData?.assignedLearners?.map((al: any) => al.userId) || []);
    const [assignedInstructorId, setAssignedInstructorId] = useState<string>(initialData?.assignedInstructorId || '');
    const [isCourseSpecific, setIsCourseSpecific] = useState<boolean>(initialData?.courseId ? true : false);

    // Form State
    const [formData, setFormData] = useState({
        // Basics
        title: initialData?.title || '',
        description: initialData?.description || '',
        courseId: initialData?.courseId || '',
        type: initialData?.type || 'HOMEWORK',
        difficulty: initialData?.difficulty || 'MEDIUM',

        // Grading
        gradingMethod: initialData?.gradingMethod || 'NUMERIC', // NUMERIC, PASS_FAIL, RUBRIC, WEIGHTED

        // Availability
        availableFrom: initialData?.availableFrom ? new Date(initialData.availableFrom).toISOString().slice(0, 16) : '',
        dueAt: initialData?.dueAt ? new Date(initialData.dueAt).toISOString().slice(0, 16) : '',
        closeAt: initialData?.closeAt ? new Date(initialData.closeAt).toISOString().slice(0, 16) : '',
        allowLate: initialData?.allowLate ?? false,
        latePenalty: initialData?.latePenalty || 0,
        maxLateDays: initialData?.maxLateDays || 0,

        // Submission
        maxFiles: initialData?.maxFiles || 5,
        maxSizeMb: initialData?.maxSizeMb || 10,
        maxAttempts: initialData?.maxAttempts || 1,
        allowedFileTypes: initialData?.allowedFileTypes || [], // Array of strings
        allowText: initialData?.allowText ?? true,
        allowFile: initialData?.allowFile ?? true,

        // Integrity
        plagiarismCheck: initialData?.plagiarismCheck ?? false,
        similarityThreshold: initialData?.similarityThreshold || 20,
        requireAIDeclaration: initialData?.requireAIDeclaration ?? false,
        lockAfterView: initialData?.lockAfterView ?? false,

        // Settings / Visibility
        visibility: initialData?.visibility || 'ALL', // ALL, GROUPS, DRAFT
        isGroupAssignment: initialData?.isGroupAssignment ?? false,
        notifyOnPublish: initialData?.notifyOnPublish ?? true,
        notifyOnDueDate: initialData?.notifyOnDueDate ?? true,
        notifyOnSubmission: initialData?.notifyOnSubmission ?? true,
    });

    useEffect(() => {
        fetchCourses();
        fetchAllUsers(); // Fetch all users for non-course assignments
        fetchInstructors(); // Fetch instructors for grading assignment
    }, []);

    // Fetch course enrollments when course changes
    useEffect(() => {
        if (formData.courseId) {
            fetchCourseLearners(formData.courseId);
        } else {
            setCourseLearners([]);
        }
    }, [formData.courseId]);

    const fetchCourses = async () => {
        try {
            console.log('[AssignmentForm] Fetching courses...');
            const res = await fetch('/api/courses');
            console.log('[AssignmentForm] Courses response status:', res.status);
            const data = await res.json();
            console.log('[AssignmentForm] Courses data:', data);
            setCourses(data.courses || []);
        } catch (err) {
            console.error('Failed to fetch courses', err);
        }
    };

    const fetchCourseLearners = async (courseId: string) => {
        try {
            const res = await fetch(`/api/courses/${courseId}/enrollments`);
            if (res.ok) {
                const data = await res.json();
                setCourseLearners(data.enrollments || []);
            }
        } catch (err) {
            console.error('Failed to fetch course enrollments', err);
        }
    };

    const fetchAllUsers = async () => {
        try {
            console.log('[AssignmentForm] Fetching all users...');
            const res = await fetch('/api/users?limit=100');
            console.log('[AssignmentForm] Users response status:', res.status);
            const data = await res.json();
            console.log('[AssignmentForm] Users data:', data);
            // Filter to only learners - check roles array or activeRole
            const users = data.data || data.users || [];
            const learners = users.filter((u: any) =>
                u.roles?.includes('LEARNER') || u.activeRole === 'LEARNER'
            );
            console.log('[AssignmentForm] Filtered learners:', learners.length);
            setAllUsers(learners);
        } catch (err) {
            console.error('Failed to fetch users', err);
        }
    };

    const fetchInstructors = async () => {
        try {
            console.log('[AssignmentForm] Fetching instructors...');
            const res = await fetch('/api/users?limit=100');
            const data = await res.json();
            // Filter to instructors and super instructors - check roles array or activeRole
            const users = data.data || data.users || [];
            const instructors = users.filter((u: any) =>
                u.roles?.includes('INSTRUCTOR') || u.roles?.includes('SUPER_INSTRUCTOR') ||
                u.activeRole === 'INSTRUCTOR' || u.activeRole === 'SUPER_INSTRUCTOR'
            );
            console.log('[AssignmentForm] Filtered instructors:', instructors.length);
            setAllInstructors(instructors);
        } catch (err) {
            console.error('Failed to fetch instructors', err);
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            const file = event.target.files[0];
            await uploadFile(file);
        }
    };

    const uploadFile = async (file: File) => {
        setUploading(true);
        const data = new FormData();
        data.append('file', file);
        data.append('context', 'assignment');
        // Simple MIME detection for kind
        let kind = 'document';
        if (file.type.startsWith('video/')) kind = 'video';
        else if (file.type.startsWith('audio/')) kind = 'audio';
        else if (file.type.startsWith('image/')) kind = 'thumbnail'; // or image

        data.append('kind', kind);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'x-csrf-token': getCsrfToken() },
                body: data,
            });

            if (res.ok) {
                const responseData = await res.json();
                setAttachments([...attachments, responseData.file]);
            } else {
                const errorData = await res.json();
                setError(errorData.error || 'Upload failed');
            }
        } catch (err) {
            console.error(err);
            setError('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(attachments.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        setError(null);

        if (!formData.title) {
            setError('Title is required');
            return;
        }

        // Course is only required for course-specific assignments when role is INSTRUCTOR
        if (isCourseSpecific && !formData.courseId && role === 'INSTRUCTOR') {
            setError('Course is required for course-specific assignments');
            return;
        }

        setLoading(true);
        try {
            // Helper to clean up date strings
            const formatDate = (d: string) => d ? new Date(d).toISOString() : undefined;

            const payload = {
                ...formData,
                courseId: formData.courseId || undefined,
                availableFrom: formatDate(formData.availableFrom),
                dueAt: formatDate(formData.dueAt),
                closeAt: formatDate(formData.closeAt),
                attachments,
                assignedLearnerIds: assignedLearnerIds.length > 0 ? assignedLearnerIds : undefined,
                assignedInstructorId: assignedInstructorId || undefined
            };

            const url = initialData?.id ? `/api/assignments/${initialData.id}` : '/api/assignments';
            const method = initialData?.id ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': getCsrfToken()
                },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                if (onSuccess) {
                    onSuccess();
                } else {
                    // Default fallback: go back
                    router.back();
                }
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to create assignment');
            }
        } catch (err) {
            console.error(err);
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <Paper sx={{ p: { xs: 2, md: 4 }, maxWidth: 900, mx: 'auto', borderRadius: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" fontWeight={700}>
                    {initialData ? 'Edit Assignment' : 'Create Assignment'}
                </Typography>
                <Box>
                    <Button onClick={() => router.back()} disabled={loading} sx={{ mr: 1 }}>
                        Cancel
                    </Button>
                    <Button variant="contained" onClick={handleSubmit} disabled={loading || uploading}>
                        {loading ? <CircularProgress size={24} /> : (initialData ? 'Save' : 'Create')}
                    </Button>
                </Box>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} variant="scrollable" scrollButtons="auto">
                    <Tab label="Basics" />
                    <Tab label="Grading" />
                    <Tab label="Availability" />
                    <Tab label="Submission" />
                    <Tab label="Settings" />
                </Tabs>
            </Box>

            {/* TAB 1: BASICS */}
            <TabPanel value={tabValue} index={0}>
                <Stack spacing={3}>
                    <TextField
                        label="Assignment Title"
                        required
                        fullWidth
                        value={formData.title}
                        onChange={(e) => handleChange('title', e.target.value)}
                    />

                    <FormControlLabel
                        control={
                            <Switch
                                checked={isCourseSpecific}
                                onChange={(e) => {
                                    setIsCourseSpecific(e.target.checked);
                                    if (!e.target.checked) {
                                        handleChange('courseId', ''); // Clear course when not course-specific
                                    }
                                }}
                            />
                        }
                        label="Course-Specific Assignment"
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: -2, mb: 2 }}>
                        {isCourseSpecific
                            ? "This assignment is linked to a specific course and visible to enrolled learners."
                            : "This is a general assignment not tied to any course. You can assign it to any learners."}
                    </Typography>

                    {isCourseSpecific && (
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <FormControl fullWidth required={role === 'INSTRUCTOR'}>
                                    <InputLabel>Course</InputLabel>
                                    <Select
                                        value={formData.courseId}
                                        label="Course"
                                        onChange={(e) => handleChange('courseId', e.target.value)}
                                    >
                                        <MenuItem value=""><em>None</em></MenuItem>
                                        {courses.map(c => (
                                            <MenuItem key={c.id} value={c.id}>{c.title}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, md: 3 }}>
                                <FormControl fullWidth>
                                    <InputLabel>Type</InputLabel>
                                    <Select
                                        value={formData.type}
                                        label="Type"
                                        onChange={(e) => handleChange('type', e.target.value)}
                                    >
                                        {['HOMEWORK', 'QUIZ', 'PROJECT', 'LAB', 'RESEARCH', 'PRESENTATION'].map(t => (
                                            <MenuItem key={t} value={t}>{t}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, md: 3 }}>
                                <FormControl fullWidth>
                                    <InputLabel>Difficulty</InputLabel>
                                    <Select
                                        value={formData.difficulty}
                                        label="Difficulty"
                                        onChange={(e) => handleChange('difficulty', e.target.value)}
                                    >
                                        {['EASY', 'MEDIUM', 'HARD'].map(t => (
                                            <MenuItem key={t} value={t}>{t}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    )}

                    {!isCourseSpecific && (
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <FormControl fullWidth>
                                    <InputLabel>Type</InputLabel>
                                    <Select
                                        value={formData.type}
                                        label="Type"
                                        onChange={(e) => handleChange('type', e.target.value)}
                                    >
                                        {['HOMEWORK', 'QUIZ', 'PROJECT', 'LAB', 'RESEARCH', 'PRESENTATION'].map(t => (
                                            <MenuItem key={t} value={t}>{t}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <FormControl fullWidth>
                                    <InputLabel>Difficulty</InputLabel>
                                    <Select
                                        value={formData.difficulty}
                                        label="Difficulty"
                                        onChange={(e) => handleChange('difficulty', e.target.value)}
                                    >
                                        {['EASY', 'MEDIUM', 'HARD'].map(t => (
                                            <MenuItem key={t} value={t}>{t}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    )}

                    <TextField
                        label="Description & Instructions"
                        fullWidth
                        multiline
                        rows={6}
                        value={formData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        placeholder="Detailed instructions for the learner..."
                    />

                    {/* File Attachments */}
                    <Box sx={{ border: '1px dashed', borderColor: 'divider', p: 2, borderRadius: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Instructor Attachments (Instructions, Templates, etc.)</Typography>
                        <List dense>
                            {attachments.map((file, idx) => (
                                <ListItem key={idx}
                                    secondaryAction={<IconButton edge="end" onClick={() => removeAttachment(idx)}><DeleteIcon /></IconButton>}
                                >
                                    <ListItemIcon><AttachFileIcon /></ListItemIcon>
                                    <ListItemText primary={file.name} secondary={file.kind?.toUpperCase()} />
                                </ListItem>
                            ))}
                        </List>
                        <Button
                            component="label"
                            variant="outlined"
                            size="small"
                            startIcon={uploading ? <CircularProgress size={16} /> : <CloudUploadIcon />}
                            disabled={uploading}
                        >
                            Upload File
                            <input type="file" hidden onChange={handleFileChange} />
                        </Button>
                    </Box>
                </Stack>
            </TabPanel>

            {/* TAB 2: GRADING */}
            <TabPanel value={tabValue} index={1}>
                <Stack spacing={3} maxWidth={600}>
                    <FormControl fullWidth>
                        <InputLabel>Grading Method</InputLabel>
                        <Select
                            value={formData.gradingMethod}
                            label="Grading Method"
                            onChange={(e) => handleChange('gradingMethod', e.target.value)}
                        >
                            <MenuItem value="NUMERIC">Numeric (0-100)</MenuItem>
                            <MenuItem value="PASS_FAIL">Pass / Fail</MenuItem>
                            <MenuItem value="RUBRIC">Rubric Based</MenuItem>
                            <MenuItem value="WEIGHTED">Weighted</MenuItem>
                        </Select>
                    </FormControl>

                    {formData.gradingMethod === 'RUBRIC' && (
                        <Alert severity="info" variant="outlined">
                            Rubric Builder to be implemented. Using default rubric placeholder.
                        </Alert>
                    )}

                    <Divider />
                    <Typography variant="subtitle2" color="text.secondary">Advanced Options</Typography>
                    <FormControlLabel
                        control={<Switch checked={false} disabled />} // Placeholder for future auto-grading
                        label="Enable Auto-Grading (Coming Soon)"
                    />
                </Stack>
            </TabPanel>

            {/* TAB 3: AVAILABILITY */}
            <TabPanel value={tabValue} index={2}>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            label="Available From"
                            type="datetime-local"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            value={formData.availableFrom}
                            onChange={(e) => handleChange('availableFrom', e.target.value)}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            label="Due Date"
                            type="datetime-local"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            value={formData.dueAt}
                            onChange={(e) => handleChange('dueAt', e.target.value)}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            label="Close Submissions (Hard Lock)"
                            type="datetime-local"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            value={formData.closeAt}
                            onChange={(e) => handleChange('closeAt', e.target.value)}
                            helperText="If set, no submissions allowed after this date."
                        />
                    </Grid>
                </Grid>

                <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" gutterBottom>Latness Policy</Typography>
                    <FormControlLabel
                        control={<Switch checked={formData.allowLate} onChange={(e) => handleChange('allowLate', e.target.checked)} />}
                        label="Allow Late Submissions"
                    />

                    {formData.allowLate && (
                        <Grid container spacing={3} sx={{ mt: 1 }}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    label="Penalty per Day (%)"
                                    type="number"
                                    fullWidth
                                    value={formData.latePenalty}
                                    onChange={(e) => handleChange('latePenalty', Number(e.target.value))}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    label="Max Late Days"
                                    type="number"
                                    fullWidth
                                    value={formData.maxLateDays}
                                    onChange={(e) => handleChange('maxLateDays', Number(e.target.value))}
                                />
                            </Grid>
                        </Grid>
                    )}
                </Box>
            </TabPanel>

            {/* TAB 4: SUBMISSION */}
            <TabPanel value={tabValue} index={3}>
                <Stack spacing={3}>
                    <Typography variant="subtitle2">Submission Types</Typography>
                    <Box sx={{ display: 'flex', gap: 4 }}>
                        <FormControlLabel
                            control={<Switch checked={formData.allowText} onChange={(e) => handleChange('allowText', e.target.checked)} />}
                            label="Text Entry"
                        />
                        <FormControlLabel
                            control={<Switch checked={formData.allowFile} onChange={(e) => handleChange('allowFile', e.target.checked)} />}
                            label="File Upload"
                        />
                    </Box>

                    {formData.allowFile && (
                        <>
                            <Divider />
                            <Grid container spacing={3}>
                                <Grid size={{ xs: 12, md: 4 }}>
                                    <TextField
                                        label="Max Files"
                                        type="number"
                                        fullWidth
                                        value={formData.maxFiles}
                                        onChange={(e) => handleChange('maxFiles', Number(e.target.value))}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, md: 4 }}>
                                    <TextField
                                        label="Max Upload Size (MB)"
                                        type="number"
                                        fullWidth
                                        value={formData.maxSizeMb}
                                        onChange={(e) => handleChange('maxSizeMb', Number(e.target.value))}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, md: 4 }}>
                                    <TextField
                                        label="Max Attempts"
                                        type="number"
                                        fullWidth
                                        value={formData.maxAttempts}
                                        onChange={(e) => handleChange('maxAttempts', Number(e.target.value))}
                                    />
                                </Grid>
                            </Grid>
                        </>
                    )}

                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6">Integrity & Security</Typography>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <FormControlLabel
                                control={<Switch checked={formData.plagiarismCheck} onChange={(e) => handleChange('plagiarismCheck', e.target.checked)} />}
                                label="Enable Integrity Check (Plagiarism)"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <FormControlLabel
                                control={<Switch checked={formData.requireAIDeclaration} onChange={(e) => handleChange('requireAIDeclaration', e.target.checked)} />}
                                label="Require AI Usage Declaration"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <FormControlLabel
                                control={<Switch checked={formData.lockAfterView} onChange={(e) => handleChange('lockAfterView', e.target.checked)} />}
                                label="Lock Content After Viewing"
                            />
                        </Grid>
                    </Grid>
                </Stack>
            </TabPanel>

            {/* TAB 5: SETTINGS */}
            <TabPanel value={tabValue} index={4}>
                <Stack spacing={3} maxWidth={600}>
                    <FormControl fullWidth>
                        <InputLabel>Visibility</InputLabel>
                        <Select
                            value={formData.visibility}
                            label="Visibility"
                            onChange={(e) => handleChange('visibility', e.target.value)}
                        >
                            <MenuItem value="ALL">Visible to All Enrolled</MenuItem>
                            <MenuItem value="GROUPS">Specific Groups Only</MenuItem>
                            <MenuItem value="DRAFT">Draft (Hidden)</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControlLabel
                        control={<Switch checked={formData.isGroupAssignment} onChange={(e) => handleChange('isGroupAssignment', e.target.checked)} />}
                        label="Group Assignment (One submission per group)"
                    />

                    <Divider />
                    <Typography variant="subtitle2">Assigned Learners</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        {isCourseSpecific
                            ? "Select specific learners from the selected course. If none selected, all enrolled learners will see it."
                            : "Select any learners to assign this general assignment to. If none selected, no one will see it."}
                    </Typography>

                    {isCourseSpecific ? (
                        // Course-specific: only show enrolled learners
                        formData.courseId ? (
                            <FormControl fullWidth>
                                <InputLabel>Select Learners (Optional)</InputLabel>
                                <Select
                                    multiple
                                    value={assignedLearnerIds}
                                    label="Select Learners (Optional)"
                                    onChange={(e) => setAssignedLearnerIds(e.target.value as string[])}
                                    renderValue={(selected) => (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {(selected as string[]).map((id) => {
                                                const learner = courseLearners.find(l => l.user.id === id);
                                                return learner ? (
                                                    <Chip
                                                        key={id}
                                                        label={`${learner.user.firstName} ${learner.user.lastName}`}
                                                        size="small"
                                                    />
                                                ) : null;
                                            })}
                                        </Box>
                                    )}
                                >
                                    {courseLearners.map((enrollment) => (
                                        <MenuItem key={enrollment.user.id} value={enrollment.user.id}>
                                            {enrollment.user.firstName} {enrollment.user.lastName} ({enrollment.user.email})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        ) : (
                            <Alert severity="info" variant="outlined">
                                Please select a course first to assign specific learners.
                            </Alert>
                        )
                    ) : (
                        // Not course-specific: show all learners
                        <FormControl fullWidth>
                            <InputLabel>Select Learners</InputLabel>
                            <Select
                                multiple
                                value={assignedLearnerIds}
                                label="Select Learners"
                                onChange={(e) => setAssignedLearnerIds(e.target.value as string[])}
                                renderValue={(selected) => (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {(selected as string[]).map((id) => {
                                            const user = allUsers.find(u => u.id === id);
                                            return user ? (
                                                <Chip
                                                    key={id}
                                                    label={`${user.firstName} ${user.lastName}`}
                                                    size="small"
                                                />
                                            ) : null;
                                        })}
                                    </Box>
                                )}
                            >
                                {allUsers.map((user) => (
                                    <MenuItem key={user.id} value={user.id}>
                                        {user.firstName} {user.lastName} ({user.email})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}

                    <Divider />

                    <Typography variant="subtitle2">Grading Instructor</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        Assign an instructor who will be responsible for grading this assignment.
                    </Typography>

                    <FormControl fullWidth>
                        <InputLabel>Select Instructor (Optional)</InputLabel>
                        <Select
                            value={assignedInstructorId}
                            label="Select Instructor (Optional)"
                            onChange={(e) => setAssignedInstructorId(e.target.value)}
                        >
                            <MenuItem value=""><em>None</em></MenuItem>
                            {allInstructors.map((instructor) => (
                                <MenuItem key={instructor.id} value={instructor.id}>
                                    {instructor.firstName} {instructor.lastName} ({instructor.activeRole})
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Divider />
                    <Typography variant="subtitle2">Notifications</Typography>
                    <FormControlLabel
                        control={<Switch checked={formData.notifyOnPublish} onChange={(e) => handleChange('notifyOnPublish', e.target.checked)} />}
                        label="Notify learners on publish"
                    />
                    <FormControlLabel
                        control={<Switch checked={formData.notifyOnDueDate} onChange={(e) => handleChange('notifyOnDueDate', e.target.checked)} />}
                        label="Remind learners before due date"
                    />
                    <FormControlLabel
                        control={<Switch checked={formData.notifyOnSubmission} onChange={(e) => handleChange('notifyOnSubmission', e.target.checked)} />}
                        label="Notify instructor on submission"
                    />
                </Stack>
            </TabPanel>
        </Paper>
    );
}
