'use client';

import * as React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import NextAppDirEmotionCacheProvider from './EmotionCache';
import theme from './theme';

// Run suppression logic immediately when module is loaded on client
if (typeof window !== 'undefined') {
    const originalConsoleError = console.error;
    
    // Helper to detect aborted/RSC errors
    const isAbortedError = (arg: any) => {
         if (!arg) return false;
         
         // String check
         if (typeof arg === 'string') {
             return arg.includes('net::ERR_ABORTED') || 
                    arg.includes('Failed to fetch RSC payload') ||
                    arg.includes('The user aborted a request') ||
                    arg.includes('Connection closed') ||
                    arg.includes('network error');
         }
         
         // Object check
         if (typeof arg === 'object') {
             const msg = arg.message || '';
             const stack = arg.stack || '';
             const name = arg.name || '';
             
             return msg.includes('net::ERR_ABORTED') || 
                    msg.includes('Failed to fetch RSC payload') ||
                    msg.includes('The user aborted a request') ||
                    name.includes('AbortError') ||
                    stack.includes('fetch-server-response') ||
                    stack.includes('layout-router') ||
                    stack.includes('prefetch-cache-utils') ||
                    stack.includes('react-dom.development.js') ||
                    stack.includes('app-router.js');
         }
         return false;
    };

    // Prevent double-patching
    if (!(console.error as any).__isPatched) {
        console.error = (...args) => {
            // Aggressive suppression of net::ERR_ABORTED and RSC errors
            if (args.some(isAbortedError)) {
                return;
            }
            
            // Also check for digest errors which Next.js uses
            const firstArg = args[0];
            if (typeof firstArg === 'string' && firstArg.includes('digest:')) {
                 // Check if it's related to known benign digests if we had them
            }

            originalConsoleError.apply(console, args);
        };
        (console.error as any).__isPatched = true;
    }
    
    // Add global event listeners for unhandled rejections if not already added
    // Note: We can't easily check if listeners are added, but adding duplicates isn't fatal for this
    // We'll stick to just console.error patching here as it's the main output channel for these
}

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
    React.useEffect(() => {
        // Event listeners for unhandled rejections/errors
        const isAbortedError = (arg: any) => {
             if (!arg) return false;
             
             // Convert arg to string to catch any hidden message properties
             const str = typeof arg === 'string' ? arg : 
                       (arg.message || (typeof arg.toString === 'function' ? arg.toString() : '') || '');

             if (str.includes('net::ERR_ABORTED') || 
                 str.includes('Failed to fetch RSC payload') ||
                 str.includes('The user aborted a request') ||
                 str.includes('Connection closed') ||
                 str.includes('network error') ||
                 str.includes('_rsc=')) {
                 return true;
             }

             if (typeof arg === 'object') {
                 const stack = arg.stack || '';
                 const name = arg.name || '';
                 const digest = arg.digest || '';
                 return name.includes('AbortError') ||
                        stack.includes('fetch-server-response') ||
                        stack.includes('layout-router') ||
                        stack.includes('prefetch-cache-utils') ||
                        digest.includes('ERR_ABORTED');
             }
             return false;
        };

        const onUnhandledRejection = (event: PromiseRejectionEvent) => {
            const reason: any = event.reason;
            if (isAbortedError(reason)) {
                event.preventDefault();
            }
        };

        const onError = (event: ErrorEvent) => {
             if (isAbortedError(event.message) || isAbortedError(event.error)) {
                 event.preventDefault();
             }
        };

        window.addEventListener('unhandledrejection', onUnhandledRejection);
        window.addEventListener('error', onError);

        return () => {
            window.removeEventListener('unhandledrejection', onUnhandledRejection);
            window.removeEventListener('error', onError);
        };
    }, []);

    return (
        <NextAppDirEmotionCacheProvider options={{ key: 'mui' }}>
            <ThemeProvider theme={theme}>
                {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
                <CssBaseline />
                {children}
            </ThemeProvider>
        </NextAppDirEmotionCacheProvider>
    );
}
