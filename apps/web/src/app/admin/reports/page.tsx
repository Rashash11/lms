'use client';

import React, { useState } from 'react';
import {
    Box,
    Typography,
    Tabs,
    Tab,
    Button,
    Menu,
    MenuItem,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import DownloadIcon from '@mui/icons-material/Download';
import OverviewTab from '@modules/reports/ui/OverviewTab';
import TrainingMatrixTab from '@modules/reports/ui/TrainingMatrixTab';
import TimelineTab from '@modules/reports/ui/TimelineTab';
import { getCsrfToken } from '@/lib/client-csrf';

export default function ReportsPage() {
    const [currentTab, setCurrentTab] = useState(0);
    const [exportAnchor, setExportAnchor] = useState<null | HTMLElement>(null);

    const handleExportTrainingProgress = async () => {
        try {
            const res = await fetch('/api/reports/export/training-progress', {
                method: 'POST',
                headers: {
                    'x-csrf-token': getCsrfToken() || '',
                },
            });

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'Training_progress.xlsx';
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exporting training progress:', error);
        }
        setExportAnchor(null);
    };

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'hsl(var(--foreground))' }}>
                    Reports
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    endIcon={<KeyboardArrowDownIcon />}
                    onClick={(e) => setExportAnchor(e.currentTarget)}
                    sx={{
                        textTransform: 'none',
                        fontWeight: 700,
                        bgcolor: 'hsl(var(--primary))',
                        color: 'hsl(var(--primary-foreground))',
                        borderRadius: '6px',
                        '&:hover': { bgcolor: 'hsl(var(--primary) / 0.9)' }
                    }}
                >
                    Training progress
                </Button>
            </Box>

            {/* Export Menu */}
            <Menu
                anchorEl={exportAnchor}
                open={Boolean(exportAnchor)}
                onClose={() => setExportAnchor(null)}
            >
                <MenuItem onClick={handleExportTrainingProgress}>Download Excel</MenuItem>
            </Menu>

            {/* Tabs */}
            <Box sx={{ borderBottom: '1px solid rgba(141, 166, 166, 0.1)', mb: 3 }}>
                <Tabs
                    value={currentTab}
                    onChange={(_, newValue) => setCurrentTab(newValue)}
                    sx={{
                        '& .MuiTab-root': {
                            textTransform: 'none',
                            fontWeight: 600,
                            color: 'hsl(var(--muted-foreground))',
                            transition: 'color 0.2s',
                            '&.Mui-selected': { color: 'hsl(var(--primary))' },
                            minHeight: 48
                        },
                        '& .MuiTabs-indicator': {
                            bgcolor: 'hsl(var(--primary))',
                            height: 3,
                            borderRadius: '3px 3px 0 0'
                        }
                    }}
                >
                    <Tab label="Overview" />
                    <Tab label="Training matrix" />
                    <Tab label="Timeline" />
                </Tabs>
            </Box>

            {/* Tab Content */}
            <Box>
                {currentTab === 0 && <OverviewTab />}
                {currentTab === 1 && <TrainingMatrixTab />}
                {currentTab === 2 && <TimelineTab />}
            </Box>
        </Box>
    );
}
