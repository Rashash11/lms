'use client';

import React, { useState, useRef } from 'react';
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
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import QuizIcon from '@mui/icons-material/Quiz';
import { getCsrfToken } from '@/lib/client-csrf';

interface TestUnitModalProps {
    open: boolean;
    onClose: () => void;
    courseId: string;
    onSave: (unit: any) => void;
    editUnit?: any;
}

export default function TestUnitModal({ open, onClose, courseId, onSave, editUnit }: TestUnitModalProps) {
    const [title, setTitle] = useState(editUnit?.title || '');
    const [file, setFile] = useState<File | null>(null);
    const [testFileUrl, setTestFileUrl] = useState(editUnit?.content?.testFileUrl || '');
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        // Validate file type
        const validExtensions = ['.json', '.xml', '.test'];
        const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();

        if (!validExtensions.includes(fileExtension)) {
            setError(`Invalid file type. Please upload a JSON, XML, or .test file.`);
            return;
        }

        setFile(selectedFile);
        setError('');

        // Auto-upload
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', selectedFile);

            const response = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'x-csrf-token': getCsrfToken() },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to upload test file');
            }

            const data = await response.json();
            setTestFileUrl(data.file.url);

            if (!title) {
                setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to upload test file');
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if (!title.trim()) {
            setError('Title is required');
            return;
        }

        if (!testFileUrl && !editUnit) {
            setError('Please upload a test file');
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
                    type: 'TEST',
                    title: title.trim(),
                    content: {
                        testFileUrl,
                        testFormat: file?.name.substring(file.name.lastIndexOf('.') + 1) || editUnit?.content?.testFormat,
                        fileName: file?.name || editUnit?.content?.fileName,
                    },
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save test unit');
            }

            const unit = await response.json();
            onSave(unit);
            handleClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save test unit');
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        setTitle('');
        setFile(null);
        setTestFileUrl('');
        setError('');
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>{editUnit ? 'Edit Test Unit' : 'Add Test Unit'}</DialogTitle>
            <DialogContent>
                <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
                        Tests are configured via file upload only. Upload a JSON or XML file containing your test questions.
                    </Alert>

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
                            borderColor: error && !testFileUrl ? 'error.main' : 'divider',
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
                            accept=".json,.xml,.test"
                        />
                        {uploading ? (
                            <CircularProgress size={48} />
                        ) : (
                            <>
                                <QuizIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                                <Typography variant="body1" gutterBottom>
                                    {file ? file.name : 'Click to select test file'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    JSON, XML, or .test format
                                </Typography>
                            </>
                        )}
                    </Paper>

                    {/* Uploaded File Info */}
                    {testFileUrl && !uploading && (
                        <Paper sx={{ p: 2, bgcolor: 'success.50', display: 'flex', alignItems: 'center', gap: 1 }}>
                            <QuizIcon color="success" />
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="body2">
                                    {file?.name || editUnit?.content?.fileName || 'Test file uploaded'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    File-based test configuration
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
                    disabled={saving || uploading || (!testFileUrl && !editUnit)}
                    startIcon={saving ? <CircularProgress size={20} /> : null}
                >
                    {saving ? 'Saving...' : 'Save'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
