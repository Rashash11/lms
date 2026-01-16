'use client';

import React from 'react';
import {
    Box, Typography, Paper, Button, Card, CardContent, Chip,
    LinearProgress, List, ListItem, ListItemIcon, ListItemText, Divider,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StarIcon from '@mui/icons-material/Star';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import PeopleIcon from '@mui/icons-material/People';
import StorageIcon from '@mui/icons-material/Storage';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ScheduleIcon from '@mui/icons-material/Schedule';

const currentPlan = {
    name: 'Free Trial',
    daysLeft: 14,
    users: 6,
    maxUsers: 5,
    storage: '0.5 GB',
    maxStorage: '1 GB',
};

const features = [
    { name: 'Unlimited courses', included: true },
    { name: 'Course store access', included: true },
    { name: 'Basic reports', included: true },
    { name: 'Email support', included: true },
    { name: 'Custom branding', included: false },
    { name: 'API access', included: false },
    { name: 'SSO integration', included: false },
    { name: 'Priority support', included: false },
];

const plans = [
    { name: 'Starter', price: 69, users: 40, features: ['Unlimited courses', 'Basic reports', 'Email support'] },
    { name: 'Basic', price: 149, users: 100, features: ['Everything in Starter', 'Custom branding', 'API access'] },
    { name: 'Plus', price: 279, users: 500, features: ['Everything in Basic', 'SSO', 'Priority support'] },
    { name: 'Premium', price: 459, users: 1000, features: ['Everything in Plus', 'Dedicated manager', 'SLA'] },
];

export default function SubscriptionPage() {
    return (
        <Box>
            <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>Subscription</Typography>

            {/* Current Plan */}
            <Paper className="glass-card" sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="h6" fontWeight={600}>{currentPlan.name}</Typography>
                            <Chip
                                icon={<ScheduleIcon sx={{ fontSize: 16 }} />}
                                label={`${currentPlan.daysLeft} days left`}
                                size="small"
                                color="warning"
                            />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                            Your trial expires in {currentPlan.daysLeft} days. Upgrade now to keep your data.
                        </Typography>
                    </Box>
                    <Button variant="contained" startIcon={<RocketLaunchIcon />} size="large">
                        Upgrade now
                    </Button>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Usage Stats */}
                <Box sx={{ display: 'flex', gap: 4 }}>
                    <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <PeopleIcon sx={{ color: 'text.secondary' }} />
                            <Typography variant="body2">Users</Typography>
                        </Box>
                        <Typography variant="h6" fontWeight={600}>{currentPlan.users} / {currentPlan.maxUsers}</Typography>
                        <LinearProgress
                            variant="determinate"
                            value={(currentPlan.users / currentPlan.maxUsers) * 100}
                            sx={{ mt: 1, height: 8, borderRadius: 4 }}
                            color={currentPlan.users > currentPlan.maxUsers ? 'error' : 'primary'}
                        />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <StorageIcon sx={{ color: 'text.secondary' }} />
                            <Typography variant="body2">Storage</Typography>
                        </Box>
                        <Typography variant="h6" fontWeight={600}>{currentPlan.storage} / {currentPlan.maxStorage}</Typography>
                        <LinearProgress
                            variant="determinate"
                            value={50}
                            sx={{ mt: 1, height: 8, borderRadius: 4 }}
                        />
                    </Box>
                </Box>
            </Paper>

            {/* Current Features */}
            <Paper className="glass-card" sx={{ p: 3, mb: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Current plan features</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {features.map((feature) => (
                        <Chip
                            key={feature.name}
                            icon={feature.included ? <CheckCircleIcon sx={{ color: '#4caf50 !important' }} /> : undefined}
                            label={feature.name}
                            variant={feature.included ? 'filled' : 'outlined'}
                            sx={{
                                bgcolor: feature.included ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
                                color: feature.included ? '#4caf50' : 'hsl(var(--muted-foreground))',
                                textDecoration: feature.included ? 'none' : 'line-through',
                                border: feature.included ? '1px solid rgba(76, 175, 80, 0.2)' : '1px solid rgba(141, 166, 166, 0.2)',
                            }}
                        />
                    ))}
                </Box>
            </Paper>

            {/* Available Plans */}
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Available plans</Typography>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                {plans.map((plan) => (
                    <Card key={plan.name} className="glass-card" sx={{ width: 250, border: '1px solid rgba(141, 166, 166, 0.1)' }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight={600}>{plan.name}</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, my: 2 }}>
                                <Typography variant="h4" fontWeight={700} color="primary">${plan.price}</Typography>
                                <Typography variant="body2" color="text.secondary">/month</Typography>
                            </Box>
                            <Chip label={`Up to ${plan.users} users`} size="small" sx={{ mb: 2 }} />
                            <List dense disablePadding>
                                {plan.features.map((feature) => (
                                    <ListItem key={feature} disablePadding sx={{ py: 0.5 }}>
                                        <ListItemIcon sx={{ minWidth: 28 }}>
                                            <CheckCircleIcon sx={{ fontSize: 16, color: '#4caf50' }} />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={feature}
                                            primaryTypographyProps={{ fontSize: 13 }}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                            <Button variant="outlined" fullWidth sx={{ mt: 2 }}>
                                Select plan
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </Box>
        </Box>
    );
}
