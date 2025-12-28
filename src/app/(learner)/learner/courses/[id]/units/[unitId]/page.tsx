'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Box,
    CircularProgress,
    Typography,
    IconButton,
    Button,
    Paper,
    Divider
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import UnitRenderer from '@/components/course-player/UnitRenderer';
import LearnerCourseOutline from '@/components/learner/LearnerCourseOutline';

function CoursePlayerContent() {
    const router = useRouter();
    const params = useParams();
    const courseId = params.id as string;
    const unitId = params.unitId as string;

    const [loading, setLoading] = useState(true);
    const [course, setCourse] = useState<any>(null);
    const [unit, setUnit] = useState<any>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [enrollment, setEnrollment] = useState<any>(null);

    useEffect(() => {
        if (courseId && unitId) {
            loadData();
        }
    }, [courseId, unitId]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Fetch enrollment to get course structure and progress
            const enrollRes = await fetch(`/api/enrollments?courseId=${courseId}`);
            if (enrollRes.ok) {
                const data = await enrollRes.json();
                const userEnrollment = data.enrollments.find((e: any) => e.courseId === courseId);
                setEnrollment(userEnrollment);

                // Fetch full course structure
                const courseRes = await fetch(`/api/courses/${courseId}`);
                if (courseRes.ok) {
                    setCourse(await courseRes.json());
                }

                // Fetch current unit
                const unitRes = await fetch(`/api/courses/${courseId}/units/${unitId}`);
                if (unitRes.ok) {
                    setUnit(await unitRes.json());
                }
            } else {
                router.push('/learner/courses');
            }
        } catch (error) {
            console.error('Error loading player data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getAllUnits = () => {
        if (!course) return [];
        const units: any[] = [];
        (course.sections || []).forEach((s: any) => {
            units.push(...s.units);
        });
        units.push(...(course.unassignedUnits || []));
        return units.sort((a, b) => a.order_index - b.order_index);
    };

    const units = getAllUnits();
    const currentIndex = units.findIndex(u => u.id === unitId);
    const prevUnit = currentIndex > 0 ? units[currentIndex - 1] : null;
    const nextUnit = currentIndex < units.length - 1 ? units[currentIndex + 1] : null;

    const handleNavigate = (id: string) => {
        // Sequential check
        const targetIndex = units.findIndex(u => u.id === id);
        if (targetIndex > currentIndex) {
            // Check if all previous units are completed
            for (let i = 0; i < targetIndex; i++) {
                if (!enrollment?.completedUnitIds?.includes(units[i].id)) {
                    // Locked
                    return;
                }
            }
        }
        router.push(`/learner/courses/${courseId}/units/${id}`);
    };

    const handleMarkComplete = async () => {
        if (!enrollment || !unit) return;

        try {
            const res = await fetch(`/api/enrollments/${enrollment.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'completeUnit',
                    unitId: unitId
                })
            });

            if (res.ok) {
                const data = await res.json();
                setEnrollment(data); // Update locally
            }
        } catch (error) {
            console.error('Error marking unit complete:', error);
        }
    };

    const isCurrentUnitCompleted = enrollment?.completedUnitIds?.includes(unitId);
    const canGoNext = isCurrentUnitCompleted || (nextUnit === null);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', bgcolor: '#fff', position: 'fixed', inset: 0, zIndex: 10000 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!course || !unit) {
        return <Box sx={{ p: 4 }}><Typography>Course or Unit not found</Typography></Box>;
    }

    return (
        <Box sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            width: '100vw',
            bgcolor: '#fff',
            zIndex: 9999, // Overlays everything
            overflow: 'hidden'
        }}>
            {/* Top Bar - More compact and integrated */}
            <Box sx={{
                height: 50,
                bgcolor: '#fff',
                display: 'flex',
                alignItems: 'center',
                px: 2,
                color: '#2d3748',
                borderBottom: '1px solid #e2e8f0',
                justifyContent: 'space-between',
                zIndex: 1200
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton size="small" onClick={() => setSidebarOpen(!sidebarOpen)}>
                        <MenuIcon sx={{ color: '#4a5568' }} />
                    </IconButton>
                    <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 800 }}>
                        {course.title}
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Button
                        size="small"
                        disabled={!prevUnit}
                        startIcon={<NavigateBeforeIcon />}
                        onClick={() => prevUnit && handleNavigate(prevUnit.id)}
                        variant="outlined"
                        sx={{ textTransform: 'none', px: 2, py: 0.5, fontSize: '0.8rem', borderColor: '#e2e8f0', color: '#3182ce' }}
                    >
                        Prev
                    </Button>

                    <Typography sx={{ fontSize: '0.8rem', color: '#718096', mx: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                        {!isCurrentUnitCompleted && (
                            <>
                                <Box sx={{ width: 14, height: 14, borderRadius: '50%', border: '1px solid #718096', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Box sx={{ width: 8, height: 8, bgcolor: 'transparent' }} />
                                </Box>
                                Complete the unit to continue
                            </>
                        )}
                        {isCurrentUnitCompleted && (
                            <>
                                <CheckCircleIcon sx={{ fontSize: '1rem', color: '#38a169' }} />
                                Completed
                            </>
                        )}
                    </Typography>

                    <Button
                        size="small"
                        disabled={!nextUnit || !canGoNext}
                        endIcon={<NavigateNextIcon />}
                        onClick={() => nextUnit && handleNavigate(nextUnit.id)}
                        variant="contained"
                        sx={{ textTransform: 'none', px: 2, py: 0.5, fontSize: '0.8rem', bgcolor: '#3182ce', '&:hover': { bgcolor: '#2b6cb0' } }}
                    >
                        Next
                    </Button>

                    <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

                    <Button
                        size="small"
                        startIcon={<ArrowBackIcon />}
                        onClick={() => router.push('/learner/courses')}
                        sx={{ textTransform: 'none', color: '#4a5568', fontWeight: 600 }}
                    >
                        Exit
                    </Button>
                </Box>
            </Box>

            <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Sidebar */}
                {sidebarOpen && (
                    <Box sx={{ width: 280, minWidth: 280, borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                        <LearnerCourseOutline
                            sections={course.sections || []}
                            unassignedUnits={course.unassignedUnits || []}
                            activeUnitId={unitId}
                            onUnitClick={handleNavigate}
                            courseTitle={course.title}
                            onBack={() => router.push('/learner/courses')}
                            progress={enrollment?.progress || 0}
                            completedUnitIds={enrollment?.completedUnitIds || []}
                        />
                    </Box>
                )}

                {/* Content */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: '#fff' }}>
                    <Box sx={{ flex: 1, overflowY: 'auto', p: { xs: 2, md: 4 } }}>
                        <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
                            <UnitRenderer unit={{ ...unit, content: unit.config }} />

                            {/* Bottom Mark Complete */}
                            {!isCurrentUnitCompleted && (
                                <Box sx={{ mt: 6, mb: 10, display: 'flex', justifyContent: 'center' }}>
                                    <Button
                                        variant="contained"
                                        color="success"
                                        size="large"
                                        startIcon={<CheckCircleIcon />}
                                        onClick={handleMarkComplete}
                                        sx={{
                                            textTransform: 'none',
                                            px: 6,
                                            py: 1.5,
                                            fontSize: '1.1rem',
                                            bgcolor: '#38a169',
                                            '&:hover': { bgcolor: '#2f855a' },
                                            borderRadius: 1
                                        }}
                                    >
                                        Mark as Complete
                                    </Button>
                                </Box>
                            )}
                            {isCurrentUnitCompleted && nextUnit && (
                                <Box sx={{ mt: 6, mb: 10, display: 'flex', justifyContent: 'center' }}>
                                    <Button
                                        variant="contained"
                                        size="large"
                                        endIcon={<NavigateNextIcon />}
                                        onClick={() => handleNavigate(nextUnit.id)}
                                        sx={{
                                            textTransform: 'none',
                                            px: 6,
                                            py: 1.5,
                                            fontSize: '1.1rem',
                                            bgcolor: '#3182ce',
                                            '&:hover': { bgcolor: '#2b6cb0' },
                                            borderRadius: 1
                                        }}
                                    >
                                        Continue to Next Unit
                                    </Button>
                                </Box>
                            )}
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}

export default function LearnerCoursePlayer() {
    return (
        <Suspense fallback={<CircularProgress />}>
            <CoursePlayerContent />
        </Suspense>
    );
}
