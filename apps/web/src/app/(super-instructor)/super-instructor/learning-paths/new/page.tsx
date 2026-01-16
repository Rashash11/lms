'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress, Typography } from '@mui/material';
import { getCsrfToken } from '@/lib/client-csrf';

export default function SuperInstructorNewLearningPathPage() {
    const router = useRouter();

    useEffect(() => {
        const createPath = async () => {
            try {
                const res = await fetch('/api/learning-paths', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-csrf-token': getCsrfToken(),
                    },
                    body: JSON.stringify({
                        name: 'New Learning Path',
                        code: `LP-${Date.now()}`,
                        status: 'inactive',
                    }),
                });

                if (res.ok) {
                    const path = await res.json();
                    // Redirect to Super Instructor edit page with the new path ID
                    router.replace(`/super-instructor/learning-paths/${path.id}/edit`);
                } else {
                    console.error('Failed to create learning path');
                    router.push('/super-instructor/learning-paths');
                }
            } catch (error) {
                console.error('Error creating learning path:', error);
                router.push('/super-instructor/learning-paths');
            }
        };

        createPath();
    }, [router]);

    return (
        <Box className="animate-fade-in" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 2 }}>
            <CircularProgress size={48} sx={{ color: 'hsl(var(--primary))' }} />
            <Typography variant="h6" sx={{ color: 'hsl(var(--muted-foreground))' }}>Creating new learning path...</Typography>
        </Box>
    );
}
