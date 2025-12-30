'use client';

import React from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import CodeIcon from '@mui/icons-material/Code';

import GraphicEqIcon from '@mui/icons-material/GraphicEq';

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
        // Debug logs
        console.log('🎬 UnitRenderer:', { type: unit.type, title: unit.title, content: unit.content });

        // Helper to convert YouTube URL to embed URL
        const getEmbedUrl = (url: string) => {
            if (!url) return '';

            // Extract video ID from various YouTube URL formats
            let videoId = null;

            // youtube.com/watch?v=VIDEO_ID
            const watchMatch = url.match(/(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/);
            if (watchMatch) videoId = watchMatch[1];

            // youtu.be/VIDEO_ID
            const shortMatch = url.match(/(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/);
            if (shortMatch) videoId = shortMatch[1];

            // youtube.com/embed/VIDEO_ID (already embed)
            const embedMatch = url.match(/(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
            if (embedMatch) return url; // Already an embed URL

            // If we found a video ID, create proper embed URL
            if (videoId) {
                const embedUrl = `https://www.youtube.com/embed/${videoId}`;
                console.log('🔄 URL Conversion:', url, '→', embedUrl);
                return embedUrl;
            }

            // If it's not a YouTube URL, return as-is (might be uploaded video)
            return url;
        };

        switch (unit.type) {
            case 'TEXT':
                return (
                    <Box
                        component="div"
                        className="tiptap-content"
                        dangerouslySetInnerHTML={{
                            __html: unit.content?.body || unit.content?.text || unit.content?.content || ''
                        }}
                    />
                );
            case 'VIDEO':
                // Support multiple config structures
                const videoUrl = unit.content?.url || unit.content?.videoUrl || unit.content?.content?.url || '';
                console.log('📹 VIDEO DEBUG:', { videoUrl, fullContent: unit.content });
                const embedVideoUrl = getEmbedUrl(videoUrl);
                console.log('🎯 Final Embed URL:', embedVideoUrl);

                if (!videoUrl) {
                    return (
                        <Box sx={{ p: 4, textAlign: 'center', color: '#718096' }}>
                            <Typography>No video configured</Typography>
                        </Box>
                    );
                }

                return (
                    <Box sx={{ position: 'relative', pt: '56.25%', width: '100%', bgcolor: '#000', borderRadius: 1, overflow: 'hidden' }}>
                        <iframe
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                            src={embedVideoUrl}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </Box>
                );
            case 'AUDIO':
                const audioSource = unit.content?.url || unit.content?.audioUrl || unit.content?.content?.url || '';

                if (!audioSource) {
                    return (
                        <Box sx={{ p: 4, textAlign: 'center', color: '#718096' }}>
                            <Typography>No audio configured</Typography>
                        </Box>
                    );
                }

                return (
                    <Box sx={{ p: 0 }}>
                        <Paper sx={{
                            p: 4,
                            bgcolor: '#f7fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3
                        }}>
                            <Box sx={{
                                width: 60,
                                height: 60,
                                borderRadius: '50%',
                                bgcolor: '#ebf8ff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                <GraphicEqIcon sx={{ fontSize: 32, color: '#3182ce' }} />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                {unit.content?.fileName && (
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#2d3748', mb: 1 }}>
                                        {unit.content.fileName}
                                    </Typography>
                                )}
                                <audio src={audioSource} controls style={{ width: '100%' }} />
                                <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary', fontFamily: 'monospace' }}>
                                    Debug URL: {audioSource}
                                </Typography>
                            </Box>
                        </Paper>
                        {unit.content?.description && (
                            <Box sx={{ mt: 3, p: 2, bgcolor: '#fff', borderRadius: 1 }}>
                                <Typography variant="body1" color="text.secondary">
                                    {unit.content.description}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                );
            case 'FILE':
                return (
                    <Box sx={{ p: 3, textAlign: 'center', bgcolor: '#f8f9fa', borderRadius: 1 }}>
                        <Typography variant="body1">File: {unit.content?.filename || 'Unnamed file'}</Typography>
                        <Typography variant="caption" display="block" color="text.secondary">
                            Size: {unit.content?.filesize ? `${(unit.content.filesize / 1024).toFixed(2)} KB` : 'Unknown'}
                        </Typography>
                        {unit.content?.url && (
                            <Button
                                variant="contained"
                                href={unit.content.url}
                                target="_blank"
                                sx={{ mt: 2 }}
                            >
                                Download
                            </Button>
                        )}
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
