'use client';

import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import CodeIcon from '@mui/icons-material/Code';

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
                    <Box component="div" dangerouslySetInnerHTML={{ __html: unit.content?.body || unit.content?.text || '' }} />
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
            case 'ASSIGNMENT':
                return (
                    <Box sx={{ p: 2 }}>
                        <Typography variant="body1" sx={{ color: '#4a5568', mb: 4 }}>
                            {unit.content?.body || unit.content?.text || 'No instructions provided.'}
                        </Typography>

                        <Typography variant="subtitle2" sx={{ color: '#718096', mb: 2, fontWeight: 600 }}>
                            Select a way to answer the current assignment
                        </Typography>

                        <Box sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' },
                            gap: 2
                        }}>
                            {[
                                { id: 'text', label: 'Text', icon: <DescriptionIcon sx={{ fontSize: '2.5rem' }} /> },
                                { id: 'file', label: 'Upload a file', icon: <InsertDriveFileIcon sx={{ fontSize: '2.5rem' }} /> },
                                { id: 'video', label: 'Record video', icon: <OndemandVideoIcon sx={{ fontSize: '2.5rem' }} /> },
                                { id: 'audio', label: 'Record audio', icon: <DescriptionIcon sx={{ fontSize: '2.5rem' }} /> }, // TODO: Mic icon
                                { id: 'screen', label: 'Record screen', icon: <CodeIcon sx={{ fontSize: '2.5rem' }} /> },
                            ].map((option) => (
                                <Paper
                                    key={option.id}
                                    variant="outlined"
                                    sx={{
                                        p: 3,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 2,
                                        cursor: 'pointer',
                                        borderColor: '#e2e8f0',
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            borderColor: '#3182ce',
                                            bgcolor: '#ebf8ff'
                                        }
                                    }}
                                >
                                    <Box sx={{ color: '#4a5568' }}>{option.icon}</Box>
                                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', textAlign: 'center' }}>
                                        {option.label}
                                    </Typography>
                                </Paper>
                            ))}
                        </Box>
                    </Box>
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
            <Paper variant="outlined" sx={{ p: 4, minHeight: 400 }}>
                {renderContent()}
            </Paper>
        </Box>
    );
}
