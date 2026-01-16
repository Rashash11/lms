'use client';

import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Button, TextField, InputAdornment, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, IconButton, Menu, MenuItem,
    Chip, CircularProgress, Card, CardContent,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import Link from '@shared/ui/AppLink';

interface Course {
    id: string;
    title: string;
    code: string;
    status: string;
    createdAt: string;
    _count?: { units: number };
}

export default function SuperInstructorCoursesPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/courses');
            const data = await res.json();
            setCourses(data.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filtered = courses.filter(c =>
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.code.toLowerCase().includes(search.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PUBLISHED': return 'success';
            case 'DRAFT': return 'warning';
            case 'ARCHIVED': return 'default';
            default: return 'default';
        }
    };

    return (
        <Box className="animate-fade-in" sx={{ p: { xs: 2, md: 3 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                    <Box sx={{
                        p: 1.5,
                        borderRadius: 3,
                        bgcolor: 'hsl(var(--secondary) / 0.1)',
                        color: 'hsl(var(--secondary))',
                        display: 'flex',
                        boxShadow: '0 0 20px hsl(var(--secondary) / 0.15)'
                    }}>
                        <MenuBookOutlinedIcon sx={{ fontSize: 32 }} />
                    </Box>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: 'hsl(var(--foreground))', letterSpacing: '-0.02em' }}>Courses</Typography>
                        <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))' }}>Manage and organize your instructional content</Typography>
                    </Box>
                </Box>
                <Button
                    component={Link}
                    href="/super-instructor/courses/new"
                    variant="contained"
                    startIcon={<AddIcon />}
                    sx={{
                        bgcolor: 'hsl(var(--secondary))',
                        color: 'white',
                        px: 3,
                        py: 1.2,
                        borderRadius: 2.5,
                        fontWeight: 700,
                        boxShadow: '0 8px 16px hsl(var(--secondary) / 0.25)',
                        '&:hover': {
                            bgcolor: 'hsl(var(--secondary))',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 12px 20px hsl(var(--secondary) / 0.35)',
                        },
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                >
                    Create Course
                </Button>
            </Box>

            <Box className="glass-card" sx={{ p: 2, mb: 4, display: 'flex', gap: 2 }}>
                <TextField
                    placeholder="Search courses by title or curriculum code..."
                    size="small"
                    fullWidth
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: 'hsl(var(--secondary))', mr: 1 }} />
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
                            '&.Mui-focused fieldset': { borderColor: 'hsl(var(--secondary) / 0.5)' },
                        }
                    }}
                />
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                    <CircularProgress />
                </Box>
            ) : filtered.length === 0 ? (
                <Box className="glass-card" sx={{ p: 8, textAlign: 'center', borderRadius: 4 }}>
                    <MenuBookOutlinedIcon sx={{ fontSize: 48, color: 'hsl(var(--muted-foreground))', opacity: 0.5, mb: 2 }} />
                    <Typography sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 500 }}>No matching courses found</Typography>
                </Box>
            ) : (
                <Grid container spacing={3}>
                    {filtered.map((course) => (
                        <Grid item xs={12} sm={6} md={4} key={course.id}>
                            <Card className="glass-card" sx={{
                                height: '100%',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                border: '1px solid rgba(141, 166, 166, 0.1)',
                                background: 'rgba(13, 20, 20, 0.4)',
                                '&:hover': {
                                    transform: 'translateY(-6px)',
                                    borderColor: 'hsl(var(--secondary) / 0.4)',
                                    boxShadow: '0 12px 30px rgba(0,0,0,0.4), 0 0 20px hsl(var(--secondary) / 0.1)'
                                }
                            }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                                        <Chip
                                            label={course.status}
                                            size="small"
                                            sx={{
                                                bgcolor: course.status === 'PUBLISHED' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(141, 166, 166, 0.08)',
                                                color: course.status === 'PUBLISHED' ? '#4ADE80' : 'hsl(var(--muted-foreground))',
                                                fontWeight: 800,
                                                fontSize: 10,
                                                borderRadius: 1.5,
                                                border: '1px solid rgba(34, 197, 94, 0.1)'
                                            }}
                                        />
                                        <IconButton
                                            size="small"
                                            onClick={(e) => { setAnchorEl(e.currentTarget); setSelectedCourse(course); }}
                                            sx={{ color: 'hsl(var(--muted-foreground))', '&:hover': { color: 'hsl(var(--secondary))' } }}
                                        >
                                            <MoreVertIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'hsl(var(--foreground))', mb: 1, lineHeight: 1.3 }}>
                                        {course.title}
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                        <Typography variant="caption" sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 600, letterSpacing: '0.02em' }}>
                                            {course.code}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'rgba(141, 166, 166, 0.3)' }}>•</Typography>
                                        <Typography variant="caption" sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 500 }}>
                                            {course._count?.units || 0} modules
                                        </Typography>
                                    </Box>

                                    <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid rgba(141, 166, 166, 0.05)', display: 'flex', gap: 1.5 }}>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            component={Link}
                                            href={`/super-instructor/courses/new?id=${course.id}`}
                                            sx={{
                                                flex: 1,
                                                borderRadius: 2,
                                                textTransform: 'none',
                                                fontWeight: 600,
                                                borderColor: 'rgba(141, 166, 166, 0.2)',
                                                color: 'hsl(var(--foreground))',
                                                '&:hover': { bgcolor: 'rgba(141, 166, 166, 0.05)', borderColor: 'hsl(var(--secondary))' }
                                            }}
                                        >
                                            Modify
                                        </Button>
                                        <Button
                                            size="small"
                                            variant="text"
                                            sx={{
                                                flex: 1,
                                                borderRadius: 2,
                                                textTransform: 'none',
                                                fontWeight: 600,
                                                color: 'hsl(var(--secondary))',
                                                '&:hover': { bgcolor: 'hsl(var(--secondary) / 0.05)' }
                                            }}
                                        >
                                            Live Preview
                                        </Button>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                PaperProps={{
                    sx: {
                        bgcolor: 'rgba(13, 20, 20, 0.95)',
                        backdropFilter: 'blur(16px)',
                        border: '1px solid rgba(141, 166, 166, 0.1)',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                        borderRadius: 3,
                        mt: 1
                    }
                }}
            >
                <MenuItem
                    component={Link}
                    href={`/super-instructor/courses/new?id=${selectedCourse?.id}`}
                    onClick={() => setAnchorEl(null)}
                    sx={{ fontSize: 13, py: 1, px: 2, fontWeight: 500 }}
                >
                    Edit Course
                </MenuItem>
                <MenuItem onClick={() => setAnchorEl(null)} sx={{ fontSize: 13, py: 1, px: 2, fontWeight: 500 }}>Duplicate</MenuItem>
                <MenuItem onClick={() => setAnchorEl(null)} sx={{ fontSize: 13, py: 1, px: 2, fontWeight: 600, color: 'hsl(0 72% 51%)' }}>Delete</MenuItem>
            </Menu>
        </Box>
    );
}
