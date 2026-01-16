'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box,
    Typography,
    TextField,
    Button,
    Paper,
    Container,
    CircularProgress
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { getCsrfToken } from '@/lib/client-csrf';

export default function NewCoursePage() {
    const router = useRouter();
    const [creating, setCreating] = useState(false);
    const [formData, setFormData] = useState({
        code: '',
        title: '',
        description: ''
    });

    const handleCreate = async () => {
        if (!formData.title) return;

        setCreating(true);
        try {
            const res = await fetch('/api/courses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': getCsrfToken()
                },
                body: JSON.stringify({
                    ...formData,
                    status: 'DRAFT',
                    hiddenFromCatalog: false
                })
            });

            if (res.ok) {
                const newCourse = await res.json();
                // Redirect to the editor
                router.push(`/admin/courses/new/edit?id=${newCourse.id}`);
            }
        } catch (error) {
            console.error('Error creating course:', error);
        } finally {
            setCreating(false);
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#f7fafc' }}>
            {/* Simple Top Navigation */}
            <Box sx={{
                height: 64,
                bgcolor: '#fff',
                borderBottom: '1px solid #edf2f7',
                display: 'flex',
                alignItems: 'center',
                px: 3
            }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => router.push('/admin/courses')}
                    sx={{ textTransform: 'none', color: '#718096', fontWeight: 600 }}
                >
                    Back to Courses
                </Button>
            </Box>

            {/* Main Content */}
            <Container maxWidth="md" sx={{ py: 6 }}>
                <Paper sx={{ p: 6, borderRadius: '16px' }}>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#2d3748', mb: 1 }}>
                        Create New Course
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#718096', mb: 4 }}>
                        Fill in the basic information to get started. You can add content after creation.
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <TextField
                            label="Course Code"
                            placeholder="e.g., CS101"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            fullWidth
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                        />

                        <TextField
                            label="Course Title"
                            placeholder="Enter course title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                            fullWidth
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                        />

                        <TextField
                            label="Description"
                            placeholder="Brief description of the course"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            multiline
                            rows={4}
                            fullWidth
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                        />

                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                            <Button
                                onClick={() => router.push('/admin/courses')}
                                sx={{ textTransform: 'none', fontWeight: 600, color: '#718096' }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="contained"
                                onClick={handleCreate}
                                disabled={!formData.title || creating}
                                sx={{
                                    textTransform: 'none',
                                    bgcolor: '#3182ce',
                                    fontWeight: 700,
                                    px: 4,
                                    borderRadius: '8px',
                                    '&:hover': { bgcolor: '#2b6cb0' }
                                }}
                            >
                                {creating ? <CircularProgress size={20} color="inherit" /> : 'Create Course'}
                            </Button>
                        </Box>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
}
