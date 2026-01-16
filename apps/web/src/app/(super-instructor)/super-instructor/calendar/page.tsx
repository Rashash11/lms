'use client';

import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Button, IconButton,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AddIcon from '@mui/icons-material/Add';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

export default function SuperInstructorCalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchEvents = async () => {
        try {
            const res = await fetch('/api/calendar-events');
            if (res.ok) {
                const data = await res.json();
                setEvents(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];

    const getDaysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const previousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    };

    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blanks = Array.from({ length: firstDay }, (_, i) => i);

    return (
        <Box className="animate-fade-in" sx={{ p: { xs: 2, md: 3 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                    <Box sx={{
                        p: 1.5,
                        borderRadius: 3,
                        bgcolor: 'hsl(var(--primary) / 0.1)',
                        color: 'hsl(var(--primary))',
                        display: 'flex',
                        boxShadow: '0 0 20px hsl(var(--primary) / 0.15)'
                    }}>
                        <CalendarTodayIcon sx={{ fontSize: 32 }} />
                    </Box>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: 'hsl(var(--foreground))', letterSpacing: '-0.02em' }}>Calendar</Typography>
                        <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))' }}>Coordinate and track global instructional events</Typography>
                    </Box>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    sx={{
                        bgcolor: 'hsl(var(--primary))',
                        color: 'white',
                        px: 3,
                        py: 1.2,
                        borderRadius: 2.5,
                        fontWeight: 700,
                        boxShadow: '0 8px 16px hsl(var(--primary) / 0.25)',
                        '&:hover': {
                            bgcolor: 'hsl(var(--primary))',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 12px 20px hsl(var(--primary) / 0.35)',
                        },
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                >
                    Add Event
                </Button>
            </Box>

            <Box className="glass-card" sx={{ p: { xs: 2, md: 4 }, borderRadius: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, px: 2 }}>
                    <IconButton
                        onClick={previousMonth}
                        sx={{
                            color: 'hsl(var(--muted-foreground))',
                            bgcolor: 'rgba(141, 166, 166, 0.05)',
                            '&:hover': { bgcolor: 'rgba(141, 166, 166, 0.1)', color: 'hsl(var(--primary))' }
                        }}
                    >
                        <ChevronLeftIcon />
                    </IconButton>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: 'hsl(var(--foreground))', letterSpacing: '-0.01em' }}>
                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </Typography>
                    <IconButton
                        onClick={nextMonth}
                        sx={{
                            color: 'hsl(var(--muted-foreground))',
                            bgcolor: 'rgba(141, 166, 166, 0.05)',
                            '&:hover': { bgcolor: 'rgba(141, 166, 166, 0.1)', color: 'hsl(var(--primary))' }
                        }}
                    >
                        <ChevronRightIcon />
                    </IconButton>
                </Box>

                <Grid container spacing={1}>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                        <Grid item xs={12 / 7} key={day}>
                            <Box sx={{ textAlign: 'center', py: 1.5 }}>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                    {day}
                                </Typography>
                            </Box>
                        </Grid>
                    ))}
                    {blanks.map((blank) => (
                        <Grid item xs={12 / 7} key={`blank-${blank}`}>
                            <Box sx={{
                                height: 100,
                                border: '1px solid rgba(141, 166, 166, 0.05)',
                                bgcolor: 'rgba(141, 166, 166, 0.02)',
                                borderRadius: 1
                            }} />
                        </Grid>
                    ))}
                    {days.map((day) => (
                        <Grid item xs={12 / 7} key={day}>
                            <Box sx={{
                                height: 100,
                                border: '1px solid rgba(141, 166, 166, 0.1)',
                                bgcolor: 'rgba(141, 166, 166, 0.03)',
                                borderRadius: 1,
                                p: 1.5,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    bgcolor: 'rgba(141, 166, 166, 0.08)',
                                    borderColor: 'hsl(var(--primary) / 0.5)',
                                    transform: 'scale(1.02)',
                                    zIndex: 1,
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                                }
                            }}>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: 'hsl(var(--foreground))' }}>{day}</Typography>
                            </Box>
                        </Grid>
                    ))}
                </Grid>
            </Box>
        </Box>
    );
}
