'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, Button, Paper, TextField, Chip, Stack, Divider } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { getCsrfToken } from '@/lib/client-csrf';

export default function SuperInstructorSkillsNewPage() {
    const router = useRouter();
    const [name, setName] = React.useState('');
    const [description, setDescription] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setLoading(true);
        try {
            const res = await fetch('/api/skills', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-csrf-token': getCsrfToken()
                },
                body: JSON.stringify({ name, description }),
            });

            if (res.ok) {
                router.push('/super-instructor/skills');
            }
        } catch (error) {
            console.error('Failed to create skill:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ maxWidth: 600, mx: 'auto', py: 4 }}>
            <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => router.back()}
                sx={{ mb: 3, color: 'text.secondary' }}
            >
                Back to Skills
            </Button>

            <Paper sx={{ p: 4, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h5" fontWeight={700} gutterBottom>
                    Create New Skill
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 3 }}>
                    Skills help categorize and track learner competencies across courses.
                </Typography>

                <form onSubmit={handleSubmit}>
                    <Stack spacing={3}>
                        <TextField
                            label="Skill Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            fullWidth
                            placeholder="e.g., JavaScript, Project Management"
                        />

                        <TextField
                            label="Description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            multiline
                            rows={3}
                            fullWidth
                            placeholder="Describe what this skill encompasses..."
                        />

                        <Divider />

                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                            <Button
                                variant="outlined"
                                onClick={() => router.back()}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={loading || !name.trim()}
                                startIcon={<AddIcon />}
                            >
                                {loading ? 'Creating...' : 'Create Skill'}
                            </Button>
                        </Box>
                    </Stack>
                </form>
            </Paper>
        </Box>
    );
}
