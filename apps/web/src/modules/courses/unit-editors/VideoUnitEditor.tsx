'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Typography,
    TextField,
    Paper,
    Button,
} from '@mui/material';
import UploadTile from './UploadTile';
import MediaRecorderDialog from './MediaRecorderDialog';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FolderIcon from '@mui/icons-material/Folder';
import VideocamIcon from '@mui/icons-material/Videocam';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { getCsrfToken } from '@/lib/client-csrf';

interface VideoUnitEditorProps {
    unitId: string;
    courseId: string;
    config: any;
    onConfigChange: (config: any) => void;
    onTitleChange?: (title: string) => void;
    title?: string;
}

export default function VideoUnitEditor({
    unitId,
    courseId,
    config,
    onConfigChange,
    onTitleChange,
    title = ''
}: VideoUnitEditorProps) {
    const [localTitle, setLocalTitle] = useState(title);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [selectedSource, setSelectedSource] = useState<string | null>(config.source || null);
    const [recorderOpen, setRecorderOpen] = useState(false);
    const [recorderMode, setRecorderMode] = useState<'video' | 'screen'>('video');
    const [youtubeUrl, setYoutubeUrl] = useState(config.videoUrl || '');
    const titleInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setLocalTitle(title);
    }, [title]);

    useEffect(() => {
        if (config.source) {
            setSelectedSource(config.source);
        }
        if (config.videoUrl) {
            setYoutubeUrl(config.videoUrl);
        }
    }, [config]);

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

    const handleSourceSelect = (source: string) => {
        setSelectedSource(source);
        if (source === 'record') {
            setRecorderMode('video');
            setRecorderOpen(true);
        } else if (source === 'screen') {
            setRecorderMode('screen');
            setRecorderOpen(true);
        } else if (source === 'upload') {
            fileInputRef.current?.click();
        }
    };

    const handleBack = () => {
        setSelectedSource(null);
        setYoutubeUrl('');
        onConfigChange({
            ...config,
            videoUrl: '',
            fileName: '',
            fileSize: undefined,
            source: null,
            content: null
        });
    };

    const handleYoutubeSubmit = () => {
        if (youtubeUrl.trim()) {
            onConfigChange({
                ...config,
                url: youtubeUrl, // Add top-level url for player compatibility
                videoUrl: youtubeUrl,
                source: 'youtube',
                content: { type: 'youtube', url: youtubeUrl }
            });
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('courseId', courseId);
                formData.append('unitId', unitId);
                formData.append('kind', 'video');

                const res = await fetch('/api/upload', {
                    method: 'POST',
                    headers: { 'x-csrf-token': getCsrfToken() },
                    body: formData,
                });

                if (!res.ok) throw new Error('Upload failed');

                const data = await res.json();
                const { url, name, size } = data.file;

                onConfigChange({
                    ...config,
                    url: url,
                    videoUrl: url,
                    fileName: name,
                    fileSize: size,
                    source: 'upload',
                    content: { type: 'upload', url: url, fileName: name }
                });
                setSelectedSource('upload');
            } catch (error) {
                console.error('Upload error:', error);
                // Fallback
                const objectUrl = URL.createObjectURL(file);
                onConfigChange({
                    ...config,
                    url: objectUrl,
                    videoUrl: objectUrl,
                    fileName: file.name,
                    fileSize: file.size,
                    source: 'upload',
                    content: { type: 'upload', url: objectUrl, fileName: file.name }
                });
                setSelectedSource('upload');
            }
        }
    };

    const getYouTubeEmbedUrl = (url: string) => {
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/);
        if (match) return `https://www.youtube.com/embed/${match[1]}`;
        return null;
    };

    const videoUrl = config.videoUrl || '';
    const embedUrl = getYouTubeEmbedUrl(videoUrl);
    const hasVideo = videoUrl && (config.source === 'youtube' || config.source === 'upload' || config.source === 'record' || config.source === 'screen');

    const SourceTile = ({
        icon,
        label,
        sublabel,
        onClick,
        large = false
    }: {
        icon: React.ReactNode;
        label: string;
        sublabel?: string;
        onClick: () => void;
        large?: boolean;
    }) => (
        <Paper
            onClick={onClick}
            sx={{
                p: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                border: '1px solid #e2e8f0',
                borderRadius: 2,
                minHeight: large ? 200 : 150,
                transition: 'all 0.2s',
                bgcolor: '#fff',
                '&:hover': {
                    borderColor: '#3182ce',
                    bgcolor: '#f7fafc',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                }
            }}
        >
            <Box sx={{ color: '#718096', mb: 2 }}>
                {icon}
            </Box>
            <Typography
                variant="body1"
                sx={{
                    color: '#2d3748',
                    fontWeight: 500,
                    textAlign: 'center'
                }}
            >
                {label}
            </Typography>
            {sublabel && (
                <Typography
                    variant="caption"
                    sx={{
                        color: '#3182ce',
                        textAlign: 'center',
                        mt: 0.5
                    }}
                >
                    {sublabel}
                </Typography>
            )}
        </Paper>
    );

    return (
        <Box sx={{ minHeight: '60vh' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Box>
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
                                {localTitle || 'Video unit'}
                            </Typography>
                        )}
                    </Box>
                    <Typography variant="body2" sx={{ color: '#718096' }}>
                        Add content
                    </Typography>
                </Box>

                {selectedSource && (
                    <Button
                        startIcon={<ArrowBackIosNewIcon sx={{ fontSize: '0.75rem !important' }} />}
                        onClick={handleBack}
                        sx={{
                            color: '#3182ce',
                            textTransform: 'none',
                            fontWeight: 600,
                            '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' }
                        }}
                    >
                        Back
                    </Button>
                )}
            </Box>

            <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
            />

            {!hasVideo ? (
                <>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 4 }}>
                        <SourceTile
                            icon={<PlayArrowIcon sx={{ fontSize: 48 }} />}
                            label="Use a YouTube video"
                            onClick={() => handleSourceSelect('youtube')}
                            large
                        />
                        <SourceTile
                            icon={<CloudUploadIcon sx={{ fontSize: 48 }} />}
                            label="Upload a file"
                            sublabel="or Drag-n-Drop here"
                            onClick={() => handleSourceSelect('upload')}
                            large
                        />

                        <Box sx={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                            <SourceTile
                                icon={<FolderIcon sx={{ fontSize: 40 }} />}
                                label="Select a course file"
                                onClick={() => handleSourceSelect('coursefile')}
                            />
                            <SourceTile
                                icon={<VideocamIcon sx={{ fontSize: 40 }} />}
                                label="Record a video"
                                onClick={() => handleSourceSelect('record')}
                            />
                            <SourceTile
                                icon={<ScreenShareIcon sx={{ fontSize: 40 }} />}
                                label="Record your screen"
                                onClick={() => handleSourceSelect('screen')}
                            />
                        </Box>
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
                    {config.source === 'youtube' && embedUrl ? (
                        <Box sx={{
                            position: 'relative',
                            width: '100%',
                            paddingTop: '56.25%',
                            borderRadius: 2,
                            overflow: 'hidden',
                            bgcolor: '#000'
                        }}>
                            <iframe
                                src={embedUrl}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    border: 'none'
                                }}
                                allowFullScreen
                            />
                        </Box>
                    ) : (
                        <Box sx={{ borderRadius: 2, overflow: 'hidden', bgcolor: '#000' }}>
                            <video
                                src={videoUrl}
                                controls
                                style={{ width: '100%', maxHeight: 500 }}
                            />
                        </Box>
                    )}

                    {config.fileName && (
                        <Typography variant="body2" sx={{ mt: 2, color: '#718096' }}>
                            File: {config.fileName}
                        </Typography>
                    )}

                    <Button
                        variant="outlined"
                        onClick={handleBack}
                        sx={{ mt: 2, textTransform: 'none' }}
                    >
                        Change video
                    </Button>
                </Box>
            )}

            {selectedSource === 'youtube' && !hasVideo && (
                <Box sx={{ mt: 4 }}>
                    <Paper sx={{ p: 4, border: '1px solid #e2e8f0', borderRadius: 2 }}>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                            Enter YouTube URL
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                fullWidth
                                value={youtubeUrl}
                                onChange={(e) => setYoutubeUrl(e.target.value)}
                                placeholder="https://www.youtube.com/watch?v=..."
                                variant="outlined"
                                size="small"
                            />
                            <Button
                                variant="contained"
                                onClick={handleYoutubeSubmit}
                                disabled={!youtubeUrl.trim()}
                                sx={{
                                    textTransform: 'none',
                                    bgcolor: '#3182ce',
                                    '&:hover': { bgcolor: '#2b6cb0' }
                                }}
                            >
                                Add Video
                            </Button>
                        </Box>
                    </Paper>
                </Box>
            )}

            <MediaRecorderDialog
                open={recorderOpen}
                onClose={() => setRecorderOpen(false)}
                onRecordingComplete={async (blob: Blob) => {
                    const ext = 'webm'; // Browser recordings are usually webm
                    const file = new File([blob], `recorded-${recorderMode}-${Date.now()}.${ext}`, { type: `video/${ext}` });

                    try {
                        const formData = new FormData();
                        formData.append('file', file);
                        formData.append('courseId', courseId);
                        formData.append('unitId', unitId);
                        formData.append('kind', 'video');

                        const res = await fetch('/api/upload', {
                            method: 'POST',
                            headers: { 'x-csrf-token': getCsrfToken() },
                            body: formData,
                        });

                        if (!res.ok) throw new Error('Upload failed');

                        const data = await res.json();
                        const { url, name, size } = data.file;

                        onConfigChange({
                            ...config,
                            url: url,
                            videoUrl: url,
                            source: recorderMode === 'screen' ? 'screen' : 'record',
                            content: { type: recorderMode, url }
                        });
                    } catch (error) { // Fallback
                        const url = URL.createObjectURL(blob);
                        onConfigChange({
                            ...config,
                            url: url,
                            videoUrl: url,
                            source: recorderMode === 'screen' ? 'screen' : 'record',
                            content: { type: recorderMode, url }
                        });
                    }
                    setRecorderOpen(false);
                }}
                mode={recorderMode}
            />
        </Box>
    );
}
