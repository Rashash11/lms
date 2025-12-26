'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Typography,
    TextField,
    Paper,
    Button,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SlideshowIcon from '@mui/icons-material/Slideshow';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

interface DocumentUnitEditorProps {
    unitId: string;
    courseId: string;
    config: any;
    onConfigChange: (config: any) => void;
    onTitleChange?: (title: string) => void;
    title?: string;
}

export default function DocumentUnitEditor({
    unitId,
    courseId,
    config,
    onConfigChange,
    onTitleChange,
    title = ''
}: DocumentUnitEditorProps) {
    const [localTitle, setLocalTitle] = useState(title);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [selectedSource, setSelectedSource] = useState<string | null>(config.source || null);
    const [slideshareUrl, setSlideshareUrl] = useState(config.documentUrl || '');
    const [isDragging, setIsDragging] = useState(false);
    const titleInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setLocalTitle(title);
    }, [title]);

    useEffect(() => {
        if (config.source) {
            setSelectedSource(config.source);
        }
        if (config.documentUrl) {
            setSlideshareUrl(config.documentUrl);
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

    const handleFileUpload = async (file: File) => {
        const objectUrl = URL.createObjectURL(file);
        onConfigChange({
            ...config,
            documentUrl: objectUrl,
            fileName: file.name,
            fileSize: file.size,
            source: 'upload',
            content: { type: 'upload', url: objectUrl, fileName: file.name }
        });
        setSelectedSource('upload');
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
        if (file) {
            handleFileUpload(file);
        }
    };

    const handleSlideshareSubmit = () => {
        if (slideshareUrl.trim()) {
            onConfigChange({
                ...config,
                documentUrl: slideshareUrl,
                source: 'slideshare',
                content: { type: 'slideshare', url: slideshareUrl }
            });
        }
    };

    const handleChangeDocument = () => {
        setSelectedSource(null);
        setSlideshareUrl('');
        onConfigChange({
            ...config,
            documentUrl: '',
            fileName: '',
            fileSize: undefined,
            source: null,
            content: null
        });
    };

    const getFileIcon = (fileName?: string) => {
        if (!fileName) return <InsertDriveFileIcon sx={{ fontSize: 56, color: '#3182ce' }} />;
        const ext = fileName.split('.').pop()?.toLowerCase();
        if (ext === 'pdf') return <PictureAsPdfIcon sx={{ fontSize: 56, color: '#e53e3e' }} />;
        if (['doc', 'docx'].includes(ext || '')) return <DescriptionIcon sx={{ fontSize: 56, color: '#2b6cb0' }} />;
        if (['ppt', 'pptx'].includes(ext || '')) return <SlideshowIcon sx={{ fontSize: 56, color: '#dd6b20' }} />;
        return <InsertDriveFileIcon sx={{ fontSize: 56, color: '#718096' }} />;
    };

    const getFileType = (fileName?: string) => {
        if (!fileName) return 'Document';
        const ext = fileName.split('.').pop()?.toLowerCase();
        if (ext === 'pdf') return 'PDF Document';
        if (['doc', 'docx'].includes(ext || '')) return 'Word Document';
        if (['ppt', 'pptx'].includes(ext || '')) return 'PowerPoint Presentation';
        if (['xls', 'xlsx'].includes(ext || '')) return 'Excel Spreadsheet';
        return 'Document';
    };

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return '';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const documentUrl = config.documentUrl || '';
    const hasDocument = documentUrl && (config.source === 'upload' || config.source === 'slideshare');

    return (
        <Box sx={{ minHeight: '60vh' }}>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                {/* Title */}
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
                            {localTitle || 'Document unit'}
                        </Typography>
                    )}
                </Box>
                <Typography variant="body2" sx={{ color: '#718096' }}>
                    Add content
                </Typography>
            </Box>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
            />

            {/* Content Area */}
            {!hasDocument ? (
                <>
                    {/* Source Selection - TalentLMS style */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 4 }}>
                        {/* Upload Tile */}
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
                                border: isDragging ? '2px solid #3182ce' : '1px solid #e2e8f0',
                                borderRadius: 2,
                                minHeight: 350,
                                bgcolor: isDragging ? '#f7fafc' : '#fff',
                                transition: 'all 0.2s',
                                '&:hover': {
                                    borderColor: '#3182ce',
                                    bgcolor: '#f7fafc',
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                                }
                            }}
                        >
                            <CloudUploadIcon sx={{ fontSize: 56, color: '#718096', mb: 2 }} />
                            <Typography
                                variant="body1"
                                sx={{
                                    color: '#2d3748',
                                    fontWeight: 500,
                                    textAlign: 'center'
                                }}
                            >
                                Upload a file
                            </Typography>
                            <Typography
                                variant="caption"
                                sx={{
                                    color: '#3182ce',
                                    textAlign: 'center',
                                    mt: 0.5,
                                    fontSize: '0.75rem'
                                }}
                            >
                                or Drag-n-Drop here
                            </Typography>
                        </Paper>

                        {/* Slideshare Tile */}
                        <Paper
                            onClick={() => setSelectedSource('slideshare')}
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
                            <SlideshowIcon sx={{ fontSize: 56, color: '#718096', mb: 2 }} />
                            <Typography
                                variant="body1"
                                sx={{
                                    color: '#3182ce',
                                    fontWeight: 500,
                                    textAlign: 'center'
                                }}
                            >
                                Use Slideshare
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
                // Document Preview
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
                        {getFileIcon(config.fileName)}
                        <Box sx={{ flex: 1 }}>
                            {config.fileName && (
                                <>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#2d3748' }}>
                                        {config.fileName}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#718096' }}>
                                        {getFileType(config.fileName)} • {formatFileSize(config.fileSize)}
                                    </Typography>
                                </>
                            )}
                            {config.source === 'slideshare' && (
                                <>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#2d3748' }}>
                                        Slideshare Presentation
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: '#718096',
                                            wordBreak: 'break-all',
                                            mt: 0.5
                                        }}
                                    >
                                        {documentUrl.length > 60 ? documentUrl.substring(0, 60) + '...' : documentUrl}
                                    </Typography>
                                </>
                            )}
                        </Box>
                        {documentUrl && (
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={() => window.open(documentUrl, '_blank')}
                                sx={{ textTransform: 'none' }}
                            >
                                {config.source === 'upload' && config.fileName?.endsWith('.pdf') ? 'Preview' : 'Open'}
                            </Button>
                        )}
                    </Paper>

                    <Button
                        variant="outlined"
                        onClick={handleChangeDocument}
                        sx={{ mt: 2, textTransform: 'none' }}
                    >
                        Change document
                    </Button>
                </Box>
            )}

            {/* Slideshare URL input - shows when slideshare is selected but no URL yet */}
            {selectedSource === 'slideshare' && !hasDocument && (
                <Box sx={{ mt: 4 }}>
                    <Paper sx={{ p: 4, border: '1px solid #e2e8f0', borderRadius: 2 }}>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                            Enter Slideshare URL
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                fullWidth
                                value={slideshareUrl}
                                onChange={(e) => setSlideshareUrl(e.target.value)}
                                placeholder="https://www.slideshare.net/..."
                                variant="outlined"
                                size="small"
                            />
                            <Button
                                variant="contained"
                                onClick={handleSlideshareSubmit}
                                disabled={!slideshareUrl.trim()}
                                sx={{
                                    textTransform: 'none',
                                    bgcolor: '#3182ce',
                                    '&:hover': { bgcolor: '#2b6cb0' }
                                }}
                            >
                                Add Document
                            </Button>
                        </Box>
                    </Paper>
                </Box>
            )}
        </Box>
    );
}
