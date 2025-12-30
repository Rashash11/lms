'use client';

import { Box } from '@mui/material';

export default function EditLayout({ children }: { children: React.ReactNode }) {
    return (
        <Box
            sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                overflow: 'auto',
                bgcolor: 'hsl(var(--background))',
                zIndex: 1300,
                color: 'hsl(var(--foreground))',
                '&::before, &::after': {
                    content: '""',
                    position: 'fixed',
                    width: '40vw',
                    height: '40vw',
                    borderRadius: '50%',
                    filter: 'blur(100px)',
                    zIndex: -1,
                    opacity: 0.15,
                    pointerEvents: 'none',
                },
                '&::before': {
                    top: '-10vw',
                    right: '-10vw',
                    background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)',
                },
                '&::after': {
                    bottom: '-10vw',
                    left: '-10vw',
                    background: 'radial-gradient(circle, hsl(var(--secondary)) 0%, transparent 70%)',
                }
            }}
        >
            {children}
        </Box>
    );
}
