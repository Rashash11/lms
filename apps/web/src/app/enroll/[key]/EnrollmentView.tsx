'use client';

import React from 'react';
import {
    Box,
    Container,
    Typography,
    Paper,
    Avatar,
    Chip
} from "@mui/material";
import SchoolIcon from "@mui/icons-material/School";
import EnrollmentForm from "./EnrollmentForm";

interface EnrollmentViewProps {
    course: {
        id: string;
        title: string;
        subtitle: string | null;
    };
    enrollmentKey: string;
}

export default function EnrollmentView({ course, enrollmentKey }: EnrollmentViewProps) {
    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                p: 3
            }}
        >
            <Container maxWidth="sm">
                <Paper
                    elevation={0}
                    sx={{
                        p: 4,
                        borderRadius: 4,
                        textAlign: 'center',
                        backdropFilter: 'blur(10px)',
                        bgcolor: 'rgba(255, 255, 255, 0.9)',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                    }}
                >
                    <Avatar
                        sx={{
                            width: 80,
                            height: 80,
                            bgcolor: '#3182ce',
                            margin: '0 auto',
                            mb: 3,
                            boxShadow: '0 4px 12px rgba(49, 130, 206, 0.4)'
                        }}
                    >
                        <SchoolIcon sx={{ fontSize: 40 }} />
                    </Avatar>

                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#2d3748', mb: 1 }}>
                        Join this Course
                    </Typography>

                    <Typography variant="body1" sx={{ color: '#718096', mb: 3 }}>
                        You've been invited to enroll in:
                    </Typography>

                    <Box sx={{ mb: 4, p: 3, bgcolor: '#f7fafc', borderRadius: 3, border: '1px solid #edf2f7' }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#2d3748', mb: 1 }}>
                            {course.title}
                        </Typography>
                        {course.subtitle && (
                            <Typography variant="body2" sx={{ color: '#4a5568' }}>
                                {course.subtitle}
                            </Typography>
                        )}
                        <Box sx={{ mt: 2 }}>
                            <Chip label="Self Enrollment" size="small" sx={{ fontWeight: 600, bgcolor: '#ebf8ff', color: '#3182ce' }} />
                        </Box>
                    </Box>

                    <EnrollmentForm enrollmentKey={enrollmentKey} courseId={course.id} />
                </Paper>
            </Container>
        </Box>
    );
}
