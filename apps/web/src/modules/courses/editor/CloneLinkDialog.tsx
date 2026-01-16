'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Autocomplete,
    Box,
    Typography,
    Divider,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Paper,
} from '@mui/material';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

interface CloneLinkDialogProps {
    open: boolean;
    onClose: () => void;
    courseId: string;
    mode: 'clone' | 'link';
    onImport: (sourceCourseId: string, sourceUnitId: string, mode: 'clone' | 'link') => void;
}

export default function CloneLinkDialog({ open, onClose, courseId, mode, onImport }: CloneLinkDialogProps) {
    const [courses, setCourses] = useState<any[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<any>(null);
    const [units, setUnits] = useState<any[]>([]);
    const [selectedUnit, setSelectedUnit] = useState<any>(null);

    useEffect(() => {
        if (open) {
            fetch('/api/courses')
                .then(res => res.json())
                .then(data => setCourses(data.filter((c: any) => c.id !== courseId)));
        }
    }, [open, courseId]);

    useEffect(() => {
        if (selectedCourse) {
            fetch(`/api/courses/${selectedCourse.id}`)
                .then(res => res.json())
                .then(data => {
                    // Combine all units from sections and unassigned
                    const allUnits = [
                        ...(data.sections?.flatMap((s: any) => s.units) || []),
                        ...(data.unassignedUnits || [])
                    ];
                    setUnits(allUnits);
                });
        } else {
            setUnits([]);
        }
    }, [selectedCourse]);

    const handleImport = () => {
        if (selectedCourse && selectedUnit) {
            onImport(selectedCourse.id, selectedUnit.id, mode);
            onClose();
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="sm"
            PaperProps={{
                sx: { borderRadius: '16px', p: 1 }
            }}
        >
            <DialogTitle sx={{ fontWeight: 800, color: '#2d3748', borderBottom: '1px solid #edf2f7', pb: 2 }}>
                {mode === 'clone' ? 'Clone from another course' : 'Link from another course'}
            </DialogTitle>
            <DialogContent sx={{ mt: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <Typography variant="body2" sx={{ color: '#718096', fontWeight: 500, lineHeight: 1.6 }}>
                        {mode === 'clone'
                            ? 'Create a fresh copy of a unit from another course. Changes to the original unit will not affect this copy.'
                            : 'Link a unit from another course. Any changes made to the source unit will automatically reflect here.'}
                    </Typography>

                    <Autocomplete
                        options={courses}
                        getOptionLabel={(option) => option.title}
                        onChange={(e, val) => setSelectedCourse(val)}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Search Course"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                            />
                        )}
                    />

                    {selectedCourse && (
                        <Box>
                            <Typography variant="overline" sx={{ color: '#a0aec0', fontWeight: 800, mb: 1.5, display: 'block', letterSpacing: 1 }}>
                                SELECT UNIT
                            </Typography>
                            <Paper variant="outlined" sx={{
                                borderRadius: '12px',
                                border: '1px solid #edf2f7',
                                maxHeight: 300,
                                overflowY: 'auto',
                                boxShadow: 'none'
                            }}>
                                <List disablePadding>
                                    {units.map((unit, index) => (
                                        <ListItem key={unit.id} disablePadding sx={{ borderBottom: index === units.length - 1 ? 'none' : '1px solid #edf2f7' }}>
                                            <ListItemButton
                                                selected={selectedUnit?.id === unit.id}
                                                onClick={() => setSelectedUnit(unit)}
                                                sx={{
                                                    py: 1.5,
                                                    '&.Mui-selected': { bgcolor: '#ebf8ff', color: '#2b6cb0' },
                                                    '&:hover': { bgcolor: '#f7fafc' }
                                                }}
                                            >
                                                <ListItemIcon sx={{ minWidth: 40 }}>
                                                    <InsertDriveFileIcon sx={{ color: selectedUnit?.id === unit.id ? '#3182ce' : '#cbd5e0' }} />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={unit.title}
                                                    secondary={unit.type}
                                                    primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
                                                    secondaryTypographyProps={{ fontSize: '0.75rem' }}
                                                />
                                            </ListItemButton>
                                        </ListItem>
                                    ))}
                                    {units.length === 0 && (
                                        <Box sx={{ p: 4, textAlign: 'center' }}>
                                            <Typography variant="body2" color="#a0aec0">No units found in this course</Typography>
                                        </Box>
                                    )}
                                </List>
                            </Paper>
                        </Box>
                    )}
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3, borderTop: '1px solid #edf2f7' }}>
                <Button onClick={onClose} sx={{ textTransform: 'none', fontWeight: 600, color: '#718096' }}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleImport}
                    disabled={!selectedCourse || !selectedUnit}
                    sx={{
                        textTransform: 'none',
                        fontWeight: 700,
                        px: 4,
                        borderRadius: '8px',
                        bgcolor: '#3182ce',
                        '&:hover': { bgcolor: '#2b6cb0' }
                    }}
                >
                    {mode === 'clone' ? 'Clone Unit' : 'Link Unit'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
