'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    Chip,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    Snackbar,
    CircularProgress,
    IconButton,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import AddIcon from '@mui/icons-material/Add';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import HistoryIcon from '@mui/icons-material/History';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { apiFetch } from '@shared/http/apiFetch';

type AutomationType = 'assign_course' | 'send_notification' | 'deactivate_user' | 'webhook' | 'assign_badge';

type Automation = {
    id: string;
    name: string;
    type: AutomationType;
    enabled: boolean;
    runCount?: number;
};

const automationTypeLabels: Record<AutomationType, string> = {
    assign_course: 'Assign course',
    send_notification: 'Send notification',
    deactivate_user: 'Deactivate user',
    webhook: 'Webhook',
    assign_badge: 'Assign badge',
};

export default function AutomationsPage() {
    const [automations, setAutomations] = useState<Automation[]>([]);
    const [loading, setLoading] = useState(true);
    const [mutatingIds, setMutatingIds] = useState<Record<string, boolean>>({});
    const [createOpen, setCreateOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [name, setName] = useState('');
    const [type, setType] = useState<AutomationType>('send_notification');
    const [enabled, setEnabled] = useState(true);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    const loadAutomations = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiFetch<{ data: Automation[] }>('/api/automations?page=1&limit=100', { credentials: 'include' });
            setAutomations(res.data || []);
        } catch (e) {
            setSnackbar({ open: true, message: e instanceof Error ? e.message : 'Failed to load automations', severity: 'error' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadAutomations();
    }, [loadAutomations]);

    const stats = useMemo(() => {
        const total = automations.length;
        const active = automations.filter(a => a.enabled).length;
        const runs = automations.reduce((sum, a) => sum + (a.runCount || 0), 0);
        return { total, active, runs };
    }, [automations]);

    const resetCreateForm = () => {
        setName('');
        setType('send_notification');
        setEnabled(true);
    };

    const handleCreate = async () => {
        if (!name.trim()) {
            setSnackbar({ open: true, message: 'Name is required', severity: 'error' });
            return;
        }

        setCreating(true);
        try {
            await apiFetch('/api/automations', {
                method: 'POST',
                credentials: 'include',
                body: {
                    name: name.trim(),
                    type,
                    parameters: {},
                    enabled,
                },
            });
            setSnackbar({ open: true, message: 'Automation created', severity: 'success' });
            setCreateOpen(false);
            resetCreateForm();
            await loadAutomations();
        } catch (e) {
            setSnackbar({ open: true, message: e instanceof Error ? e.message : 'Failed to create automation', severity: 'error' });
        } finally {
            setCreating(false);
        }
    };

    const toggleEnabled = async (automation: Automation, nextEnabled: boolean) => {
        setMutatingIds(prev => ({ ...prev, [automation.id]: true }));
        try {
            await apiFetch('/api/automations', {
                method: 'PATCH',
                credentials: 'include',
                body: { ids: [automation.id], enabled: nextEnabled },
            });
            setAutomations(prev => prev.map(a => (a.id === automation.id ? { ...a, enabled: nextEnabled } : a)));
        } catch (e) {
            setSnackbar({ open: true, message: e instanceof Error ? e.message : 'Failed to update automation', severity: 'error' });
        } finally {
            setMutatingIds(prev => ({ ...prev, [automation.id]: false }));
        }
    };

    const deleteAutomation = async (automation: Automation) => {
        setMutatingIds(prev => ({ ...prev, [automation.id]: true }));
        try {
            await apiFetch('/api/automations', {
                method: 'DELETE',
                credentials: 'include',
                body: { ids: [automation.id] },
            });
            setAutomations(prev => prev.filter(a => a.id !== automation.id));
            setSnackbar({ open: true, message: 'Automation deleted', severity: 'success' });
        } catch (e) {
            setSnackbar({ open: true, message: e instanceof Error ? e.message : 'Failed to delete automation', severity: 'error' });
        } finally {
            setMutatingIds(prev => ({ ...prev, [automation.id]: false }));
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight="bold">Automations</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>Create Automation</Button>
            </Box>

            <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                    { label: 'Total Rules', value: stats.total, icon: <AutoFixHighIcon />, color: 'primary' },
                    { label: 'Active', value: stats.active, icon: <PlayArrowIcon />, color: 'success' },
                    { label: 'Total Runs', value: stats.runs, icon: <HistoryIcon />, color: 'info' },
                ].map((stat) => (
                    <Grid item xs={4} key={stat.label}>
                        <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ p: 1, borderRadius: 1, bgcolor: `${stat.color}.lighter`, color: `${stat.color}.main` }}>
                                {stat.icon}
                            </Box>
                            <Box>
                                <Typography variant="h5" fontWeight={700}>{stat.value}</Typography>
                                <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
                            </Box>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead><TableRow>
                        <TableCell>Automation</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell align="center">Runs</TableCell>
                        <TableCell align="center">Enabled</TableCell>
                        <TableCell align="right">Actions</TableCell>
                    </TableRow></TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 2 }}>
                                        <CircularProgress size={18} />
                                        <Typography variant="body2" color="text.secondary">Loading automations…</Typography>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ) : automations.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4}>
                                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                                        No automations yet.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : automations.map((rule) => {
                            const busy = Boolean(mutatingIds[rule.id]);
                            return (
                                <TableRow key={rule.id}>
                                    <TableCell><Typography fontWeight={500}>{rule.name}</Typography></TableCell>
                                    <TableCell>
                                        <Chip label={automationTypeLabels[rule.type] || rule.type} size="small" variant="outlined" />
                                    </TableCell>
                                    <TableCell align="center">{rule.runCount || 0}</TableCell>
                                    <TableCell align="center">
                                        <Switch
                                            checked={Boolean(rule.enabled)}
                                            onChange={(e) => toggleEnabled(rule, e.target.checked)}
                                            disabled={busy}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton aria-label="Delete automation" onClick={() => deleteAutomation(rule)} disabled={busy}>
                                            <DeleteOutlineIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>Create automation</DialogTitle>
                <DialogContent sx={{ pt: 1 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        <TextField
                            label="Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            fullWidth
                            autoFocus
                        />
                        <FormControl fullWidth>
                            <InputLabel id="automation-type-label">Type</InputLabel>
                            <Select
                                labelId="automation-type-label"
                                value={type}
                                label="Type"
                                onChange={(e) => setType(e.target.value as AutomationType)}
                            >
                                {Object.entries(automationTypeLabels).map(([key, label]) => (
                                    <MenuItem key={key} value={key}>{label}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">Enabled</Typography>
                            <Switch checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => {
                            setCreateOpen(false);
                            resetCreateForm();
                        }}
                        disabled={creating}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleCreate} disabled={creating} variant="contained">
                        {creating ? 'Creating…' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
