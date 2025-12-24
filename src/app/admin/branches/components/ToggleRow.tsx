import React from 'react';
import { Box, Typography, Switch } from '@mui/material';

interface ToggleRowProps {
    label: string;
    description?: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
}

export default function ToggleRow({ label, description, checked, onChange, disabled }: ToggleRowProps) {
    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 3,
                py: 2,
                borderBottom: '1px solid',
                borderColor: 'divider',
                '&:last-child': {
                    borderBottom: 'none'
                }
            }}
        >
            <Box sx={{ flex: 1, pr: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                    {label}
                </Typography>
                {description && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.4 }}>
                        {description}
                    </Typography>
                )}
            </Box>
            <Switch
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                disabled={disabled}
            />
        </Box>
    );
}
