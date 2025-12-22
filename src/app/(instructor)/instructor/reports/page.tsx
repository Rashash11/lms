'use client';

import React from 'react';
import { Box, Typography, Paper, Button, Card, CardContent, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import DownloadIcon from '@mui/icons-material/Download';
import AssessmentIcon from '@mui/icons-material/Assessment';

export default function InstructorReportsPage() {
    return (
        <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>Reports</Typography>

            <Grid container spacing={3}>
                {[
                    { name: 'Course Progress', description: 'Learner progress across your courses' },
                    { name: 'Quiz Performance', description: 'Test scores and statistics' },
                    { name: 'Assignment Performance', description: 'Assignment grades and feedback' },
                    { name: 'Attendance Report', description: 'ILT session attendance' },
                ].map((report) => (
                    <Grid item xs={12} sm={6} key={report.name}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                    <AssessmentIcon color="success" fontSize="large" />
                                    <Box>
                                        <Typography variant="h6">{report.name}</Typography>
                                        <Typography variant="body2" color="text.secondary">{report.description}</Typography>
                                    </Box>
                                </Box>
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Course</InputLabel>
                                            <Select defaultValue="all" label="Course">
                                                <MenuItem value="all">All Courses</MenuItem>
                                                <MenuItem value="js">Advanced JavaScript</MenuItem>
                                                <MenuItem value="react">React Fundamentals</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Button variant="contained" color="success" fullWidth startIcon={<DownloadIcon />}>
                                            Export
                                        </Button>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}
