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
import GroupIcon from '@mui/icons-material/Group';
import { getCsrfToken } from '@/lib/client-csrf';

export default function NewGroupPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        groupKey: '',
    });
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) {
            setSnackbar({ open: true, message: 'Group name is required', severity: 'error' });
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/groups', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-csrf-token': getCsrfToken()
                },
                body: JSON.stringify({
                    ...formData,
                    price: formData.price ? parseFloat(formData.price) : null,
                }),
            });

            if (res.ok) {
                setSnackbar({ open: true, message: 'Group created successfully', severity: 'success' });
                setTimeout(() => {
                    router.push('/super-instructor/groups');
                }, 1500);
            } else {
                const error = await res.json();
                setSnackbar({ open: true, message: error.error || 'Failed to create group', severity: 'error' });
            }
        } catch (error) {
            setSnackbar({ open: true, message: 'Failed to create group', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto', py: 4, px: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 2 }}>
                <IconButton onClick={() => router.push('/super-instructor/groups')} sx={{ color: '#6B21A8' }}>
                    <ArrowBackIcon />
                </IconButton>
                <Box>
                    <Typography variant="h4" fontWeight={700} color="#1F2937">Add Group</Typography>
                    <Typography variant="body2" color="text.secondary">Create a new group to organize users and courses</Typography>
                </Box>
            </Box>

            <form onSubmit={handleSubmit}>
                <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <GroupIcon sx={{ color: '#6B21A8', fontSize: 20 }} />
                                <Typography variant="subtitle2" fontWeight={600}>Group Information</Typography>
                            </Box>
                            <Divider sx={{ mb: 3 }} />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Group Name"
                                placeholder="e.g. Sales Team, Advanced Learners"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Description"
                                multiline
                                rows={4}
                                placeholder="Add a description for this group..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Price (Optional)"
                                type="number"
                                placeholder="0.00"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                }}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Group Key (Optional)"
                                placeholder="e.g. sales-2024"
                                value={formData.groupKey}
                                onChange={(e) => setFormData({ ...formData, groupKey: e.target.value })}
                                helperText="Used for self-enrollment via key"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                        </Grid>

                        <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }} component="div">
                            <Button
                                variant="outlined"
                                onClick={() => router.push('/super-instructor/groups')}
                                sx={{ borderRadius: 2, px: 4, borderColor: '#6B21A8', color: '#6B21A8' }}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={loading}
                                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                                sx={{
                                    borderRadius: 2,
                                    px: 4,
                                    bgcolor: '#6B21A8',
                                    '&:hover': { bgcolor: '#5B21B6' }
                                }}
                            >
                                Create Group
                            </Button>
                        </Grid>
                    </Grid>
                </Paper>
            </form>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
