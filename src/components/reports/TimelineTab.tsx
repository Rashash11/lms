'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
    Box,
    TextField,
    Button,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Paper,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Typography,
    CircularProgress,
} from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import AddCircleIcon from '@mui/icons-material/AddCircle';

interface TimelineEvent {
    id: string;
    timestamp: Date;
    relativeTime: string;
    eventType: string;
    description: string;
}

export default function TimelineTab() {
    const [events, setEvents] = useState<TimelineEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        from: '',
        to: '',
        event: '',
        user: '',
        course: '',
    });

    const fetchEvents = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filters.from) params.append('from', filters.from);
            if (filters.to) params.append('to', filters.to);
            if (filters.event) params.append('event', filters.event);
            if (filters.user) params.append('user', filters.user);
            if (filters.course) params.append('course', filters.course);

            const res = await fetch(`/api/reports/timeline?${params}`);
            const json = await res.json();
            setEvents(json.events || []);
        } catch (error) {
            console.error('Error fetching timeline:', error);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const handleReset = () => {
        setFilters({
            from: '',
            to: '',
            event: '',
            user: '',
            course: '',
        });
    };

    const getEventIcon = (eventType: string) => {
        if (eventType.includes('signin') || eventType.includes('login')) {
            return <LoginIcon color="primary" />;
        }
        return <AddCircleIcon color="success" />;
    };

    // Set default dates (last 30 days)
    useEffect(() => {
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);

        setFilters({
            from: thirtyDaysAgo.toISOString().split('T')[0],
            to: today.toISOString().split('T')[0],
            event: '',
            user: '',
            course: '',
        });
    }, []);

    return (
        <Box>
            {/* Filter Bar */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Box sx={{ flex: '1 1 150px' }}>
                        <TextField
                            label="From"
                            type="date"
                            fullWidth
                            size="small"
                            value={filters.from}
                            onChange={(e) => setFilters({ ...filters, from: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Box>
                    <Box sx={{ flex: '1 1 150px' }}>
                        <TextField
                            label="To"
                            type="date"
                            fullWidth
                            size="small"
                            value={filters.to}
                            onChange={(e) => setFilters({ ...filters, to: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Box>
                    <Box sx={{ flex: '1 1 150px' }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Event</InputLabel>
                            <Select
                                value={filters.event}
                                onChange={(e) => setFilters({ ...filters, event: e.target.value })}
                                label="Event"
                            >
                                <MenuItem value="">Not specified</MenuItem>
                                <MenuItem value="user_signin">User sign in</MenuItem>
                                <MenuItem value="learning_path_created">Learning path created</MenuItem>
                                <MenuItem value="course_created">Course created</MenuItem>
                                <MenuItem value="course_completed">Course completed</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                    <Box sx={{ flex: '1 1 150px' }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>User</InputLabel>
                            <Select
                                value={filters.user}
                                onChange={(e) => setFilters({ ...filters, user: e.target.value })}
                                label="User"
                            >
                                <MenuItem value="">Not specified</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                    <Box sx={{ flex: '1 1 150px' }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Course</InputLabel>
                            <Select
                                value={filters.course}
                                onChange={(e) => setFilters({ ...filters, course: e.target.value })}
                                label="Course"
                            >
                                <MenuItem value="">Not specified</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                    <Box sx={{ flex: '0 0 auto' }}>
                        <Button onClick={handleReset} fullWidth>
                            Reset
                        </Button>
                    </Box>
                </Box>
            </Paper>

            {/* Events List */}
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Events
            </Typography>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <List>
                    {events.map((event) => (
                        <ListItem
                            key={event.id}
                            sx={{
                                bgcolor: 'background.paper',
                                mb: 1,
                                borderRadius: 1,
                                border: 1,
                                borderColor: 'divider',
                            }}
                        >
                            <ListItemIcon>{getEventIcon(event.eventType)}</ListItemIcon>
                            <ListItemText
                                primary={event.description}
                                secondary={event.relativeTime}
                            />
                        </ListItem>
                    ))}
                    {events.length === 0 && (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="body1" color="text.secondary">
                                No events found
                            </Typography>
                        </Box>
                    )}
                </List>
            )}
        </Box>
    );
}
