'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
    Box, Typography, Tabs, Tab, Card, CardContent,
    List, ListItem, ListItemIcon, ListItemText, Divider, Skeleton
} from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { usePermissions } from '@/hooks/usePermissions';
import { useApiError } from '@/hooks/useApiError';
import AccessDenied from '@shared/ui/components/AccessDenied';
import SchoolIcon from '@mui/icons-material/School';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import TableChartIcon from '@mui/icons-material/TableChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PieChartIcon from '@mui/icons-material/PieChart';

export default function ReportsPage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState(0);
    const { can, loading: permissionsLoading } = usePermissions();
    const { handleResponse } = useApiError();
    const [forbidden, setForbidden] = useState(false);

    const fetchOverview = useCallback(async () => {
        try {
            const res = await fetch('/api/reports');
            if (res.status === 403) {
                setForbidden(true);
                return;
            }
            if (handleResponse(res)) return;
            const data = await res.json();
            setStats(data);
        } catch (error) {
            console.error('Error fetching overview:', error);
        } finally {
            setLoading(false);
        }
    }, [handleResponse]);

    useEffect(() => {
        if (!permissionsLoading && can('reports:read')) {
            void fetchOverview();
        }
    }, [can, fetchOverview, permissionsLoading]);

    if (permissionsLoading) return null;
    if (!can('reports:read') || forbidden) {
        return <AccessDenied requiredPermission="reports:read" />;
    }

    return (
        <Box>
            {/* Header */}
            <Typography variant="h5" fontWeight={600} color="#172B4D" sx={{ mb: 3 }}>
                Reports
            </Typography>

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
                <Tabs
                    value={tab}
                    onChange={(e, val) => setTab(val)}
                    sx={{
                        '& .MuiTab-root': {
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: 15,
                            minWidth: 120
                        },
                        '& .Mui-selected': { color: '#0052CC' },
                        '& .MuiTabs-indicator': { backgroundColor: '#0052CC' }
                    }}
                >
                    <Tab label="Overview" />
                    <Tab label="Training matrix" />
                    <Tab label="Timeline" />
                </Tabs>
            </Box>

            {/* Overview Tab */}
            {tab === 0 && (
                <Box sx={{ display: 'flex', gap: 3 }}>
                    {/* Left Card - Overview */}
                    <Card sx={{ flex: 1, border: '1px solid #DFE1E6', boxShadow: 'none' }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" fontWeight={600} color="#172B4D" sx={{ mb: 2 }}>
                                Overview
                            </Typography>
                            {loading ? (
                                <Box>
                                    {[1, 2, 3, 4, 5, 6].map(i => (
                                        <Skeleton key={i} height={50} sx={{ mb: 1 }} />
                                    ))}
                                </Box>
                            ) : (
                                <List disablePadding>
                                    <ListItem sx={{ py: 1.5, px: 0 }}>
                                        <ListItemIcon sx={{ minWidth: 40 }}>
                                            <MenuBookIcon sx={{ color: '#6B778C' }} />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="Courses"
                                            primaryTypographyProps={{ fontSize: 14, color: '#6B778C' }}
                                        />
                                        <Typography variant="body1" fontWeight={600} color="#172B4D">
                                            {stats?.courses || 0}
                                        </Typography>
                                    </ListItem>
                                    <Divider />
                                    <ListItem sx={{ py: 1.5, px: 0 }}>
                                        <ListItemIcon sx={{ minWidth: 40 }}>
                                            <SchoolIcon sx={{ color: '#6B778C' }} />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="Learning paths"
                                            primaryTypographyProps={{ fontSize: 14, color: '#6B778C' }}
                                        />
                                        <Typography variant="body1" fontWeight={600} color="#172B4D">
                                            {stats?.learningPaths || 0}
                                        </Typography>
                                    </ListItem>
                                    <Divider />
                                    <ListItem sx={{ py: 1.5, px: 0 }}>
                                        <ListItemIcon sx={{ minWidth: 40 }}>
                                            <DirectionsRunIcon sx={{ color: '#6B778C' }} />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="Learning activities"
                                            primaryTypographyProps={{ fontSize: 14, color: '#6B778C' }}
                                        />
                                        <Typography variant="body1" fontWeight={600} color="#172B4D">
                                            {stats?.learningActivities || 0}
                                        </Typography>
                                    </ListItem>
                                    <Divider />
                                    <ListItem sx={{ py: 1.5, px: 0 }}>
                                        <ListItemIcon sx={{ minWidth: 40 }}>
                                            <TableChartIcon sx={{ color: '#6B778C' }} />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="Training matrix"
                                            primaryTypographyProps={{ fontSize: 14, color: '#6B778C' }}
                                        />
                                        <Typography variant="body1" fontWeight={600} color="#172B4D">
                                            {stats?.trainingMatrix || '0.0'}%
                                        </Typography>
                                    </ListItem>
                                    <Divider />
                                    <ListItem sx={{ py: 1.5, px: 0 }}>
                                        <ListItemIcon sx={{ minWidth: 40 }}>
                                            <TimelineIcon sx={{ color: '#6B778C' }} />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="Timeline"
                                            primaryTypographyProps={{ fontSize: 14, color: '#6B778C' }}
                                        />
                                        <Typography variant="body1" fontWeight={600} color="#172B4D">
                                            {stats?.timeline || 0}
                                        </Typography>
                                    </ListItem>
                                    <Divider />
                                    <ListItem sx={{ py: 1.5, px: 0 }}>
                                        <ListItemIcon sx={{ minWidth: 40 }}>
                                            <AccessTimeIcon sx={{ color: '#6B778C' }} />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="Training time"
                                            primaryTypographyProps={{ fontSize: 14, color: '#6B778C' }}
                                        />
                                        <Typography variant="body1" fontWeight={600} color="#172B4D">
                                            {stats?.trainingTime || '0h 0m'}
                                        </Typography>
                                    </ListItem>
                                </List>
                            )}
                        </CardContent>
                    </Card>

                    {/* Right Card - Courses Chart */}
                    <Card sx={{ flex: 1, border: '1px solid #DFE1E6', boxShadow: 'none' }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" fontWeight={600} color="#172B4D" sx={{ mb: 2 }}>
                                Courses
                            </Typography>
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    py: 6
                                }}
                            >
                                <PieChartIcon sx={{ fontSize: 80, color: '#0052CC', mb: 2 }} />
                                <Typography variant="body1" fontWeight={600} color="#172B4D">
                                    No stats to show
                                </Typography>
                                <Typography variant="body2" color="#6B778C">
                                    Create your first course now
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color="primary"
                                    sx={{ mt: 2, cursor: 'pointer', fontWeight: 500 }}
                                >
                                    Go to courses
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Box>
            )}

            {/* Training Matrix Tab */}
            {tab === 1 && (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography variant="h6" color="#172B4D">
                        Training Matrix
                    </Typography>
                    <Typography variant="body2" color="#6B778C">
                        Coming soon
                    </Typography>
                </Box>
            )}

            {/* Timeline Tab */}
            {tab === 2 && (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography variant="h6" color="#172B4D">
                        Timeline
                    </Typography>
                    <Typography variant="body2" color="#6B778C">
                        Coming soon
                    </Typography>
                </Box>
            )}
        </Box>
    );
}
