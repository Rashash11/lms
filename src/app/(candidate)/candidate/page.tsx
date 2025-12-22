'use client';

import React from 'react';
import { Box, Typography, Paper, Card, CardContent, Button, Chip, LinearProgress, Alert, Stepper, Step, StepLabel, Avatar, Divider } from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import QuizIcon from '@mui/icons-material/Quiz';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ScheduleIcon from '@mui/icons-material/Schedule';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import WarningIcon from '@mui/icons-material/Warning';
import PersonIcon from '@mui/icons-material/Person';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import BadgeIcon from '@mui/icons-material/Badge';

const stats = [
    { label: 'Assigned Exams', value: '3', icon: <QuizIcon />, color: 'primary' },
    { label: 'Completed', value: '1', icon: <CheckCircleIcon />, color: 'success' },
    { label: 'Pending', value: '2', icon: <AccessTimeIcon />, color: 'warning' },
    { label: 'Scheduled', value: '1', icon: <ScheduleIcon />, color: 'info' },
];

const assignedExams = [
    {
        id: 1,
        title: 'Advanced JavaScript Certification',
        duration: '90 minutes',
        questions: 50,
        attempts: { used: 0, max: 2 },
        status: 'available',
        window: { start: 'Dec 18, 2024', end: 'Dec 25, 2024' },
        proctored: true,
    },
    {
        id: 2,
        title: 'React Developer Assessment',
        duration: '60 minutes',
        questions: 40,
        attempts: { used: 1, max: 3 },
        status: 'available',
        window: { start: 'Dec 15, 2024', end: 'Dec 22, 2024' },
        proctored: true,
    },
    {
        id: 3,
        title: 'Node.js Backend Exam',
        duration: '120 minutes',
        questions: 60,
        attempts: { used: 1, max: 1 },
        status: 'completed',
        score: 85,
        grade: 'Pass',
        completedAt: 'Dec 10, 2024',
        proctored: false,
    },
];

const onboardingSteps = [
    { label: 'Verify Email', completed: true },
    { label: 'Upload ID', completed: true },
    { label: 'Profile Photo', completed: false },
    { label: 'System Check', completed: false },
];

export default function CandidateDashboard() {
    const completedSteps = onboardingSteps.filter(s => s.completed).length;
    const onboardingComplete = completedSteps === onboardingSteps.length;

    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={700}>Welcome, Test Candidate!</Typography>
                <Typography variant="body2" color="text.secondary">Ready for your next assessment? Check your assigned exams below.</Typography>
            </Box>

            {/* Onboarding Alert */}
            {!onboardingComplete && (
                <Alert severity="warning" sx={{ mb: 3 }} icon={<WarningIcon />}>
                    <Typography variant="body2" fontWeight={500}>Complete your onboarding to access proctored exams</Typography>
                    <Box sx={{ mt: 2 }}>
                        <Stepper alternativeLabel activeStep={completedSteps}>
                            {onboardingSteps.map((step) => (
                                <Step key={step.label} completed={step.completed}>
                                    <StepLabel>{step.label}</StepLabel>
                                </Step>
                            ))}
                        </Stepper>
                    </Box>
                    <Button size="small" sx={{ mt: 2 }}>Complete Onboarding</Button>
                </Alert>
            )}

            {/* Stats */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {stats.map((stat) => (
                    <Grid item xs={6} md={3} key={stat.label}>
                        <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${stat.color}.lighter`, color: `${stat.color}.main` }}>
                                {stat.icon}
                            </Box>
                            <Box>
                                <Typography variant="h5" fontWeight={700}>{stat.value}</Typography>
                                <Typography variant="body2" color="text.secondary">{stat.label}</Typography>
                            </Box>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {/* Assigned Exams */}
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Your Exams</Typography>
            <Grid container spacing={3}>
                {assignedExams.map((exam) => (
                    <Grid item xs={12} md={6} key={exam.id}>
                        <Card sx={{ height: '100%' }}>
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

                                {exam.status === 'completed' ? (
                                    <Box sx={{ bgcolor: 'success.lighter', p: 2, borderRadius: 1 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Box>
                                                <Typography variant="body2" color="success.main" fontWeight={600}>
                                                    Completed - {exam.grade}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">{exam.completedAt}</Typography>
                                            </Box>
                                            <Typography variant="h4" fontWeight={700} color="success.main">{exam.score}%</Typography>
                                        </Box>
                                    </Box>
                                ) : (
                                    <>
                                        <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1, mb: 2 }}>
                                            <Typography variant="caption" color="text.secondary">Available Window</Typography>
                                            <Typography variant="body2">{exam.window?.start} - {exam.window?.end}</Typography>
                                        </Box>
                                        <Button
                                            variant="contained"
                                            fullWidth
                                            startIcon={<PlayArrowIcon />}
                                            color="secondary"
                                            disabled={!onboardingComplete && exam.proctored}
                                        >
                                            {exam.attempts.used > 0 ? 'Retake Exam' : 'Start Exam'}
                                        </Button>
                                        {!onboardingComplete && exam.proctored && (
                                            <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                                                Complete onboarding to access proctored exams
                                            </Typography>
                                        )}
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}
