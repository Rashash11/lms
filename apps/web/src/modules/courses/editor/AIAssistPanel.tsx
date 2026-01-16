'use client';

import React from 'react';
import {
    Box,
    Typography,
    IconButton,
    Paper,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import SummarizeIcon from '@mui/icons-material/Summarize';
import TranslateIcon from '@mui/icons-material/Translate';
import TextFormatIcon from '@mui/icons-material/TextFormat';

interface AIAssistPanelProps {
    onClose: () => void;
    onApplyAction: (action: string) => void;
}

export default function AIAssistPanel({ onClose, onApplyAction }: AIAssistPanelProps) {
    const actions = [
        { id: 'improve', label: 'Improve writing', icon: <AutoFixHighIcon sx={{ color: '#805ad5' }} /> },
        { id: 'summarize', label: 'Summarize', icon: <SummarizeIcon sx={{ color: '#3182ce' }} /> },
        { id: 'expand', label: 'Expand content', icon: <TextFormatIcon sx={{ color: '#38a169' }} /> },
        { id: 'fix', label: 'Fix grammar & spelling', icon: <TranslateIcon sx={{ color: '#e53e3e' }} /> },
    ];

    return (
        <Paper
            elevation={4}
            sx={{
                width: 320,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderLeft: '1px solid #e2e8f0',
                bgcolor: '#fff',
            }}
        >
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#f8fafc' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#4a5568', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AutoFixHighIcon sx={{ fontSize: 18 }} />
                    AI ASSIST
                </Typography>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon sx={{ fontSize: 18 }} />
                </IconButton>
            </Box>
            <Divider />
            <Box sx={{ p: 2, flex: 1, overflowY: 'auto' }}>
                <Typography variant="body2" sx={{ color: '#718096', mb: 2 }}>
                    Select an action to apply to your current content or selection.
                </Typography>
                <List sx={{ p: 0 }}>
                    {actions.map((action) => (
                        <ListItem key={action.id} disablePadding sx={{ mb: 1 }}>
                            <ListItemButton
                                onClick={() => onApplyAction(action.id)}
                                sx={{ borderRadius: '8px', border: '1px solid #edf2f7', '&:hover': { bgcolor: '#f7fafc', borderColor: '#3182ce' } }}
                            >
                                <ListItemIcon sx={{ minWidth: 40 }}>{action.icon}</ListItemIcon>
                                <ListItemText primary={action.label} primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }} />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            </Box>
            <Divider />
            <Box sx={{ p: 2, bgcolor: '#ebf8ff' }}>
                <Typography variant="caption" sx={{ color: '#2b6cb0', fontWeight: 600 }}>
                    Tip: Highlight text to apply AI actions to specific parts of your unit.
                </Typography>
            </Box>
        </Paper>
    );
}
