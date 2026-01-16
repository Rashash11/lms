'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box, Typography, Paper, TextField, Button, IconButton,
    Snackbar, Alert, CircularProgress, Divider, InputAdornment
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import { apiFetch } from '@shared/http/apiFetch';

export default function NewConferencePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        startTime: '',
        endTime: '',
    });
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await apiFetch('/api/conferences', {
                method: 'POST',
                body: {
                    ...formData,
                    duration: Math.round((new Date(formData.endTime).getTime() - new Date(formData.startTime).getTime()) / 60000),
                },
            });
            setSnackbar({ open: true, message: 'Conference scheduled successfully', severity: 'success' });
            setTimeout(() => router.push('/super-instructor/conferences'), 1500);
        } catch {
            setSnackbar({ open: true, message: 'An error occurred', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto', py: 4, px: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 2 }}>
                <IconButton onClick={() => router.push('/super-instructor/conferences')} sx={{ color: '#6B21A8' }}>
                    <ArrowBackIcon />
                </IconButton>
                <Box>
                    <Typography variant="h4" fontWeight={700} color="#1F2937">Schedule Conference</Typography>
                    <Typography variant="body2" color="text.secondary">Create a virtual meeting for your students</Typography>
                </Box>
            </Box>

            <form onSubmit={handleSubmit}>
                <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <VideoCallIcon sx={{ color: '#6B21A8', fontSize: 20 }} />
                                <Typography variant="subtitle2" fontWeight={600}>Conference Details</Typography>
                            </Box>
                            <Divider sx={{ mb: 3 }} />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Conference Title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Description"
                                multiline
                                rows={3}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Start Time"
                                type="datetime-local"
                                value={formData.startTime}
                                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                                required
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="End Time"
                                type="datetime-local"
                                value={formData.endTime}
                                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                                required
                            />
                        </Grid>

                        <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                            <Button variant="outlined" onClick={() => router.push('/super-instructor/conferences')}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={loading}
                                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                                sx={{ bgcolor: '#6B21A8', '&:hover': { bgcolor: '#5B21B6' } }}
                            >
                                Schedule
                            </Button>
                        </Grid>
                    </Grid>
                </Paper>
            </form>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
}
