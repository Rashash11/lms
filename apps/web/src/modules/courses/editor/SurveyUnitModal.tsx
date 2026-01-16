'use client';

import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Box,
    CircularProgress,
    Typography,
    Alert,
} from '@mui/material';
import PollIcon from '@mui/icons-material/Poll';
import { getCsrfToken } from '@/lib/client-csrf';

interface SurveyUnitModalProps {
    open: boolean;
    onClose: () => void;
    courseId: string;
    onSave: (unit: any) => void;
    editUnit?: any;
}

export default function SurveyUnitModal({ open, onClose, courseId, onSave, editUnit }: SurveyUnitModalProps) {
    const [title, setTitle] = useState(editUnit?.title || '');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSave = async () => {
        if (!title.trim()) {
            setError('Title is required');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const url = editUnit
                ? `/api/courses/${courseId}/units/${editUnit.id}`
                : `/api/courses/${courseId}/units`;

            const method = editUnit ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 
                    'Content-Type': 'application/json',
                    'x-csrf-token': getCsrfToken()
                },
                body: JSON.stringify({
                    type: 'SURVEY',
                    title: title.trim(),
                    content: {
                        questions: [], // Empty scaffold
                        configured: false,
                    },
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save survey unit');
            }

            const unit = await response.json();
            onSave(unit);
            handleClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save survey unit');
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        setTitle('');
        setError('');
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>{editUnit ? 'Edit Survey Unit' : 'Add Survey Unit'}</DialogTitle>
            <DialogContent>
                <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PollIcon />
                            <Typography variant="body2">
                                Survey will be created as an empty scaffold. You can configure questions later.
                            </Typography>
                        </Box>
                    </Alert>

                    <TextField
                        label="Survey Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        fullWidth
                        required
                        autoFocus
                        error={!!error}
                        helperText={error}
                        placeholder="e.g., Course Feedback Survey"
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={saving}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={saving}
                    startIcon={saving ? <CircularProgress size={20} /> : null}
                >
                    {saving ? 'Creating...' : 'Create Survey'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
