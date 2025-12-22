'use client';

import React, { useState } from 'react';
import {
    Box, Typography, TextField, Button, Checkbox, FormControlLabel,
    Snackbar, Alert, Breadcrumbs, Link, InputAdornment, Tooltip, IconButton,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

export default function AddGroupPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        assignGroupKey: false,
        groupKey: '',
        autoEnroll: false,
    });

    // Validation errors
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        let value: string | boolean = event.target.value;

        // Handle checkbox
        if (event.target.type === 'checkbox') {
            value = (event.target as HTMLInputElement).checked;

            // Auto-generate key when checkbox is checked
            if (field === 'assignGroupKey' && value) {
                const randomKey = Math.random().toString(36).substring(2, 10).toUpperCase();
                setFormData(prev => ({ ...prev, groupKey: randomKey }));
            }
        }

        setFormData(prev => ({ ...prev, [field]: value }));

        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (formData.description.length > 500) {
            newErrors.description = 'Description cannot exceed 500 characters';
        }

        if (formData.price && parseFloat(formData.price) < 0) {
            newErrors.price = 'Price must be 0 or greater';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            const payload: any = {
                name: formData.name,
                description: formData.description || undefined,
                price: formData.price ? parseFloat(formData.price) : undefined,
                groupKey: formData.assignGroupKey ? formData.groupKey : undefined,
                autoEnroll: formData.autoEnroll,
            };

            const res = await fetch('/api/groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                setSnackbar({ open: true, message: 'Group created', severity: 'success' });
                setTimeout(() => {
                    router.push('/admin/groups');
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

    const handleCancel = () => {
        router.push('/admin/groups');
    };

    const remainingChars = 500 - formData.description.length;

    return (
        <Box>
            {/* Breadcrumb */}
            <Breadcrumbs sx={{ mb: 2 }}>
                <Link
                    href="/admin/groups"
                    underline="hover"
                    color="#1976d2"
                    sx={{ cursor: 'pointer', fontSize: 14 }}
                    onClick={(e) => { e.preventDefault(); router.push('/admin/groups'); }}
                >
                    Groups
                </Link>
                <Typography color="text.primary" sx={{ fontSize: 14 }}>Add group</Typography>
            </Breadcrumbs>

            {/* Header */}
            <Typography variant="h5" fontWeight={600} sx={{ mb: 4, color: '#1a2b4a' }}>
                Add group
            </Typography>

            {/* Form */}
            <Box sx={{ maxWidth: 600 }}>
                {/* Name */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" sx={{ mb: 0.5, color: '#1a2b4a' }}>
                        Name <span style={{ color: '#d32f2f' }}>*</span>
                    </Typography>
                    <TextField
                        fullWidth
                        size="small"
                        value={formData.name}
                        onChange={handleChange('name')}
                        error={!!errors.name}
                        helperText={errors.name}
                        sx={{ bgcolor: '#f8f9fa' }}
                    />
                </Box>

                {/* Description */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" sx={{ mb: 0.5, color: '#1a2b4a' }}>
                        Description
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        placeholder="Short description up to 500 characters"
                        value={formData.description}
                        onChange={handleChange('description')}
                        error={!!errors.description}
                        helperText={errors.description || `${remainingChars} characters remaining`}
                        sx={{ bgcolor: '#f8f9fa' }}
                    />
                </Box>

                {/* Price */}
                <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="body2" sx={{ color: '#1a2b4a' }}>
                            Price
                        </Typography>
                        <Tooltip title="Set a price for selling access to this group." arrow>
                            <IconButton size="small" sx={{ ml: 0.5 }}>
                                <InfoOutlinedIcon sx={{ fontSize: 16, color: '#ff9800' }} />
                            </IconButton>
                        </Tooltip>
                    </Box>
                    <TextField
                        fullWidth
                        size="small"
                        type="number"
                        value={formData.price}
                        onChange={handleChange('price')}
                        error={!!errors.price}
                        helperText={errors.price}
                        sx={{ bgcolor: '#f8f9fa' }}
                        InputProps={{
                            endAdornment: <InputAdornment position="end">$</InputAdornment>,
                        }}
                        inputProps={{ min: 0, step: 0.01 }}
                    />
                </Box>

                {/* Group key */}
                <Box sx={{ mb: 3 }}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={formData.assignGroupKey}
                                onChange={handleChange('assignGroupKey')}
                                sx={{ '&.Mui-checked': { color: '#1976d2' } }}
                            />
                        }
                        label={
                            <Typography variant="body2" sx={{ color: '#1a2b4a' }}>
                                Assign group key
                            </Typography>
                        }
                    />
                    {formData.assignGroupKey && (
                        <TextField
                            fullWidth
                            size="small"
                            label="Group key"
                            value={formData.groupKey}
                            onChange={handleChange('groupKey')}
                            sx={{ mt: 1, bgcolor: '#f8f9fa' }}
                        />
                    )}
                </Box>

                {/* Auto-enroll */}
                <Box sx={{ mb: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={formData.autoEnroll}
                                    onChange={handleChange('autoEnroll')}
                                    sx={{ '&.Mui-checked': { color: '#1976d2' } }}
                                />
                            }
                            label={
                                <Typography variant="body2" sx={{ color: '#1a2b4a' }}>
                                    Auto-enroll users to courses
                                </Typography>
                            }
                        />
                        <Tooltip title="Automatically enroll group users to assigned courses." arrow>
                            <IconButton size="small">
                                <InfoOutlinedIcon sx={{ fontSize: 16, color: '#ff9800' }} />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={loading}
                        sx={{
                            bgcolor: '#1976d2',
                            textTransform: 'none',
                            px: 4,
                            '&:hover': { bgcolor: '#1565c0' },
                        }}
                    >
                        {loading ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={handleCancel}
                        sx={{
                            textTransform: 'none',
                            px: 3,
                            borderColor: '#ccc',
                            color: '#1a2b4a',
                            '&:hover': { borderColor: '#999', bgcolor: 'transparent' },
                        }}
                    >
                        Cancel
                    </Button>
                </Box>
            </Box>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
