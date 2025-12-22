import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
    title: {
        default: 'Zedny LMS',
        template: '%s | Zedny LMS',
    },
    description: 'Cloud Learning Management System',
}

import ThemeRegistry from '@/components/ThemeRegistry/ThemeRegistry'

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body>
                <ThemeRegistry>
                    {children}
                </ThemeRegistry>
            </body>
        </html>
    )
}
