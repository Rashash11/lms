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
import { Menu, MenuItem, ListItemIcon, ListItemText, Chip, Divider } from '@mui/material';

interface HeaderProps {
    courseId: string;
    title: string;
    status: 'DRAFT' | 'PUBLISHED';
    description?: string;
    onTitleChange: (newTitle: string) => void;
    onDescriptionChange: (newDescription: string) => void;
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
    status,
    onTitleChange,
    onDescriptionChange,
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

    return (
        <Box sx={{
            minHeight: 180,
            display: 'flex',
            alignItems: 'flex-start',
            px: 4,
            py: 4,
            bgcolor: '#00264d', // Darker blue like Zedny reference
            color: '#fff',
            position: 'relative',
            zIndex: 1000
        }}>
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
                                        color: '#fff',
                                        '&:before, &:after': { display: 'none' }
                                    },
                                    '& input': {
                                        padding: '4px 8px',
                                        bgcolor: 'rgba(255,255,255,0.1)',
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
                                        color: '#fff',
                                        '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
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
                                    color: '#fff',
                                    width: 600,
                                    lineHeight: 1.5,
                                    '&:before, &:after': { display: 'none' }
                                },
                                '& .MuiInputBase-input': {
                                    bgcolor: 'rgba(255,255,255,0.1)',
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
                                color: description ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)',
                                maxWidth: 600,
                                cursor: 'text',
                                minHeight: 24,
                                p: 0.5,
                                borderRadius: 1,
                                whiteSpace: 'pre-wrap',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }
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
                                    bgcolor: '#3182ce',
                                    color: '#fff',
                                    fontWeight: 700,
                                    borderRadius: '6px',
                                    px: 3,
                                    height: 36,
                                    '&:hover': { bgcolor: '#2b6cb0' },
                                    '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' }
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
                                    borderColor: 'rgba(255,255,255,0.3)',
                                    color: '#fff',
                                    fontWeight: 700,
                                    borderRadius: '6px',
                                    px: 3,
                                    height: 36,
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', borderColor: '#fff' }
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
                            sx={{ border: '1px solid rgba(255,255,255,0.3)', borderRadius: 1, color: '#fff' }}
                        >
                            <VisibilityIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>

                    <IconButton
                        size="small"
                        onClick={(e) => setAnchorEl(e.currentTarget)}
                        sx={{ border: '1px solid rgba(255,255,255,0.3)', borderRadius: 1, color: '#fff' }}
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
                    <MenuItem onClick={() => { setAnchorEl(null); onDelete(); }} sx={{ color: '#e53e3e' }}>
                        <ListItemIcon><DeleteIcon fontSize="small" sx={{ color: '#e53e3e' }} /></ListItemIcon>
                        <ListItemText>Delete course</ListItemText>
                    </MenuItem>
                </Menu>
            </Box>
        </Box>
    );
}
