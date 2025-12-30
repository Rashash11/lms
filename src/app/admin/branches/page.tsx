'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box, Typography, Button, TextField, InputAdornment, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, Chip, IconButton, Card, CardContent,
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

interface Branch {
    id: string;
    name: string;
    slug: string;
    users: number;
    courses: number;
    status: 'active' | 'inactive';
    customBranding: boolean;
}

const mockBranches: Branch[] = [
    { id: '1', name: 'Main Branch', slug: 'main', users: 1247, courses: 45, status: 'active', customBranding: false },
    { id: '2', name: 'New York Office', slug: 'nyc', users: 342, courses: 28, status: 'active', customBranding: true },
    { id: '3', name: 'Los Angeles', slug: 'la', users: 189, courses: 15, status: 'active', customBranding: true },
    { id: '4', name: 'Chicago Hub', slug: 'chicago', users: 95, courses: 12, status: 'active', customBranding: false },
    { id: '5', name: 'Training Center', slug: 'training', users: 0, courses: 5, status: 'inactive', customBranding: false },
];

const stats = [
    { label: 'Total Branches', value: mockBranches.length, icon: <AccountTreeIcon />, color: 'primary' },
    { label: 'Total Users', value: mockBranches.reduce((sum, b) => sum + b.users, 0).toLocaleString(), icon: <PeopleIcon />, color: 'success' },
    { label: 'Total Courses', value: mockBranches.reduce((sum, b) => sum + b.courses, 0), icon: <SchoolIcon />, color: 'info' },
    { label: 'Custom Branded', value: mockBranches.filter(b => b.customBranding).length, icon: <SettingsIcon />, color: 'warning' },
];

export default function BranchesPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredBranches = mockBranches.filter(branch =>
        branch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        branch.slug.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'hsl(var(--foreground))' }}>Branches</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => router.push('/admin/branches/create')}
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

            {/* Stats */}
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

            {/* Search */}
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

            {/* Table */}
            <TableContainer component={Paper} className="glass-card" sx={{ bgcolor: 'rgba(13, 20, 20, 0.4)', border: '1px solid rgba(141, 166, 166, 0.1)' }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ borderBottom: '1px solid rgba(141, 166, 166, 0.1)' }}>
                            <TableCell sx={{ fontWeight: 700, color: 'hsl(var(--foreground))' }}>Branch Name</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: 'hsl(var(--foreground))' }}>Slug</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, color: 'hsl(var(--foreground))' }}>Users</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, color: 'hsl(var(--foreground))' }}>Courses</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: 'hsl(var(--foreground))' }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: 'hsl(var(--foreground))' }}>Branding</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, color: 'hsl(var(--foreground))' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredBranches.map((branch) => (
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
                                <TableCell align="center" sx={{ color: 'hsl(var(--muted-foreground))' }}>{branch.users.toLocaleString()}</TableCell>
                                <TableCell align="center" sx={{ color: 'hsl(var(--muted-foreground))' }}>{branch.courses}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={branch.status}
                                        size="small"
                                        sx={{
                                            bgcolor: branch.status === 'active' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(141, 166, 166, 0.1)',
                                            color: branch.status === 'active' ? '#4caf50' : 'hsl(var(--muted-foreground))',
                                            fontWeight: 600,
                                            border: `1px solid ${branch.status === 'active' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(141, 166, 166, 0.2)'}`
                                        }}
                                    />
                                </TableCell>
                                <TableCell>
                                    {branch.customBranding ? (
                                        <Chip
                                            label="Custom"
                                            size="small"
                                            sx={{
                                                bgcolor: 'rgba(3, 169, 244, 0.1)',
                                                color: '#03a9f4',
                                                fontWeight: 600,
                                                border: '1px solid rgba(3, 169, 244, 0.2)'
                                            }}
                                        />
                                    ) : (
                                        <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))' }}>-</Typography>
                                    )}
                                </TableCell>
                                <TableCell align="right">
                                    <IconButton
                                        size="small"
                                        onClick={() => router.push(`/admin/branches/${branch.id}/edit`)}
                                        sx={{ color: 'hsl(var(--foreground))' }}
                                    >
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton size="small" sx={{ color: 'hsl(var(--destructive))' }}><DeleteIcon fontSize="small" /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}
