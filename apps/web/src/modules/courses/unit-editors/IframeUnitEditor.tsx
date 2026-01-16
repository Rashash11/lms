'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

interface IframeUnitEditorProps {
    unitId: string;
    courseId: string;
    config: any;
    onConfigChange: (config: any) => void;
    onTitleChange?: (title: string) => void;
    title?: string;
}

export default function IframeUnitEditor({
    unitId,
    courseId,
    config,
    onConfigChange,
    onTitleChange,
    title = ''
}: IframeUnitEditorProps) {
    const [localTitle, setLocalTitle] = useState(title);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const titleInputRef = useRef<HTMLInputElement>(null);

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

    const iframeUrl = config.iframeUrl || config.content?.url || '';

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
                            {localTitle || 'Iframe unit'}
                        </Typography>
                    )}
                </Box>
                <Typography variant="body2" sx={{ color: '#718096' }}>
                    Add content
                </Typography>
            </Box>

            {/* URL Input Field */}
            <Box sx={{ mb: 4 }}>
                <TextField
                    fullWidth
                    placeholder="Paste the URL of the webpage you want to embed"
                    value={iframeUrl}
                    onChange={(e) => onConfigChange({
                        ...config,
                        iframeUrl: e.target.value,
                        content: { type: 'iframe', url: e.target.value }
                    })}
                    variant="outlined"
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            bgcolor: '#fff',
                            fontSize: '0.875rem'
                        }
                    }}
                    InputProps={{
                        endAdornment: iframeUrl && (
                            <Button
                                size="small"
                                onClick={() => window.open(iframeUrl, '_blank')}
                                sx={{
                                    textTransform: 'none',
                                    minWidth: 'auto',
                                    p: 0.5
                                }}
                            >
                                <OpenInNewIcon sx={{ fontSize: 18 }} />
                            </Button>
                        )
                    }}
                />
            </Box>

            {/* Iframe Preview */}
            {iframeUrl && (
                <Box sx={{ mb: 4 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#2d3748' }}>
                        Preview
                    </Typography>
                    <Box
                        sx={{
                            width: '100%',
                            height: 500,
                            border: '1px solid #e2e8f0',
                            borderRadius: 2,
                            overflow: 'hidden',
                            bgcolor: '#fff'
                        }}
                    >
                        <iframe
                            src={iframeUrl}
                            style={{
                                width: '100%',
                                height: '100%',
                                border: 'none'
                            }}
                            title="Iframe preview"
                        />
                    </Box>
                </Box>
            )}

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
        </Box>
    );
}
