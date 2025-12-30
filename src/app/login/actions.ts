'use server'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { setSession, verifyPassword, LOCK_CONFIG, RoleKey, SessionPayload } from '@/lib/auth'
import { redirect } from 'next/navigation'

const loginSchema = z.object({
    username: z.string().min(1, 'Username or email is required'),
    password: z.string().min(1, 'Password is required'),
})

export async function authenticate(prevState: any, formData: FormData) {
    const data = Object.fromEntries(formData)
    const result = loginSchema.safeParse(data)

    if (!result.success) {
        return { error: 'Invalid input' }
    }

    const { username, password } = result.data

    try {
        // Find user by username or email
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { username: username },
                    { email: username.toLowerCase() },
                ],
            },
            include: { roles: true },
        })

        if (!user || !user.passwordHash) {
            return { error: 'Invalid credentials' }
        }

        // Check if account is locked
        if (user.status === 'LOCKED' || (user.lockedUntil && new Date(user.lockedUntil) > new Date())) {
            const lockedUntil = user.lockedUntil ? new Date(user.lockedUntil).toLocaleTimeString() : 'later';
            return { error: `Account locked. Try again at ${lockedUntil}` }
        }

        // Check if user is inactive
        if (user.status === 'INACTIVE' || user.status === 'DEACTIVATED') {
            return { error: 'Account is deactivated. Contact administrator.' }
        }

        // Verify password
        const passwordValid = await verifyPassword(password, user.passwordHash)

        if (!passwordValid) {
            // Increment failed attempts
            const newAttempts = user.failedLoginAttempts + 1;
            const shouldLock = newAttempts >= LOCK_CONFIG.maxAttempts;

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    failedLoginAttempts: newAttempts,
                    ...(shouldLock && {
                        lockedUntil: new Date(Date.now() + LOCK_CONFIG.lockDurationMs),
                    }),
                },
            });

            if (shouldLock) {
                return { error: 'Too many failed attempts. Account locked for 5 minutes.' }
            }

            return { error: 'Invalid credentials' }
        }

        // Success - reset failed attempts and update last login
        await prisma.user.update({
            where: { id: user.id },
            data: {
                failedLoginAttempts: 0,
                lockedUntil: null,
                lastLoginAt: new Date(),
            },
        });

        // Get user roles
        const roles = user.roles.map((r: { roleKey: string }) => r.roleKey as RoleKey);

        // If no roles assigned, default to LEARNER
        if (roles.length === 0) {
            roles.push('LEARNER');
        }

        // Determine active role
        const activeRole = (user.activeRole as RoleKey) || roles[0];

        // Create session with full user info and roles
        const sessionPayload: SessionPayload = {
            userId: user.id,
            email: user.email,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            roles,
            activeRole,
        };

        await setSession(sessionPayload);

        // Log timeline event
        await prisma.timelineEvent.create({
            data: {
                userId: user.id,
                eventType: 'USER_LOGIN',
                details: { email: user.email, role: activeRole },
            },
        });

        // Redirect based on role
        let redirectPath = '/learner';
        if (activeRole === 'ADMIN') {
            redirectPath = '/admin';
        } else if (activeRole === 'SUPER_INSTRUCTOR') {
            redirectPath = '/super-instructor';
        } else if (activeRole === 'INSTRUCTOR') {
            redirectPath = '/instructor';
        }

        // Use redirect (throws, so nothing after this runs)
        redirect(redirectPath);

    } catch (error) {
        // Check if it's a redirect (Next.js throws for redirect)
        if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
            throw error;
        }
        console.error('Login error:', error)
        return { error: 'Something went wrong.' }
    }
}
