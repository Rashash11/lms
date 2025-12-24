import React, { useState } from 'react';
import { Box, Typography, Avatar, IconButton, Button } from '@mui/material';
import UploadIcon from '@mui/icons-material/Upload'

    ;

interface ImageUploadRowProps {
    label: string;
    description: string;
    imageUrl?: string | null;
    onUpload: (file: File) => Promise<void>;
    disabled?: boolean;
    helperText?: string;
}

export default function ImageUploadRow({
    label,
    description,
    imageUrl,
    onUpload,
    disabled,
    helperText
}: ImageUploadRowProps) {
    const [uploading, setUploading] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploading(true);
            try {
                await onUpload(file);
            } finally {
                setUploading(false);
            }
        }
    };

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
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.4 }}>
                    {description}
                </Typography>
                {helperText && (
                    <Typography variant="caption" color="primary" sx={{ display: 'block', mt: 0.5 }}>
                        {helperText}
                    </Typography>
                )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {imageUrl && (
                    <Avatar
                        src={imageUrl}
                        variant="rounded"
                        sx={{ width: 48, height: 48 }}
                    />
                )}
                <input
                    type="file"
                    accept=".gif,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    id={`upload-${label}`}
                    disabled={disabled || uploading}
                />
                <label htmlFor={`upload-${label}`}>
                    <IconButton
                        component="span"
                        disabled={disabled || uploading}
                        sx={{ bgcolor: 'grey.100', '&:hover': { bgcolor: 'grey.200' } }}
                    >
                        <UploadIcon />
                    </IconButton>
                </label>
            </Box>
        </Box>
    );
}
