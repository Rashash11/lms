'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Typography,
    Button,
    IconButton,
    TextField,
    CircularProgress,
    Tooltip,
    Paper
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SettingsIcon from '@mui/icons-material/Settings';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Menu, MenuItem, ListItemIcon, ListItemText, Chip, Divider } from '@mui/material';

interface HeaderProps {
    courseId: string;
    title: string;
    status: 'DRAFT' | 'PUBLISHED';
    description?: string;
    courseImage?: string | null;
    onTitleChange: (newTitle: string) => void;
    onDescriptionChange: (newDescription: string) => void;
    onImageUpload: (file: File) => void;
    onImageGenerate: () => void;
    saveState: 'saving' | 'saved' | 'error';
    onPublish: () => void;
    onUnpublish: () => void;
    onDuplicate: () => void;
    onDelete: () => void;
    isPublishing: boolean;
    publishDisabled: boolean;
    hidePublishButton?: boolean;
}

export default function Header({
    courseId,
    title,
    description,
    courseImage,
    status,
    onTitleChange,
    onDescriptionChange,
    onImageUpload,
    onImageGenerate,
    saveState,
    onPublish,
    onUnpublish,
    onDuplicate,
    onDelete,
    isPublishing,
    publishDisabled,
    hidePublishButton = false
}: HeaderProps) {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [localTitle, setLocalTitle] = useState(title);

    // Description state
    const [isEditingDesc, setIsEditingDesc] = useState(false);
    const [localDescription, setLocalDescription] = useState(description || '');

    useEffect(() => {
        setLocalDescription(description || '');
    }, [description]);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setLocalTitle(title);
    }, [title]);

    const handleBlur = () => {
        setIsEditing(false);
        if (localTitle.trim() && localTitle !== title) {
            onTitleChange(localTitle);
        } else {
            setLocalTitle(title);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleBlur();
        if (e.key === 'Escape') {
            setLocalTitle(title);
            setIsEditing(false);
        }
    };

    const handleDescBlur = () => {
        setIsEditingDesc(false);
        if (localDescription !== description) {
            onDescriptionChange(localDescription);
        }
    };

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            onImageUpload(file);
        }
        // Reset input so the same file can be selected again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <Box
            className="hero-glass-card"
            sx={{
                minHeight: 180,
                display: 'flex',
                alignItems: 'flex-start',
                px: 4,
                py: 4,
                background: 'rgba(13, 20, 20, 0.4)',
                border: '1px solid rgba(141, 166, 166, 0.2)',
                color: 'hsl(var(--foreground))',
                position: 'relative',
                zIndex: 1000,
                m: 2,
                borderRadius: 2,
            }}
        >
            <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <Box sx={{ position: 'relative' }}>
                        {isEditing ? (
                            <TextField
                                variant="standard"
                                value={localTitle}
                                onChange={(e) => setLocalTitle(e.target.value)}
                                onBlur={handleBlur}
                                onKeyDown={handleKeyDown}
                                autoFocus
                                inputRef={inputRef}
                                sx={{
                                    '& .MuiInput-root': {
                                        fontSize: '2.5rem',
                                        fontWeight: 800,
                                        width: 500,
                                        color: 'hsl(var(--foreground))',
                                        '&:before, &:after': { display: 'none' }
                                    },
                                    '& input': {
                                        padding: '4px 8px',
                                        bgcolor: 'rgba(141, 166, 166, 0.1)',
                                        border: '1px solid rgba(141, 166, 166, 0.2)',
                                        borderRadius: '4px'
                                    }
                                }}
                            />
                        ) : (
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flexDirection: 'column' }}>
                                <Typography
                                    variant="h2"
                                    onClick={() => setIsEditing(true)}
                                    sx={{
                                        cursor: 'text',
                                        fontWeight: 500, // Matching TalentLMS slim but large bold font
                                        color: 'hsl(var(--foreground))',
                                        '&:hover': { bgcolor: 'rgba(141, 166, 166, 0.1)' },
                                        px: 1,
                                        py: 0.5,
                                        borderRadius: 1,
                                        minWidth: 100,
                                        fontSize: '2rem',
                                        lineHeight: 1.2
                                    }}
                                >
                                    {localTitle || 'New course'}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Box>

                <Box sx={{ mt: 1, pl: 1, position: 'relative' }}>
                    {isEditingDesc ? (
                        <TextField
                            multiline
                            minRows={2}
                            maxRows={4}
                            variant="standard"
                            value={localDescription}
                            onChange={(e) => setLocalDescription(e.target.value)}
                            onBlur={handleDescBlur}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                    setLocalDescription(description || '');
                                    setIsEditingDesc(false);
                                }
                            }}
                            autoFocus
                            sx={{
                                '& .MuiInput-root': {
                                    fontSize: '0.875rem',
                                    color: 'hsl(var(--foreground))',
                                    width: 600,
                                    lineHeight: 1.5,
                                    '&:before, &:after': { display: 'none' }
                                },
                                '& .MuiInputBase-input': {
                                    bgcolor: 'rgba(141, 166, 166, 0.1)',
                                    border: '1px solid rgba(141, 166, 166, 0.1)',
                                    borderRadius: '4px',
                                    p: 1
                                }
                            }}
                        />
                    ) : (
                        <Typography
                            variant="body2"
                            onClick={() => setIsEditingDesc(true)}
                            sx={{
                                color: description ? 'hsl(var(--foreground) / 0.9)' : 'hsl(var(--muted-foreground))',
                                maxWidth: 600,
                                cursor: 'text',
                                minHeight: 24,
                                p: 0.5,
                                borderRadius: 1,
                                whiteSpace: 'pre-wrap',
                                '&:hover': { bgcolor: 'rgba(141, 166, 166, 0.1)' }
                            }}
                        >
                            {localDescription || 'Add a course description up to 5000 characters'}
                        </Typography>
                    )}
                </Box>
            </Box>

            {/* Right Side: Actions & Image Placeholder */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {!hidePublishButton && (
                        status === 'DRAFT' ? (
                            <Button
                                variant="contained"
                                onClick={onPublish}
                                disabled={isPublishing || publishDisabled || saveState === 'saving'}
                                sx={{
                                    textTransform: 'none',
                                    bgcolor: 'hsl(var(--primary))',
                                    color: 'hsl(var(--primary-foreground))',
                                    fontWeight: 700,
                                    borderRadius: '6px',
                                    px: 3,
                                    height: 36,
                                    '&:hover': { bgcolor: 'hsl(var(--primary) / 0.9)' },
                                    '&.Mui-disabled': { bgcolor: 'rgba(141, 166, 166, 0.1)', color: 'rgba(141, 166, 166, 0.3)' }
                                }}
                            >
                                {isPublishing ? 'Publishing...' : 'Publish'}
                            </Button>
                        ) : (
                            <Button
                                variant="outlined"
                                onClick={onUnpublish}
                                disabled={isPublishing || saveState === 'saving'}
                                sx={{
                                    textTransform: 'none',
                                    borderColor: 'rgba(141, 166, 166, 0.3)',
                                    color: 'hsl(var(--foreground))',
                                    fontWeight: 700,
                                    borderRadius: '6px',
                                    px: 3,
                                    height: 36,
                                    '&:hover': { bgcolor: 'rgba(141, 166, 166, 0.1)', borderColor: 'hsl(var(--foreground))' }
                                }}
                            >
                                Unpublish
                            </Button>
                        )
                    )}

                    <Tooltip title="Preview as learner">
                        <IconButton
                            size="small"
                            onClick={() => window.open(`/courses/player/${courseId}`, '_blank')}
                            sx={{ border: '1px solid rgba(141, 166, 166, 0.3)', borderRadius: 1, color: 'hsl(var(--foreground))' }}
                        >
                            <VisibilityIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>

                    <IconButton
                        size="small"
                        onClick={(e) => setAnchorEl(e.currentTarget)}
                        sx={{ border: '1px solid rgba(141, 166, 166, 0.3)', borderRadius: 1, color: 'hsl(var(--foreground))' }}
                    >
                        <MoreVertIcon fontSize="small" />
                    </IconButton>
                </Box>



                {/* Action Menu (Copied from previous state) */}
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={() => setAnchorEl(null)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                    <MenuItem onClick={() => { setAnchorEl(null); onDuplicate(); }}>
                        <ListItemIcon><ContentCopyIcon fontSize="small" /></ListItemIcon>
                        <ListItemText>Duplicate course</ListItemText>
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={() => { setAnchorEl(null); onDelete(); }} sx={{ color: 'hsl(var(--destructive))' }}>
                        <ListItemIcon><DeleteIcon fontSize="small" sx={{ color: 'hsl(var(--destructive))' }} /></ListItemIcon>
                        <ListItemText>Delete course</ListItemText>
                    </MenuItem>
                </Menu>

                {/* Course Image */}
                <Box
                    className="glass-card"
                    sx={{
                        width: 450,
                        height: 250,
                        bgcolor: 'rgba(13, 20, 20, 0.6)',
                        borderRadius: 2,
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        border: '1px solid rgba(141, 166, 166, 0.2)'
                    }}
                >
                    {courseImage ? (
                        <>
                            <Image
                                src={courseImage}
                                alt="Course"
                                width={450}
                                height={250}
                                loader={({ src }) => src}
                                unoptimized
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                }}
                            />
                            {/* Overlay buttons on hover */}
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    bgcolor: 'rgba(0,0,0,0.4)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 2,
                                    opacity: 0,
                                    transition: 'opacity 0.2s',
                                    '&:hover': {
                                        opacity: 1
                                    }
                                }}
                            >
                                <Tooltip title="Upload image">
                                    <IconButton
                                        onClick={() => fileInputRef.current?.click()}
                                        sx={{
                                            bgcolor: 'hsl(var(--primary))',
                                            color: 'hsl(var(--primary-foreground))',
                                            '&:hover': { bgcolor: 'hsl(var(--primary) / 0.8)' }
                                        }}
                                    >
                                        <CloudUploadIcon />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Generate image using AI">
                                    <IconButton
                                        onClick={onImageGenerate}
                                        sx={{
                                            bgcolor: 'hsl(var(--primary))',
                                            color: 'hsl(var(--primary-foreground))',
                                            '&:hover': { bgcolor: 'hsl(var(--primary) / 0.8)' }
                                        }}
                                    >
                                        <AutoAwesomeIcon />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </>
                    ) : (
                        <>
                            {/* File and book icons in background */}
                            <Box
                                sx={{
                                    position: 'absolute',
                                    display: 'flex',
                                    gap: 2,
                                    opacity: 0.4
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 60,
                                        height: 70,
                                        bgcolor: 'hsl(var(--primary))',
                                        borderRadius: 2,
                                        position: 'relative',
                                        '&::before': {
                                            content: '""',
                                            position: 'absolute',
                                            top: 0,
                                            right: 0,
                                            width: 0,
                                            height: 0,
                                            borderStyle: 'solid',
                                            borderWidth: '0 15px 15px 0',
                                            borderColor: 'transparent rgba(141, 166, 166, 0.5) transparent transparent'
                                        }
                                    }}
                                />
                                <Box
                                    sx={{
                                        width: 50,
                                        height: 65,
                                        bgcolor: 'hsl(var(--secondary))',
                                        borderRadius: 1,
                                        border: '3px solid hsl(var(--secondary) / 0.8)',
                                        borderLeft: '8px solid hsl(var(--secondary) / 0.8)'
                                    }}
                                />
                            </Box>

                            {/* Upload and Generate buttons */}
                            <Box
                                sx={{
                                    position: 'absolute',
                                    bottom: 12,
                                    right: 12,
                                    display: 'flex',
                                    gap: 1
                                }}
                            >
                                <Tooltip title="Upload image">
                                    <IconButton
                                        onClick={() => fileInputRef.current?.click()}
                                        sx={{
                                            bgcolor: 'hsl(var(--primary))',
                                            color: 'hsl(var(--primary-foreground))',
                                            '&:hover': { bgcolor: 'hsl(var(--primary) / 0.8)' },
                                            width: 40,
                                            height: 40
                                        }}
                                    >
                                        <CloudUploadIcon />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Generate image using AI">
                                    <IconButton
                                        onClick={onImageGenerate}
                                        sx={{
                                            bgcolor: 'hsl(var(--primary))',
                                            color: 'hsl(var(--primary-foreground))',
                                            '&:hover': { bgcolor: 'hsl(var(--primary) / 0.8)' },
                                            width: 40,
                                            height: 40
                                        }}
                                    >
                                        <AutoAwesomeIcon />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </>
                    )}

                    {/* Hidden file input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                    />
                </Box>
            </Box>
        </Box>
    );
}
