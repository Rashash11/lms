'use client';

import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Button, TextField, InputAdornment, Card, CardContent,
    Chip, CircularProgress,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import Link from '@shared/ui/AppLink';

interface Skill {
    id: string;
    name: string;
    description: string | null;
    category: string;
    userCount: number;
}

export default function SuperInstructorSkillsPage() {
    const [skills, setSkills] = useState<Skill[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchSkills();
    }, []);

    const fetchSkills = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/skills');
            if (res.ok) {
                const data = await res.json();
                setSkills(data.data || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box className="animate-fade-in" sx={{ p: { xs: 2, md: 3 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                    <Box sx={{
                        p: 1.5,
                        borderRadius: 3,
                        bgcolor: 'hsl(var(--primary) / 0.1)',
                        color: 'hsl(var(--primary))',
                        display: 'flex',
                        boxShadow: '0 0 20px hsl(var(--primary) / 0.15)'
                    }}>
                        <EmojiEventsIcon sx={{ fontSize: 32 }} />
                    </Box>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: 'hsl(var(--foreground))', letterSpacing: '-0.02em' }}>Skills</Typography>
                        <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))' }}>Define and award competencies</Typography>
                    </Box>
                </Box>
                <Button
                    component={Link}
                    href="/super-instructor/skills/new"
                    variant="contained"
                    startIcon={<AddIcon />}
                    sx={{
                        bgcolor: 'hsl(var(--primary))',
                        color: 'white',
                        px: 3,
                        py: 1.2,
                        borderRadius: 2.5,
                        fontWeight: 700,
                        boxShadow: '0 8px 16px hsl(var(--primary) / 0.25)',
                        '&:hover': {
                            bgcolor: 'hsl(var(--primary))',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 12px 20px hsl(var(--primary) / 0.35)',
                        },
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                >
                    Add Skill
                </Button>
            </Box>

            <Box className="glass-card" sx={{ p: 2, mb: 3, display: 'flex', gap: 2 }}>
                <TextField
                    placeholder="Search skills by name or category..."
                    size="small"
                    fullWidth
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: 'hsl(var(--primary))', mr: 1 }} />
                            </InputAdornment>
                        ),
                    }}
                    sx={{
                        maxWidth: 500,
                        '& .MuiOutlinedInput-root': {
                            bgcolor: 'rgba(141, 166, 166, 0.05)',
                            borderRadius: 2.5,
                            '& fieldset': { borderColor: 'rgba(141, 166, 166, 0.1)' },
                            '&:hover fieldset': { borderColor: 'rgba(141, 166, 166, 0.2)' },
                            '&.Mui-focused fieldset': { borderColor: 'hsl(var(--primary) / 0.5)' },
                        }
                    }}
                />
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                    <CircularProgress />
                </Box>
            ) : skills.length === 0 ? (
                <Box className="glass-card" sx={{ p: 8, textAlign: 'center', borderRadius: 4 }}>
                    <EmojiEventsIcon sx={{ fontSize: 48, color: 'hsl(var(--muted-foreground))', opacity: 0.5, mb: 2 }} />
                    <Typography sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 500 }}>No skills found. Create your first skill to get started!</Typography>
                </Box>
            ) : (
                <Grid container spacing={3}>
                    {skills.map((skill) => (
                        <Grid item xs={12} sm={6} md={4} key={skill.id}>
                            <Card className="glass-card" sx={{ height: '100%', borderRadius: 3, transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                        <Box sx={{
                                            p: 1.2,
                                            borderRadius: 2,
                                            bgcolor: 'hsl(var(--primary) / 0.1)',
                                            color: 'hsl(var(--primary))',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <EmojiEventsIcon sx={{ fontSize: 28 }} />
                                        </Box>
                                        <Typography variant="h6" sx={{ fontWeight: 700, color: 'hsl(var(--foreground))' }}>
                                            {skill.name}
                                        </Typography>
                                    </Box>
                                    <Typography variant="body2" sx={{ mb: 2, color: 'hsl(var(--muted-foreground))', minHeight: 40, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                        {skill.description || 'No description provided'}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Chip
                                            label={skill.category}
                                            size="small"
                                            sx={{
                                                bgcolor: 'hsl(var(--primary) / 0.1)',
                                                color: 'hsl(var(--primary))',
                                                fontWeight: 600,
                                                fontSize: 11,
                                                borderRadius: 2
                                            }}
                                        />
                                        <Typography variant="caption" sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 500 }}>
                                            {skill.userCount} users
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Box>
    );
}
