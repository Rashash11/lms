'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Typography,
    TextField,
    Paper,
    Button,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import HomeIcon from '@mui/icons-material/Home';
import GroupsIcon from '@mui/icons-material/Groups';
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { Slider, Radio, RadioGroup, FormControlLabel } from '@mui/material';

interface ILTUnitEditorProps {
    unitId: string;
    courseId: string;
    config: any;
    onConfigChange: (config: any) => void;
    onTitleChange?: (title: string) => void;
    title?: string;
}

interface Session {
    id: string;
    type: 'online-integrated' | 'in-person' | 'online-external';
    name: string;
    date: string;
    startTime: string;
    instructor?: string;
    duration: number;
    durationUnit: 'minutes' | 'hours';
    description?: string;
    color?: string;
    location?: string;
    capacity?: string;
    maxAttendees?: number;
}

export default function ILTUnitEditor({
    unitId,
    courseId,
    config,
    onConfigChange,
    onTitleChange,
    title = ''
}: ILTUnitEditorProps) {
    const [localTitle, setLocalTitle] = useState(title);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [description, setDescription] = useState(config.description || '');
    const [sessions, setSessions] = useState<Session[]>(config.sessions || []);
    const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
    const [selectedSessionType, setSelectedSessionType] = useState<string | null>(null);
    const [editingSession, setEditingSession] = useState<Session | null>(null);
    const titleInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setLocalTitle(title);
    }, [title]);

    useEffect(() => {
        setDescription(config.description || '');
        setSessions(config.sessions || []);
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

    const handleDescriptionChange = (value: string) => {
        setDescription(value);
        onConfigChange({ ...config, description: value });
    };

    const handleAddSession = (type: string) => {
        setSelectedSessionType(type);
        setEditingSession(null);
        setSessionDialogOpen(true);
    };

    const handleSaveSession = (session: Session) => {
        const updatedSessions = editingSession
            ? sessions.map(s => s.id === editingSession.id ? session : s)
            : [...sessions, { ...session, id: Date.now().toString() }];

        setSessions(updatedSessions);
        onConfigChange({ ...config, sessions: updatedSessions });
        setSessionDialogOpen(false);
        setEditingSession(null);
    };

    const handleDeleteSession = (sessionId: string) => {
        const updatedSessions = sessions.filter(s => s.id !== sessionId);
        setSessions(updatedSessions);
        onConfigChange({ ...config, sessions: updatedSessions });
    };

    const SessionTile = ({
        icon,
        title,
        subtitle,
        onClick
    }: {
        icon: React.ReactNode;
        title: string;
        subtitle: string;
        onClick: () => void;
    }) => (
        <Paper
            onClick={onClick}
            sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                border: '1px solid #e2e8f0',
                borderRadius: 2,
                minHeight: 150,
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
                    fontWeight: 600,
                    textAlign: 'center',
                    mb: 0.5
                }}
            >
                {title}
            </Typography>
            <Typography
                variant="caption"
                sx={{
                    color: '#718096',
                    textAlign: 'center',
                    fontSize: '0.75rem'
                }}
            >
                {subtitle}
            </Typography>
        </Paper>
    );

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
                            {localTitle || 'ILT unit'}
                        </Typography>
                    )}
                </Box>

                {/* Description */}
                <TextField
                    fullWidth
                    placeholder="Add description here"
                    value={description}
                    onChange={(e) => handleDescriptionChange(e.target.value)}
                    variant="standard"
                    sx={{
                        '& .MuiInput-root': {
                            fontSize: '0.875rem',
                            color: '#718096',
                            '&:before, &:after': { display: 'none' }
                        }
                    }}
                />
            </Box>

            {/* Sessions Section */}
            {sessions.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: '#2d3748' }}>
                        There are no sessions yet!
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 4, color: '#718096' }}>
                        Add sessions from the list below to create your ILT unit.
                    </Typography>

                    {/* Session Type Tiles */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, maxWidth: 800, mx: 'auto' }}>
                        <SessionTile
                            icon={<PersonIcon sx={{ fontSize: 48 }} />}
                            title="Online session"
                            subtitle="(integrated tool)"
                            onClick={() => handleAddSession('online-integrated')}
                        />
                        <SessionTile
                            icon={<HomeIcon sx={{ fontSize: 48 }} />}
                            title="In-person session"
                            subtitle=""
                            onClick={() => handleAddSession('in-person')}
                        />
                        <SessionTile
                            icon={<GroupsIcon sx={{ fontSize: 48 }} />}
                            title="Online session"
                            subtitle="(other external tools)"
                            onClick={() => handleAddSession('online-external')}
                        />
                    </Box>
                </Box>
            ) : (
                <Box>
                    {/* Sessions List */}
                    {sessions.map((session) => (
                        <Paper key={session.id} sx={{ p: 3, mb: 2, border: '1px solid #e2e8f0', borderRadius: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box sx={{ flex: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                        {session.color && (
                                            <Box sx={{ width: 12, height: 12, borderRadius: '2px', bgcolor: session.color }} />
                                        )}
                                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#2d3748' }}>
                                            {session.name || 'Untitled Session'}
                                        </Typography>
                                    </Box>
                                    <Typography variant="body2" sx={{ color: '#718096', mb: 0.5 }}>
                                        {session.date} at {session.startTime} ({session.duration} mins)
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#718096', mb: 1 }}>
                                        Type: {session.type === 'online-integrated' ? 'Online (Integrated)' :
                                            session.type === 'in-person' ? 'In-Person' : 'Online (External)'}
                                    </Typography>
                                    {session.instructor && (
                                        <Typography variant="body2" sx={{ color: '#718096' }}>
                                            Instructor: {session.instructor}
                                        </Typography>
                                    )}
                                </Box>
                                <Box>
                                    <IconButton size="small" onClick={() => {
                                        setEditingSession(session);
                                        setSelectedSessionType(session.type);
                                        setSessionDialogOpen(true);
                                    }}>
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton size="small" onClick={() => handleDeleteSession(session.id)}>
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            </Box>
                        </Paper>
                    ))}

                    {/* Add Session Button */}
                    <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => {
                            setSelectedSessionType('online-integrated');
                            setEditingSession(null);
                            setSessionDialogOpen(true);
                        }}
                        sx={{ mt: 2, textTransform: 'none' }}
                    >
                        Add Session
                    </Button>
                </Box>
            )}

            {/* Session Dialog */}
            <SessionDialog
                open={sessionDialogOpen}
                onClose={() => {
                    setSessionDialogOpen(false);
                    setEditingSession(null);
                }}
                sessionType={selectedSessionType}
                session={editingSession}
                onSave={handleSaveSession}
            />

            {/* Settings Button */}
            <Box sx={{ position: 'fixed', bottom: 24, right: 24 }}>
                <IconButton
                    sx={{
                        bgcolor: '#fff',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        '&:hover': { bgcolor: '#f7fafc' }
                    }}
                >
                    <SettingsIcon />
                </IconButton>
            </Box>
        </Box>
    );
}

// Session Dialog Component
function SessionDialog({
    open,
    onClose,
    sessionType,
    session,
    onSave
}: {
    open: boolean;
    onClose: () => void;
    sessionType: string | null;
    session: Session | null;
    onSave: (session: Session) => void;
}) {
    const [formData, setFormData] = useState<Partial<Session>>({
        name: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '18:30',
        instructor: 'm. mostafa',
        duration: 30,
        durationUnit: 'minutes',
        description: '',
        color: '#0046AB',
        capacity: '',
        location: '',
        maxAttendees: 20
    });

    useEffect(() => {
        if (session) {
            setFormData({
                ...session,
                durationUnit: session.durationUnit || 'minutes'
            });
        } else {
            setFormData({
                name: '',
                date: new Date().toISOString().split('T')[0],
                startTime: '18:30',
                instructor: 'm. mostafa',
                duration: 30,
                durationUnit: 'minutes',
                description: '',
                color: '#0046AB',
                capacity: '',
                location: '',
                maxAttendees: 20
            });
        }
    }, [session, open]);

    const handleSave = () => {
        onSave({
            ...formData,
            id: session?.id || Date.now().toString(),
            type: (sessionType as any) || session?.type || 'online-integrated'
        } as Session);
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: '8px',
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    bottom: 0,
                    m: 0,
                    maxHeight: 'none',
                    width: 500
                }
            }}
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid #edf2f7', py: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#2d3748' }}>
                    {sessionType === 'in-person' ? 'Add in-person session' : 'Add online session'}
                </Typography>
                <HelpOutlineIcon sx={{ fontSize: 18, color: '#3182ce', cursor: 'pointer' }} />
            </DialogTitle>
            <DialogContent sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Name */}
                <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, mb: 1, color: '#2d3748' }}>Name</Typography>
                    <TextField
                        fullWidth
                        placeholder="Type a session name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        size="small"
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '4px',
                            }
                        }}
                    />
                </Box>

                {/* Date and Start Time */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, mb: 1, color: '#2d3748' }}>Date</Typography>
                        <TextField
                            fullWidth
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            size="small"
                            InputProps={{
                                endAdornment: <CalendarMonthIcon sx={{ color: '#718096', fontSize: 20 }} />
                            }}
                        />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, mb: 1, color: '#2d3748' }}>Start time</Typography>
                        <TextField
                            fullWidth
                            type="time"
                            value={formData.startTime}
                            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                            size="small"
                            InputProps={{
                                endAdornment: <AccessTimeIcon sx={{ color: '#718096', fontSize: 20 }} />
                            }}
                        />
                    </Box>
                </Box>

                {/* Instructor and Capacity */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, mb: 1, color: '#2d3748' }}>Instructor</Typography>
                        <Select
                            fullWidth
                            value={formData.instructor}
                            onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                            size="small"
                            sx={{ borderRadius: '4px' }}
                        >
                            <MenuItem value="m. mostafa">m. mostafa</MenuItem>
                            <MenuItem value="instructor.1">instructor.1</MenuItem>
                        </Select>
                    </Box>
                    {sessionType === 'in-person' && (
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, mb: 1, color: '#2d3748' }}>Capacity</Typography>
                            <TextField
                                fullWidth
                                placeholder="Type the session's capacity"
                                value={formData.capacity}
                                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                                size="small"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '4px',
                                    }
                                }}
                            />
                        </Box>
                    )}
                </Box>

                {/* Location */}
                {sessionType === 'in-person' && (
                    <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700, mb: 1, color: '#2d3748' }}>Location</Typography>
                        <TextField
                            fullWidth
                            placeholder="Type the location for the in-person session"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            size="small"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '4px',
                                    bgcolor: '#f7fafc'
                                }
                            }}
                        />
                    </Box>
                )}

                {/* Duration */}
                <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, mb: 1, color: '#2d3748' }}>Duration</Typography>
                    <Box sx={{ px: 1, py: 1, border: '1px solid #e2e8f0', borderRadius: '4px' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: -1 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#3182ce' }}>{formData.duration}</Typography>
                        </Box>
                        <Slider
                            value={formData.duration}
                            onChange={(_, value) => setFormData({ ...formData, duration: value as number })}
                            min={1}
                            max={formData.durationUnit === 'hours' ? 24 : 120}
                            step={1}
                            sx={{
                                color: '#3182ce',
                                height: 4,
                                '& .MuiSlider-thumb': {
                                    width: 12,
                                    height: 12,
                                    transition: '0.3s cubic-bezier(.47,1.64,.41,.8)',
                                    '&:before': {
                                        boxShadow: '0 2px 12px 0 rgba(0,0,0,0.4)',
                                    },
                                    '&:hover, &.Mui-focusVisible': {
                                        boxShadow: `0px 0px 0px 8px ${'rgb(0 0 0 / 16%)'}`,
                                    },
                                    '&.Mui-active': {
                                        width: 20,
                                        height: 20,
                                    },
                                },
                                '& .MuiSlider-rail': {
                                    opacity: 0.28,
                                },
                            }}
                        />
                        <RadioGroup
                            row
                            value={formData.durationUnit}
                            onChange={(e) => setFormData({ ...formData, durationUnit: e.target.value as 'minutes' | 'hours' })}
                            sx={{ mt: 1 }}
                        >
                            <FormControlLabel
                                value="minutes"
                                control={<Radio size="small" />}
                                label={<Typography variant="caption" sx={{ color: '#718096' }}>Minutes</Typography>}
                            />
                            <FormControlLabel
                                value="hours"
                                control={<Radio size="small" />}
                                label={<Typography variant="caption" sx={{ color: '#718096' }}>Hours</Typography>}
                            />
                        </RadioGroup>
                    </Box>
                </Box>

                {/* Description */}
                <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, mb: 1, color: '#2d3748' }}>Description</Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="Type a description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '4px',
                                bgcolor: '#f7fafc'
                            }
                        }}
                    />
                </Box>

                {/* Color */}
                <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, mb: 1, color: '#2d3748' }}>Color</Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', bgcolor: '#f7fafc', p: 1, borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                        <TextField
                            fullWidth
                            value={formData.color}
                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                            size="small"
                            variant="standard"
                            InputProps={{ disableUnderline: true }}
                            sx={{ '& input': { p: 0, fontWeight: 500 } }}
                        />
                        <Box sx={{ width: 24, height: 24, borderRadius: '4px', bgcolor: formData.color, cursor: 'pointer' }} />
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3, gap: 1, borderTop: '1px solid #edf2f7' }}>
                <Button
                    variant="contained"
                    onClick={handleSave}
                    sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        bgcolor: '#3182ce',
                        '&:hover': { bgcolor: '#2b6cb0' },
                        boxShadow: 'none',
                        px: 3,
                        borderRadius: '4px'
                    }}
                >
                    Save
                </Button>
                <Button
                    onClick={onClose}
                    sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        color: '#2d3748',
                        bgcolor: '#f7fafc',
                        '&:hover': { bgcolor: '#edf2f7' },
                        px: 3,
                        borderRadius: '4px'
                    }}
                >
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
}
