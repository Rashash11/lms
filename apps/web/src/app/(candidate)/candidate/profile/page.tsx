'use client';

import React, { useState } from 'react';
import {
    Box, Typography, Card, CardContent, Button, Chip, Paper,
    Avatar, TextField, FormControl, InputLabel, Select, MenuItem,
    Stepper, Step, StepLabel, Alert, Divider,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import PersonIcon from '@mui/icons-material/Person';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import BadgeIcon from '@mui/icons-material/Badge';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import UploadIcon from '@mui/icons-material/Upload';
import ComputerIcon from '@mui/icons-material/Computer';

const onboardingSteps = [
    { label: 'Verify Email', completed: true, description: 'Your email has been verified' },
    { label: 'Upload ID', completed: true, description: 'Government-issued ID uploaded' },
    { label: 'Profile Photo', completed: false, description: 'Take a photo for identity verification' },
    { label: 'System Check', completed: false, description: 'Verify your camera and microphone' },
];

export default function CandidateProfilePage() {
    const completedSteps = onboardingSteps.filter(s => s.completed).length;
    const onboardingComplete = completedSteps === onboardingSteps.length;

    return (
        <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>My Profile</Typography>

            <Grid container spacing={3}>
                {/* Profile Card */}
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Avatar sx={{ width: 100, height: 100, mx: 'auto', mb: 2, bgcolor: 'secondary.main', fontSize: 36 }}>
                                TC
                            </Avatar>
                            <Typography variant="h6" fontWeight={600}>Test Candidate</Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>candidate@example.com</Typography>
                            <Chip label="CANDIDATE" color="secondary" size="small" sx={{ mt: 1 }} />

                            <Divider sx={{ my: 3 }} />

                            <Box sx={{ textAlign: 'left' }}>
                                <Typography variant="caption" color="text.secondary">Member Since</Typography>
                                <Typography variant="body2" sx={{ mb: 2 }}>December 2024</Typography>

                                <Typography variant="caption" color="text.secondary">Exams Completed</Typography>
                                <Typography variant="body2" sx={{ mb: 2 }}>2</Typography>

                                <Typography variant="caption" color="text.secondary">Onboarding Status</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {onboardingComplete ? (
                                        <Chip label="Complete" size="small" color="success" icon={<CheckCircleIcon />} />
                                    ) : (
                                        <Chip label={`${completedSteps}/${onboardingSteps.length} steps`} size="small" color="warning" />
                                    )}
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Onboarding & Details */}
                <Grid item xs={12} md={8}>
                    {/* Onboarding */}
                    {!onboardingComplete && (
                        <Card sx={{ mb: 3 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>Complete Your Onboarding</Typography>
                                <Alert severity="info" sx={{ mb: 3 }}>
                                    Complete all steps to access proctored exams
                                </Alert>
                                <Stepper activeStep={completedSteps} alternativeLabel>
                                    {onboardingSteps.map((step) => (
                                        <Step key={step.label} completed={step.completed}>
                                            <StepLabel>{step.label}</StepLabel>
                                        </Step>
                                    ))}
                                </Stepper>

                                <Box sx={{ mt: 3 }}>
                                    {!onboardingSteps[2].completed && (
                                        <Paper sx={{ p: 2, mb: 2, bgcolor: 'warning.lighter' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <PhotoCameraIcon color="warning" />
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography variant="subtitle2">Profile Photo Required</Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Take a clear photo of your face for identity verification
                                                    </Typography>
                                                </Box>
                                                <Button variant="contained" size="small" startIcon={<PhotoCameraIcon />}>
                                                    Take Photo
                                                </Button>
                                            </Box>
                                        </Paper>
                                    )}
                                    {!onboardingSteps[3].completed && (
                                        <Paper sx={{ p: 2, bgcolor: 'grey.100' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <ComputerIcon color="action" />
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography variant="subtitle2">System Check</Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Verify your camera and microphone work correctly
                                                    </Typography>
                                                </Box>
                                                <Button variant="outlined" size="small">
                                                    Run Check
                                                </Button>
                                            </Box>
                                        </Paper>
                                    )}
                                </Box>
                            </CardContent>
                        </Card>
                    )}

                    {/* Profile Details */}
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Profile Details</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <TextField fullWidth label="First Name" defaultValue="Test" size="small" />
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField fullWidth label="Last Name" defaultValue="Candidate" size="small" />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField fullWidth label="Email" defaultValue="candidate@example.com" size="small" disabled />
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField fullWidth label="Phone" defaultValue="+1 (555) 123-4567" size="small" />
                                </Grid>
                                <Grid item xs={6}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Timezone</InputLabel>
                                        <Select defaultValue="est" label="Timezone">
                                            <MenuItem value="est">Eastern Time (EST)</MenuItem>
                                            <MenuItem value="pst">Pacific Time (PST)</MenuItem>
                                            <MenuItem value="utc">UTC</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12}>
                                    <Button variant="contained">Save Changes</Button>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}
