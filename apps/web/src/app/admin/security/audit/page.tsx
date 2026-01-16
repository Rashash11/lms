'use client';

import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Chip, Alert, CircularProgress,
    FormControl, InputLabel, Select, MenuItem, TextField
} from '@mui/material';
import { usePermissions } from '@/hooks/usePermissions';
import AccessDenied from '@shared/ui/components/AccessDenied';

interface AuditEvent {
    id: string;
    userId: string | null;
    eventType: string;
    ip: string | null;
    userAgent: string | null;
    meta: any;
    createdAt: string;
    users?: {
        email: string;
        firstName: string;
        lastName: string;
    } | null;
}

const EVENT_TYPES = [
    'ALL', 'LOGIN_SUCCESS', 'LOGIN_FAIL', 'LOGOUT', 'REFRESH_ROTATED',
    'REFRESH_FAILED', 'PASSWORD_CHANGED', 'SWITCH_NODE_FAIL', 'SESSION_REVOKED'
];

export default function AuditLogPage() {
    const { can, loading: permsLoading } = usePermissions();
    const [events, setEvents] = useState<AuditEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [eventType, setEventType] = useState('ALL');
    const [userIdFilter, setUserIdFilter] = useState('');

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (eventType !== 'ALL') params.set('eventType', eventType);
            if (userIdFilter) params.set('userId', userIdFilter);
            params.set('limit', '50');

            const res = await fetch(`/api/admin/security/audit?${params.toString()}`, { credentials: 'include' });
            if (!res.ok) throw new Error('Failed to fetch audit logs');
            const data = await res.json();
            setEvents(data.events || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (can('security:audit:read')) {
            const debounce = setTimeout(fetchEvents, 500);
            return () => clearTimeout(debounce);
        }
    }, [eventType, userIdFilter, permsLoading]); // eslint-disable-line react-hooks/exhaustive-deps

    if (permsLoading) return <CircularProgress />;
    if (!can('security:audit:read')) return <AccessDenied requiredPermission="security:audit:read" />;

    const getStatusChip = (type: string) => {
        if (type.includes('SUCCESS') || type.includes('ROTATED')) return <Chip label={type} size="small" color="success" variant="outlined" />;
        if (type.includes('FAIL')) return <Chip label={type} size="small" color="error" variant="outlined" />;
        return <Chip label={type} size="small" color="default" variant="outlined" />;
    };

    return (
        <Box>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" fontWeight={800} sx={{ color: 'hsl(var(--foreground))', mb: 1 }}>
                    Audit Log
                </Typography>

                <Paper
                    className="glass-card"
                    sx={{
                        p: 2,
                        display: 'flex',
                        gap: 2,
                        alignItems: 'center',
                        bgcolor: 'hsl(var(--card) / 0.4)',
                        border: '1px solid hsl(var(--border) / 0.1)',
                        borderRadius: 2
                    }}
                >
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel sx={{ color: 'hsl(var(--muted-foreground))' }}>Event Type</InputLabel>
                        <Select
                            value={eventType}
                            label="Event Type"
                            onChange={(e) => setEventType(e.target.value)}
                            sx={{
                                color: 'hsl(var(--foreground))',
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'hsl(var(--border) / 0.2)' },
                                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'hsl(var(--primary))' },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'hsl(var(--primary))' },
                            }}
                        >
                            {EVENT_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                        </Select>
                    </FormControl>

                    <TextField
                        size="small"
                        label="Filter by User ID"
                        value={userIdFilter}
                        onChange={(e) => setUserIdFilter(e.target.value)}
                        sx={{
                            minWidth: 250,
                            '& .MuiInputLabel-root': { color: 'hsl(var(--muted-foreground))' },
                            '& .MuiOutlinedInput-root': {
                                color: 'hsl(var(--foreground))',
                                '& fieldset': { borderColor: 'hsl(var(--border) / 0.2)' },
                                '&:hover fieldset': { borderColor: 'hsl(var(--primary))' },
                                '&.Mui-focused fieldset': { borderColor: 'hsl(var(--primary))' },
                            }
                        }}
                    />
                </Paper>
            </Box>

            {error && (
                <Alert
                    severity="error"
                    sx={{
                        mb: 3,
                        bgcolor: 'hsl(var(--destructive) / 0.1)',
                        color: 'hsl(var(--destructive))',
                        border: '1px solid hsl(var(--destructive) / 0.2)'
                    }}
                >
                    {error}
                </Alert>
            )}

            <TableContainer
                component={Paper}
                className="glass-card"
                sx={{
                    bgcolor: 'hsl(var(--card) / 0.4)',
                    border: '1px solid hsl(var(--border) / 0.1)',
                    borderRadius: 2,
                    overflow: 'hidden'
                }}
            >
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'hsl(var(--muted) / 0.3)' }}>
                            <TableCell sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 600 }}>Timestamp</TableCell>
                            <TableCell sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 600 }}>Event</TableCell>
                            <TableCell sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 600 }}>User</TableCell>
                            <TableCell sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 600 }}>Source</TableCell>
                            <TableCell sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 600 }}>Details</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                                    <CircularProgress size={32} sx={{ color: 'hsl(var(--primary))' }} />
                                </TableCell>
                            </TableRow>
                        ) : events.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 8, color: 'hsl(var(--muted-foreground))' }}>
                                    No events found matching filters.
                                </TableCell>
                            </TableRow>
                        ) : (
                            events.map((event) => (
                                <TableRow key={event.id} hover sx={{ '&:hover': { bgcolor: 'hsl(var(--accent) / 0.2)' } }}>
                                    <TableCell sx={{ whiteSpace: 'nowrap', color: 'hsl(var(--foreground))' }}>
                                        {new Date(event.createdAt).toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        {getStatusChip(event.eventType)}
                                    </TableCell>
                                    <TableCell>
                                        {event.users ? (
                                            <Box>
                                                <Typography variant="body2" fontWeight={600} sx={{ color: 'hsl(var(--foreground))' }}>{event.users.email}</Typography>
                                                <Typography variant="caption" sx={{ color: 'hsl(var(--muted-foreground))' }}>{event.users.firstName} {event.users.lastName}</Typography>
                                            </Box>
                                        ) : event.userId ? (
                                            <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'hsl(var(--muted-foreground))' }}>{event.userId}</Typography>
                                        ) : (
                                            <Typography variant="caption" sx={{ color: 'hsl(var(--muted-foreground))' }}>anonymous</Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ color: 'hsl(var(--foreground))', opacity: 0.8 }}>{event.ip}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="caption" sx={{
                                            color: 'hsl(var(--muted-foreground))',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                            maxWidth: 300
                                        }}>
                                            {JSON.stringify(event.meta)}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}
