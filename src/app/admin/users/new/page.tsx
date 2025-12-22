'use client';

import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, TextField, Button, Select, MenuItem,
    FormControl, InputLabel, Checkbox, FormControlLabel, Snackbar, Alert,
    InputAdornment, IconButton, Breadcrumbs, Link, Autocomplete,
} from '@mui/material';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import SearchIcon from '@mui/icons-material/Search';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined';

// Common timezones list
const timezones = [
    { value: 'UTC', label: '(GMT +00:00) UTC' },
    { value: 'Europe/London', label: '(GMT +00:00) Greenwich Mean Time: Edinburgh, Lisbon, London' },
    { value: 'Europe/Paris', label: '(GMT +01:00) Central European Time: Amsterdam, Berlin, Paris' },
    { value: 'Europe/Athens', label: '(GMT +02:00) Eastern European Time: Athens, Cairo, Helsinki' },
    { value: 'Europe/Moscow', label: '(GMT +03:00) Moscow, St. Petersburg' },
    { value: 'Asia/Dubai', label: '(GMT +04:00) Abu Dhabi, Dubai, Muscat' },
    { value: 'Asia/Karachi', label: '(GMT +05:00) Islamabad, Karachi' },
    { value: 'Asia/Kolkata', label: '(GMT +05:30) Chennai, Kolkata, Mumbai, New Delhi' },
    { value: 'Asia/Dhaka', label: '(GMT +06:00) Dhaka' },
    { value: 'Asia/Bangkok', label: '(GMT +07:00) Bangkok, Hanoi, Jakarta' },
    { value: 'Asia/Shanghai', label: '(GMT +08:00) Beijing, Hong Kong, Singapore' },
    { value: 'Asia/Tokyo', label: '(GMT +09:00) Tokyo, Seoul, Osaka' },
    { value: 'Australia/Sydney', label: '(GMT +10:00) Canberra, Melbourne, Sydney' },
    { value: 'Pacific/Auckland', label: '(GMT +12:00) Auckland, Wellington' },
    { value: 'America/New_York', label: '(GMT -05:00) Eastern Time (US & Canada)' },
    { value: 'America/Chicago', label: '(GMT -06:00) Central Time (US & Canada)' },
    { value: 'America/Denver', label: '(GMT -07:00) Mountain Time (US & Canada)' },
    { value: 'America/Los_Angeles', label: '(GMT -08:00) Pacific Time (US & Canada)' },
    { value: 'America/Anchorage', label: '(GMT -09:00) Alaska' },
    { value: 'Pacific/Honolulu', label: '(GMT -10:00) Hawaii' },
];

const languages = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'it', label: 'Italian' },
    { value: 'pt', label: 'Portuguese' },
    { value: 'ar', label: 'Arabic' },
    { value: 'zh', label: 'Chinese' },
    { value: 'ja', label: 'Japanese' },
    { value: 'ko', label: 'Korean' },
];

const userTypes = [
    { value: 'learner', label: 'Learner-Type' },
    { value: 'instructor', label: 'Instructor-Type' },
    { value: 'admin', label: 'Admin-Type' },
];

export default function AddUserPage() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
    const [loading, setLoading] = useState(false);
    const [showAvatarHint, setShowAvatarHint] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Form state
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        bio: '',
        username: '',
        password: '',
        timezone: 'Europe/London',
        language: 'en',
        userType: 'learner',
        isActive: true,
        deactivateAt: '',
        showDeactivateAt: false,
        excludeFromEmails: false,
    });

    // Validation errors
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { value: unknown } }) => {
        setFormData(prev => ({ ...prev, [field]: event.target.value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleCheckboxChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [field]: event.target.checked }));
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.firstName.trim()) {
            newErrors.firstName = 'First name is required';
        }
        if (!formData.lastName.trim()) {
            newErrors.lastName = 'Last name is required';
        }
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }
        if (!formData.username.trim()) {
            newErrors.username = 'Username is required';
        } else if (formData.username.length < 3) {
            newErrors.username = 'Username must be at least 3 characters';
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
            // Map user type to role
            const roleMapping: Record<string, string> = {
                'learner': 'LEARNER',
                'instructor': 'INSTRUCTOR',
                'admin': 'ADMIN',
            };

            const payload = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                username: formData.username,
                password: formData.password || undefined,
                status: formData.isActive ? 'ACTIVE' : 'INACTIVE',
                roles: [roleMapping[formData.userType] || 'LEARNER'],
                excludeFromEmails: formData.excludeFromEmails,
                // These fields will be used when the schema is updated
                bio: formData.bio || undefined,
                timezone: formData.timezone,
                language: formData.language,
                deactivateAt: formData.showDeactivateAt && formData.deactivateAt ? formData.deactivateAt : undefined,
            };

            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                setSnackbar({ open: true, message: 'User created successfully', severity: 'success' });
                setTimeout(() => {
                    router.push('/admin/users');
                }, 1500);
            } else {
                const error = await res.json();
                setSnackbar({ open: true, message: error.error || 'Failed to create user', severity: 'error' });
            }
        } catch (error) {
            setSnackbar({ open: true, message: 'Failed to create user', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        router.push('/admin/users');
    };

    return (
        <Box>
            {/* Breadcrumb */}
            <Breadcrumbs sx={{ mb: 2 }}>
                <Link
                    href="/admin/users"
                    underline="hover"
                    color="#1976d2"
                    sx={{ cursor: 'pointer', fontSize: 14 }}
                    onClick={(e) => { e.preventDefault(); router.push('/admin/users'); }}
                >
                    Users
                </Link>
                <Typography color="text.primary" sx={{ fontSize: 14 }}>Add user</Typography>
            </Breadcrumbs>

            {/* Header */}
            <Typography variant="h5" fontWeight={600} sx={{ mb: 3, color: '#1a2b4a' }}>
                Add user
            </Typography>

            {/* Main Content */}
            <Box sx={{ display: 'flex', gap: 4, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
                {/* Left Column - Avatar */}
                <Box sx={{ width: { xs: '100%', md: 200 }, flexShrink: 0 }}>
                    <Box
                        sx={{ position: 'relative' }}
                        onMouseEnter={() => setShowAvatarHint(true)}
                        onMouseLeave={() => setShowAvatarHint(false)}
                    >
                        <Box
                            sx={{
                                width: 150,
                                height: 180,
                                bgcolor: '#8b7355',
                                borderRadius: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                position: 'relative',
                            }}
                        >
                            {avatarPreview ? (
                                <Image
                                    src={avatarPreview}
                                    alt="Avatar preview"
                                    fill
                                    sizes="150px"
                                    style={{ objectFit: 'cover' }}
                                    unoptimized
                                />
                            ) : null}
                        </Box>

                        {/* Camera Upload Button */}
                        <IconButton
                            onClick={() => fileInputRef.current?.click()}
                            sx={{
                                position: 'absolute',
                                right: -20,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                bgcolor: '#1a2b4a',
                                color: 'white',
                                width: 44,
                                height: 44,
                                '&:hover': { bgcolor: '#0d47a1' },
                            }}
                        >
                            <CameraAltOutlinedIcon />
                        </IconButton>

                        {/* Hidden file input */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".gif,.jpeg,.jpg,.png"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    // Check file size (3MB max)
                                    if (file.size > 3 * 1024 * 1024) {
                                        setSnackbar({ open: true, message: 'File size must be less than 3 MB', severity: 'error' });
                                        return;
                                    }
                                    // Create preview URL
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                        setAvatarPreview(reader.result as string);
                                    };
                                    reader.readAsDataURL(file);
                                }
                            }}
                        />

                        {/* File hints tooltip */}
                        {showAvatarHint && (
                            <Box
                                sx={{
                                    position: 'absolute',
                                    left: 0,
                                    bottom: -50,
                                    bgcolor: 'white',
                                    border: '1px solid #e0e0e0',
                                    borderRadius: 1,
                                    p: 1,
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                    whiteSpace: 'nowrap',
                                    zIndex: 10,
                                }}
                            >
                                <Typography variant="caption" component="div" sx={{ color: '#666' }}>
                                    Accepted files: <Link href="#" sx={{ color: '#1976d2' }}>gif</Link>, <Link href="#" sx={{ color: '#1976d2' }}>jpeg</Link>, <Link href="#" sx={{ color: '#1976d2' }}>png</Link>
                                </Typography>
                                <Typography variant="caption" component="div" sx={{ color: '#d32f2f' }}>
                                    Max file size: 3 MB
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Box>

                {/* Right Column - Form */}
                <Box sx={{ flex: 1, maxWidth: 600 }}>
                    {/* Basic Info */}
                    <Box sx={{ mb: 4 }}>
                        <TextField
                            label="First name"
                            required
                            fullWidth
                            size="small"
                            value={formData.firstName}
                            onChange={handleChange('firstName')}
                            error={!!errors.firstName}
                            helperText={errors.firstName}
                            sx={{ mb: 2.5, bgcolor: '#f8f9fa' }}
                        />
                        <TextField
                            label="Last name"
                            required
                            fullWidth
                            size="small"
                            value={formData.lastName}
                            onChange={handleChange('lastName')}
                            error={!!errors.lastName}
                            helperText={errors.lastName}
                            sx={{ mb: 2.5, bgcolor: '#f8f9fa' }}
                        />
                        <TextField
                            label="Email"
                            required
                            fullWidth
                            size="small"
                            type="email"
                            value={formData.email}
                            onChange={handleChange('email')}
                            error={!!errors.email}
                            helperText={errors.email}
                            sx={{ mb: 2.5, bgcolor: '#f8f9fa' }}
                        />
                        <TextField
                            label="Bio"
                            fullWidth
                            multiline
                            rows={4}
                            value={formData.bio}
                            onChange={handleChange('bio')}
                            sx={{ mb: 2.5, bgcolor: '#f8f9fa' }}
                        />
                    </Box>

                    {/* Sign in credentials */}
                    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, color: '#1a2b4a' }}>
                        Sign in credentials
                    </Typography>
                    <Box sx={{ mb: 4 }}>
                        <TextField
                            label="Username"
                            required
                            fullWidth
                            size="small"
                            value={formData.username}
                            onChange={handleChange('username')}
                            error={!!errors.username}
                            helperText={errors.username}
                            sx={{ mb: 2.5, bgcolor: '#f8f9fa' }}
                        />
                        <TextField
                            label="Password"
                            fullWidth
                            size="small"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Type new password"
                            value={formData.password}
                            onChange={handleChange('password')}
                            sx={{ mb: 1, bgcolor: '#f8f9fa' }}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                            size="small"
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                            Passwords are required to be at least 8 characters long, and contain at least{' '}
                            <Link href="#" sx={{ color: '#1976d2' }}>one uppercase letter</Link>,{' '}
                            <Link href="#" sx={{ color: '#1976d2' }}>one lowercase letter</Link> and{' '}
                            <Link href="#" sx={{ color: '#1976d2' }}>one number</Link>.
                        </Typography>
                    </Box>

                    {/* Location and language */}
                    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, color: '#1a2b4a' }}>
                        Location and language
                    </Typography>
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="body2" sx={{ mb: 0.5, color: '#1a2b4a' }}>Timezone</Typography>
                        <Autocomplete
                            options={timezones}
                            getOptionLabel={(option) => option.label}
                            value={timezones.find(tz => tz.value === formData.timezone) || timezones[1]}
                            onChange={(_, newValue) => {
                                if (newValue) {
                                    setFormData(prev => ({ ...prev, timezone: newValue.value }));
                                }
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    size="small"
                                    sx={{ mb: 2.5, bgcolor: '#f8f9fa' }}
                                    InputProps={{
                                        ...params.InputProps,
                                        endAdornment: (
                                            <>
                                                <InputAdornment position="end">
                                                    <SearchIcon sx={{ color: '#999', fontSize: 20 }} />
                                                </InputAdornment>
                                                {params.InputProps.endAdornment}
                                            </>
                                        ),
                                    }}
                                />
                            )}
                        />

                        <Typography variant="body2" sx={{ mb: 0.5, color: '#1a2b4a' }}>Language</Typography>
                        <FormControl fullWidth size="small" sx={{ mb: 2.5 }}>
                            <Select
                                value={formData.language}
                                onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                                sx={{ bgcolor: '#f8f9fa' }}
                            >
                                {languages.map(lang => (
                                    <MenuItem key={lang.value} value={lang.value}>{lang.label}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Typography variant="body2" sx={{ mb: 0.5, color: '#1a2b4a' }}>
                            User type <span style={{ color: '#d32f2f' }}>*</span>
                        </Typography>
                        <FormControl fullWidth size="small" sx={{ mb: 2.5 }}>
                            <Select
                                value={formData.userType}
                                onChange={(e) => setFormData(prev => ({ ...prev, userType: e.target.value }))}
                                sx={{ bgcolor: '#f8f9fa' }}
                            >
                                {userTypes.map(type => (
                                    <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>

                    {/* Status Options */}
                    <Box sx={{ mb: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Checkbox
                                checked={formData.isActive}
                                onChange={handleCheckboxChange('isActive')}
                                sx={{
                                    color: formData.isActive ? '#1976d2' : undefined,
                                    '&.Mui-checked': { color: '#1976d2' },
                                    p: 0, mr: 1,
                                }}
                            />
                            <Typography variant="body2" sx={{ color: '#1a2b4a' }}>Active</Typography>
                            <IconButton size="small" sx={{ ml: 0.5 }}>
                                <InfoOutlinedIcon sx={{ fontSize: 16, color: '#ff9800' }} />
                            </IconButton>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Checkbox
                                checked={formData.showDeactivateAt}
                                onChange={(e) => setFormData(prev => ({ ...prev, showDeactivateAt: e.target.checked }))}
                                sx={{ p: 0, mr: 1 }}
                            />
                            <Typography variant="body2" sx={{ color: '#1a2b4a' }}>Deactivate at</Typography>
                            <IconButton size="small" sx={{ ml: 0.5 }}>
                                <InfoOutlinedIcon sx={{ fontSize: 16, color: '#ff9800' }} />
                            </IconButton>
                        </Box>
                        {formData.showDeactivateAt && (
                            <TextField
                                type="date"
                                size="small"
                                value={formData.deactivateAt}
                                onChange={handleChange('deactivateAt')}
                                sx={{ ml: 3, mb: 1.5, bgcolor: '#f8f9fa', width: 200 }}
                            />
                        )}

                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Checkbox
                                checked={formData.excludeFromEmails}
                                onChange={handleCheckboxChange('excludeFromEmails')}
                                sx={{ p: 0, mr: 1 }}
                            />
                            <Link href="#" underline="hover" sx={{ color: '#1976d2', fontSize: 14 }}>
                                Exclude from all non-essential emails and notifications
                            </Link>
                        </Box>
                    </Box>
                </Box>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
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
