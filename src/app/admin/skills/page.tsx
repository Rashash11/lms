'use client';

import React, { useState } from 'react';
import {
    Box, Typography, Paper, Button, Card, CardContent, CardActions,
    Chip, IconButton, TextField, InputAdornment, Tabs, Tab, LinearProgress,
    Avatar, List, ListItem, ListItemAvatar, ListItemText, Switch, FormControlLabel,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import QuizIcon from '@mui/icons-material/Quiz';

const skills = [
    { id: '1', name: 'JavaScript', description: 'Modern JavaScript programming', questions: 50, users: 120, aiEnabled: true },
    { id: '2', name: 'React', description: 'React component development', questions: 35, users: 89, aiEnabled: true },
    { id: '3', name: 'Python', description: 'Python programming fundamentals', questions: 45, users: 156, aiEnabled: true },
    { id: '4', name: 'Data Analysis', description: 'Data analysis with Python and SQL', questions: 30, users: 67, aiEnabled: false },
    { id: '5', name: 'Project Management', description: 'Agile and traditional PM skills', questions: 25, users: 234, aiEnabled: true },
];

export default function SkillsPage() {
    const [tab, setTab] = useState(0);
    const [search, setSearch] = useState('');

    const filteredSkills = skills.filter(skill =>
        skill.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h5" fontWeight={600}>Skills</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Define skills and let AI assess your learners
                    </Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />}>
                    Add skill
                </Button>
            </Box>

            {/* Info Banner */}
            <Paper sx={{ p: 2, mb: 3, bgcolor: '#e3f2fd', border: '1px solid #90caf9' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <AutoFixHighIcon sx={{ color: '#1976d2', fontSize: 32 }} />
                    <Box>
                        <Typography variant="subtitle1" fontWeight={600} color="#1976d2">
                            AI-Powered Skills Assessment
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Enable AI to automatically generate questions and assess learner proficiency
                        </Typography>
                    </Box>
                </Box>
            </Paper>

            {/* Search */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <TextField
                    placeholder="Search skills..."
                    size="small"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    sx={{ width: 300 }}
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>
                    }}
                />
            </Paper>

            {/* Skills List */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {filteredSkills.map((skill) => (
                    <Paper key={skill.id} sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Avatar sx={{ bgcolor: '#1976d2', width: 48, height: 48 }}>
                                    <EmojiObjectsIcon />
                                </Avatar>
                                <Box>
                                    <Typography variant="h6" fontWeight={600}>{skill.name}</Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                        {skill.description}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                        <Chip
                                            icon={<QuizIcon sx={{ fontSize: 16 }} />}
                                            label={`${skill.questions} questions`}
                                            size="small"
                                            variant="outlined"
                                        />
                                        <Typography variant="caption" color="text.secondary">
                                            {skill.users} users assessed
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <FormControlLabel
                                    control={<Switch checked={skill.aiEnabled} size="small" />}
                                    label={<Typography variant="caption">AI enabled</Typography>}
                                    labelPlacement="start"
                                />
                                <Button variant="outlined" size="small">Manage</Button>
                                <Button variant="contained" size="small" startIcon={<PlayCircleOutlineIcon />}>
                                    Test
                                </Button>
                            </Box>
                        </Box>
                    </Paper>
                ))}
            </Box>

            {filteredSkills.length === 0 && (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <EmojiObjectsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">No skills found</Typography>
                    <Button variant="contained" startIcon={<AddIcon />} sx={{ mt: 2 }}>
                        Create your first skill
                    </Button>
                </Paper>
            )}
        </Box>
    );
}
