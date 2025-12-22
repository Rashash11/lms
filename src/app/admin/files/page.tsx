'use client';

import React from 'react';
import { Box, Typography, Paper, Button, Card, CardContent } from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import AddIcon from '@mui/icons-material/Add';
import FolderIcon from '@mui/icons-material/Folder';
import ImageIcon from '@mui/icons-material/Image';
import VideoFileIcon from '@mui/icons-material/VideoFile';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const folders = [
    { name: 'Course Materials', files: 156, size: '2.3 GB' },
    { name: 'User Uploads', files: 89, size: '1.1 GB' },
    { name: 'Certificates', files: 45, size: '120 MB' },
    { name: 'Assignments', files: 234, size: '890 MB' },
];

const stats = [
    { label: 'Images', value: 234, icon: <ImageIcon />, color: 'primary' },
    { label: 'Videos', value: 56, icon: <VideoFileIcon />, color: 'error' },
    { label: 'Documents', value: 189, icon: <InsertDriveFileIcon />, color: 'success' },
    { label: 'Storage Used', value: '4.5 GB', icon: <FolderIcon />, color: 'info' },
];

export default function FilesPage() {
    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight="bold">Files & Assets</Typography>
                <Button variant="contained" startIcon={<CloudUploadIcon />}>Upload Files</Button>
            </Box>

            <Grid container spacing={2} sx={{ mb: 3 }}>
                {stats.map((stat) => (
                    <Grid item xs={6} md={3} key={stat.label}>
                        <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ p: 1, borderRadius: 1, bgcolor: `${stat.color}.lighter`, color: `${stat.color}.main` }}>
                                {stat.icon}
                            </Box>
                            <Box>
                                <Typography variant="h5" fontWeight={700}>{stat.value}</Typography>
                                <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
                            </Box>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Folders</Typography>
            <Grid container spacing={2}>
                {folders.map((folder) => (
                    <Grid item xs={12} sm={6} md={3} key={folder.name}>
                        <Card sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 } }}>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <FolderIcon sx={{ fontSize: 48, color: 'warning.main', mb: 1 }} />
                                <Typography variant="subtitle1" fontWeight={600}>{folder.name}</Typography>
                                <Typography variant="caption" color="text.secondary">{folder.files} files • {folder.size}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}
