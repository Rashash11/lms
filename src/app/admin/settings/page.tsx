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
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>Settings</Typography>

            <Grid container spacing={3}>
                {/* Settings Categories */}
                <Grid item xs={12} md={8}>
                    <Grid container spacing={2}>
                        {settingsCategories.map((category) => (
                            <Grid item xs={12} sm={6} key={category.title}>
                                <Card sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 } }}>
                                    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'primary.lighter', color: 'primary.main' }}>
                                            {category.icon}
                                        </Box>
                                        <Box>
                                            <Typography variant="h6">{category.title}</Typography>
                                            <Typography variant="body2" color="text.secondary">{category.description}</Typography>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Grid>

                {/* Integrations Status */}
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Integrations Status</Typography>
                            <Alert severity="info" sx={{ mb: 2 }}>
                                Some integrations are disabled in this deployment.
                            </Alert>
                            <List dense>
                                {integrationStatus.map((integration) => (
                                    <ListItem key={integration.name} sx={{ px: 0 }}>
                                        <ListItemText primary={integration.name} secondary={integration.flag} />
                                        <Chip label="OFF" size="small" />
                                    </ListItem>
                                ))}
                            </List>
                            <Button fullWidth variant="outlined" sx={{ mt: 2 }}>View Documentation</Button>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Quick Settings */}
            <Card sx={{ mt: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>Quick Settings</Typography>
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
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                                    <Typography variant="body2">{setting.label}</Typography>
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
