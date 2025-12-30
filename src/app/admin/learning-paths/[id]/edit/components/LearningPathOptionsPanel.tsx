'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    TextField,
    Switch,
    Select,
    MenuItem,
    FormControlLabel,
    Button,
    Drawer,
    IconButton,
    Tabs,
    Tab,
    Alert,
    CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface LearningPathOptions {
    isActive: boolean;
    code: string | null;
    category: string | null;
    completionDaysLimit: number | null;
    accessRetentionEnabled: boolean;
    courseOrderMode: 'SEQUENTIAL' | 'ANY';
    completionRule: 'ALL_COURSES_COMPLETED';
    certificateType: 'CLASSIC' | 'FANCY' | 'MODERN' | 'SIMPLE' | null;
}

interface Category {
    id: string;
    name: string;
}

interface Props {
    open: boolean;
    pathId: string;
    onClose: () => void;
    onSaved?: () => void;
}

export default function LearningPathOptionsPanel({ open, pathId, onClose, onSaved }: Props) {
    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    // Form state
    const [options, setOptions] = useState<LearningPathOptions>({
        isActive: false,
        code: null,
        category: null,
        completionDaysLimit: null,
        accessRetentionEnabled: false,
        courseOrderMode: 'ANY',
        completionRule: 'ALL_COURSES_COMPLETED',
        certificateType: null,
    });

    const [originalOptions, setOriginalOptions] = useState<LearningPathOptions | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);

    // Load initial data when panel opens
    useEffect(() => {
        if (open && pathId) {
            loadOptions();
        }
    }, [open, pathId]);

    const loadOptions = async () => {
        setLoading(true);
        setError(null);
        setFieldErrors({});

        try {
            const response = await fetch(`/api/admin/learning-paths/${pathId}/options`);
            if (response.ok) {
                const data = await response.json();
                setOptions(data.options);
                setOriginalOptions(data.options);
                setCategories(data.categories || []);
            } else {
                setError('Failed to load options');
            }
        } catch (err) {
            console.error('Failed to load options:', err);
            setError('Failed to load options');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setFieldErrors({});

        try {
            const response = await fetch(`/api/admin/learning-paths/${pathId}/options`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(options),
            });

            if (response.ok) {
                const data = await response.json();
                setOptions(data.options);
                setOriginalOptions(data.options);
                if (onSaved) onSaved();
                onClose();
            } else {
                const errorData = await response.json();
                if (errorData.field) {
                    setFieldErrors({ [errorData.field]: errorData.error });
                } else {
                    setError(errorData.error || 'Failed to save options');
                }
            }
        } catch (err) {
            console.error('Failed to save options:', err);
            setError('Failed to save options');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        if (originalOptions) {
            setOptions(originalOptions);
        }
        setError(null);
        setFieldErrors({});
        onClose();
    };

    const updateOption = <K extends keyof LearningPathOptions>(
        field: K,
        value: LearningPathOptions[K]
    ) => {
        setOptions((prev) => ({ ...prev, [field]: value }));
        // Clear field error when user starts editing
        if (fieldErrors[field]) {
            setFieldErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={handleCancel}
            ModalProps={{
                sx: { zIndex: 1300 },
            }}
            PaperProps={{
                sx: {
                    width: 480,
                    display: 'flex',
                    flexDirection: 'column',
                    bgcolor: 'rgba(13, 20, 20, 0.95)',
                },
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    p: 3,
                    borderBottom: 1,
                    borderColor: 'divider',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'hsl(var(--foreground))' }}>
                    Learning path options
                </Typography>
                <IconButton onClick={handleCancel} size="small" sx={{ color: 'hsl(var(--muted-foreground))' }}>
                    <CloseIcon />
                </IconButton>
            </Box>

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs
                    value={activeTab}
                    onChange={(e, newValue) => setActiveTab(newValue)}
                    sx={{
                        '& .MuiTab-root': {
                            textTransform: 'none',
                            fontWeight: 600,
                            color: 'hsl(var(--muted-foreground))',
                            '&.Mui-selected': { color: 'hsl(var(--primary))' }
                        },
                        '& .MuiTabs-indicator': { bgcolor: 'hsl(var(--primary))' }
                    }}
                >
                    <Tab label="Info" />
                    <Tab label="Limits" />
                    <Tab label="Completion" />
                </Tabs>
            </Box>

            {/* Content */}
            <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        {error && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {error}
                            </Alert>
                        )}

                        {/* Tab 1: Info */}
                        {activeTab === 0 && (
                            <Box>
                                {/* Activation Status */}
                                <Box sx={{ mb: 4 }}>
                                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                        Activation status
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        Activate learning path to publish it and allow learners to enroll.
                                    </Typography>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={options.isActive}
                                                onChange={(e) => updateOption('isActive', e.target.checked)}
                                            />
                                        }
                                        label="Activate learning path"
                                    />
                                </Box>

                                {/* Code */}
                                <Box sx={{ mb: 4 }}>
                                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                        Code
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        Assign a unique identifier to sort learning paths in an alphabetical order.
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        placeholder="Insert code"
                                        value={options.code || ''}
                                        onChange={(e) => updateOption('code', e.target.value || null)}
                                        error={!!fieldErrors.code}
                                        helperText={fieldErrors.code}
                                    />
                                </Box>

                                {/* Category */}
                                <Box sx={{ mb: 4 }}>
                                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                        Category
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        Add the learning path to a suitable category (e.g., Programming, Marketing, etc.).
                                    </Typography>
                                    <Select
                                        fullWidth
                                        size="small"
                                        displayEmpty
                                        value={options.category || ''}
                                        onChange={(e) => updateOption('category', e.target.value || null)}
                                    >
                                        <MenuItem value="">
                                            <em>Select a category</em>
                                        </MenuItem>
                                        {categories.map((cat) => (
                                            <MenuItem key={cat.id} value={cat.name}>
                                                {cat.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </Box>
                            </Box>
                        )}

                        {/* Tab 2: Limits */}
                        {activeTab === 1 && (
                            <Box>
                                {/* Time */}
                                <Box sx={{ mb: 4 }}>
                                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                        Time
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        Set a specific number of days in which learners have to complete the learning path after enrollment.
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                        Number of days
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        type="number"
                                        placeholder="Set number of days"
                                        value={options.completionDaysLimit || ''}
                                        onChange={(e) => {
                                            const val = e.target.value ? parseInt(e.target.value) : null;
                                            updateOption('completionDaysLimit', val);
                                        }}
                                        inputProps={{ min: 1 }}
                                        error={!!fieldErrors.completionDaysLimit}
                                        helperText={fieldErrors.completionDaysLimit}
                                    />
                                </Box>

                                {/* Access Retention */}
                                <Box sx={{ mb: 4 }}>
                                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                        Access retention
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        Set if users retain access to learning path materials after completing the learning path.
                                    </Typography>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={options.accessRetentionEnabled}
                                                onChange={(e) => updateOption('accessRetentionEnabled', e.target.checked)}
                                            />
                                        }
                                        label="Activate access retention"
                                    />
                                </Box>
                            </Box>
                        )}

                        {/* Tab 3: Completion */}
                        {activeTab === 2 && (
                            <Box>
                                {/* Courses Completion Order */}
                                <Box sx={{ mb: 4 }}>
                                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                        Courses completion order
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        Set the order in which learning path courses must be completed.
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                        Show courses in
                                    </Typography>
                                    <Select
                                        fullWidth
                                        size="small"
                                        value={options.courseOrderMode}
                                        onChange={(e) => updateOption('courseOrderMode', e.target.value as 'SEQUENTIAL' | 'ANY')}
                                    >
                                        <MenuItem value="SEQUENTIAL">In a sequential order</MenuItem>
                                        <MenuItem value="ANY">In any order</MenuItem>
                                    </Select>
                                </Box>

                                {/* Completion Rules */}
                                <Box sx={{ mb: 4 }}>
                                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                        Completion rules
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        Define the conditions required for the learning path to be marked as completed.
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                        Learning path is completed when
                                    </Typography>
                                    <Select
                                        fullWidth
                                        size="small"
                                        value={options.completionRule}
                                        onChange={(e) => updateOption('completionRule', e.target.value as 'ALL_COURSES_COMPLETED')}
                                    >
                                        <MenuItem value="ALL_COURSES_COMPLETED">All courses are completed</MenuItem>
                                    </Select>
                                </Box>

                                {/* Certificate */}
                                <Box sx={{ mb: 4 }}>
                                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                        Certificate
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        Assign a certificate to be issued upon learning path completion.
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                        Type
                                    </Typography>
                                    <Select
                                        fullWidth
                                        size="small"
                                        displayEmpty
                                        value={options.certificateType || ''}
                                        onChange={(e) => updateOption('certificateType', (e.target.value || null) as any)}
                                    >
                                        <MenuItem value="">
                                            <em>Select a certificate type</em>
                                        </MenuItem>
                                        <MenuItem value="CLASSIC">Classic</MenuItem>
                                        <MenuItem value="FANCY">Fancy</MenuItem>
                                        <MenuItem value="MODERN">Modern</MenuItem>
                                        <MenuItem value="SIMPLE">Simple</MenuItem>
                                    </Select>
                                </Box>
                            </Box>
                        )}
                    </>
                )}
            </Box>

            {/* Footer Actions */}
            <Box
                sx={{
                    p: 2,
                    borderTop: 1,
                    borderColor: 'divider',
                    display: 'flex',
                    gap: 2,
                    justifyContent: 'flex-end',
                }}
            >
                <Button
                    variant="outlined"
                    onClick={handleCancel}
                    disabled={saving}
                    sx={{ textTransform: 'none' }}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={saving || loading}
                    sx={{ textTransform: 'none' }}
                >
                    {saving ? 'Saving...' : 'Save'}
                </Button>
            </Box>
        </Drawer>
    );
}
