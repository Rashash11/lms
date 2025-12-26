'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, TextField } from '@mui/material';
import InlineTextEditor from './InlineTextEditor';


interface TextUnitEditorProps {
    unitId: string;
    courseId: string;
    config: any;
    onConfigChange: (config: any) => void;
    onTitleChange?: (title: string) => void;
    title?: string;
}

export default function TextUnitEditor({
    unitId,
    courseId,
    config,
    onConfigChange,
    onTitleChange,
    title = ''
}: TextUnitEditorProps) {
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

    return (
        <Box sx={{ minHeight: '60vh' }}>
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
                            fontSize: '2rem',
                            fontWeight: 700,
                            color: '#000', // Darker black
                            fontFamily: '"Inter", "Segoe UI", sans-serif',
                            cursor: 'text',
                            mb: 1,
                            '&:hover': { opacity: 0.7 }
                        }}
                    >
                        {localTitle || 'Content unit'}
                    </Typography>
                )}
            </Box>

            <Box sx={{ mb: 4 }}>
                <InlineTextEditor
                    content={config.html || config.text || ''}
                    onChange={(html) => onConfigChange({ ...config, html, text: html })}
                    placeholder="Add content"
                />
            </Box>


        </Box>
    );
}
