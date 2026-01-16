'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from '@shared/ui/AppLink';
import {
    Box,
    Typography,
    Button,
    TextField,
    InputAdornment,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    IconButton,
    Snackbar,
    Alert,
    CircularProgress,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import SettingsIcon from '@mui/icons-material/Settings';
import { apiFetch } from '@shared/http/apiFetch';

interface Branch {
    id: string;
    name: string;
    slug: string;
    title?: string | null;
    isActive?: boolean;
    tenant?: { name: string; domain: string | null };
    defaultUserType?: { id: string; name: string } | null;
    defaultGroup?: { id: string; name: string } | null;
}

export default function BranchesPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [branches, setBranches] = useState<Branch[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    const loadBranches = useCallback(async () => {
        setLoading(true);
        try {
            const qs = new URLSearchParams();
            qs.set('page', '1');
            qs.set('limit', '50');
            if (searchQuery.trim()) qs.set('search', searchQuery.trim());
            const res = await apiFetch<{ data: Branch[]; pagination?: { total?: number } }>(`/api/branches?${qs.toString()}`, { credentials: 'include' });
            setBranches(res.data || []);
            setTotal(res.pagination?.total ?? (res.data || []).length);
        } catch (e) {
            setSnackbar({ open: true, message: e instanceof Error ? e.message : 'Failed to load branches', severity: 'error' });
        } finally {
            setLoading(false);
        }
    }, [searchQuery]);

    useEffect(() => {
        void loadBranches();
    }, [loadBranches]);

    const stats = useMemo(() => {
        const active = branches.filter(b => b.isActive).length;
        const branded = branches.filter(b => Boolean(b.title)).length;
        return [
            { label: 'Total Branches', value: total || branches.length, icon: <AccountTreeIcon />, color: 'primary' },
            { label: 'Active', value: active, icon: <PeopleIcon />, color: 'success' },
            { label: 'Branded', value: branded, icon: <SettingsIcon />, color: 'warning' },
            { label: 'Loaded', value: branches.length, icon: <SchoolIcon />, color: 'info' },
        ];
    }, [branches, total]);

    const deleteBranch = async (branch: Branch) => {
        try {
            await apiFetch(`/api/branches/${branch.id}`, { method: 'DELETE', credentials: 'include' });
            setBranches(prev => prev.filter(b => b.id !== branch.id));
            setSnackbar({ open: true, message: 'Branch deleted', severity: 'success' });
        } catch (e) {
            setSnackbar({ open: true, message: e instanceof Error ? e.message : 'Failed to delete branch', severity: 'error' });
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'hsl(var(--foreground))' }}>Branches</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    component={Link}
                    href="/admin/branches/create"
                    sx={{
                        textTransform: 'none',
                        fontWeight: 700,
                        bgcolor: 'hsl(var(--primary))',
                        color: 'hsl(var(--primary-foreground))',
                        borderRadius: '6px',
                        '&:hover': { bgcolor: 'hsl(var(--primary) / 0.9)' }
                    }}
                >
                    Add Branch
                </Button>
            </Box>

            <Grid container spacing={2} sx={{ mb: 3 }}>
                {stats.map((stat) => (
                    <Grid item xs={6} md={3} key={stat.label}>
                        <Paper className="glass-card" sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'rgba(13, 20, 20, 0.4)', border: '1px solid rgba(141, 166, 166, 0.1)' }}>
                            <Box sx={{
                                p: 1,
                                borderRadius: 1.5,
                                bgcolor: stat.color === 'primary' ? 'rgba(26, 84, 85, 0.1)' :
                                    stat.color === 'success' ? 'rgba(76, 175, 80, 0.1)' :
                                        stat.color === 'info' ? 'rgba(3, 169, 244, 0.1)' :
                                            'rgba(255, 152, 0, 0.1)',
                                color: stat.color === 'primary' ? 'hsl(var(--primary))' :
                                    stat.color === 'success' ? '#4caf50' :
                                        stat.color === 'info' ? '#03a9f4' :
                                            '#ff9800'
                            }}>
                                {stat.icon}
                            </Box>
                            <Box>
                                <Typography variant="h5" sx={{ fontWeight: 800, color: 'hsl(var(--foreground))' }}>{stat.value}</Typography>
                                <Typography variant="caption" sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 600 }}>{stat.label}</Typography>
                            </Box>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            <Paper className="glass-card" sx={{ p: 2, mb: 2, bgcolor: 'rgba(13, 20, 20, 0.4)', border: '1px solid rgba(141, 166, 166, 0.1)' }}>
                <TextField
                    size="small" placeholder="Search branches..."
                    value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: 'hsl(var(--muted-foreground))' }} />
                            </InputAdornment>
                        )
                    }}
                    sx={{ width: 300 }}
                />
            </Paper>

            <TableContainer component={Paper} className="glass-card" sx={{ bgcolor: 'rgba(13, 20, 20, 0.4)', border: '1px solid rgba(141, 166, 166, 0.1)' }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ borderBottom: '1px solid rgba(141, 166, 166, 0.1)' }}>
                            <TableCell sx={{ fontWeight: 700, color: 'hsl(var(--foreground))' }}>Branch Name</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: 'hsl(var(--foreground))' }}>Slug</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: 'hsl(var(--foreground))' }}>Tenant</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: 'hsl(var(--foreground))' }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: 'hsl(var(--foreground))' }}>Defaults</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, color: 'hsl(var(--foreground))' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 2 }}>
                                        <CircularProgress size={18} />
                                        <Typography variant="body2" color="text.secondary">Loading branches…</Typography>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ) : branches.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6}>
                                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                                        No branches found.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : branches.map((branch) => (
                            <TableRow
                                key={branch.id}
                                hover
                                sx={{ '&:hover': { backgroundColor: 'rgba(141, 166, 166, 0.05) !important' } }}
                            >
                                <TableCell><Typography sx={{ fontWeight: 600, color: 'hsl(var(--foreground))' }}>{branch.name}</Typography></TableCell>
                                <TableCell>
                                    <Chip
                                        label={branch.slug}
                                        size="small"
                                        sx={{
                                            bgcolor: 'rgba(141, 166, 166, 0.1)',
                                            color: 'hsl(var(--muted-foreground))',
                                            border: '1px solid rgba(141, 166, 166, 0.2)',
                                            fontWeight: 600
                                        }}
                                    />
                                </TableCell>
                                <TableCell sx={{ color: 'hsl(var(--muted-foreground))' }}>
                                    {branch.tenant?.name || '—'}
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={branch.isActive ? 'active' : 'inactive'}
                                        size="small"
                                        sx={{
                                            bgcolor: branch.isActive ? 'rgba(76, 175, 80, 0.1)' : 'rgba(141, 166, 166, 0.1)',
                                            color: branch.isActive ? '#4caf50' : 'hsl(var(--muted-foreground))',
                                            fontWeight: 600,
                                            border: `1px solid ${branch.isActive ? 'rgba(76, 175, 80, 0.2)' : 'rgba(141, 166, 166, 0.2)'}`
                                        }}
                                    />
                                </TableCell>
                                <TableCell sx={{ color: 'hsl(var(--muted-foreground))' }}>
                                    {branch.defaultUserType?.name || '—'} / {branch.defaultGroup?.name || '—'}
                                </TableCell>
                                <TableCell align="right">
                                    <IconButton
                                        size="small"
                                        onClick={() => router.push(`/admin/branches/${branch.id}/edit`)}
                                        sx={{ color: 'hsl(var(--foreground))' }}
                                    >
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton size="small" sx={{ color: 'hsl(var(--destructive))' }} onClick={() => deleteBranch(branch)}>
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
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
