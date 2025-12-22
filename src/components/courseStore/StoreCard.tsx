'use client';

import React from 'react';
import { Box, Typography, IconButton, Chip, styled } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

interface StoreCardProps {
    id: string;
    title: string;
    code: string;
    price: string;
    imageUrl: string;
    onAdd?: (id: string) => void;
}

const CardContainer = styled(Box)({
    width: '260px',
    borderRadius: '12px',
    backgroundColor: '#FFFFFF',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    overflow: 'hidden',
    flexShrink: 0,
    transition: 'box-shadow 0.2s ease',
    '&:hover': {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
    },
});

const ImageContainer = styled(Box)({
    position: 'relative',
    height: '150px',
    width: '100%',
    overflow: 'hidden',
});

const CourseImage = styled('img')({
    width: '100%',
    height: '100%',
    objectFit: 'cover',
});

const PricePill = styled(Chip)({
    position: 'absolute',
    top: '12px',
    right: '12px',
    backgroundColor: '#D9ECFF',
    color: '#111827',
    fontSize: '14px',
    fontWeight: 600,
    height: '28px',
    borderRadius: '14px',
    '& .MuiChip-label': {
        padding: '0 12px',
    },
});

const AddButton = styled(IconButton)({
    position: 'absolute',
    bottom: '12px',
    right: '12px',
    width: '44px',
    height: '44px',
    backgroundColor: '#1E6FE6',
    color: '#FFFFFF',
    '&:hover': {
        backgroundColor: '#155DCC',
    },
    boxShadow: '0 2px 8px rgba(30, 111, 230, 0.3)',
});

const ContentArea = styled(Box)({
    padding: '16px',
});

const Title = styled(Typography)({
    fontSize: '16px',
    fontWeight: 600,
    color: '#111827',
    lineHeight: '1.4',
    marginBottom: '8px',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    minHeight: '44.8px', // 2 lines minimum height
});

const Code = styled(Typography)({
    fontSize: '12px',
    color: '#6B7280',
    fontWeight: 400,
});

export default function StoreCard({ id, title, code, price, imageUrl, onAdd }: StoreCardProps) {
    const handleAddClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onAdd?.(id);
    };

    return (
        <CardContainer>
            <ImageContainer>
                <CourseImage src={imageUrl} alt={title} />
                <PricePill label={price} />
                <AddButton onClick={handleAddClick} size="small">
                    <AddIcon />
                </AddButton>
            </ImageContainer>
            <ContentArea>
                <Title>{title}</Title>
                <Code>{code}</Code>
            </ContentArea>
        </CardContainer>
    );
}
