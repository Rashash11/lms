'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Typography,
    TextField,
    Paper,
    Button,
} from '@mui/material';
import MediaRecorderDialog from './MediaRecorderDialog';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import MicIcon from '@mui/icons-material/Mic';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';

interface AudioUnitEditorProps {
    unitId: string;
    courseId: string;
    config: any;
    onConfigChange: (config: any) => void;
    onTitleChange?: (title: string) => void;
    title?: string;
}

export default function AudioUnitEditor({
    unitId,
    courseId,
    config,
    onConfigChange,
    onTitleChange,
    title = ''
}: AudioUnitEditorProps) {
    const [localTitle, setLocalTitle] = useState(title);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [recorderOpen, setRecorderOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const titleInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setLocalTitle(title);
    }, [title]);

    const handleTitleBlur = () => {
        setIsEditingTitle(false);
        if (localTitle.trim() && localTitle !== title) {
            onTitleChange?.(localTitle);
        } else {
            setLocalTitle(title);
        }
    };

    const handleTitleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleTitleBlur();
        if (e.key === 'Escape') {
            setLocalTitle(title);
            setIsEditingTitle(false);
        }
    };

    const handleFileUpload = async (file: File) => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('courseId', courseId);
            formData.append('unitId', unitId);
            formData.append('kind', 'audio');

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) throw new Error('Upload failed');

            const data = await res.json();
            const { url, name, size } = data.file;

            onConfigChange({
                ...config,
                audioUrl: url,
                fileName: name,
                fileSize: size,
                source: 'upload',
                content: { type: 'upload', url: url, fileName: name }
            });
        } catch (error: any) {
            console.error('Upload error:', error);
            alert(`Upload failed: ${error.message}`);
            // Fallback to blob if upload fails (though persistence will fail)
            const objectUrl = URL.createObjectURL(file);
            onConfigChange({
                ...config,
                audioUrl: objectUrl,
                fileName: file.name,
                fileSize: file.size,
                source: 'upload',
                content: { type: 'upload', url: objectUrl, fileName: file.name }
            });
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileUpload(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('audio/')) {
            handleFileUpload(file);
        }
    };

    const handleChangeAudio = () => {
        onConfigChange({
            ...config,
            audioUrl: '',
            fileName: '',
            fileSize: undefined,
            source: null,
            content: null
        });
    };

    const audioUrl = config.audioUrl || config.content?.url || '';
    const hasAudio = audioUrl && (config.source === 'upload' || config.source === 'record');

    return (
        <Box sx={{ minHeight: '60vh' }}>
            <Box sx={{ mb: 3 }}>
                <Box sx={{ mb: 1 }}>
                    {isEditingTitle ? (
                        <TextField
                            variant="standard"
                            value={localTitle}
                            onChange={(e) => setLocalTitle(e.target.value)}
                            onBlur={handleTitleBlur}
                            onKeyDown={handleTitleKeyDown}
                            autoFocus
                            inputRef={titleInputRef}
                            fullWidth
                            sx={{
                                '& .MuiInput-root': {
                                    fontSize: '1.75rem',
                                    fontWeight: 700,
                                    color: '#2d3748',
                                    fontFamily: '"Inter", "Segoe UI", sans-serif',
                                    '&:before, &:after': { display: 'none' }
                                },
                                '& input': { padding: '4px 0' }
                            }}
                        />
                    ) : (
                        <Typography
                            variant="h1"
                            onClick={() => setIsEditingTitle(true)}
                            sx={{
                                fontSize: '1.75rem',
                                fontWeight: 700,
                                color: '#2d3748',
                                fontFamily: '"Inter", "Segoe UI", sans-serif',
                                cursor: 'text',
                                '&:hover': { bgcolor: 'rgba(0,0,0,0.02)', borderRadius: '4px' }
                            }}
                        >
                            {localTitle || 'Audio unit'}
                        </Typography>
                    )}
                </Box>
                <Typography variant="body2" sx={{ color: '#718096' }}>
                    Add content
                </Typography>
            </Box>

            <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
            />

            {!hasAudio ? (
                <>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 2, mt: 4 }}>
                        <Paper
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            sx={{
                                p: 4,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                borderRadius: 2,
                                minHeight: 350,
                                bgcolor: isDragging ? '#2b6cb0' : '#3182ce',
                                transition: 'all 0.2s',
                                '&:hover': {
                                    bgcolor: '#2b6cb0',
                                }
                            }}
                        >
                            <CloudUploadIcon sx={{ fontSize: 56, color: '#fff', mb: 2 }} />
                            <Typography
                                variant="body1"
                                sx={{
                                    color: '#fff',
                                    fontWeight: 600,
                                    textAlign: 'center',
                                    fontSize: '1rem'
                                }}
                            >
                                Upload a file
                            </Typography>
                            <Typography
                                variant="caption"
                                sx={{
                                    color: 'rgba(255,255,255,0.8)',
                                    textAlign: 'center',
                                    mt: 0.5
                                }}
                            >
                                or Drag-n-Drop here
                            </Typography>
                        </Paper>

                        <Paper
                            onClick={() => setRecorderOpen(true)}
                            sx={{
                                p: 4,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                border: '1px solid #e2e8f0',
                                borderRadius: 2,
                                minHeight: 350,
                                bgcolor: '#fff',
                                transition: 'all 0.2s',
                                '&:hover': {
                                    borderColor: '#3182ce',
                                    bgcolor: '#f7fafc',
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                                }
                            }}
                        >
                            <MicIcon sx={{ fontSize: 48, color: '#718096', mb: 2 }} />
                            <Typography
                                variant="body1"
                                sx={{
                                    color: '#3182ce',
                                    fontWeight: 500,
                                    textAlign: 'center'
                                }}
                            >
                                Record audio
                            </Typography>
                        </Paper>
                    </Box>

                    {/* Add content text field */}
                    <Box sx={{ mt: 4 }}>
                        <TextField
                            fullWidth
                            multiline
                            minRows={3}
                            placeholder="Add content"
                            value={config.description || ''}
                            onChange={(e) => onConfigChange({ ...config, description: e.target.value })}
                            variant="outlined"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    bgcolor: '#fff',
                                    fontSize: '0.875rem'
                                }
                            }}
                        />
                    </Box>
                </>
            ) : (
                <Box sx={{ mt: 4 }}>
                    <Paper sx={{
                        p: 4,
                        bgcolor: '#f7fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3
                    }}>
                        <GraphicEqIcon sx={{
                            fontSize: 56,
                            color: config.source === 'record' ? '#e53e3e' : '#3182ce'
                        }} />
                        <Box sx={{ flex: 1 }}>
                            {config.fileName && (
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#2d3748', mb: 1 }}>
                                    {config.fileName}
                                </Typography>
                            )}
                            {config.source === 'record' && (
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#e53e3e', mb: 1 }}>
                                    Recorded Audio
                                </Typography>
                            )}
                            <audio src={audioUrl} controls style={{ width: '100%' }} />
                        </Box>
                    </Paper>

                    <Button
                        variant="outlined"
                        onClick={handleChangeAudio}
                        sx={{ mt: 2, textTransform: 'none' }}
                    >
                        Change audio
                    </Button>
                </Box>
            )}

            <MediaRecorderDialog
                open={recorderOpen}
                onClose={() => setRecorderOpen(false)}
                onRecordingComplete={async (blob: Blob) => {
                    const file = new File([blob], `recorded-audio-${Date.now()}.webm`, { type: 'audio/webm' });
                    await handleFileUpload(file);
                    setRecorderOpen(false);
                }}
                mode="audio"
            />
        </Box>
    );
}
