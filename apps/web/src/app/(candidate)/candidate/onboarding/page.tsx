'use client';

import React from 'react';
import { Box, Typography, Paper, Stepper, Step, StepLabel, Card, CardContent, Button, Alert, Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import EmailIcon from '@mui/icons-material/Email';
import BadgeIcon from '@mui/icons-material/Badge';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import ComputerIcon from '@mui/icons-material/Computer';

const steps = [
    { label: 'Verify Email', icon: <EmailIcon />, completed: true, description: 'Your email has been verified successfully.' },
    { label: 'Upload ID Document', icon: <BadgeIcon />, completed: true, description: 'Government-issued ID has been uploaded and verified.' },
    { label: 'Take Profile Photo', icon: <PhotoCameraIcon />, completed: false, description: 'Take a clear photo of your face for identity verification during proctored exams.' },
    { label: 'System Compatibility Check', icon: <ComputerIcon />, completed: false, description: 'Verify your camera, microphone, and browser work correctly for proctored exams.' },
];

export default function CandidateOnboardingPage() {
    const completedCount = steps.filter(s => s.completed).length;
    const isComplete = completedCount === steps.length;

    return (
        <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>Onboarding</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Complete all steps to access proctored exams
            </Typography>

            {isComplete ? (
                <Alert severity="success" sx={{ mb: 3 }}>
                    <Typography variant="body2" fontWeight={600}>Onboarding Complete!</Typography>
                    <Typography variant="body2">You can now access all proctored exams.</Typography>
                </Alert>
            ) : (
                <Alert severity="info" sx={{ mb: 3 }}>
                    <Typography variant="body2">
                        Progress: {completedCount}/{steps.length} steps completed
                    </Typography>
                </Alert>
            )}

            {steps.map((step, index) => (
                <Card key={index} sx={{ mb: 2, border: !step.completed ? 2 : 0, borderColor: 'warning.main' }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{
                                p: 1.5,
                                borderRadius: '50%',
                                bgcolor: step.completed ? 'success.lighter' : 'grey.100',
                                color: step.completed ? 'success.main' : 'grey.500'
                            }}>
                                {step.icon}
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="h6">{step.label}</Typography>
                                    {step.completed ? (
                                        <Chip label="Completed" size="small" color="success" icon={<CheckCircleIcon />} />
                                    ) : (
                                        <Chip label="Pending" size="small" color="warning" />
                                    )}
                                </Box>
                                <Typography variant="body2" color="text.secondary">{step.description}</Typography>
                            </Box>
                            {!step.completed && (
                                <Button variant="contained" color="secondary">
                                    {index === 2 ? 'Take Photo' : 'Run Check'}
                                </Button>
                            )}
                        </Box>
                    </CardContent>
                </Card>
            ))}
        </Box>
    );
}
