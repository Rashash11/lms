'use client';

import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    RadioGroup,
    FormControlLabel,
    Radio,
    TextField,
    Box,
    Typography,
    FormLabel,
} from '@mui/material';
import { apiFetch, ApiFetchError } from '@shared/http/apiFetch';

interface Course {
    id: string;
    title: string;
    code: string;
}

interface LearningPathCourse {
    id: string;
    courseId: string;
    order: number;
    course: Course;
}

interface Section {
    id: string;
    name: string;
    order: number;
}

interface AddCourseModalProps {
    open: boolean;
    onClose: () => void;
    pathId: string;
    existingCourses: LearningPathCourse[];
    availableCourses: Course[];
    sections?: Section[];
    onCourseAdded: () => void;
}

export default function AddCourseModal({
    open,
    onClose,
    pathId,
    existingCourses,
    availableCourses,
    sections = [],
    onCourseAdded,
}: AddCourseModalProps) {
    const [selectedCourseId, setSelectedCourseId] = useState<string>('');
    const [selectedSectionId, setSelectedSectionId] = useState<string>('');
    const [unlockType, setUnlockType] = useState<string>('NONE');
    const [unlockCourseId, setUnlockCourseId] = useState<string>('');
    const [minScore, setMinScore] = useState<number>(70);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Auto-select first section when modal opens
    React.useEffect(() => {
        if (open && sections && sections.length > 0) {
            const firstSection = sections.sort((a, b) => a.order - b.order)[0];
            setSelectedSectionId(firstSection.id);
        }
    }, [open, sections]);

    // Filter out already added courses
    const coursesToShow = availableCourses.filter(
        (c) => !existingCourses.some((ec) => ec.courseId === c.id)
    );

    const handleAdd = async () => {
        if (!selectedCourseId) {
            setError('Please select a course');
            return;
        }

        if ((unlockType === 'AFTER_COURSE' || unlockType === 'AFTER_SCORE') && !unlockCourseId) {
            setError('Please select a dependency course');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const body: Record<string, unknown> = {
                courseId: selectedCourseId,
                unlockType,
            };

            if (selectedSectionId) {
                body.sectionId = selectedSectionId;
            }

            if (unlockType === 'AFTER_COURSE' || unlockType === 'AFTER_SCORE') {
                body.unlockCourseId = unlockCourseId;
            }

            if (unlockType === 'AFTER_SCORE') {
                body.minScore = minScore;
            }

            await apiFetch(`/api/learning-paths/${pathId}/courses`, {
                method: 'POST',
                body,
            });
            onCourseAdded();
            handleClose();
        } catch (err) {
            console.error('Failed to add course:', err);
            setError(err instanceof ApiFetchError ? err.message : 'Failed to add course');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setSelectedCourseId('');
        setSelectedSectionId('');
        setUnlockType('NONE');
        setUnlockCourseId('');
        setMinScore(70);
        setError(null);
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>Add Course to Learning Path</DialogTitle>
            <DialogContent>
                <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {/* Course Selector */}
                    <FormControl fullWidth>
                        <InputLabel>Select Course</InputLabel>
                        <Select
                            value={selectedCourseId}
                            onChange={(e) => setSelectedCourseId(e.target.value)}
                            label="Select Course"
                        >
                            {coursesToShow.map((course) => (
                                <MenuItem key={course.id} value={course.id}>
                                    {course.title} ({course.code})
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Section Selector */}
                    {sections && sections.length > 0 && (
                        <FormControl fullWidth>
                            <InputLabel>Section (Optional)</InputLabel>
                            <Select
                                value={selectedSectionId}
                                onChange={(e) => setSelectedSectionId(e.target.value)}
                                label="Section (Optional)"
                            >
                                <MenuItem value="">
                                    <em>No section (ungrouped)</em>
                                </MenuItem>
                                {sections.sort((a, b) => a.order - b.order).map((section) => (
                                    <MenuItem key={section.id} value={section.id}>
                                        {section.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}

                    {/* Unlock Condition */}
                    <FormControl component="fieldset">
                        <FormLabel component="legend">Unlock Condition</FormLabel>
                        <RadioGroup
                            value={unlockType}
                            onChange={(e) => {
                                setUnlockType(e.target.value);
                                setUnlockCourseId('');
                            }}
                        >
                            <FormControlLabel
                                value="NONE"
                                control={<Radio />}
                                label="Available immediately"
                            />
                            <FormControlLabel
                                value="AFTER_COURSE"
                                control={<Radio />}
                                label="Available after completing another course"
                                disabled={existingCourses.length === 0}
                            />
                            <FormControlLabel
                                value="AFTER_SCORE"
                                control={<Radio />}
                                label="Available after passing another course with minimum score"
                                disabled={existingCourses.length === 0}
                            />
                        </RadioGroup>
                    </FormControl>

                    {/* Dependency Course Selector */}
                    {(unlockType === 'AFTER_COURSE' || unlockType === 'AFTER_SCORE') && (
                        <FormControl fullWidth>
                            <InputLabel>Dependency Course</InputLabel>
                            <Select
                                value={unlockCourseId}
                                onChange={(e) => setUnlockCourseId(e.target.value)}
                                label="Dependency Course"
                            >
                                {existingCourses
                                    .sort((a, b) => a.order - b.order)
                                    .map((pc) => (
                                        <MenuItem key={pc.courseId} value={pc.courseId}>
                                            {pc.course.title} (Order: {pc.order})
                                        </MenuItem>
                                    ))}
                            </Select>
                        </FormControl>
                    )}

                    {/* Minimum Score Input */}
                    {unlockType === 'AFTER_SCORE' && (
                        <FormControl fullWidth>
                            <TextField
                                type="number"
                                label="Minimum Score (%)"
                                value={minScore}
                                onChange={(e) => setMinScore(Number(e.target.value))}
                                inputProps={{ min: 0, max: 100 }}
                                helperText="Learners must achieve at least this score to unlock this course"
                            />
                        </FormControl>
                    )}

                    {/* Error Message */}
                    {error && (
                        <Typography color="error" variant="body2">
                            {error}
                        </Typography>
                    )}
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={handleClose} disabled={loading}>
                    Cancel
                </Button>
                <Button
                    onClick={handleAdd}
                    variant="contained"
                    disabled={loading || !selectedCourseId}
                >
                    {loading ? 'Adding...' : 'Add to learning path'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
