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
import OverviewTab from '@/components/reports/OverviewTab';
import TrainingMatrixTab from '@/components/reports/TrainingMatrixTab';
import TimelineTab from '@/components/reports/TimelineTab';

export default function ReportsPage() {
    const [currentTab, setCurrentTab] = useState(0);
    const [exportAnchor, setExportAnchor] = useState<null | HTMLElement>(null);

    const handleExportTrainingProgress = async () => {
        try {
            const res = await fetch('/api/reports/export/training-progress', {
                method: 'POST',
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
                <Typography variant="h4" fontWeight="bold">
                    Reports
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    endIcon={<KeyboardArrowDownIcon />}
                    onClick={(e) => setExportAnchor(e.currentTarget)}
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
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)}>
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
