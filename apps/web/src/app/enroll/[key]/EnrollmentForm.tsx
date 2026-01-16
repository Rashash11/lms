'use client';

import { useState } from 'react';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { getCsrfToken } from '@/lib/client-csrf';

interface EnrollmentFormProps {
    enrollmentKey: string;
    courseId: string;
}

export default function EnrollmentForm({ enrollmentKey, courseId }: EnrollmentFormProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const handleEnroll = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/courses/enroll/${enrollmentKey}`, {
                method: 'POST',
                headers: { 'x-csrf-token': getCsrfToken() }
            });
            const data = await res.json();

            if (res.ok) {
                setSuccess(true);
                setTimeout(() => {
                    router.push(`/learner/courses/${courseId}`);
                }, 1500);
            } else {
                setError(data.error || 'Failed to enroll');
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <Box sx={{ textAlign: 'center' }}>
                <CheckCircleIcon sx={{ fontSize: 60, color: '#48bb78', mb: 2 }} />
                <Typography variant="h6" sx={{ color: '#2d3748', fontWeight: 600 }}>
                    Successfully Enrolled!
                </Typography>
                <Typography variant="body2" sx={{ color: '#718096' }}>
                    Redirecting to course dashboard...
                </Typography>
            </Box>
        );
    }

    return (
        <Box>
            {error && (
                <Typography variant="body2" color="error" sx={{ mb: 2, fontWeight: 600 }}>
                    {error}
                </Typography>
            )}
            <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleEnroll}
                disabled={loading}
                sx={{
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    bgcolor: '#3182ce',
                    borderRadius: 2,
                    boxShadow: '0 4px 6px -1px rgba(66, 153, 225, 0.4)',
                    '&:hover': {
                        bgcolor: '#2b6cb0',
                        boxShadow: '0 10px 15px -3px rgba(66, 153, 225, 0.4)'
                    }
                }}
            >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Confirm Enrollment'}
            </Button>
            <Button
                fullWidth
                variant="text"
                sx={{ mt: 2, textTransform: 'none', color: '#718096' }}
                onClick={() => router.push('/learner')}
            >
                Not interested? Back to Dashboard
            </Button>
        </Box>
    );
}
