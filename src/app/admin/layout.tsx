'use client';

import React, { useState, useEffect } from 'react';
import {
    Box, Drawer, AppBar, Toolbar, Typography, List, ListItem, ListItemButton,
    ListItemIcon, ListItemText, IconButton, Avatar, Menu, MenuItem, Divider,
    Chip, Badge, TextField, InputAdornment, Button, Radio, Switch, CircularProgress,
} from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import HomeIcon from '@mui/icons-material/Home';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import RouteIcon from '@mui/icons-material/Route';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import AutoFixHighOutlinedIcon from '@mui/icons-material/AutoFixHighOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import EmojiObjectsOutlinedIcon from '@mui/icons-material/EmojiObjectsOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import LogoutIcon from '@mui/icons-material/Logout';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

// NCOSH Design System Unified Palette
const SIDEBAR_BG = 'rgba(13, 20, 20, 0.4)';
const SIDEBAR_BG_SOLID = 'hsl(180 15% 8%)';
const ACTIVE_BG = 'rgba(26, 84, 85, 0.15)';
const HOVER_BG = 'rgba(141, 166, 166, 0.08)';
const TEXT_COLOR = 'hsl(180 10% 95%)';
const MUTED_TEXT = 'hsl(180 10% 60%)';
const ICON_COLOR = 'hsl(180.6 65.6% 60%)';
const DIVIDER = 'rgba(141, 166, 166, 0.1)';

const drawerWidth = 260;

const menuItems = [
    { text: 'Home', icon: <HomeIcon />, path: '/admin' },
    { text: 'Users', icon: <PeopleOutlineIcon />, path: '/admin/users' },
    { text: 'Courses', icon: <MenuBookOutlinedIcon />, path: '/admin/courses' },
    { text: 'Learning paths', icon: <RouteIcon />, path: '/admin/learning-paths' },
    { text: 'Course store', icon: <StorefrontOutlinedIcon />, path: '/admin/course-store', hasArrow: true, hasBadge: true },
    { text: 'Groups', icon: <GroupsOutlinedIcon />, path: '/admin/groups' },
    { text: 'Branches', icon: <AccountTreeOutlinedIcon />, path: '/admin/branches', hasBadge: true },
    { text: 'Automations', icon: <AutoFixHighOutlinedIcon />, path: '/admin/automations', hasBadge: true },
    { text: 'Notifications', icon: <NotificationsNoneOutlinedIcon />, path: '/admin/notifications' },
    { text: 'Reports', icon: <AssessmentOutlinedIcon />, path: '/admin/reports', hasArrow: true },
    { text: 'Skills', icon: <EmojiObjectsOutlinedIcon />, path: '/admin/skills', hasBadge: true },
    { text: 'Assignments', icon: <AssignmentOutlinedIcon />, path: '/admin/assignments' },
    { text: 'Account & Settings', icon: <SettingsOutlinedIcon />, path: '/admin/settings', hasArrow: true },
    { text: 'Subscription', icon: <CreditCardOutlinedIcon />, path: '/admin/subscription' },
];

type RoleKey = 'ADMIN' | 'INSTRUCTOR' | 'SUPER_INSTRUCTOR' | 'LEARNER';
const roleLabels: Record<RoleKey, string> = {
    'ADMIN': 'Administrator',
    'INSTRUCTOR': 'Instructor',
    'SUPER_INSTRUCTOR': 'Super instructor',
    'LEARNER': 'Learner'
};

interface UserData {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    roles: RoleKey[];
    activeRole: RoleKey;
    avatar?: string;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [user, setUser] = useState<UserData | null>(null);
    const [switching, setSwitching] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        const onUnhandledRejection = (event: PromiseRejectionEvent) => {
            const reason: any = event.reason;
            if (!reason || typeof reason !== 'object') return;

            const name = 'name' in reason ? reason.name : undefined;
            if (name !== 'AbortError') return;

            const stack = typeof reason.stack === 'string' ? reason.stack : '';
            if (stack.includes('fetch-server-response') || stack.includes('layout-router') || stack.includes('/_rsc=')) {
                event.preventDefault();
            }
        };

        const onError = (event: ErrorEvent) => {
            if (typeof event.message !== 'string') return;
            if (!event.message.includes('net::ERR_ABORTED')) return;

            const stack = typeof event.error?.stack === 'string' ? event.error.stack : '';
            if (stack.includes('fetch-server-response') || stack.includes('layout-router') || stack.includes('/_rsc=')) {
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

    // Fetch current user on mount and check route restrictions
    useEffect(() => {
        fetch('/api/me')
            .then(res => res.json())
            .then(data => {
                if (data.user) {
                    setUser(data.user);
                    // Route protection for Super Instructors
                    if (data.user.activeRole === 'SUPER_INSTRUCTOR') {
                        const restrictedPaths = ['/admin/settings', '/admin/subscription', '/admin/automations', '/admin/branches'];
                        if (restrictedPaths.some(path => pathname.startsWith(path))) {
                            router.replace('/admin/403');
                        }
                    }
                }
            })
            .catch(err => console.error('Failed to fetch user:', err));
    }, [pathname, router]);

    const handleRoleChange = async (role: RoleKey) => {
        if (switching || role === user?.activeRole) return;

        setSwitching(true);
        try {
            const res = await fetch('/api/me/switch-role', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role }),
            });

            const data = await res.json();

            if (data.success) {
                setUser(prev => prev ? { ...prev, activeRole: role } : null);
                setAnchorEl(null);
                router.push(data.redirectUrl);
            }
        } catch (err) {
            console.error('Failed to switch role:', err);
        } finally {
            setSwitching(false);
        }
    };

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    };

    const drawer = (
        <Box sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: SIDEBAR_BG,
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderRight: `1px solid ${DIVIDER}`
        }}>
            {/* Logo at top of sidebar */}
            <Box sx={{ height: 70, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Box sx={{ position: 'relative', width: 180, height: 50, filter: 'drop-shadow(0 0 8px rgba(26, 84, 85, 0.3))' }}>
                    <Image
                        src="/main-logo (1).svg"
                        alt="Zedny Logo"
                        width={180}
                        height={50}
                        style={{ objectFit: 'contain' }}
                    />
                </Box>
            </Box>

            <List sx={{ flex: 1, pt: 0, px: 1.5 }}>
                {menuItems.filter(item => {
                    if (user?.activeRole === 'SUPER_INSTRUCTOR') {
                        if (['Account & Settings', 'Subscription', 'Automations', 'Branches'].includes(item.text)) return false;
                    }
                    return true;
                }).map((item) => {
                    const isSelected = pathname === item.path || (item.path === '/admin' && pathname === '/admin');
                    return (
                        <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                            <ListItemButton
                                component={Link}
                                href={item.path}
                                prefetch={true}
                                selected={isSelected}
                                onClick={() => setMobileOpen(false)}
                                sx={{
                                    height: 40,
                                    px: 1.5,
                                    borderRadius: '10px',
                                    color: isSelected ? TEXT_COLOR : MUTED_TEXT,
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    '&.Mui-selected': {
                                        bgcolor: ACTIVE_BG,
                                        boxShadow: 'inset 0 0 0 1px rgba(26, 84, 85, 0.2)',
                                        '&:hover': { bgcolor: ACTIVE_BG },
                                        '& .MuiListItemIcon-root': { color: ICON_COLOR }
                                    },
                                    '&:hover': {
                                        bgcolor: HOVER_BG,
                                        transform: 'translateX(4px)'
                                    },
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 28, color: isSelected ? ICON_COLOR : MUTED_TEXT, transition: 'color 0.2s' }}>
                                    {React.cloneElement(item.icon, { sx: { fontSize: 18 } })}
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.text}
                                    primaryTypographyProps={{ fontSize: 13, fontWeight: isSelected ? 600 : 500, letterSpacing: '0.01em' }}
                                />
                                {item.hasBadge && (
                                    <Box sx={{
                                        width: 6, height: 6, borderRadius: '50%',
                                        bgcolor: 'hsl(var(--secondary))', ml: 0.5,
                                        boxShadow: '0 0 8px hsl(var(--secondary) / 0.5)'
                                    }} />
                                )}
                                {item.hasArrow && <ChevronRightIcon sx={{ fontSize: 16, opacity: 0.4 }} />}
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>

            {/* Demo mode toggle at bottom */}
            <Box sx={{ p: 1.5, borderTop: `1px solid ${DIVIDER}` }}>
                <Box sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5,
                    cursor: 'pointer',
                    p: 1, borderRadius: 2,
                    '&:hover': { bgcolor: HOVER_BG }
                }}>
                    <PlayCircleOutlineIcon sx={{ color: ICON_COLOR, fontSize: 18 }} />
                    <Typography sx={{ color: TEXT_COLOR, fontSize: 13, flex: 1, fontWeight: 500 }}>Demo mode</Typography>
                    <InfoOutlinedIcon sx={{ color: MUTED_TEXT, fontSize: 16 }} />
                </Box>
            </Box>
        </Box>
    );

    if (pathname?.startsWith('/admin/courses/new/edit')) {
        return <>{children}</>;
    }

    return (
        <Box sx={{ display: 'flex', bgcolor: 'hsl(var(--background))', minHeight: '100vh' }}>
            <AppBar
                position="fixed"
                sx={{
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    ml: { sm: `${drawerWidth}px` },
                    bgcolor: 'rgba(8, 12, 12, 0.8)',
                    color: 'hsl(var(--foreground))',
                    borderBottom: `1px solid ${DIVIDER}`,
                    boxShadow: 'none',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                }}
            >
                <Toolbar sx={{ px: 3, gap: 2, minHeight: '64px !important', height: 64 }}>
                    <IconButton edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={{ display: { sm: 'none' }, color: ICON_COLOR }}>
                        <MenuIcon />
                    </IconButton>

                    <IconButton sx={{ display: { xs: 'none', sm: 'flex' }, color: ICON_COLOR, p: 0.5 }}>
                        <MenuIcon sx={{ fontSize: 22 }} />
                    </IconButton>

                    <Box sx={{ flexGrow: 1 }} />

                    {/* Search - Glass pill style */}
                    <TextField
                        placeholder="Search anything..."
                        size="small"
                        sx={{
                            width: '100%', maxWidth: 400,
                            '& .MuiOutlinedInput-root': {
                                bgcolor: 'rgba(141, 166, 166, 0.05)',
                                height: 40,
                                borderRadius: 20,
                                transition: 'all 0.2s',
                                border: `1px solid ${DIVIDER}`,
                                '& fieldset': { border: 'none' },
                                '&:hover': { bgcolor: 'rgba(141, 166, 166, 0.08)', borderColor: 'rgba(26, 84, 85, 0.3)' },
                                '&.Mui-focused': { bgcolor: 'rgba(141, 166, 166, 0.1)', borderColor: 'rgba(26, 84, 85, 0.5)', boxShadow: '0 0 0 4px rgba(26, 84, 85, 0.1)' }
                            },
                        }}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: ICON_COLOR, fontSize: 20 }} /></InputAdornment>
                        }}
                    />

                    <Box sx={{ flexGrow: 1 }} />

                    <IconButton size="small" sx={{ color: MUTED_TEXT, '&:hover': { color: ICON_COLOR } }}>
                        <NotificationsOutlinedIcon sx={{ fontSize: 22 }} />
                    </IconButton>

                    {/* User Menu - Glass style */}
                    <Box
                        onClick={(e) => setAnchorEl(e.currentTarget)}
                        sx={{
                            display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer',
                            bgcolor: 'rgba(26, 84, 85, 0.1)', border: `1px solid ${DIVIDER}`, borderRadius: 20,
                            px: 1, py: 0.5, height: 40,
                            transition: 'all 0.2s',
                            '&:hover': { bgcolor: 'rgba(26, 84, 85, 0.15)', borderColor: 'rgba(26, 84, 85, 0.3)' }
                        }}
                    >
                        <Avatar sx={{ width: 30, height: 30, bgcolor: 'hsl(var(--primary))', fontSize: 13, fontWeight: 700, boxShadow: '0 0 10px rgba(26, 84, 85, 0.4)' }}>
                            {user?.firstName?.[0]?.toUpperCase() || 'A'}
                        </Avatar>
                        <Box sx={{ display: { xs: 'none', lg: 'block' }, mx: 0.5 }}>
                            <Typography variant="body2" fontWeight={700} fontSize={13} color={TEXT_COLOR}>
                                {user ? `${user.firstName} ${user.lastName}` : 'Admin'}
                            </Typography>
                        </Box>
                        <KeyboardArrowDownIcon sx={{ color: MUTED_TEXT, fontSize: 16 }} />
                    </Box>

                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={() => setAnchorEl(null)}
                        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                        PaperProps={{
                            sx: {
                                width: 240,
                                mt: 1.5,
                                bgcolor: 'rgba(13, 20, 20, 0.9)',
                                backdropFilter: 'blur(20px)',
                                border: `1px solid ${DIVIDER}`,
                                borderRadius: 3,
                                boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                            }
                        }}
                    >
                        {/* ... menu items (style them slightly better if needed) */}
                        <Box sx={{ px: 2, py: 1.5 }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ letterSpacing: '0.05em', textTransform: 'uppercase' }}>Switch role</Typography>
                        </Box>
                        {user?.roles?.map((roleKey) => (
                            <MenuItem
                                key={roleKey}
                                onClick={() => handleRoleChange(roleKey)}
                                sx={{ py: 1, mx: 1, borderRadius: 1.5 }}
                                disabled={switching}
                            >
                                <Radio checked={user.activeRole === roleKey} size="small" sx={{ p: 0.5, mr: 1, color: ICON_COLOR, '&.Mui-checked': { color: ICON_COLOR } }} />
                                <Typography variant="body2" fontSize={13} fontWeight={500}>{roleLabels[roleKey]}</Typography>
                                {switching && user.activeRole !== roleKey && <CircularProgress size={14} sx={{ ml: 'auto', color: ICON_COLOR }} />}
                            </MenuItem>
                        ))}
                        <Divider sx={{ my: 1, opacity: 0.5 }} />
                        <MenuItem sx={{ py: 1, mx: 1, borderRadius: 1.5 }}><PersonOutlineIcon sx={{ mr: 1.5, fontSize: 18, color: ICON_COLOR }} /><Typography variant="body2" fontSize={13}>My profile</Typography></MenuItem>
                        <MenuItem onClick={handleLogout} sx={{ py: 1, mx: 1, borderRadius: 1.5, color: 'hsl(0 72% 51%)' }}><LogoutIcon sx={{ mr: 1.5, fontSize: 18 }} /><Typography variant="body2" fontSize={13} fontWeight={600}>Log out</Typography></MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>

            {/* Sidebar Container */}
            <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={() => setMobileOpen(false)}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': { width: drawerWidth, border: 'none' }
                    }}
                >
                    {drawer}
                </Drawer>
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', sm: 'block' },
                        '& .MuiDrawer-paper': {
                            width: drawerWidth,
                            boxSizing: 'border-box',
                            border: 'none',
                            background: 'transparent'
                        }
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>

            {/* Main Content */}
            <Box component="main" sx={{
                flexGrow: 1,
                p: { xs: 2, sm: 3, md: 4 },
                width: { sm: `calc(100% - ${drawerWidth}px)` },
                mt: 8,
                maxWidth: '100%',
                position: 'relative'
            }}>
                {children}
            </Box>
        </Box >
    );
}
