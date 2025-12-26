'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    IconButton,
    Tooltip,
    Divider,
    Drawer,
    MenuItem,
    Select,
    FormControl,
    FormLabel,
    InputLabel,
    Switch,
    Stack,
    FormHelperText,
    Dialog,
    Slide,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import CloseIcon from '@mui/icons-material/Close';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { TransitionProps } from '@mui/material/transitions';

import InlineTextEditor from './InlineTextEditor';

// Custom Icon for 'Submissions'
const SubmissionsIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <line x1="10" y1="9" x2="8" y2="9"></line>
    </svg>
);

// Empty State SVG Placeholder (Simplified version of the illustration)
const EmptySubmissionsSvg = () => (
    <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="60" y="40" width="80" height="100" rx="4" fill="#F7FAFC" stroke="#E2E8F0" strokeWidth="2" />
        <line x1="70" y1="60" x2="130" y2="60" stroke="#CBD5E0" strokeWidth="2" strokeLinecap="round" />
        <line x1="70" y1="80" x2="130" y2="80" stroke="#CBD5E0" strokeWidth="2" strokeLinecap="round" />
        <line x1="70" y1="100" x2="110" y2="100" stroke="#CBD5E0" strokeWidth="2" strokeLinecap="round" />

        {/* Person Illustration Placeholder */}
        <circle cx="140" cy="140" r="15" fill="#3182CE" />
        <path d="M140 155 L140 180 L125 200 M140 180 L155 200" stroke="#2D3748" strokeWidth="3" fill="none" />
        <path d="M140 155 L120 170 M140 155 L160 170" stroke="#3182CE" strokeWidth="3" fill="none" />
    </svg>
);

const Transition = React.forwardRef(function Transition(
    props: TransitionProps & {
        children: React.ReactElement;
    },
    ref: React.Ref<unknown>,
) {
    return <Slide direction="up" ref={ref} {...props} />;
});

interface AssignmentUnitConfig {
    html?: string;
    completionType?: string;
    dueDate?: string;
    endTime?: string;
    duration?: string;
    replyMethods?: {
        text: boolean;
        file: boolean;
        video: boolean;
        audio: boolean;
        screen: boolean;
    };
    submissionType?: 'file' | 'text' | 'both';
    maxPoints?: number;
    passPoints?: number;
}

interface AssignmentUnitEditorProps {
    unitId: string;
    courseId: string;
    config: AssignmentUnitConfig;
    onConfigChange: (config: AssignmentUnitConfig) => void;
    onTitleChange?: (title: string) => void;
    title?: string;
}

export default function AssignmentUnitEditor({
    unitId,
    courseId,
    config,
    onConfigChange,
    onTitleChange,
    title = '',
}: AssignmentUnitEditorProps) {
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [localTitle, setLocalTitle] = useState(title);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [submissionsOpen, setSubmissionsOpen] = useState(false);
    const titleInputRef = useRef<HTMLInputElement>(null);

    const [localConfig, setLocalConfig] = useState<AssignmentUnitConfig>(config);

    useEffect(() => {
        setLocalTitle(title);
    }, [title]);

    useEffect(() => {
        setLocalConfig(config);
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

    const handleSaveSettings = () => {
        onConfigChange(localConfig);
        setSettingsOpen(false);
    };

    const handleCancelSettings = () => {
        setLocalConfig(config);
        setSettingsOpen(false);
    };

    const updateReplyMethod = (method: keyof NonNullable<AssignmentUnitConfig['replyMethods']>, value: boolean) => {
        const currentMethods = localConfig.replyMethods || { text: false, file: true, video: false, audio: false, screen: false };
        setLocalConfig({
            ...localConfig,
            replyMethods: {
                ...currentMethods,
                [method]: value
            }
        });
    };

    return (
        <Box sx={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            {/* Header */}
            <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
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
                            {localTitle || 'Assignment unit'}
                        </Typography>
                    )}
                </Box>
            </Box>

            {/* Content Editor */}
            <Box sx={{ flex: 1, mb: 4 }}>
                <InlineTextEditor
                    content={config.html || ''}
                    onChange={(html) => onConfigChange({ ...config, html })}
                    placeholder="Add content"
                />
            </Box>

            {/* Bottom Toolbar */}
            <Divider />
            <Box sx={{
                py: 2,
                display: 'flex',
                justifyContent: 'center',
                gap: 4
            }}>
                <Tooltip title="View Submissions">
                    <IconButton
                        onClick={() => setSubmissionsOpen(true)}
                        sx={{
                            color: submissionsOpen ? '#3182ce' : '#4a5568',
                            bgcolor: submissionsOpen ? '#ebf8ff' : 'transparent',
                            '&:hover': { color: '#2d3748', bgcolor: '#edf2f7' }
                        }}
                    >
                        <SubmissionsIcon />
                    </IconButton>
                </Tooltip>

                <Tooltip title="Settings">
                    <IconButton
                        onClick={() => setSettingsOpen(true)}
                        sx={{
                            color: settingsOpen ? '#3182ce' : '#4a5568',
                            bgcolor: settingsOpen ? '#ebf8ff' : 'transparent',
                            '&:hover': { color: '#2d3748', bgcolor: '#edf2f7' }
                        }}
                    >
                        <SettingsIcon />
                    </IconButton>
                </Tooltip>
            </Box>

            {/* Submissions Modal (Full Screen Dialog to match screenshot) */}
            <Dialog
                open={submissionsOpen}
                onClose={() => setSubmissionsOpen(false)}
                TransitionComponent={Transition}
                fullScreen
                PaperProps={{
                    sx: { bgcolor: '#fff' }
                }}
            >
                {/* Header */}
                <Box sx={{ px: 4, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#2d3748' }}>
                        Submissions
                    </Typography>
                    <IconButton onClick={() => setSubmissionsOpen(false)}>
                        <CloseIcon />
                    </IconButton>
                </Box>

                {/* Empty State Content */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', p: 4 }}>
                    <Box sx={{ mb: 4 }}>
                        <EmptySubmissionsSvg />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#2d3748', mb: 1 }}>
                        Nothing available to grade yet
                    </Typography>
                </Box>
            </Dialog>

            {/* Settings Drawer (Already Implemented) */}
            <Drawer
                anchor="right"
                open={settingsOpen}
                onClose={handleCancelSettings}
                PaperProps={{
                    sx: { width: 450, p: 0 }
                }}
            >
                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

                    {/* Drawer Header */}
                    <Box sx={{ p: 3, borderBottom: '1px solid #e2e8f0' }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#2d3748' }}>
                            Assignment options
                        </Typography>
                    </Box>

                    {/* Drawer Content */}
                    <Box sx={{ p: 4, flex: 1, overflowY: 'auto' }}>

                        {/* Complete Unit Section */}
                        <Box sx={{ mb: 4 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <SettingsIcon fontSize="small" sx={{ color: '#4a5568' }} />
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Complete unit</Typography>
                            </Box>
                            <FormControl fullWidth size="small">
                                <Select
                                    value={localConfig.completionType || 'manual'}
                                    onChange={(e) => setLocalConfig({ ...localConfig, completionType: e.target.value })}
                                    displayEmpty
                                    sx={{ bgcolor: '#f7fafc' }}
                                >
                                    <MenuItem value="manual">When instructor accepts the answer</MenuItem>
                                    <MenuItem value="upload">When student uploads a file</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>

                        {/* Details Section */}
                        <Box sx={{ mb: 4 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <SettingsIcon fontSize="small" sx={{ color: '#4a5568' }} />
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Details</Typography>
                            </Box>

                            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        Due date <Tooltip title="Info"><Typography variant="caption" sx={{ color: '#3182ce', cursor: 'help' }}>ⓘ</Typography></Tooltip>
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        placeholder="DD/MM/YYYY"
                                        value={localConfig.dueDate || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, dueDate: e.target.value })}
                                        InputProps={{
                                            endAdornment: <CalendarTodayIcon fontSize="small" sx={{ color: '#a0aec0' }} />
                                        }}
                                        sx={{ bgcolor: '#f7fafc' }}
                                    />
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        End time <Tooltip title="Info"><Typography variant="caption" sx={{ color: '#3182ce', cursor: 'help' }}>ⓘ</Typography></Tooltip>
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        placeholder="HH:MM"
                                        value={localConfig.endTime || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, endTime: e.target.value })}
                                        InputProps={{
                                            endAdornment: <AccessTimeIcon fontSize="small" sx={{ color: '#a0aec0' }} />
                                        }}
                                        sx={{ bgcolor: '#f7fafc' }}
                                    />
                                </Box>
                            </Stack>

                            <Box>
                                <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    Duration <Tooltip title="Info"><Typography variant="caption" sx={{ color: '#3182ce', cursor: 'help' }}>ⓘ</Typography></Tooltip>
                                </Typography>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Minutes"
                                    value={localConfig.duration || ''}
                                    onChange={(e) => setLocalConfig({ ...localConfig, duration: e.target.value })}
                                    sx={{ bgcolor: '#f7fafc' }}
                                />
                            </Box>
                        </Box>

                        {/* Reply Method Section */}
                        <Box sx={{ mb: 4 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>Reply method</Typography>

                            <Stack spacing={2}>
                                {['Text', 'Upload a file', 'Record video', 'Record audio', 'Record screen'].map((label) => {
                                    const key = label.toLowerCase().replace('upload a ', '').replace('record ', '') as keyof NonNullable<AssignmentUnitConfig['replyMethods']>;
                                    const checked = localConfig.replyMethods?.[key] ?? (key === 'file');

                                    return (
                                        <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Switch
                                                checked={checked}
                                                onChange={(e) => updateReplyMethod(key, e.target.checked)}
                                                size="small"
                                            />
                                            <Typography variant="body2">{label}</Typography>
                                        </Box>
                                    );
                                })}
                            </Stack>
                        </Box>
                    </Box>

                    {/* Drawer Footer */}
                    <Box sx={{ p: 3, borderTop: '1px solid #e2e8f0', display: 'flex', gap: 2 }}>
                        <Button
                            variant="contained"
                            onClick={handleSaveSettings}
                            sx={{ bgcolor: '#0051cc', textTransform: 'none', px: 4, '&:hover': { bgcolor: '#003d99' } }}
                        >
                            Save
                        </Button>
                        <Button
                            variant="text"
                            onClick={handleCancelSettings}
                            sx={{ color: '#4a5568', textTransform: 'none' }}
                        >
                            Cancel
                        </Button>
                    </Box>

                </Box>
            </Drawer>

        </Box>
    );
}
