'use client';

import React from 'react';
import { Box, Typography, Paper, Button, Chip, Alert, Divider, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';
import LinkIcon from '@mui/icons-material/Link';
import SettingsIcon from '@mui/icons-material/Settings';
import KeyIcon from '@mui/icons-material/Key';

interface FeatureFlaggedPageProps {
    featureName: string;
    featureFlag: string;
    description: string;
    requirements?: string[];
    docsLink?: string;
}

export default function FeatureFlaggedPage({
    featureName,
    featureFlag,
    description,
    requirements = [],
    docsLink,
}: FeatureFlaggedPageProps) {
    return (
        <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Box sx={{ mb: 3 }}>
                    <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: 'grey.200', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                        <BlockIcon sx={{ fontSize: 40, color: 'grey.500' }} />
                    </Box>
                    <Typography variant="h5" fontWeight={700} gutterBottom>{featureName}</Typography>
                    <Chip label={`${featureFlag} = OFF`} color="default" size="small" sx={{ mb: 2 }} />
                </Box>

                <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
                    <Typography variant="body2">{description}</Typography>
                </Alert>

                {requirements.length > 0 && (
                    <Box sx={{ textAlign: 'left', mb: 3 }}>
                        <Typography variant="subtitle2" gutterBottom>Requirements to enable:</Typography>
                        <List dense>
                            {requirements.map((req, i) => (
                                <ListItem key={i} sx={{ py: 0 }}>
                                    <ListItemIcon sx={{ minWidth: 32 }}>
                                        <KeyIcon fontSize="small" color="action" />
                                    </ListItemIcon>
                                    <ListItemText primary={req} primaryTypographyProps={{ variant: 'body2' }} />
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                )}

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                    <Button variant="outlined" startIcon={<SettingsIcon />} href="/admin/settings">
                        Go to Settings
                    </Button>
                    {docsLink && (
                        <Button variant="text" startIcon={<LinkIcon />} href={docsLink} target="_blank">
                            View Documentation
                        </Button>
                    )}
                </Box>
            </Paper>
        </Box>
    );
}
