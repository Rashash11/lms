'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Box, IconButton, styled } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import StoreCard from './StoreCard';
import type { Course } from '@modules/courses/store/mock';

interface StoreCarouselProps {
    courses: Course[];
    onAddCourse?: (id: string) => void;
}

const CarouselContainer = styled(Box)({
    position: 'relative',
    width: '100%',
});

const ArrowButton = styled(IconButton)({
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '44px',
    height: '44px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#D1D5DB',
    zIndex: 2,
    '&:hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    '&.Mui-disabled': {
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        color: 'rgba(255, 255, 255, 0.1)',
        borderColor: 'transparent',
    },
    borderRadius: '12px',
});

const LeftArrow = styled(ArrowButton)({
    left: '-56px',
});

const RightArrow = styled(ArrowButton)({
    right: '-56px',
});

const ScrollContainer = styled(Box)({
    display: 'flex',
    gap: '24px',
    overflowX: 'auto',
    scrollBehavior: 'smooth',
    scrollbarWidth: 'none',
    '&::-webkit-scrollbar': {
        display: 'none',
    },
    paddingBottom: '4px',
});

export default function StoreCarousel({ courses, onAddCourse }: StoreCarouselProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
        }
    };

    useEffect(() => {
        checkScroll();
        const scrollElement = scrollRef.current;
        if (scrollElement) {
            scrollElement.addEventListener('scroll', checkScroll);
            return () => scrollElement.removeEventListener('scroll', checkScroll);
        }
    }, [courses]);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const cardWidth = 260;
            const gap = 24;
            const scrollAmount = cardWidth + gap;
            const newScrollLeft = scrollRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
            scrollRef.current.scrollTo({
                left: newScrollLeft,
                behavior: 'smooth',
            });
        }
    };

    return (
        <CarouselContainer>
            <LeftArrow
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
            >
                <ChevronLeftIcon />
            </LeftArrow>
            <ScrollContainer ref={scrollRef}>
                {courses.map((course) => (
                    <StoreCard
                        key={course.id}
                        {...course}
                        onAdd={onAddCourse}
                    />
                ))}
            </ScrollContainer>
            <RightArrow
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
            >
                <ChevronRightIcon />
            </RightArrow>
        </CarouselContainer>
    );
}
