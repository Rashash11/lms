'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';

export default function LearnerCoursePage() {
    const router = useRouter();
    const params = useParams();
    const courseId = params.id as string;

    useEffect(() => {
        const fetchFirstUnit = async () => {
            try {
                const res = await fetch(`/api/courses/${courseId}`);
                if (res.ok) {
                    const course = await res.json();

                    const progressRes = await fetch(`/api/learner/progress?courseId=${courseId}`);
                    let completedIds: string[] = [];
                    if (progressRes.ok) {
                        const progressData = await progressRes.json();
                        completedIds = progressData.completedUnitIds || [];
                    }

                    const allUnits: any[] = [];
                    if (course.sections) {
                        course.sections.forEach((s: any) => {
                            if (s.units) allUnits.push(...s.units);
                        });
                    }
                    if (course.unassignedUnits) {
                        allUnits.push(...course.unassignedUnits);
                    }
                    allUnits.sort((a, b) => a.orderIndex - b.orderIndex);

                    const firstUncompleted = allUnits.find(u => !completedIds.includes(u.id)) || allUnits[0];

                    if (firstUncompleted) {
                        router.replace(`/learner/courses/${courseId}/units/${firstUncompleted.id}`);
                    } else {
                        router.replace('/learner/courses');
                    }
                } else {
                    router.replace('/learner/courses');
                }
            } catch (error) {
                console.error('Error fetching first unit:', error);
                router.replace('/learner/courses');
            }
        };

        if (courseId) {
            fetchFirstUnit();
        }
    }, [courseId, router]);

    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <CircularProgress />
        </Box>
    );
}
