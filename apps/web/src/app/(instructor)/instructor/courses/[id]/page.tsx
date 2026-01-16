'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, CircularProgress } from '@mui/material';
import { useParams } from 'next/navigation';
import AccessDenied from '@shared/ui/components/AccessDenied';

export default function CourseDetailPage() {
    const params = useParams();
    const courseId = params.id as string;

    const [course, setCourse] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [forbidden, setForbidden] = useState(false);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                const res = await fetch(`/api/instructor/courses?limit=200`);
                if (res.status === 403) {
                    if (mounted) setForbidden(true);
                    return;
                }
                if (!res.ok) return;
                const data = await res.json();
                const found = data?.courses?.find((c: any) => c.id === courseId);
                if (mounted) setCourse(found || null);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        if (courseId) load();
        return () => {
            mounted = false;
        };
    }, [courseId]);

    if (forbidden) return <AccessDenied />;
    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h5" fontWeight={600} gutterBottom>
                {course?.title || 'Course not found'}
            </Typography>
            <Paper sx={{ p: 3, mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                    Course detail page for course ID: {courseId}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Full course editor will be implemented here.
                </Typography>
            </Paper>
        </Box>
    );
}
