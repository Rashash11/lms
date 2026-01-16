'use client';

import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Card, CardContent, Button,
    Select, MenuItem, FormControl, InputLabel,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import DownloadIcon from '@mui/icons-material/Download';

export default function SuperInstructorReportsPage() {
    const [reportType, setReportType] = useState('user-progress');
    const [stats, setStats] = useState({
        totalUsers: '0',
        completionRate: '0%',
        totalCourses: '0',
        activeLearners: '0'
    });

    useEffect(() => {
        fetch(`/api/reports?type=${reportType}`)
            .then(r => r.json())
            .then(data => {
                if (data.stats) setStats(data.stats);
            })
            .catch(console.error);
    }, [reportType]);

    const reportCards = [
        { title: 'Total Users', value: stats.totalUsers, change: '+0%', color: '#6B21A8' },
        { title: 'Course Completions', value: stats.completionRate, change: '+0%', color: '#059669' },
        { title: 'Total Courses', value: stats.totalCourses, change: '+0%', color: '#2563EB' },
        { title: 'Active Learners', value: stats.activeLearners, change: '+0%', color: '#DC2626' },
    ];

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
                        <AssessmentIcon sx={{ fontSize: 32 }} />
                    </Box>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: 'hsl(var(--foreground))', letterSpacing: '-0.02em' }}>Reports & Analytics</Typography>
                        <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))' }}>Deep dive into performance metrics and trends</Typography>
                    </Box>
                </Box>
                <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    sx={{
                        borderColor: 'hsl(var(--primary))',
                        color: 'hsl(var(--primary))',
                        borderRadius: 2.5,
                        textTransform: 'none',
                        fontWeight: 600,
                        '&:hover': {
                            bgcolor: 'hsl(var(--primary) / 0.1)',
                            borderColor: 'hsl(var(--primary))',
                        }
                    }}
                >
                    Export Report
                </Button>
            </Box>

            <Box className="glass-card" sx={{ p: 3, mb: 3, borderRadius: 4 }}>
                <FormControl fullWidth sx={{ maxWidth: 300 }}>
                    <InputLabel sx={{ color: 'hsl(var(--muted-foreground))' }}>Report Type</InputLabel>
                    <Select
                        value={reportType}
                        label="Report Type"
                        onChange={(e) => setReportType(e.target.value)}
                        sx={{
                            color: 'hsl(var(--foreground))',
                            '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(141, 166, 166, 0.2)' },
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'hsl(var(--primary) / 0.5)' },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'hsl(var(--primary))' },
                            '& .MuiSvgIcon-root': { color: 'hsl(var(--muted-foreground))' }
                        }}
                    >
                        <MenuItem value="user-progress">User Progress</MenuItem>
                        <MenuItem value="course-completion">Course Completion</MenuItem>
                        <MenuItem value="assignment-scores">Assignment Scores</MenuItem>
                        <MenuItem value="learning-paths">Learning Path Progress</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            <Grid container spacing={3} sx={{ mb: 3 }}>
                {reportCards.map((card, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                        <Card className="glass-card" sx={{ height: '100%', borderRadius: 3, transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                    <Box sx={{
                                        width: 48, height: 48, borderRadius: 2,
                                        bgcolor: `hsl(from ${card.color} h s l / 0.15)`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: card.color
                                    }}>
                                        <AssessmentIcon sx={{ fontSize: 24 }} />
                                    </Box>
                                    <TrendingUpIcon sx={{ color: '#22C55E', fontSize: 20 }} />
                                </Box>
                                <Typography variant="h4" sx={{ fontWeight: 800, color: 'hsl(var(--foreground))', mb: 0.5 }}>{card.value}</Typography>
                                <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 500 }}>{card.title}</Typography>
                                <Typography variant="caption" sx={{ color: '#22C55E', fontWeight: 600, display: 'block', mt: 1 }}>{card.change} from last month</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Box className="glass-card" sx={{ p: 5, textAlign: 'center', borderRadius: 4 }}>
                <Typography sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 500 }}>
                    Detailed reports will be displayed here based on your selection
                </Typography>
            </Box>
        </Box>
    );
}
