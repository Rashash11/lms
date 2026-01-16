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
import { getCsrfToken } from '@/lib/client-csrf';

// Common timezones list{ getCsrfToken } from '@/lib/client-csrf';

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
    { value: 'learner', label: 'Learner', role: 'LEARNER' },
    { value: 'instructor', label: 'Instructor', role: 'INSTRUCTOR' },
    { value: 'super_instructor', label: 'Super instructor', role: 'SUPER_INSTRUCTOR' },
    { value: 'admin', label: 'Administrator', role: 'ADMIN' },
];

export default function AddUserPage() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
    const [loading, setLoading] = useState(false);
    const [showAvatarHint, setShowAvatarHint] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [activeUserRole, setActiveUserRole] = useState<string>('');

    // Fetch current user's role on mount
    useEffect(() => {
        fetch('/api/me').then(res => res.json()).then(data => {
            if (data.user) {
                setActiveUserRole(data.user.activeRole);
            }
        });
    }, []);

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
            const payload = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                username: formData.username,
                password: formData.password || undefined,
                status: formData.isActive ? 'ACTIVE' : 'INACTIVE',
                roles: [userTypes.find(t => t.value === formData.userType)?.role || 'LEARNER'],
                excludeFromEmails: formData.excludeFromEmails,
                // These fields will be used when the schema is updated
                bio: formData.bio || undefined,
                timezone: formData.timezone,
                language: formData.language,
                deactivateAt: formData.showDeactivateAt && formData.deactivateAt ? formData.deactivateAt : undefined,
            };

            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-csrf-token': getCsrfToken()
                },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                setSnackbar({ open: true, message: 'User created successfully', severity: 'success' });
                setTimeout(() => {
                    router.push('/super-instructor/users');
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
        router.push('/super-instructor/users');
    };

    return (
        <Box className="animate-fade-in" sx={{ p: { xs: 2, md: 3 } }}>
            {/* Breadcrumb */}
            <Breadcrumbs sx={{ mb: 2, '& .MuiBreadcrumbs-separator': { color: 'hsl(var(--muted-foreground))' } }}>
                <Link
                    href="/super-instructor/users"
                    underline="hover"
                    sx={{ cursor: 'pointer', fontSize: 14, color: 'hsl(var(--muted-foreground))', '&:hover': { color: 'hsl(var(--primary))' } }}
                    onClick={(e) => { e.preventDefault(); router.push('/super-instructor/users'); }}
                >
                    Users
                </Link>
                <Typography sx={{ fontSize: 14, color: 'hsl(var(--foreground))', fontWeight: 500 }}>Add user</Typography>
            </Breadcrumbs>

            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: 'hsl(var(--foreground))', letterSpacing: '-0.02em', mb: 1 }}>
                    Add user
                </Typography>
                <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))' }}>
                    Create a new user account and assign roles
                </Typography>
            </Box>

            {/* Main Content */}
            <Box className="glass-card" sx={{ p: 4, display: 'flex', gap: 6, flexWrap: { xs: 'wrap', md: 'nowrap' }, alignItems: 'flex-start', borderRadius: 4 }}>
                {/* Left Column - Avatar */}
                <Box sx={{ width: { xs: '100%', md: 240 }, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Box
                        sx={{ position: 'relative' }}
                        onMouseEnter={() => setShowAvatarHint(true)}
                        onMouseLeave={() => setShowAvatarHint(false)}
                    >
                        <Box
                            sx={{
                                width: 180,
                                height: 180,
                                bgcolor: 'hsl(var(--background))',
                                border: '2px dashed hsla(var(--border))',
                                borderRadius: '50%',
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
                                right: 0,
                                bottom: 0,
                                top: 'auto',
                                transform: 'none',
                                bgcolor: 'hsl(var(--primary))',
                                color: 'hsl(var(--primary-foreground))',
                                width: 40,
                                height: 40,
                                boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                                '&:hover': { bgcolor: 'hsl(var(--primary))', transform: 'scale(1.1)' },
                                transition: 'all 0.2s ease'
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
                                    bgcolor: 'hsl(var(--card))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: 1,
                                    p: 1,
                                    boxShadow: '0 8px 32px -8px rgba(0, 0, 0, 0.5)',
                                    whiteSpace: 'nowrap',
                                    zIndex: 10,
                                }}
                            >
                                <Typography variant="caption" component="div" sx={{ color: 'hsl(var(--muted-foreground))' }}>
                                    Accepted files: <Link href="#" sx={{ color: 'hsl(var(--primary))' }}>gif</Link>, <Link href="#" sx={{ color: 'hsl(var(--primary))' }}>jpeg</Link>, <Link href="#" sx={{ color: 'hsl(var(--primary))' }}>png</Link>
                                </Typography>
                                <Typography variant="caption" component="div" sx={{ color: 'hsl(var(--destructive))' }}>
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
                            sx={{ mb: 2.5 }}
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
                            sx={{ mb: 2.5 }}
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
                            sx={{ mb: 2.5 }}
                        />
                        <TextField
                            label="Bio"
                            fullWidth
                            multiline
                            rows={4}
                            value={formData.bio}
                            onChange={handleChange('bio')}
                            sx={{ mb: 2.5 }}
                        />
                    </Box>

                    {/* Sign in credentials */}
                    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, color: 'hsl(var(--foreground))' }}>
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
                            sx={{ mb: 2.5 }}
                        />
                        <TextField
                            label="Password"
                            fullWidth
                            size="small"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Type new password"
                            value={formData.password}
                            onChange={handleChange('password')}
                            sx={{ mb: 1 }}
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
                            <Link href="#" sx={{ color: 'hsl(var(--primary))' }}>one uppercase letter</Link>,{' '}
                            <Link href="#" sx={{ color: 'hsl(var(--primary))' }}>one lowercase letter</Link> and{' '}
                            <Link href="#" sx={{ color: 'hsl(var(--primary))' }}>one number</Link>.
                        </Typography>
                    </Box>

                    {/* Location and language */}
                    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, color: 'hsl(var(--foreground))' }}>
                        Location and language
                    </Typography>
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="body2" sx={{ mb: 0.5, color: 'hsl(var(--foreground))' }}>Timezone</Typography>
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
                                    sx={{ mb: 2.5 }}
                                    InputProps={{
                                        ...params.InputProps,
                                        endAdornment: (
                                            <>
                                                <InputAdornment position="end">
                                                    <SearchIcon sx={{ color: 'hsl(var(--muted-foreground))', fontSize: 20 }} />
                                                </InputAdornment>
                                                {params.InputProps.endAdornment}
                                            </>
                                        ),
                                    }}
                                />
                            )}
                        />

                        <Typography variant="body2" sx={{ mb: 0.5, color: 'hsl(var(--foreground))' }}>Language</Typography>
                        <FormControl fullWidth size="small" sx={{ mb: 2.5 }}>
                            <Select
                                value={formData.language}
                                onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                            >
                                {languages.map(lang => (
                                    <MenuItem key={lang.value} value={lang.value}>{lang.label}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Typography variant="body2" sx={{ mb: 0.5, color: 'hsl(var(--foreground))' }}>
                            User type <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
                        </Typography>
                        <FormControl fullWidth size="small" sx={{ mb: 2.5 }}>
                            <Select
                                value={formData.userType}
                                onChange={(e) => setFormData(prev => ({ ...prev, userType: e.target.value }))}
                            >
                                {userTypes.filter(type => {
                                    // Super Instructors cannot assign ADMIN role
                                    if (activeUserRole === 'SUPER_INSTRUCTOR' && type.role === 'ADMIN') {
                                        return false;
                                    }
                                    return true;
                                }).map(type => (
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
                                    color: 'hsl(var(--primary))',
                                    '&.Mui-checked': { color: 'hsl(var(--primary))' },
                                    p: 0, mr: 1,
                                }}
                            />
                            <Typography variant="body2" sx={{ color: 'hsl(var(--foreground))' }}>Active</Typography>
                            <IconButton size="small" sx={{ ml: 0.5 }}>
                                <InfoOutlinedIcon sx={{ fontSize: 16, color: 'hsl(var(--warning))' }} />
                            </IconButton>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Checkbox
                                checked={formData.showDeactivateAt}
                                onChange={(e) => setFormData(prev => ({ ...prev, showDeactivateAt: e.target.checked }))}
                                sx={{ p: 0, mr: 1 }}
                            />
                            <Typography variant="body2" sx={{ color: 'hsl(var(--foreground))' }}>Deactivate at</Typography>
                            <IconButton size="small" sx={{ ml: 0.5 }}>
                                <InfoOutlinedIcon sx={{ fontSize: 16, color: 'hsl(var(--warning))' }} />
                            </IconButton>
                        </Box>
                        {formData.showDeactivateAt && (
                            <TextField
                                type="date"
                                size="small"
                                value={formData.deactivateAt}
                                onChange={handleChange('deactivateAt')}
                                sx={{ ml: 3, mb: 1.5, width: 200 }}
                            />
                        )}

                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Checkbox
                                checked={formData.excludeFromEmails}
                                onChange={handleCheckboxChange('excludeFromEmails')}
                                sx={{ p: 0, mr: 1 }}
                            />
                            <Link href="#" underline="hover" sx={{ color: 'hsl(var(--primary))', fontSize: 14 }}>
                                Exclude from all non-essential emails and notifications
                            </Link>
                        </Box>
                    </Box>
                </Box>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, mt: 4, justifyContent: 'flex-end' }}>
                <Button
                    variant="outlined"
                    onClick={handleCancel}
                    sx={{
                        textTransform: 'none',
                        px: 4,
                        py: 1,
                        borderColor: 'hsl(var(--border))',
                        color: 'hsl(var(--foreground))',
                        fontWeight: 600,
                        '&:hover': {
                            borderColor: 'hsl(var(--primary))',
                            bgcolor: 'hsl(var(--primary) / 0.1)',
                            color: 'hsl(var(--primary))'
                        },
                    }}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={loading}
                    sx={{
                        bgcolor: 'hsl(var(--primary))',
                        color: 'hsl(var(--primary-foreground))',
                        textTransform: 'none',
                        px: 6,
                        py: 1,
                        fontWeight: 700,
                        boxShadow: '0 4px 12px hsl(var(--primary) / 0.3)',
                        '&:hover': {
                            bgcolor: 'hsl(var(--primary))',
                            boxShadow: '0 6px 16px hsl(var(--primary) / 0.4)',
                            transform: 'translateY(-1px)'
                        },
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                >
                    {loading ? 'Saving...' : 'Create User'}
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
