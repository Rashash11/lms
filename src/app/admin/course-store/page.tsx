'use client';

import React, { useState } from 'react';
import { Box, Typography, Snackbar, Alert, styled } from '@mui/material';
import LogoMarquee from '@/components/courseStore/LogoMarquee';
import StoreSection from '@/components/courseStore/StoreSection';
import { marqueeLogos, sections } from '@/lib/courseStore/mock';

const PageContainer = styled(Box)({
    maxWidth: '1200px',
    margin: '0 auto',
    paddingTop: '24px',
    paddingBottom: '48px',
});

const PageTitle = styled(Typography)({
    fontSize: '28px',
    fontWeight: 700,
    letterSpacing: '-0.2px',
    color: '#111827',
    textAlign: 'center',
    marginBottom: '12px',
});

const IntroText = styled(Typography)({
    fontSize: '16px',
    color: '#374151',
    textAlign: 'center',
    marginBottom: '24px',
    lineHeight: '1.6',
});

export default function CourseStorePage() {
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [addedCourse, setAddedCourse] = useState('');

    const handleAddCourse = (courseId: string) => {
        setAddedCourse(courseId);
        setSnackbarOpen(true);
    };

    const handleCloseSnackbar = () => {
        setSnackbarOpen(false);
    };

    return (
        <PageContainer>
            <PageTitle>Course store</PageTitle>
            <IntroText>
                Find the right courses for every learning need. From soft skills to compliance and beyond, we have got you covered.
            </IntroText>

            <LogoMarquee />

            {sections.map((section) => (
                <StoreSection
                    key={section.id}
                    title={section.title}
                    chips={section.chips}
                    description={section.description}
                    viewAllUrl={section.viewAllUrl}
                    courses={section.courses}
                    onAddCourse={handleAddCourse}
                />
            ))}

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={3000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
                    Course added to your selection!
                </Alert>
            </Snackbar>
        </PageContainer>
    );
}
