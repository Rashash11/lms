'use client';

import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Chip, Snackbar, Alert
} from '@mui/material';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import AddIcon from '@mui/icons-material/Add';

interface CalendarEvent {
    id: string;
    title: string;
    description: string | null;
    startTime: string;
    endTime: string;
    type: string;
}

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date(2025, 11, 1)); // December 2025
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
    const [newEvent, setNewEvent] = useState({
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        type: 'custom'
    });

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    useEffect(() => {
        fetchEvents();
    }, [currentDate]);

    const fetchEvents = async () => {
        try {
            const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

            const res = await fetch(`/api/instructor/calendar/events?start=${start.toISOString()}&end=${end.toISOString()}`);
            const data = await res.json();
            if (data.events) {
                setEvents(data.events);
            }
        } catch (error) {
            console.error('Failed to fetch events:', error);
        }
    };

    const handleAddEvent = async () => {
        try {
            const res = await fetch('/api/instructor/calendar/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newEvent)
            });
            const data = await res.json();
            if (data.success) {
                setSnackbar({ open: true, message: 'Event created successfully', severity: 'success' });
                setOpenDialog(false);
                setNewEvent({
                    title: '',
                    description: '',
                    startTime: '',
                    endTime: '',
                    type: 'custom'
                });
                fetchEvents();
            }
        } catch (error) {
            setSnackbar({ open: true, message: 'Failed to create event', severity: 'error' });
        }
    };

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        return { daysInMonth, startingDayOfWeek };
    };

    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleToday = () => {
        setCurrentDate(new Date());
    };

    const getEventsForDay = (day: number) => {
        return events.filter(event => {
            const eventDate = new Date(event.startTime);
            return eventDate.getDate() === day &&
                eventDate.getMonth() === currentDate.getMonth() &&
                eventDate.getFullYear() === currentDate.getFullYear();
        });
    };

    const renderCalendarDays = () => {
        const days = [];
        const prevMonthDays = startingDayOfWeek;

        // Previous month's trailing days
        const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
        const prevMonthLastDay = prevMonth.getDate();
        for (let i = prevMonthDays - 1; i >= 0; i--) {
            days.push(
                <Box
                    key={`prev-${i}`}
                    sx={{
                        border: '1px solid #DFE1E6',
                        minHeight: 100,
                        p: 1,
                        bgcolor: '#FAFBFC'
                    }}
                >
                    <Typography variant="caption" color="#97A0AF">
                        {prevMonthLastDay - i}
                    </Typography>
                </Box>
            );
        }

        // Current month's days
        const today = new Date();
        for (let day = 1; day <= daysInMonth; day++) {
            const isToday =
                day === today.getDate() &&
                currentDate.getMonth() === today.getMonth() &&
                currentDate.getFullYear() === today.getFullYear();

            const dayEvents = getEventsForDay(day);

            days.push(
                <Box
                    key={`current-${day}`}
                    sx={{
                        border: '1px solid #DFE1E6',
                        minHeight: 100,
                        p: 1,
                        bgcolor: isToday ? '#E6F2FF' : 'white',
                        position: 'relative',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: isToday ? '#D6E7FF' : '#F4F5F7' }
                    }}
                >
                    <Typography
                        variant="caption"
                        color={isToday ? '#0052CC' : '#172B4D'}
                        fontWeight={isToday ? 600 : 400}
                    >
                        {day}
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                        {dayEvents.slice(0, 2).map(event => (
                            <Chip
                                key={event.id}
                                label={event.title}
                                size="small"
                                sx={{
                                    fontSize: 10,
                                    height: 18,
                                    bgcolor: '#0052CC',
                                    color: 'white',
                                    mb: 0.5,
                                    width: '100%',
                                    '& .MuiChip-label': {
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }
                                }}
                            />
                        ))}
                        {dayEvents.length > 2 && (
                            <Typography variant="caption" color="#6B778C" sx={{ fontSize: 10 }}>
                                +{dayEvents.length - 2} more
                            </Typography>
                        )}
                    </Box>
                </Box>
            );
        }

        return days;
    };

    return (
        <Box>
            {/* Header */}
            <Typography variant="h5" fontWeight={600} color="#172B4D" sx={{ mb: 3 }}>
                Calendar
            </Typography>

            {/* Navigation Bar */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={handleToday}
                        sx={{
                            textTransform: 'none',
                            borderColor: '#DFE1E6',
                            color: '#0052CC',
                            fontWeight: 600
                        }}
                    >
                        Today
                    </Button>
                    <IconButton size="small" onClick={handlePrevMonth}>
                        <NavigateBeforeIcon />
                    </IconButton>
                    <IconButton size="small" onClick={handleNextMonth}>
                        <NavigateNextIcon />
                    </IconButton>
                    <Typography variant="h6" fontWeight={600} color="#172B4D">
                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setOpenDialog(true)}
                        sx={{
                            bgcolor: '#0052CC',
                            textTransform: 'none',
                            fontWeight: 600,
                            '&:hover': { bgcolor: '#0747A6' }
                        }}
                    >
                        Add event
                    </Button>
                    <Button
                        variant="outlined"
                        sx={{
                            textTransform: 'none',
                            borderColor: '#DFE1E6',
                            color: '#172B4D',
                            fontWeight: 600
                        }}
                    >
                        Export
                    </Button>
                </Box>
            </Box>

            {/* Calendar Grid */}
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    border: '1px solid #DFE1E6',
                    borderRadius: 1,
                    overflow: 'hidden'
                }}
            >
                {/* Day Headers */}
                {dayNames.map(day => (
                    <Box
                        key={day}
                        sx={{
                            bgcolor: '#FAFBFC',
                            border: '1px solid #DFE1E6',
                            p: 1,
                            textAlign: 'center'
                        }}
                    >
                        <Typography variant="body2" fontWeight={600} color="#172B4D">
                            {day}
                        </Typography>
                    </Box>
                ))}

                {/* Calendar Days */}
                {renderCalendarDays()}
            </Box>

            {/* Add Event Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add Event</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        <TextField
                            label="Event Title"
                            fullWidth
                            value={newEvent.title}
                            onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                        />
                        <TextField
                            label="Description"
                            fullWidth
                            multiline
                            rows={3}
                            value={newEvent.description}
                            onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                        />
                        <TextField
                            label="Start Time"
                            type="datetime-local"
                            fullWidth
                            value={newEvent.startTime}
                            onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            label="End Time"
                            type="datetime-local"
                            fullWidth
                            value={newEvent.endTime}
                            onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            label="Event Type"
                            fullWidth
                            select
                            value={newEvent.type}
                            onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
                            SelectProps={{ native: true }}
                        >
                            <option value="custom">Custom</option>
                            <option value="conference">Conference</option>
                            <option value="ilt">ILT Session</option>
                            <option value="deadline">Deadline</option>
                        </TextField>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleAddEvent}
                        disabled={!newEvent.title || !newEvent.startTime || !newEvent.endTime}
                    >
                        Add Event
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
}
