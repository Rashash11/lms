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

interface ScormUnitEditorProps {
    unitId: string;
    courseId: string;
    config: any;
    onConfigChange: (config: any) => void;
    onTitleChange?: (title: string) => void;
    title?: string;
}

export default function ScormUnitEditor({
    unitId,
    courseId,
    config,
    onConfigChange,
    onTitleChange,
    title = ''
}: ScormUnitEditorProps) {
    const [localTitle, setLocalTitle] = useState(title);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
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

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onConfigChange({
                ...config,
                fileName: file.name,
                fileSize: file.size,
                uploadDate: new Date().toISOString(),
                source: 'upload'
            });
        }
    };

    const handleReplace = (e: React.MouseEvent) => {
        e.stopPropagation();
        handleUploadClick();
    };

    return (
        <Box sx={{ maxWidth: 1000, mx: 'auto', py: 4, px: 2 }}>
            {/* Header / Title */}
            <Box sx={{ mb: 4 }}>
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
                                fontSize: '2rem',
                                fontWeight: 600,
                                color: '#1a202c',
                                '&:before, &:after': { display: 'none' }
                            },
                        }}
                    />
                ) : (
                    <Typography
                        variant="h4"
                        onClick={() => setIsEditingTitle(true)}
                        sx={{
                            fontWeight: 600,
                            color: '#1a202c',
                            cursor: 'text',
                            fontSize: '2rem',
                            '&:hover': {
                                bgcolor: 'rgba(0,0,0,0.02)',
                                borderRadius: '4px'
                            }
                        }}
                    >
                        {localTitle || 'Scorm unit'}
                    </Typography>
                )}
            </Box>

            {/* Hidden File Input */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".zip,.pif"
                style={{ display: 'none' }}
            />

            {/* Upload Area */}
            {config.fileName ? (
                <Paper
                    sx={{
                        p: 4,
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <CloudUploadIcon sx={{ fontSize: 40, color: '#3182ce' }} />
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2d3748' }}>
                                {config.fileName}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#718096' }}>
                                {(config.fileSize / (1024 * 1024)).toFixed(2)} MB • Uploaded on {new Date(config.uploadDate).toLocaleDateString()}
                            </Typography>
                        </Box>
                    </Box>
                    <Button
                        variant="outlined"
                        onClick={handleReplace}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 600,
                            color: '#3182ce',
                            borderColor: '#3182ce',
                            '&:hover': { bgcolor: '#ebf8ff', borderColor: '#2b6cb0' }
                        }}
                    >
                        Change file
                    </Button>
                </Paper>
            ) : (
                <Paper
                    onClick={handleUploadClick}
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                    sx={{
                        height: 480,
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: isHovering ? '#0046AB' : '#f8f9fa',
                        border: isHovering ? 'none' : '1px dashed #cbd5e0',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease-in-out',
                        color: isHovering ? '#fff' : '#4a5568',
                    }}
                >
                    <CloudUploadIcon sx={{ fontSize: 64, mb: 2, opacity: 0.9 }} />
                    <Typography variant="h6" sx={{ fontWeight: 500, textAlign: 'center', px: 3 }}>
                        Upload a SCORM, xAPI, or cmi5 file
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
                        or Drag-n-Drop here
                    </Typography>
                </Paper>
            )}
        </Box>
    );
}
