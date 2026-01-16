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
    Paper,
    Alert,
} from '@mui/material';
import { getCsrfToken } from '@/lib/client-csrf';

interface EmbedUnitModalProps {
    open: boolean;
    onClose: () => void;
    courseId: string;
    onSave: (unit: any) => void;
    editUnit?: any;
}

export default function EmbedUnitModal({ open, onClose, courseId, onSave, editUnit }: EmbedUnitModalProps) {
    const [title, setTitle] = useState(editUnit?.title || '');
    const [embedCode, setEmbedCode] = useState(editUnit?.content?.embedCode || '');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [showPreview, setShowPreview] = useState(false);

    const isValidEmbed = (code: string): boolean => {
        if (!code.trim()) return false;

        // Check for iframe or script tags
        const iframeRegex = /<iframe[^>]*>.*?<\/iframe>/is;
        const scriptRegex = /<script[^>]*>.*?<\/script>/is;

        return iframeRegex.test(code) || scriptRegex.test(code);
    };

    const sanitizeEmbed = (code: string): string => {
        // Basic sanitization - remove dangerous attributes
        let sanitized = code;

        // Remove event handlers
        sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');

        // Ensure sandbox attribute for iframes
        if (sanitized.includes('<iframe') && !sanitized.includes('sandbox=')) {
            sanitized = sanitized.replace('<iframe', '<iframe sandbox="allow-scripts allow-same-origin"');
        }

        return sanitized;
    };

    const handleSave = async () => {
        if (!title.trim()) {
            setError('Title is required');
            return;
        }

        if (!embedCode.trim()) {
            setError('Embed code is required');
            return;
        }

        if (!isValidEmbed(embedCode)) {
            setError('Invalid embed code. Please provide an iframe or script tag.');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const sanitized = sanitizeEmbed(embedCode);

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
                    type: 'EMBED',
                    title: title.trim(),
                    content: {
                        embedCode: sanitized,
                        embedType: embedCode.includes('<iframe') ? 'iframe' : 'script',
                    },
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save embed unit');
            }

            const unit = await response.json();
            onSave(unit);
            handleClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save embed unit');
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        setTitle('');
        setEmbedCode('');
        setError('');
        setShowPreview(false);
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle>{editUnit ? 'Edit Embed Unit' : 'Add Embed Unit'}</DialogTitle>
            <DialogContent>
                <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                        label="Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        fullWidth
                        required
                        autoFocus
                        error={!!error && !title.trim()}
                    />

                    <TextField
                        label="Embed Code"
                        value={embedCode}
                        onChange={(e) => {
                            setEmbedCode(e.target.value);
                            setShowPreview(false);
                        }}
                        fullWidth
                        multiline
                        rows={6}
                        placeholder='<iframe src="https://example.com/embed" width="100%" height="400"></iframe>'
                        helperText="Paste your iframe or script embed code here"
                    />

                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            variant="outlined"
                            onClick={() => setShowPreview(!showPreview)}
                            disabled={!embedCode.trim()}
                            size="small"
                        >
                            {showPreview ? 'Hide Preview' : 'Show Preview'}
                        </Button>
                    </Box>

                    {showPreview && isValidEmbed(embedCode) && (
                        <Paper sx={{ p: 2, bgcolor: 'action.hover' }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Preview:
                            </Typography>
                            <Box
                                sx={{
                                    width: '100%',
                                    minHeight: 200,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 1,
                                    overflow: 'hidden',
                                }}
                                dangerouslySetInnerHTML={{ __html: sanitizeEmbed(embedCode) }}
                            />
                        </Paper>
                    )}

                    <Alert severity="warning" sx={{ fontSize: '0.875rem' }}>
                        Only embed content from trusted sources. Malicious embed codes will be sanitized.
                    </Alert>

                    {error && (
                        <Typography variant="body2" color="error">
                            {error}
                        </Typography>
                    )}
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
                    {saving ? 'Saving...' : 'Save'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
