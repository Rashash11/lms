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
} from '@mui/material';
import RichTextEditor from './RichTextEditor';

import { getCsrfToken } from '@/lib/client-csrf';

interface TextUnitModalProps {
    open: boolean;
    onClose: () => void;
    courseId: string;
    onSave: (unit: any) => void;
    editUnit?: any;
}

export default function TextUnitModal({ open, onClose, courseId, onSave, editUnit }: TextUnitModalProps) {
    const [title, setTitle] = useState(editUnit?.title || '');
    const [config, setConfig] = useState(editUnit?.config || { html: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSave = async () => {
        if (!title.trim()) {
            setError('Title is required');
            return;
        }

        if (!config.html?.trim() || config.html === '<p></p>') {
            setError('Content is required');
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
                    'x-csrf-token': getCsrfToken(),
                },
                body: JSON.stringify({
                    type: 'TEXT',
                    title: title.trim(),
                    config: config,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save text unit');
            }

            const unit = await response.json();
            onSave(unit);
            handleClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save text unit');
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        setTitle('');
        setConfig({ html: '' });
        setError('');
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { borderRadius: '16px', p: 1 }
            }}
        >
            <DialogTitle sx={{ fontWeight: 800, color: '#2d3748', borderBottom: '1px solid #edf2f7', pb: 2 }}>
                {editUnit ? 'Edit Text Unit' : 'Add Text Unit'}
            </DialogTitle>
            <DialogContent sx={{ mt: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <TextField
                        label="Unit Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        fullWidth
                        required
                        autoFocus
                        error={!!error && !title.trim()}
                        sx={{
                            '& .MuiOutlinedInput-root': { borderRadius: '10px' },
                            '& .MuiInputLabel-root': { fontWeight: 600 }
                        }}
                    />
                    <Box>
                        <RichTextEditor
                            content={config.html || ''}
                            onChange={(html) => setConfig({ ...config, html })}
                            placeholder="Enter your content here..."
                        />
                        {error && (!config.html || config.html.trim() === '') && (
                            <Box sx={{ color: 'error.main', fontSize: '0.75rem', mt: 0.5, px: 1 }}>
                                {error}
                            </Box>
                        )}
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3, borderTop: '1px solid #edf2f7' }}>
                <Button onClick={handleClose} disabled={saving} sx={{ textTransform: 'none', fontWeight: 600, color: '#718096' }}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={saving}
                    startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
                    sx={{
                        textTransform: 'none',
                        fontWeight: 700,
                        px: 4,
                        borderRadius: '8px',
                        bgcolor: '#3182ce',
                        '&:hover': { bgcolor: '#2b6cb0' }
                    }}
                >
                    {saving ? 'Saving...' : 'Save Unit'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
