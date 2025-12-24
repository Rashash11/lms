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
import HistoryIcon from '@mui/icons-material/History';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import LogoutIcon from '@mui/icons-material/Logout';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

// TalentLMS Exact Color Palette
const SIDEBAR_BG = '#2560D8';  // TalentLMS blue (highly saturated)
const SIDEBAR_BG_DARK = '#1E4DB8';  // Slightly darker for separators/hover
const ACTIVE_BG = '#1F5FBF';  // Active pill / active row
const HOVER_BG = 'rgba(255,255,255,0.08)';
const TEXT_COLOR = '#FFFFFF';
const MUTED_TEXT = 'rgba(255,255,255,0.75)';
const ICON_COLOR = 'rgba(255,255,255,0.9)';
const DIVIDER = 'rgba(255,255,255,0.12)';
const LOGO_ORANGE = '#F58220';

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
    { text: 'Account & Settings', icon: <SettingsOutlinedIcon />, path: '/admin/settings', hasArrow: true },
    { text: 'Subscription', icon: <CreditCardOutlinedIcon />, path: '/admin/subscription' },
];

type RoleKey = 'ADMIN' | 'INSTRUCTOR' | 'LEARNER';
const roleLabels: Record<RoleKey, string> = {
    'ADMIN': 'Administrator',
    'INSTRUCTOR': 'Instructor',
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
    const [demoMode, setDemoMode] = useState(false);
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

    // Fetch current user on mount
    useEffect(() => {
        fetch('/api/me')
            .then(res => res.json())
            .then(data => {
                if (data.user) {
                    setUser(data.user);
                }
            })
            .catch(err => console.error('Failed to fetch user:', err));
    }, []);

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
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: SIDEBAR_BG }}>
            {/* Logo at top of sidebar */}
            <Box sx={{ height: 70, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Box sx={{ position: 'relative', width: 180, height: 50 }}>
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
                {menuItems.map((item) => {
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
                                    borderRadius: 2,
                                    color: isSelected ? TEXT_COLOR : MUTED_TEXT,
                                    '&.Mui-selected': {
                                        bgcolor: ACTIVE_BG,
                                        '&:hover': { bgcolor: ACTIVE_BG },
                                    },
                                    '&:hover': { bgcolor: HOVER_BG },
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 28, color: isSelected ? ICON_COLOR : MUTED_TEXT }}>
                                    {React.cloneElement(item.icon, { sx: { fontSize: 18 } })}
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.text}
                                    primaryTypographyProps={{ fontSize: 13, fontWeight: 500 }}
                                />
                                {item.hasBadge && (
                                    <Box sx={{
                                        width: 6, height: 6, borderRadius: '50%',
                                        bgcolor: '#ffa726', ml: 0.5
                                    }} />
                                )}
                                {item.hasArrow && <ChevronRightIcon sx={{ fontSize: 16, opacity: 0.6 }} />}
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
                }}>
                    <PlayCircleOutlineIcon sx={{ color: ICON_COLOR, fontSize: 18 }} />
                    <Typography sx={{ color: TEXT_COLOR, fontSize: 13, flex: 1 }}>Demo mode</Typography>
                    <InfoOutlinedIcon sx={{ color: MUTED_TEXT, fontSize: 16 }} />
                </Box>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', bgcolor: '#f5f7fa', minHeight: '100vh' }}>
            <AppBar
                position="fixed"
                sx={{
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    ml: { sm: `${drawerWidth}px` },
                    bgcolor: '#F8F9FA',
                    color: 'text.primary',
                    borderBottom: '1px solid #E0E3E7',
                    boxShadow: 'none',
                }}
            >
                <Toolbar sx={{ px: 3, gap: 2, minHeight: '56px !important', height: 56 }}>
                    <IconButton edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={{ display: { sm: 'none' } }}>
                        <MenuIcon />
                    </IconButton>

                    {/* Hamburger menu for desktop */}
                    <IconButton sx={{ display: { xs: 'none', sm: 'flex' }, color: '#3C4852', p: 0.5 }}>
                        <MenuIcon sx={{ fontSize: 22 }} />
                    </IconButton>

                    {/* Logo in header */}
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ position: 'relative', width: 140, height: 36 }}>
                            <Image
                                src="/main-logo (1).svg"
                                alt="Zedny Logo"
                                width={140}
                                height={36}
                                style={{ objectFit: 'contain' }}
                            />
                        </Box>
                    </Box>

                    {/* Search - TalentLMS pill style */}
                    <TextField
                        placeholder="Search"
                        size="small"
                        sx={{
                            flex: 1, maxWidth: 500, ml: 3,
                            '& .MuiOutlinedInput-root': {
                                bgcolor: '#FFFFFF',
                                height: 38,
                                borderRadius: 19,
                                border: '1px solid #DFE1E6',
                                '& fieldset': { border: 'none' },
                                '&:hover': { borderColor: '#C1C7D0' },
                            },
                            '& .MuiInputBase-input': { fontSize: 14, py: 0.8, color: '#42526E' }
                        }}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#6B778C', fontSize: 20 }} /></InputAdornment>
                        }}
                    />

                    <Box sx={{ flexGrow: 1 }} />



                    {/* Notifications */}
                    <IconButton size="small" sx={{ p: 1 }}>
                        <NotificationsOutlinedIcon sx={{ fontSize: 22, color: '#42526E' }} />
                    </IconButton>

                    {/* User Menu */}
                    <Box
                        onClick={(e) => setAnchorEl(e.currentTarget)}
                        sx={{
                            display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer',
                            bgcolor: '#FFFFFF', border: '1px solid #DFE1E6', borderRadius: 20,
                            px: 1.5, py: 0.5, height: 36,
                            '&:hover': { bgcolor: '#F4F5F7', borderColor: '#C1C7D0' }
                        }}
                    >
                        <Avatar sx={{ width: 28, height: 28, bgcolor: '#7c4dff', fontSize: 12 }}>
                            {user?.firstName?.[0]?.toUpperCase() || 'U'}
                        </Avatar>
                        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                            <Typography variant="body2" fontWeight={600} lineHeight={1.2} fontSize={13}>
                                {user ? `${user.firstName} ${user.lastName}` : 'Loading...'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" fontSize={11}>
                                {user?.activeRole ? roleLabels[user.activeRole] : 'User'}
                            </Typography>
                        </Box>
                        <KeyboardArrowDownIcon sx={{ color: '#8B98A5', fontSize: 16 }} />
                    </Box>

                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={() => setAnchorEl(null)}
                        PaperProps={{ sx: { width: 220, mt: 1 } }}
                    >
                        <Box sx={{ px: 2, py: 1 }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={500}>Switch role</Typography>
                        </Box>
                        {user?.roles?.map((roleKey) => (
                            <MenuItem
                                key={roleKey}
                                onClick={() => handleRoleChange(roleKey)}
                                sx={{ py: 0.5 }}
                                disabled={switching}
                            >
                                <Radio
                                    checked={user.activeRole === roleKey}
                                    size="small"
                                    sx={{ p: 0.5, mr: 1 }}
                                />
                                <Typography variant="body2" fontSize={13}>{roleLabels[roleKey]}</Typography>
                                {switching && user.activeRole !== roleKey && (
                                    <CircularProgress size={14} sx={{ ml: 'auto' }} />
                                )}
                            </MenuItem>
                        ))}
                        <Divider sx={{ my: 1 }} />
                        <MenuItem><PersonOutlineIcon sx={{ mr: 1.5, fontSize: 18 }} /><Typography variant="body2" fontSize={13}>My profile</Typography></MenuItem>
                        <MenuItem><HistoryIcon sx={{ mr: 1.5, fontSize: 18 }} /><Typography variant="body2" fontSize={13}>Go to legacy interface</Typography></MenuItem>
                        <MenuItem><OndemandVideoIcon sx={{ mr: 1.5, fontSize: 18 }} /><Typography variant="body2" fontSize={13}>Watch demo</Typography></MenuItem>
                        <Divider sx={{ my: 1 }} />
                        <MenuItem onClick={handleLogout}><LogoutIcon sx={{ mr: 1.5, fontSize: 18 }} /><Typography variant="body2" fontSize={13}>Log out</Typography></MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>

            {/* Sidebar */}
            <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={() => setMobileOpen(false)}
                    sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { width: drawerWidth, bgcolor: SIDEBAR_BG } }}
                >
                    {drawer}
                </Drawer>
                <Drawer
                    variant="permanent"
                    sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box', bgcolor: SIDEBAR_BG, border: 'none' } }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>

            {/* Main Content */}
            <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, sm: 3, md: 4 }, width: { sm: `calc(100% - ${drawerWidth}px)` }, mt: 7, maxWidth: '100%' }}>
                {children}
            </Box>
        </Box >
    );
}
