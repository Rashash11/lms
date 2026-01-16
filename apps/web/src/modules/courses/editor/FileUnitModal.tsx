'use client';

import React, { useState, useRef, useCallback } from 'react';
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
    LinearProgress,
    Paper,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { getCsrfToken } from '@/lib/client-csrf';

interface FileUnitModalProps {
    open: boolean;
    onClose: () => void;
    courseId: string;
    onSave: (unit: any) => void;
    editUnit?: any;
}

export default function FileUnitModal({ open, onClose, courseId, onSave, editUnit }: FileUnitModalProps) {
    const [title, setTitle] = useState(editUnit?.title || '');
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [fileUrl, setFileUrl] = useState(editUnit?.content?.fileUrl || '');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            if (!title) {
                // Auto-fill title with filename (without extension)
                const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '');
                setTitle(nameWithoutExt);
            }
            setError('');
        }
    };

    const handleUpload = useCallback(async () => {
        if (!file) return;

        setUploading(true);
        setError('');
        setUploadProgress(0);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'x-csrf-token': getCsrfToken() },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to upload file');
            }

            const data = await response.json();
            setFileUrl(data.file.url);
            setUploadProgress(100);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to upload file');
        } finally {
            setUploading(false);
        }
    }, [file]);

    const handleSave = async () => {
        if (!title.trim()) {
            setError('Title is required');
            return;
        }

        if (!fileUrl && !editUnit) {
            setError('Please upload a file first');
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
                    type: 'FILE',
                    title: title.trim(),
                    content: {
                        fileUrl,
                        fileName: file?.name || editUnit?.content?.fileName,
                        fileSize: file?.size || editUnit?.content?.fileSize,
                        mimeType: file?.type || editUnit?.content?.mimeType,
                    },
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save file unit');
            }

            const unit = await response.json();
            onSave(unit);
            handleClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save file unit');
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        setTitle('');
        setFile(null);
        setFileUrl('');
        setError('');
        setUploadProgress(0);
        onClose();
    };

    // Trigger upload when file is selected
    React.useEffect(() => {
        if (file && !uploading) {
            handleUpload();
        }
    }, [file, uploading, handleUpload]);

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>{editUnit ? 'Edit File Unit' : 'Add File Unit'}</DialogTitle>
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

                    {/* File Upload Area */}
                    <Paper
                        sx={{
                            p: 3,
                            border: '2px dashed',
                            borderColor: error && !fileUrl ? 'error.main' : 'divider',
                            textAlign: 'center',
                            cursor: 'pointer',
                            '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
                        }}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            hidden
                            onChange={handleFileSelect}
                            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip"
                        />
                        <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                        <Typography variant="body1" gutterBottom>
                            {file ? file.name : 'Click to select a file'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            PDF, Word, PowerPoint, Excel, or ZIP (max 50MB)
                        </Typography>
                    </Paper>

                    {/* Upload Progress */}
                    {uploading && (
                        <Box>
                            <Typography variant="body2" gutterBottom>
                                Uploading... {Math.round(uploadProgress)}%
                            </Typography>
                            <LinearProgress variant="indeterminate" />
                        </Box>
                    )}

                    {/* Uploaded File Info */}
                    {fileUrl && !uploading && (
                        <Paper sx={{ p: 2, bgcolor: 'success.50', display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AttachFileIcon color="success" />
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="body2">
                                    {file?.name || editUnit?.content?.fileName || 'File uploaded'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : ''}
                                </Typography>
                            </Box>
                        </Paper>
                    )}

                    {error && (
                        <Typography variant="body2" color="error">
                            {error}
                        </Typography>
                    )}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={saving || uploading}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={saving || uploading || (!fileUrl && !editUnit)}
                    startIcon={saving ? <CircularProgress size={20} /> : null}
                >
                    {saving ? 'Saving...' : 'Save'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
