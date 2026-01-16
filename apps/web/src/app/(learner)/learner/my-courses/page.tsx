'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';

export default function MyCoursesPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to the actual my courses page
        router.replace('/learner/courses');
    }, [router]);

    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <CircularProgress />
        </Box>
    );
}
