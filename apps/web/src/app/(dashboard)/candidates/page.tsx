'use client';

import React, { useState } from 'react';
import {
    Box,
    Tabs,
    Tab,
    Typography,
    Paper,
    Badge,
} from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import AssignmentIcon from '@mui/icons-material/Assignment';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import LiveProctoringTab from './components/LiveProctoringTab';
import TestAttemptsTab from './components/TestAttemptsTab';
import ReschedulingTab from './components/ReschedulingTab';
import ImportedResultsTab from './components/ImportedResultsTab';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`candidates-tabpanel-${index}`}
            aria-labelledby={`candidates-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
        </div>
    );
}

export default function CandidatesPage() {
    const [activeTab, setActiveTab] = useState(0);

    // Mock counts for badges
    const counts = {
        liveProctoring: 12,
        testAttempts: 156,
        rescheduling: 5,
        imported: 0,
    };

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    return (
        <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>
                Candidates
            </Typography>

            <Paper sx={{ mb: 3 }}>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                        borderBottom: 1,
                        borderColor: 'divider',
                        '& .MuiTab-root': {
                            minHeight: 64,
                            textTransform: 'none',
                            fontSize: '0.95rem',
                        },
                    }}
                >
                    <Tab
                        icon={
                            <Badge badgeContent={counts.liveProctoring} color="error" max={99}>
                                <VideocamIcon />
                            </Badge>
                        }
                        iconPosition="start"
                        label="Live Proctoring"
                    />
                    <Tab
                        icon={
                            <Badge badgeContent={counts.testAttempts} color="primary" max={999}>
                                <AssignmentIcon />
                            </Badge>
                        }
                        iconPosition="start"
                        label="Test Attempts"
                    />
                    <Tab
                        icon={
                            <Badge badgeContent={counts.rescheduling} color="warning" max={99}>
                                <EventRepeatIcon />
                            </Badge>
                        }
                        iconPosition="start"
                        label="Rescheduling Requests"
                    />
                    <Tab
                        icon={<FileUploadIcon />}
                        iconPosition="start"
                        label="Imported Results"
                        disabled={counts.imported === 0}
                    />
                </Tabs>
            </Paper>

            <TabPanel value={activeTab} index={0}>
                <LiveProctoringTab />
            </TabPanel>
            <TabPanel value={activeTab} index={1}>
                <TestAttemptsTab />
            </TabPanel>
            <TabPanel value={activeTab} index={2}>
                <ReschedulingTab />
            </TabPanel>
            <TabPanel value={activeTab} index={3}>
                <ImportedResultsTab />
            </TabPanel>
        </Box>
    );
}
