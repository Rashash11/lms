'use client';

import React from 'react';
import { Box, Typography, Paper, TextField, InputAdornment, Button, Card, CardContent, Avatar, Chip } from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import SearchIcon from '@mui/icons-material/Search';
import ForumIcon from '@mui/icons-material/Forum';
import AddIcon from '@mui/icons-material/Add';

const threads = [
    { id: '1', title: 'Advanced closures question', course: 'Advanced JavaScript', author: 'John Doe', replies: 5, lastActivity: '1 hour ago' },
    { id: '2', title: 'Help with hooks', course: 'React Fundamentals', author: 'Jane Smith', replies: 12, lastActivity: '3 hours ago' },
];

export default function InstructorDiscussionsPage() {
    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight="bold">Course Discussions</Typography>
            </Box>

            <Paper sx={{ p: 2, mb: 3 }}>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Search threads..."
                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
                />
            </Paper>

            {threads.map((thread) => (
                <Card key={thread.id} sx={{ mb: 2, cursor: 'pointer', '&:hover': { boxShadow: 4 } }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar>{thread.author.split(' ').map(n => n[0]).join('')}</Avatar>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="h6">{thread.title}</Typography>
                                <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                                    <Chip label={thread.course} size="small" variant="outlined" />
                                    <Typography variant="caption" color="text.secondary">{thread.replies} replies • {thread.lastActivity}</Typography>
                                </Box>
                            </Box>
                            <Button size="small">Reply</Button>
                        </Box>
                    </CardContent>
                </Card>
            ))}
        </Box>
    );
}
