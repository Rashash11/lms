'use client';

import React from 'react';
import { Box, Typography, Chip, Button, styled } from '@mui/material';
import Link from '@shared/ui/AppLink';
import StoreCarousel from './StoreCarousel';
import type { Course } from '@modules/courses/store/mock';

interface StoreSectionProps {
    title: string;
    chips: string[];
    description: string;
    viewAllUrl: string;
    courses: Course[];
    onAddCourse?: (id: string) => void;
}

const SectionContainer = styled(Box)({
    marginTop: '48px',
});

const SectionHeader = styled(Box)({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '8px',
});

const SectionTitle = styled(Typography)({
    fontSize: '22px',
    fontWeight: 700,
    color: '#FFFFFF',
    letterSpacing: '-0.2px',
});

// ViewAllButton styles are now moved to sx props in the component

const ChipsRow = styled(Box)({
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    marginTop: '8px',
});

const CategoryChip = styled(Chip)({
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    color: '#D1D5DB',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    height: '24px',
    borderRadius: '6px',
    letterSpacing: '0.5px',
    '& .MuiChip-label': {
        padding: '2px 8px',
    },
});

const Description = styled(Typography)({
    fontSize: '16px',
    color: '#9CA3AF',
    lineHeight: '1.6',
    marginTop: '10px',
    marginBottom: '18px',
    '& .link-text': {
        color: '#3B82F6',
        textDecoration: 'none',
        cursor: 'pointer',
        '&:hover': {
            textDecoration: 'underline',
        },
    },
});

export default function StoreSection({
    title,
    chips,
    description,
    viewAllUrl,
    courses,
    onAddCourse,
}: StoreSectionProps) {
    // Parse description to handle <link> tags
    const parseDescription = (text: string) => {
        const parts = text.split(/<link>|<\/link>/);
        return parts.map((part, index) => {
            if (index % 2 === 1) {
                // This is inside <link> tags
                return (
                    <span key={index} className="link-text">
                        {part}
                    </span>
                );
            }
            return part;
        });
    };

    return (
        <SectionContainer>
            <SectionHeader>
                <Box>
                    <SectionTitle>{title}</SectionTitle>
                    <ChipsRow>
                        {chips.map((chip, index) => (
                            <CategoryChip key={index} label={chip} />
                        ))}
                    </ChipsRow>
                </Box>
                <Button
                    variant="outlined"
                    component={Link}
                    href={viewAllUrl}
                    sx={{
                        height: '40px',
                        borderRadius: '10px',
                        padding: '0 16px',
                        borderColor: '#1E6FE6',
                        color: '#1E6FE6',
                        textTransform: 'none',
                        fontSize: '14px',
                        fontWeight: 600,
                        '&:hover': {
                            borderColor: '#155DCC',
                            backgroundColor: 'rgba(30, 111, 230, 0.04)',
                        },
                    }}
                >
                    View all
                </Button>
            </SectionHeader>
            <Description>{parseDescription(description)}</Description>
            <StoreCarousel courses={courses} onAddCourse={onAddCourse} />
        </SectionContainer>
    );
}
