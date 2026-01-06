'use client';

import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import { useRouter } from 'next/navigation';

interface AccessDeniedProps {
    /** Message to display */
    message?: string;
    /** Permission that was required (shown in dev mode only) */
    requiredPermission?: string;
    /** Show back button */
    showBackButton?: boolean;
    /** Custom back URL */
    backUrl?: string;
}

/**
 * Access Denied component for 403 errors
 * Shows a friendly message when user lacks permission
 */
export function AccessDenied({
    message = "You don't have permission to access this resource.",
    requiredPermission,
    showBackButton = true,
    backUrl,
}: AccessDeniedProps) {
    const router = useRouter();
    const isDev = process.env.NODE_ENV === 'development';

    const handleBack = () => {
        if (backUrl) {
            router.push(backUrl);
        } else {
            router.back();
        }
    };

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '60vh',
                p: 3,
            }}
        >
            <Paper
                elevation={0}
                sx={{
                    textAlign: 'center',
                    p: 4,
                    maxWidth: 400,
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: 2,
                }}
            >
                <Box
                    sx={{
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        backgroundColor: 'error.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 2,
                    }}
                >
                    <LockIcon sx={{ fontSize: 32, color: 'white' }} />
                </Box>

                <Typography variant="h5" gutterBottom fontWeight="bold">
                    Access Denied
                </Typography>

                <Typography color="text.secondary" sx={{ mb: 3 }}>
                    {message}
                </Typography>

                {isDev && requiredPermission && (
                    <Typography
                        variant="caption"
                        sx={{
                            display: 'block',
                            mb: 2,
                            p: 1,
                            backgroundColor: 'rgba(255, 0, 0, 0.1)',
                            borderRadius: 1,
                            fontFamily: 'monospace',
                        }}
                    >
                        Required: {requiredPermission}
                    </Typography>
                )}

                {showBackButton && (
                    <Button
                        variant="contained"
                        onClick={handleBack}
                        sx={{ mt: 1 }}
                    >
                        Go Back
                    </Button>
                )}
            </Paper>
        </Box>
    );
}

export default AccessDenied;
