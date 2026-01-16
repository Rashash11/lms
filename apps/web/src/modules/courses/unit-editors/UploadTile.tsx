'use client';

import React, { useCallback, useState } from 'react';
import { Box, Typography, CircularProgress, LinearProgress } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

interface UploadTileProps {
    title: string;
    description?: string;
    icon?: React.ReactNode;
    accept?: string; // e.g., 'video/*', 'audio/*', '.pdf,.doc,.docx'
    maxSizeMB?: number;
    onUpload: (file: File) => Promise<void>;
    disabled?: boolean;
}

export default function UploadTile({
    title,
    description,
    icon,
    accept = '*/*',
    maxSizeMB = 500,
    onUpload,
    disabled = false,
}: UploadTileProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const validateFile = useCallback((file: File): boolean => {
        const maxBytes = maxSizeMB * 1024 * 1024;
        if (file.size > maxBytes) {
            setError(`File size exceeds ${maxSizeMB}MB limit`);
            return false;
        }
        setError(null);
        return true;
    }, [maxSizeMB]);

    const handleFile = useCallback(async (file: File) => {
        if (!validateFile(file)) return;

        setIsUploading(true);
        setUploadProgress(0);
        setError(null);

        try {
            // Simulate progress for better UX
            const progressInterval = setInterval(() => {
                setUploadProgress((prev) => Math.min(prev + 10, 90));
            }, 200);

            await onUpload(file);

            clearInterval(progressInterval);
            setUploadProgress(100);

            // Reset after a brief delay
            setTimeout(() => {
                setIsUploading(false);
                setUploadProgress(0);
            }, 1000);
        } catch (err: any) {
            setError(err.message || 'Upload failed');
            setIsUploading(false);
            setUploadProgress(0);
        }
    }, [onUpload, validateFile]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled && !isUploading) {
            setIsDragging(true);
        }
    }, [disabled, isUploading]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);

            if (disabled || isUploading) return;

            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFile(files[0]);
            }
        },
        [disabled, handleFile, isUploading]
    );

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFile(files[0]);
        }
    };

    return (
        <Box
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            sx={{
                position: 'relative',
                height: 200,
                border: `2px dashed ${isDragging ? '#3182ce' : error ? '#e53e3e' : '#cbd5e0'
                    }`,
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: isDragging ? '#ebf8ff' : '#f7fafc',
                cursor: disabled || isUploading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                opacity: disabled ? 0.5 : 1,
                '&:hover': {
                    bgcolor: disabled || isUploading ? '#f7fafc' : '#edf2f7',
                    borderColor: disabled || isUploading ? '#cbd5e0' : '#3182ce',
                },
            }}
            onClick={() => {
                if (!disabled && !isUploading) {
                    document.getElementById(`upload-input-${title}`)?.click();
                }
            }}
        >
            <input
                id={`upload-input-${title}`}
                type="file"
                accept={accept}
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                disabled={disabled || isUploading}
            />

            {isUploading ? (
                <Box sx={{ width: '80%', textAlign: 'center' }}>
                    <CircularProgress size={40} sx={{ mb: 2 }} />
                    <Typography variant="body2" sx={{ color: '#4a5568', mb: 1 }}>
                        Uploading...
                    </Typography>
                    <LinearProgress
                        variant="determinate"
                        value={uploadProgress}
                        sx={{ height: 6, borderRadius: 3 }}
                    />
                    <Typography variant="caption" sx={{ color: '#718096', mt: 1, display: 'block' }}>
                        {uploadProgress}%
                    </Typography>
                </Box>
            ) : (
                <>
                    {icon || <CloudUploadIcon sx={{ fontSize: 48, color: '#a0aec0', mb: 2 }} />}
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2d3748', mb: 0.5 }}>
                        {title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#718096' }}>
                        {description || "Drag & drop or click to select"}
                    </Typography>
                    {error && (
                        <Typography variant="caption" sx={{ color: '#e53e3e', mt: 1 }}>
                            {error}
                        </Typography>
                    )}
                </>
            )}
        </Box>
    );
}
