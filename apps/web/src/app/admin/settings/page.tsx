'use client';

import React from 'react';
import {
    Box, Typography, Card, CardContent, Divider, List, ListItem, ListItemButton,
    ListItemIcon, ListItemText, Switch, Paper, Button, Chip, Alert,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import PaletteIcon from '@mui/icons-material/Palette';
import SecurityIcon from '@mui/icons-material/Security';
import IntegrationInstructionsIcon from '@mui/icons-material/IntegrationInstructions';
import NotificationsIcon from '@mui/icons-material/Notifications';
import KeyIcon from '@mui/icons-material/Key';
import LanguageIcon from '@mui/icons-material/Language';
import CloudIcon from '@mui/icons-material/Cloud';
import StorageIcon from '@mui/icons-material/Storage';
import InfoIcon from '@mui/icons-material/Info';

const settingsCategories = [
    { title: 'Branding', icon: <PaletteIcon />, description: 'Logo, colors, and theme customization' },
    { title: 'Security', icon: <SecurityIcon />, description: 'Password policies, session settings' },
    { title: 'Integrations', icon: <IntegrationInstructionsIcon />, description: 'SSO, conferencing, LTI' },
    { title: 'Notifications', icon: <NotificationsIcon />, description: 'Email templates and triggers' },
    { title: 'API Keys', icon: <KeyIcon />, description: 'Manage API access tokens' },
    { title: 'Localization', icon: <LanguageIcon />, description: 'Languages and date formats' },
];

const integrationStatus = [
    { name: 'SAML SSO', status: 'flagged', flag: 'FEATURE_SSO_SAML' },
    { name: 'OIDC SSO', status: 'flagged', flag: 'FEATURE_SSO_OIDC' },
    { name: 'LDAP', status: 'flagged', flag: 'FEATURE_LDAP' },
    { name: 'SCIM', status: 'flagged', flag: 'FEATURE_SCIM' },
    { name: 'Zoom', status: 'flagged', flag: 'FEATURE_CONFERENCING' },
    { name: 'Microsoft Teams', status: 'flagged', flag: 'FEATURE_CONFERENCING' },
    { name: 'BigBlueButton', status: 'flagged', flag: 'FEATURE_CONFERENCING' },
];

export default function SettingsPage() {
    return (
        <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'hsl(var(--foreground))', mb: 3 }}>Settings</Typography>


            <Grid container spacing={3}>
                {/* Settings Categories */}
                <Grid item xs={12} md={8}>
                    <Grid container spacing={2}>
                        {settingsCategories.map((category) => (
                            <Grid item xs={12} sm={6} key={category.title}>
                                <Card
                                    className="glass-card"
                                    sx={{
                                        cursor: 'pointer',
                                        bgcolor: 'rgba(13, 20, 20, 0.4)',
                                        border: '1px solid rgba(141, 166, 166, 0.1)',
                                        transition: 'all 0.2s',
                                        '&:hover': { transform: 'translateY(-4px)', bgcolor: 'rgba(13, 20, 20, 0.6)', border: '1px solid rgba(26, 84, 85, 0.3)' }
                                    }}
                                >
                                    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(26, 84, 85, 0.1)', color: 'hsl(var(--primary))' }}>
                                            {category.icon}
                                        </Box>
                                        <Box>
                                            <Typography variant="h6" sx={{ fontWeight: 700, color: 'hsl(var(--foreground))' }}>{category.title}</Typography>
                                            <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))' }}>{category.description}</Typography>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}

                    </Grid>
                </Grid>

                {/* Integrations Status */}
                <Grid item xs={12} md={4}>
                    <Card className="glass-card" sx={{ bgcolor: 'rgba(13, 20, 20, 0.4)', border: '1px solid rgba(141, 166, 166, 0.1)' }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: 'hsl(var(--foreground))', mb: 2 }}>Integrations Status</Typography>
                            <Alert
                                severity="info"
                                sx={{
                                    mb: 2,
                                    bgcolor: 'rgba(3, 169, 244, 0.1)',
                                    color: '#b3e5fc',
                                    border: '1px solid rgba(3, 169, 244, 0.2)',
                                    '& .MuiAlert-icon': { color: '#03a9f4' }
                                }}
                            >
                                Some integrations are disabled in this deployment.
                            </Alert>
                            <List dense>
                                {integrationStatus.map((integration) => (
                                    <ListItem key={integration.name} sx={{ px: 0, borderBottom: '1px solid rgba(141, 166, 166, 0.05)' }}>
                                        <ListItemText
                                            primary={integration.name}
                                            secondary={integration.flag}
                                            primaryTypographyProps={{ fontWeight: 600, color: 'hsl(var(--foreground))' }}
                                            secondaryTypographyProps={{ fontSize: '0.7rem', color: 'hsl(var(--muted-foreground))' }}
                                        />
                                        <Chip
                                            label="OFF"
                                            size="small"
                                            sx={{
                                                bgcolor: 'rgba(141, 166, 166, 0.1)',
                                                color: 'hsl(var(--muted-foreground))',
                                                fontWeight: 600,
                                                fontSize: '0.65rem'
                                            }}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                            <Button
                                fullWidth
                                variant="outlined"
                                sx={{
                                    mt: 2,
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    borderColor: 'rgba(141, 166, 166, 0.2)',
                                    color: 'hsl(var(--foreground))',
                                    '&:hover': { borderColor: 'hsl(var(--primary))', bgcolor: 'rgba(26, 84, 85, 0.05)' }
                                }}
                            >
                                View Documentation
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>

            </Grid>

            {/* Quick Settings */}
            <Card className="glass-card" sx={{ mt: 3, bgcolor: 'rgba(13, 20, 20, 0.4)', border: '1px solid rgba(141, 166, 166, 0.1)' }}>
                <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'hsl(var(--foreground))', mb: 2 }}>Quick Settings</Typography>
                    <Grid container spacing={2}>
                        {[
                            { label: 'Allow self-registration', enabled: true },
                            { label: 'Require email verification', enabled: true },
                            { label: 'Enable course catalog', enabled: true },
                            { label: 'Allow self-enrollment', enabled: false },
                            { label: 'Enable discussions', enabled: true },
                            { label: 'Enable gamification', enabled: false },
                        ].map((setting) => (
                            <Grid item xs={12} sm={6} md={4} key={setting.label}>
                                <Box sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    p: 1.5,
                                    bgcolor: 'rgba(141, 166, 166, 0.05)',
                                    borderRadius: 1.5,
                                    border: '1px solid rgba(141, 166, 166, 0.05)'
                                }}>
                                    <Typography variant="body2" sx={{ fontWeight: 500, color: 'hsl(var(--foreground))' }}>{setting.label}</Typography>
                                    <Switch defaultChecked={setting.enabled} size="small" />
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                </CardContent>
            </Card>

        </Box>
    );
}
