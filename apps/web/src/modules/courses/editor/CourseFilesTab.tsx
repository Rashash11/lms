'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Button,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    IconButton,
    LinearProgress,
    Chip,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import VideoFileIcon from '@mui/icons-material/VideoFile';
import { getCsrfToken } from '@/lib/client-csrf';

interface CourseFile {
    id: string;
    name: string;
    type: string;
    size: number;
    url: string;
    uploadedAt: string;
}

interface CourseFilesTabProps {
    courseId: string;
}

export default function CourseFilesTab({ courseId }: CourseFilesTabProps) {
    const [files, setFiles] = useState<CourseFile[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const fetchFiles = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/courses/${courseId}/files`);
            if (!res.ok) throw new Error();
            const data = await res.json();
            setFiles(data.files || []);
        } catch (err) {
            console.error('Failed to fetch files');
        } finally {
            setLoading(false);
        }
    }, [courseId]);

    useEffect(() => {
        void fetchFiles();
    }, [fetchFiles]);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const uploadedFiles = event.target.files;
        if (!uploadedFiles || uploadedFiles.length === 0) return;

        setUploading(true);
        setUploadProgress(0);

        const formData = new FormData();
        Array.from(uploadedFiles).forEach((file) => {
            formData.append('files', file);
        });

        try {
            // Simulate upload progress
            const uploadInterval = setInterval(() => {
                setUploadProgress((prev) => {
                    if (prev >= 90) {
                        clearInterval(uploadInterval);
                        return prev;
                    }
                    return prev + 10;
                });
            }, 100);

            const res = await fetch(`/api/courses/${courseId}/files`, {
                method: 'POST',
                body: formData,
            });

            clearInterval(uploadInterval);

            if (!res.ok) throw new Error();

            setUploadProgress(100);
            await fetchFiles();
        } catch (err) {
            console.error('Upload failed:', err);
        } finally {
            setTimeout(() => {
                setUploading(false);
                setUploadProgress(0);
            }, 500);
        }
    };

    const handleDeleteFile = async (fileId: string) => {
        if (!confirm('Delete this file?')) return;

        try {
            const res = await fetch(`/api/files/${fileId}`, {
                method: 'DELETE',
                headers: { 'x-csrf-token': getCsrfToken() },
            });
            if (!res.ok) throw new Error();
            await fetchFiles();
        } catch (err) {
            console.error('Delete failed');
        }
    };

    const getFileIcon = (type: string) => {
        if (type.startsWith('image/')) return <ImageIcon sx={{ color: '#4299e1' }} />;
        if (type.includes('pdf')) return <PictureAsPdfIcon sx={{ color: '#e53e3e' }} />;
        if (type.startsWith('video/')) return <VideoFileIcon sx={{ color: '#9c27b0' }} />;
        return <InsertDriveFileIcon sx={{ color: '#718096' }} />;
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <Box sx={{ p: 0 }}>
            {/* Upload Section */}
            <Box sx={{
                p: 8,
                border: '2px dashed #cbd5e0',
                borderRadius: 3,
                textAlign: 'center',
                bgcolor: '#f7fafc',
                mb: 4,
                position: 'relative'
            }}>
                <input
                    id="file-upload"
                    multiple
                    type="file"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                />
                <CloudUploadIcon sx={{ fontSize: 64, color: '#a0aec0', mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    Upload Course Resources
                </Typography>
                <Typography variant="body2" sx={{ color: '#718096', mb: 3 }}>
                    Add files, images, videos, and documents to your course library
                </Typography>
                <Button
                    variant="contained"
                    component="label"
                    htmlFor="file-upload"
                    disabled={uploading}
                    sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        bgcolor: '#3182ce',
                        '&:hover': { bgcolor: '#2c5282' }
                    }}
                >
                    {uploading ? 'Uploading...' : 'Browse Files'}
                </Button>

                {uploading && (
                    <Box sx={{ mt: 3, maxWidth: 400, mx: 'auto' }}>
                        <LinearProgress variant="determinate" value={uploadProgress} sx={{ height: 8, borderRadius: 4 }} />
                        <Typography variant="caption" sx={{ color: '#4a5568', mt: 1, display: 'block' }}>
                            {uploadProgress}% uploaded
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* Files List */}
            {loading ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                    <LinearProgress />
                    <Typography variant="body2" sx={{ color: '#a0aec0', mt: 2 }}>
                        Loading files...
                    </Typography>
                </Box>
            ) : files.length === 0 ? (
                <Box sx={{ p: 8, textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                        No files uploaded yet. Add resources to build your course library.
                    </Typography>
                </Box>
            ) : (
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#2d3748' }}>
                            Course Files ({files.length})
                        </Typography>
                    </Box>
                    <List>
                        {files.map((file) => (
                            <ListItem
                                key={file.id}
                                sx={{
                                    border: '1px solid #edf2f7',
                                    borderRadius: 2,
                                    mb: 1,
                                    '&:hover': { bgcolor: '#f7fafc' }
                                }}
                                secondaryAction={
                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                        <IconButton
                                            edge="end"
                                            size="small"
                                            onClick={() => window.open(file.url, '_blank')}
                                            sx={{ color: '#4a5568' }}
                                        >
                                            <DownloadIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            edge="end"
                                            size="small"
                                            onClick={() => handleDeleteFile(file.id)}
                                            sx={{ color: '#e53e3e' }}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                }
                            >
                                <ListItemIcon sx={{ minWidth: 40 }}>
                                    {getFileIcon(file.type)}
                                </ListItemIcon>
                                <ListItemText
                                    primary={
                                        <Typography variant="body1" sx={{ fontWeight: 600, color: '#2d3748' }}>
                                            {file.name}
                                        </Typography>
                                    }
                                    secondary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                                            <Chip
                                                label={formatFileSize(file.size)}
                                                size="small"
                                                sx={{ height: 20, fontSize: '0.7rem' }}
                                            />
                                            <Typography variant="caption" sx={{ color: '#718096' }}>
                                                Uploaded {new Date(file.uploadedAt).toLocaleDateString()}
                                            </Typography>
                                        </Box>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>
                </Box>
            )}
        </Box>
    );
}
