'use client';

import React, { useState } from 'react';
import {
    Box,
    Typography,
    Tabs,
    Tab,
    TextField,
    Switch,
    FormControlLabel,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Button,
    Paper,
    Divider,
    Grid
} from '@mui/material';

interface CourseOptionsTabProps {
    course: any;
    onUpdate: (data: any) => void;
}

export default function CourseOptionsTab({ course, onUpdate }: CourseOptionsTabProps) {
    const [activeSubTab, setActiveSubTab] = useState(0);

    const handleFieldChange = (field: string, value: any) => {
        onUpdate({ [field]: value });
    };

    const renderInfo = () => (
        <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 8 }}>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>COURSE TITLE</Typography>
                    <TextField
                        fullWidth
                        value={course.title || ''}
                        onChange={(e) => handleFieldChange('title', e.target.value)}
                        variant="outlined"
                        size="small"
                    />
                </Box>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>SUBTITLE</Typography>
                    <TextField
                        fullWidth
                        value={course.subtitle || ''}
                        onChange={(e) => handleFieldChange('subtitle', e.target.value)}
                        variant="outlined"
                        size="small"
                        placeholder="A brief catchy line for the course"
                    />
                </Box>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>DESCRIPTION</Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        value={course.description || ''}
                        onChange={(e) => handleFieldChange('description', e.target.value)}
                        variant="outlined"
                        size="small"
                    />
                </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: '#f8fafc', borderStyle: 'dashed' }}>
                    <Box component="img"
                        src={course.thumbnailUrl || 'https://via.placeholder.com/200x120?text=No+Image'}
                        sx={{ width: '100%', borderRadius: 1, mb: 2 }}
                    />
                    <Button variant="outlined" size="small" component="label" sx={{ textTransform: 'none' }}>
                        Change Image
                        <input type="file" hidden />
                    </Button>
                </Paper>
            </Grid>
        </Grid>
    );

    const renderAvailability = () => (
        <Box>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Availability & Visibility</Typography>
            <Paper variant="outlined" sx={{ p: 3 }}>
                <FormControlLabel
                    control={<Switch checked={course.show_in_catalog !== false} onChange={(e) => handleFieldChange('show_in_catalog', e.target.checked)} />}
                    label={<Box><Typography variant="body2" fontWeight={600}>Show in course catalog</Typography><Typography variant="caption" color="text.secondary">Make this course visible to all learners in the catalog</Typography></Box>}
                    sx={{ mb: 3, display: 'flex', alignItems: 'flex-start' }}
                />
                <Divider sx={{ my: 2 }} />
                <FormControlLabel
                    control={<Switch checked={course.approval_required === true} onChange={(e) => handleFieldChange('approval_required', e.target.checked)} />}
                    label={<Box><Typography variant="body2" fontWeight={600}>Approval required</Typography><Typography variant="caption" color="text.secondary">Admin or instructor must approve enrollment requests</Typography></Box>}
                    sx={{ mb: 3, display: 'flex', alignItems: 'flex-start' }}
                />
            </Paper>
        </Box>
    );

    const renderRules = () => (
        <Box>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Rules & Limits</Typography>
            <Paper variant="outlined" sx={{ p: 3 }}>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>EXPIRATION (DAYS)</Typography>
                        <TextField
                            fullWidth
                            type="number"
                            size="small"
                            value={course.expiration_days || 0}
                            onChange={(e) => handleFieldChange('expiration_days', parseInt(e.target.value))}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>MAX LEARNERS</Typography>
                        <TextField
                            fullWidth
                            type="number"
                            size="small"
                            value={course.max_learners || 0}
                            onChange={(e) => handleFieldChange('max_learners', parseInt(e.target.value))}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 12 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>PREREQUISITES</Typography>
                        <FormControl fullWidth size="small">
                            <Select
                                value={course.prerequisite_id || ''}
                                onChange={(e) => handleFieldChange('prerequisite_id', e.target.value)}
                                displayEmpty
                            >
                                <MenuItem value="">None</MenuItem>
                                {/* Course list would go here */}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );

    const renderCompletion = () => (
        <Box>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Completion Rules</Typography>
            <Paper variant="outlined" sx={{ p: 3 }}>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>CRITERIA</Typography>
                    <FormControl fullWidth size="small">
                        <Select
                            value={course.completion_rule || 'all'}
                            onChange={(e) => handleFieldChange('completion_rule', e.target.value)}
                        >
                            <MenuItem value="all">All units completed</MenuItem>
                            <MenuItem value="percentage">Percentage of units completed</MenuItem>
                            <MenuItem value="tests">All tests passed</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
                {course.completion_rule === 'percentage' && (
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>PERCENTAGE REQUIRED</Typography>
                        <TextField
                            fullWidth
                            type="number"
                            size="small"
                            value={course.completion_percentage || 100}
                            onChange={(e) => handleFieldChange('completion_percentage', parseInt(e.target.value))}
                        />
                    </Box>
                )}
                <Divider sx={{ my: 3 }} />
                <FormControlLabel
                    control={<Switch checked={course.sequential_navigation === true} onChange={(e) => handleFieldChange('sequential_navigation', e.target.checked)} />}
                    label={<Box><Typography variant="body2" fontWeight={600}>Sequential navigation</Typography><Typography variant="caption" color="text.secondary">Force learners to complete units in order</Typography></Box>}
                    sx={{ alignItems: 'flex-start' }}
                />
            </Paper>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', height: '100%' }}>
            {/* Sub-navigation Sidebar */}
            <Box sx={{ width: 200, borderRight: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
                <Tabs
                    orientation="vertical"
                    value={activeSubTab}
                    onChange={(e, v) => setActiveSubTab(v)}
                    sx={{
                        '& .MuiTab-root': {
                            alignItems: 'flex-start',
                            textTransform: 'none',
                            fontWeight: 600,
                            textAlign: 'left',
                            fontSize: '0.875rem',
                            py: 1.5,
                            px: 3,
                            color: '#718096',
                            '&.Mui-selected': { color: '#3182ce', bgcolor: '#ebf8ff' }
                        },
                        '& .MuiTabs-indicator': { left: 0, width: 3 }
                    }}
                >
                    <Tab label="Course Info" />
                    <Tab label="Availability" />
                    <Tab label="Rules & Limits" />
                    <Tab label="Completion" />
                </Tabs>
            </Box>

            <Box sx={{ flex: 1, p: 4, overflowY: 'auto' }}>
                {activeSubTab === 0 && renderInfo()}
                {activeSubTab === 1 && renderAvailability()}
                {activeSubTab === 2 && renderRules()}
                {activeSubTab === 3 && renderCompletion()}
            </Box>
        </Box>
    );
}
