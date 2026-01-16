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
    Tabs,
    Tab,
    Paper,
} from '@mui/material';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { getCsrfToken } from '@/lib/client-csrf';

interface VideoUnitModalProps {
    open: boolean;
    onClose: () => void;
    courseId: string;
    onSave: (unit: any) => void;
    editUnit?: any;
}

export default function VideoUnitModal({ open, onClose, courseId, onSave, editUnit }: VideoUnitModalProps) {
    const [title, setTitle] = useState(editUnit?.title || '');
    const [tab, setTab] = useState(0); // 0 = URL, 1 = Upload
    const [videoUrl, setVideoUrl] = useState(editUnit?.content?.url || '');
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

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
                throw new Error(errorData.error || 'Failed to upload video');
            }

            const data = await response.json();
            setVideoUrl(data.file.url);

            if (!title) {
                setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to upload video');
        } finally {
            setUploading(false);
        }
    };

    const validateUrl = (url: string): boolean => {
        if (!url) return false;

        // Check for YouTube, Vimeo, or direct video URLs
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
        const vimeoRegex = /^(https?:\/\/)?(www\.)?vimeo\.com\/.+/;
        const videoFileRegex = /\.(mp4|webm|ogg|mov)(\?.*)?$/i;

        return youtubeRegex.test(url) || vimeoRegex.test(url) || videoFileRegex.test(url);
    };

    const handleSave = async () => {
        if (!title.trim()) {
            setError('Title is required');
            return;
        }

        if (!videoUrl) {
            setError('Please provide a video URL or upload a file');
            return;
        }

        if (tab === 0 && !validateUrl(videoUrl)) {
            setError('Invalid video URL. Please enter a YouTube, Vimeo, or direct video link.');
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
                    type: 'VIDEO',
                    title: title.trim(),
                    content: {
                        type: tab === 0 ? 'url' : 'upload',
                        url: videoUrl,
                        fileName: file?.name,
                    },
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save video unit');
            }

            const unit = await response.json();
            onSave(unit);
            handleClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save video unit');
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        setTitle('');
        setVideoUrl('');
        setFile(null);
        setError('');
        setTab(0);
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>{editUnit ? 'Edit Video Unit' : 'Add Video Unit'}</DialogTitle>
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

                    <Tabs value={tab} onChange={(e, v) => setTab(v)}>
                        <Tab label="URL" />
                        <Tab label="Upload" />
                    </Tabs>

                    {/* URL Tab */}
                    {tab === 0 && (
                        <Box>
                            <TextField
                                label="Video URL"
                                value={videoUrl}
                                onChange={(e) => setVideoUrl(e.target.value)}
                                fullWidth
                                placeholder="https://www.youtube.com/watch?v=..."
                                helperText="Enter a YouTube, Vimeo, or direct video link"
                            />
                            {videoUrl && validateUrl(videoUrl) && (
                                <Paper sx={{ mt: 2, p: 2, bgcolor: 'action.hover', display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <PlayCircleOutlineIcon color="primary" />
                                    <Typography variant="body2">
                                        Video URL is valid
                                    </Typography>
                                </Paper>
                            )}
                        </Box>
                    )}

                    {/* Upload Tab */}
                    {tab === 1 && (
                        <Paper
                            sx={{
                                p: 3,
                                border: '2px dashed',
                                borderColor: 'divider',
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
                                accept="video/mp4,video/webm,video/quicktime"
                            />
                            <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                            <Typography variant="body1" gutterBottom>
                                {file ? file.name : uploading ? 'Uploading...' : 'Click to select a video'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                MP4, WebM, or MOV (max 100MB)
                            </Typography>
                            {uploading && <CircularProgress size={24} sx={{ mt: 2 }} />}
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
                    disabled={saving || uploading}
                    startIcon={saving ? <CircularProgress size={20} /> : null}
                >
                    {saving ? 'Saving...' : 'Save'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
