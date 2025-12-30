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
                bgcolor: '#f5f5f5',
                zIndex: 1300, // Above the admin layout
            }}
        >
            {children}
        </Box>
    );
}
