import React from 'react';
import { Box, Typography, Select, MenuItem, FormControl } from '@mui/material';

interface SelectRowProps {
    label: string;
    description?: string;
    value: string;
    options: Array<{ value: string; label: string }>;
    onChange: (value: string) => void;
    disabled?: boolean;
    placeholder?: string;
}

export default function SelectRow({
    label,
    description,
    value,
    options,
    onChange,
    disabled,
    placeholder
}: SelectRowProps) {
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
            <FormControl size="small" sx={{ minWidth: 200 }}>
                <Select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    displayEmpty
                >
                    {placeholder && (
                        <MenuItem value="" disabled>
                            {placeholder}
                        </MenuItem>
                    )}
                    {options.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                            {option.label}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </Box>
    );
}
