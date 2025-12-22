'use client';

import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

interface UnitRendererProps {
    unit: {
        id: string;
        type: string;
        title: string;
        content: any;
    };
}

export default function UnitRenderer({ unit }: UnitRendererProps) {
    const renderContent = () => {
        switch (unit.type) {
            case 'TEXT':
                return (
                    <Box component="div" dangerouslySetInnerHTML={{ __html: unit.content?.body || '' }} />
                );
            case 'VIDEO':
                return (
                    <Box sx={{ position: 'relative', pt: '56.25%', width: '100%' }}>
                        <iframe
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                            src={unit.content?.url}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </Box>
                );
            case 'FILE':
                return (
                    <Box sx={{ p: 3, textAlign: 'center', bgcolor: '#f8f9fa', borderRadius: 1 }}>
                        <Typography variant="body1">File: {unit.content?.filename || 'Unnamed file'}</Typography>
                        <Typography variant="caption" display="block" color="text.secondary">
                            Size: {unit.content?.filesize ? `${(unit.content.filesize / 1024).toFixed(2)} KB` : 'Unknown'}
                        </Typography>
                    </Box>
                );
            case 'EMBED':
                return (
                    <Box component="div" dangerouslySetInnerHTML={{ __html: unit.content?.html || '' }} />
                );
            default:
                return (
                    <Box sx={{ p: 10, textAlign: 'center' }}>
                        <Typography variant="h6" color="text.secondary">
                            Content type "{unit.type}" renderer not yet implemented.
                        </Typography>
                    </Box>
                );
        }
    };

    return (
        <Box sx={{ py: 2 }}>
            <Typography variant="h4" gutterBottom fontWeight={600}>
                {unit.title}
            </Typography>
            <Paper variant="outlined" sx={{ p: 4, minHeight: 400 }}>
                {renderContent()}
            </Paper>
        </Box>
    );
}
