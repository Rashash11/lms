'use client';

import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, IconButton, Chip, Alert, CircularProgress, Tooltip
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import ComputerIcon from '@mui/icons-material/Computer';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import { usePermissions } from '@/hooks/usePermissions';
import AccessDenied from '@shared/ui/components/AccessDenied';
import { getCsrfToken } from '@/lib/client-csrf';

interface Session {
    id: string;
    userId: string;
    userEmail: string;
    userName: string;
    ip: string;
    deviceType: string;
    userAgent: string;
    lastActiveAt: string;
    createdAt: string;
    isCurrent: boolean;
}

export default function ActiveSessionsPage() {
    const { can, loading: permsLoading } = usePermissions();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSessions = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/security/sessions', { credentials: 'include' });
            if (!res.ok) throw new Error('Failed to fetch sessions');
            const data = await res.json();
            setSessions(data.sessions || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleRevoke = async (sessionId: string) => {
        if (!confirm('Are you sure you want to revoke this session? The user will be logged out.')) return;

        try {
            const res = await fetch(`/api/admin/security/sessions?id=${sessionId}`, {
                method: 'DELETE',
                headers: { 'x-csrf-token': getCsrfToken() }
            });
            if (!res.ok) throw new Error('Failed to revoke session');
            setSessions(prev => prev.filter(s => s.id !== sessionId));
        } catch (err) {
            alert('Failed to revoke session');
        }
    };

    useEffect(() => {
        if (can('security:sessions:read')) {
            fetchSessions();
        }
    }, [permsLoading]); // eslint-disable-line react-hooks/exhaustive-deps

    if (permsLoading) return <CircularProgress />;
    if (!can('security:sessions:read')) return <AccessDenied requiredPermission="security:sessions:read" />;

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight={800} sx={{ color: 'hsl(var(--foreground))' }}>
                    Active Sessions
                </Typography>
                <IconButton
                    onClick={fetchSessions}
                    disabled={loading}
                    sx={{
                        color: 'hsl(var(--primary))',
                        bgcolor: 'hsl(var(--primary) / 0.1)',
                        '&:hover': { bgcolor: 'hsl(var(--primary) / 0.2)' }
                    }}
                >
                    <RefreshIcon />
                </IconButton>
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
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'hsl(var(--muted) / 0.3)' }}>
                            <TableCell sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 600 }}>User</TableCell>
                            <TableCell sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 600 }}>Device / IP</TableCell>
                            <TableCell sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 600 }}>Last Active</TableCell>
                            <TableCell sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 600 }}>Status</TableCell>
                            <TableCell align="right" sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 600 }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                                    <CircularProgress size={32} sx={{ color: 'hsl(var(--primary))' }} />
                                </TableCell>
                            </TableRow>
                        ) : sessions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 8, color: 'hsl(var(--muted-foreground))' }}>
                                    No active sessions found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            sessions.map((session) => (
                                <TableRow key={session.id} hover sx={{ '&:hover': { bgcolor: 'hsl(var(--accent) / 0.2)' } }}>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={600} sx={{ color: 'hsl(var(--foreground))' }}>{session.userName}</Typography>
                                        <Typography variant="caption" sx={{ color: 'hsl(var(--muted-foreground))' }}>{session.userEmail}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            {session.deviceType === 'mobile' ?
                                                <SmartphoneIcon fontSize="small" sx={{ color: 'hsl(var(--muted-foreground))' }} /> :
                                                <ComputerIcon fontSize="small" sx={{ color: 'hsl(var(--muted-foreground))' }} />
                                            }
                                            <Box>
                                                <Typography variant="body2" sx={{ color: 'hsl(var(--foreground))' }}>{session.ip}</Typography>
                                                <Tooltip title={session.userAgent}>
                                                    <Typography variant="caption" sx={{ color: 'hsl(var(--muted-foreground))', maxWidth: 150, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {session.userAgent}
                                                    </Typography>
                                                </Tooltip>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ color: 'hsl(var(--foreground))' }}>{new Date(session.lastActiveAt).toLocaleString()}</Typography>
                                        <Typography variant="caption" sx={{ color: 'hsl(var(--muted-foreground))' }}>Created: {new Date(session.createdAt).toLocaleDateString()}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        {session.isCurrent ? (
                                            <Chip
                                                label="Current"
                                                size="small"
                                                sx={{
                                                    color: 'hsl(var(--primary))',
                                                    borderColor: 'hsl(var(--primary) / 0.3)',
                                                    bgcolor: 'hsl(var(--primary) / 0.1)'
                                                }}
                                                variant="outlined"
                                            />
                                        ) : (
                                            <Chip
                                                label="Active"
                                                size="small"
                                                sx={{
                                                    color: 'hsl(var(--success))',
                                                    borderColor: 'hsl(var(--success) / 0.3)',
                                                    bgcolor: 'hsl(var(--success) / 0.1)'
                                                }}
                                                variant="outlined"
                                            />
                                        )}
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            size="small"
                                            onClick={() => handleRevoke(session.id)}
                                            disabled={session.isCurrent || !can('security:sessions:revoke')}
                                            sx={{
                                                color: 'hsl(var(--destructive))',
                                                '&:hover': { bgcolor: 'hsl(var(--destructive) / 0.1)' },
                                                '&.Mui-disabled': { opacity: 0.3 }
                                            }}
                                        >
                                            <DeleteOutlineIcon />
                                        </IconButton>
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
