'use client';

import React from 'react';
import { Box, Typography, Paper, TextField, InputAdornment, Button, Card, CardContent, Avatar, Chip } from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import SearchIcon from '@mui/icons-material/Search';
import ForumIcon from '@mui/icons-material/Forum';
import AddIcon from '@mui/icons-material/Add';

const discussions = [
    { id: '1', title: 'Best practices for async/await', course: 'Advanced JavaScript', author: 'John Doe', replies: 12, lastActivity: '2 hours ago' },
    { id: '2', title: 'React hooks question', course: 'React Fundamentals', author: 'Jane Smith', replies: 8, lastActivity: '1 day ago' },
    { id: '3', title: 'Express middleware help', course: 'Node.js Backend', author: 'Bob Johnson', replies: 5, lastActivity: '3 days ago' },
];

export default function LearnerDiscussionsPage() {
    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight="bold">Discussions</Typography>
                <Button variant="contained" startIcon={<AddIcon />}>New Thread</Button>
            </Box>

            <Paper sx={{ p: 2, mb: 3 }}>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Search discussions..."
                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
                />
            </Paper>

            <Grid container spacing={2}>
                {discussions.map((thread) => (
                    <Grid item xs={12} key={thread.id}>
                        <Card sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 } }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                                        {thread.author.split(' ').map(n => n[0]).join('')}
                                    </Avatar>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="h6">{thread.title}</Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                                            <Chip label={thread.course} size="small" variant="outlined" />
                                            <Typography variant="caption" color="text.secondary">by {thread.author}</Typography>
                                            <Typography variant="caption" color="text.secondary">•</Typography>
                                            <Typography variant="caption" color="text.secondary">{thread.replies} replies</Typography>
                                            <Typography variant="caption" color="text.secondary">•</Typography>
                                            <Typography variant="caption" color="text.secondary">{thread.lastActivity}</Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}
