import React from 'react';
import { Box, Typography } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

interface SettingRowProps {
    label: string;
    description?: string;
    value: string;
    onClick: () => void;
}

export default function SettingRow({ label, description, value, onClick }: SettingRowProps) {
    return (
        <Box
            onClick={onClick}
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 3,
                py: 2,
                cursor: 'pointer',
                borderBottom: '1px solid',
                borderColor: 'divider',
                '&:hover': {
                    bgcolor: 'grey.50'
                },
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                    {value}
                </Typography>
                <ChevronRightIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
            </Box>
        </Box>
    );
}
