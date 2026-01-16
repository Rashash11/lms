import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
    title: {
        default: 'Zedny LMS',
        template: '%s | Zedny LMS',
    },
    description: 'Cloud Learning Management System',
}

import ThemeRegistry from '@shared/theme/ThemeRegistry'

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" className="dark" suppressHydrationWarning>
            <head>
             </head>
            <body style={{ position: 'relative', overflowX: 'hidden' }}>
                {/* Global Background Glows */}
                <div style={{
                    position: 'fixed',
                    top: '-10%',
                    right: '-5%',
                    width: '40vw',
                    height: '40vw',
                    background: 'radial-gradient(circle, rgba(26, 84, 85, 0.15) 0%, transparent 70%)',
                    zIndex: -1,
                    pointerEvents: 'none',
                }} />
                <div style={{
                    position: 'fixed',
                    bottom: '-10%',
                    left: '-5%',
                    width: '50vw',
                    height: '50vw',
                    background: 'radial-gradient(circle, rgba(227, 131, 45, 0.08) 0%, transparent 70%)',
                    zIndex: -1,
                    pointerEvents: 'none',
                }} />

                <ThemeRegistry>
                    {children}
                </ThemeRegistry>
            </body>
        </html>
    )
}
