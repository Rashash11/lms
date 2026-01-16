'use client';

import React from 'react';
import { Box, Typography, styled } from '@mui/material';

const MarqueeContainer = styled(Box)({
    height: '100px',
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    marginBottom: '32px',
    '&:hover .marquee-track': {
        animationPlayState: 'paused',
    },
});

const MarqueeTrack = styled(Box)({
    display: 'flex',
    gap: '64px',
    alignItems: 'center',
    animation: 'scroll 15s linear infinite',
    paddingLeft: '32px',
    '@keyframes scroll': {
        '0%': {
            transform: 'translateX(0)',
        },
        '100%': {
            transform: 'translateX(-50%)',
        },
    },
});

const LogoItem = styled(Box)({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
});

const LogoImage = styled('img')({
    height: '48px',
    width: 'auto',
    objectFit: 'contain',
    transition: 'transform 0.3s ease',
    '&:hover': {
        transform: 'scale(1.1)',
    },
});

const CompanyName = styled(Typography)({
    fontSize: '14px',
    fontWeight: 600,
    color: '#9CA3AF',
    textTransform: 'lowercase',
});

// Zedny logos - alternating between dark and light versions
const zednyLogos = [
    { id: 1, src: '/logos/zedny-dark.png', name: 'zedny' },
    { id: 2, src: '/logos/zedny-light.png', name: 'zedny' },
    { id: 3, src: '/logos/zedny-dark.png', name: 'zedny' },
    { id: 4, src: '/logos/zedny-light.png', name: 'zedny' },
    { id: 5, src: '/logos/zedny-dark.png', name: 'zedny' },
    { id: 6, src: '/logos/zedny-light.png', name: 'zedny' },
];

export default function LogoMarquee() {
    // Duplicate logos array to create seamless loop
    const duplicatedLogos = [...zednyLogos, ...zednyLogos];

    return (
        <MarqueeContainer>
            <MarqueeTrack className="marquee-track">
                {duplicatedLogos.map((logo, index) => (
                    <LogoItem key={`${logo.id}-${index}`}>
                        <LogoImage
                            src={logo.src}
                            alt={logo.name}
                        />
                        <CompanyName>{logo.name}</CompanyName>
                    </LogoItem>
                ))}
            </MarqueeTrack>
        </MarqueeContainer>
    );
}
