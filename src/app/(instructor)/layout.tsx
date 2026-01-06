'use client';

import React, { useState, useEffect } from 'react';
import {
    Box, Drawer, AppBar, Toolbar, Typography, List, ListItem, ListItemButton,
    ListItemIcon, ListItemText, IconButton, Avatar, Menu, MenuItem, Divider,
    TextField, InputAdornment, Radio, CircularProgress, Switch, Tooltip,
} from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import HomeIcon from '@mui/icons-material/Home';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import RouteIcon from '@mui/icons-material/Route';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import GradingOutlinedIcon from '@mui/icons-material/GradingOutlined';
import VideocamOutlinedIcon from '@mui/icons-material/VideocamOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import EmojiObjectsOutlinedIcon from '@mui/icons-material/EmojiObjectsOutlined';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LogoutIcon from '@mui/icons-material/Logout';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { usePermissions } from '@/hooks/usePermissions';

// NCOSH Design System Unified Palette
const drawerWidth = 260;

const menuItems = [
    { text: 'Home', icon: <HomeIcon />, path: '/instructor' },
    { text: 'Courses', icon: <MenuBookOutlinedIcon />, path: '/instructor/courses', permission: 'course:read' },
    { text: 'Learning paths', icon: <RouteIcon />, path: '/instructor/learning-paths', permission: 'learning_path:read' },
    { text: 'Groups', icon: <GroupsOutlinedIcon />, path: '/instructor/groups' },
    { text: 'Grading Hub', icon: <GradingOutlinedIcon />, path: '/instructor/grading-hub', permission: 'submission:read' },
    { text: 'Conferences', icon: <VideocamOutlinedIcon />, path: '/instructor/conferences', permission: 'conference:read' },
    { text: 'Reports', icon: <AssessmentOutlinedIcon />, path: '/instructor/reports', permission: 'reports:read' },
    { text: 'Assignments', icon: <AssignmentOutlinedIcon />, path: '/instructor/assignments', permission: 'assignment:read' },
    { text: 'Calendar', icon: <CalendarTodayOutlinedIcon />, path: '/instructor/calendar', permission: 'calendar:read' },
    { text: 'Skills', icon: <EmojiObjectsOutlinedIcon />, path: '/instructor/skills', permission: 'skills:read' },
];

type RoleKey = 'ADMIN' | 'INSTRUCTOR' | 'LEARNER' | 'SUPER_INSTRUCTOR';
const roleLabels: Record<string, string> = {
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
    roles: string[];
    activeRole: string;
    avatar?: string;
}

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [user, setUser] = useState<UserData | null>(null);
    const [switching, setSwitching] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { can, loading: permissionsLoading } = usePermissions();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch('/api/me');
                if (res.ok) {
                    const data = await res.json();
                    setUser(data.user);
                }
            } catch (error) {
                console.error('Error fetching user:', error);
            }
        };
        fetchUser();
    }, []);

    const handleRoleChange = async (role: string) => {
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

    const drawerColors = {
        bg: 'rgba(13, 20, 20, 0.4)',
        active: 'rgba(26, 84, 85, 0.15)',
        hover: 'rgba(141, 166, 166, 0.08)',
        text: 'hsl(180 10% 95%)',
        muted: 'hsl(180 10% 60%)',
        icon: 'hsl(180.6 65.6% 60%)',
        border: 'rgba(141, 166, 166, 0.1)',
    };

    const drawer = (
        <Box sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: drawerColors.bg,
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderRight: `1px solid ${drawerColors.border}`
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
                {menuItems.filter(item => !item.permission || can(item.permission)).map((item) => {
                    const isSelected = pathname === item.path || (item.path === '/instructor' && pathname === '/instructor');
                    return (
                        <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                            <ListItemButton
                                component={Link}
                                href={item.path}
                                prefetch={true}
                                selected={isSelected}
                                onClick={() => setMobileOpen(false)}
                                sx={{
                                    height: 42,
                                    px: 1.5,
                                    borderRadius: '10px',
                                    color: isSelected ? drawerColors.text : drawerColors.muted,
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    '&.Mui-selected': {
                                        bgcolor: drawerColors.active,
                                        boxShadow: 'inset 0 0 0 1px rgba(26, 84, 85, 0.2)',
                                        '&:hover': { bgcolor: drawerColors.active },
                                        '& .MuiListItemIcon-root': { color: drawerColors.icon }
                                    },
                                    '&:hover': {
                                        bgcolor: drawerColors.hover,
                                        transform: 'translateX(4px)'
                                    },
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 32, color: isSelected ? drawerColors.icon : drawerColors.muted }}>
                                    {React.cloneElement(item.icon as React.ReactElement, { sx: { fontSize: 20 } })}
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.text}
                                    primaryTypographyProps={{ fontSize: 13, fontWeight: isSelected ? 600 : 500 }}
                                />
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>

            {/* Demo mode toggle at bottom */}
            <Box sx={{ p: 1.5, borderTop: `1px solid ${drawerColors.border}`, mt: 'auto' }}>
                <Box sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5,
                    p: 1, borderRadius: 2,
                    '&:hover': { bgcolor: drawerColors.hover }
                }}>
                    <Switch
                        size="small"
                        sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: drawerColors.icon },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: 'rgba(26, 84, 85, 0.5)' }
                        }}
                    />
                    <Typography sx={{ color: drawerColors.text, fontSize: 13, flex: 1, fontWeight: 500 }}>Demo mode</Typography>
                    <Tooltip title="Switch to learner view">
                        <InfoOutlinedIcon sx={{ color: drawerColors.muted, fontSize: 16, cursor: 'pointer' }} />
                    </Tooltip>
                </Box>
            </Box>

            {/* Help Center at very bottom */}
            <Box sx={{ p: 1.5, borderTop: `1px solid ${drawerColors.border}` }}>
                <Box sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5,
                    cursor: 'pointer', p: 1,
                    '&:hover': { bgcolor: drawerColors.hover, borderRadius: 2 }
                }}>
                    <HelpOutlineIcon sx={{ color: drawerColors.icon, fontSize: 18 }} />
                    <Typography sx={{ color: drawerColors.text, fontSize: 13, fontWeight: 500 }}>Help Center</Typography>
                    <Box sx={{ ml: 'auto' }}>
                        <KeyboardArrowDownIcon sx={{ color: drawerColors.muted, fontSize: 16, transform: 'rotate(-90deg)' }} />
                    </Box>
                </Box>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', bgcolor: 'hsl(var(--background))', minHeight: '100vh' }}>
            <AppBar
                position="fixed"
                sx={{
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    ml: { sm: `${drawerWidth}px` },
                    bgcolor: 'rgba(8, 12, 12, 0.8)',
                    color: 'hsl(var(--foreground))',
                    borderBottom: `1px solid ${drawerColors.border}`,
                    boxShadow: 'none',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                }}
            >
                <Toolbar sx={{ px: 3, gap: 2, minHeight: '64px !important', height: 64 }}>
                    <IconButton edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={{ display: { sm: 'none' }, color: drawerColors.icon }}>
                        <MenuIcon />
                    </IconButton>

                    <IconButton sx={{ display: { xs: 'none', sm: 'flex' }, color: drawerColors.icon, p: 0.5 }}>
                        <MenuIcon sx={{ fontSize: 22 }} />
                    </IconButton>

                    <Box sx={{ flexGrow: 1 }} />

                    <TextField
                        placeholder="Search..."
                        size="small"
                        sx={{
                            width: '100%', maxWidth: 400,
                            '& .MuiOutlinedInput-root': {
                                bgcolor: 'rgba(141, 166, 166, 0.05)',
                                height: 40,
                                borderRadius: 20,
                                border: `1px solid ${drawerColors.border}`,
                                '& fieldset': { border: 'none' },
                                '&:hover': { bgcolor: 'rgba(141, 166, 166, 0.08)', borderColor: 'rgba(26, 84, 85, 0.3)' },
                            }
                        }}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: drawerColors.icon, fontSize: 20 }} /></InputAdornment>
                        }}
                    />

                    <Box sx={{ flexGrow: 1 }} />

                    <IconButton size="small" sx={{ color: drawerColors.muted }}><MailOutlineIcon sx={{ fontSize: 22 }} /></IconButton>
                    <IconButton size="small" sx={{ color: drawerColors.muted }}><ChatBubbleOutlineIcon sx={{ fontSize: 22 }} /></IconButton>

                    <Box
                        onClick={(e) => setAnchorEl(e.currentTarget)}
                        sx={{
                            display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer',
                            bgcolor: 'rgba(26, 84, 85, 0.1)', border: `1px solid ${drawerColors.border}`, borderRadius: 20,
                            px: 1, py: 0.5, height: 40,
                            transition: 'all 0.2s',
                            '&:hover': { bgcolor: 'rgba(26, 84, 85, 0.15)', borderColor: 'rgba(26, 84, 85, 0.3)' }
                        }}
                    >
                        <Avatar sx={{ width: 30, height: 30, bgcolor: 'hsl(var(--primary))', fontSize: 13, fontWeight: 700 }}>
                            {user?.firstName ? user.firstName[0] : 'I'}
                        </Avatar>
                        <Box sx={{ display: { xs: 'none', md: 'block' }, mx: 0.5 }}>
                            <Typography variant="body2" fontWeight={700} fontSize={13} color={drawerColors.text}>
                                {user ? `${user.firstName} ${user.lastName}` : 'Instructor'}
                            </Typography>
                        </Box>
                        <KeyboardArrowDownIcon sx={{ color: drawerColors.muted, fontSize: 16 }} />
                    </Box>

                    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)} PaperProps={{
                        sx: {
                            width: 240,
                            mt: 1.5,
                            bgcolor: 'rgba(13, 20, 20, 0.9)',
                            backdropFilter: 'blur(20px)',
                            border: `1px solid ${drawerColors.border}`,
                            borderRadius: 3,
                            boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                        }
                    }}>
                        <Box sx={{ px: 2, py: 1.5 }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ letterSpacing: '0.05em', textTransform: 'uppercase' }}>Switch role</Typography>
                        </Box>
                        {user?.roles?.map((roleKey) => (
                            <MenuItem key={roleKey} onClick={() => handleRoleChange(roleKey)} sx={{ py: 1, mx: 1, borderRadius: 1.5 }}>
                                <Radio checked={user.activeRole === roleKey} size="small" sx={{ p: 0.5, mr: 1, color: drawerColors.icon, '&.Mui-checked': { color: drawerColors.icon } }} />
                                <Typography variant="body2" fontSize={13} fontWeight={500}>{roleLabels[roleKey] || roleKey}</Typography>
                                {switching && user.activeRole !== roleKey && <CircularProgress size={14} sx={{ ml: 'auto', color: drawerColors.icon }} />}
                            </MenuItem>
                        ))}
                        <Divider sx={{ my: 1, opacity: 0.5 }} />
                        <MenuItem sx={{ py: 1, mx: 1, borderRadius: 1.5 }}><PersonOutlineIcon sx={{ mr: 1.5, fontSize: 18, color: drawerColors.icon }} /><Typography variant="body2" fontSize={13}>My profile</Typography></MenuItem>
                        <MenuItem onClick={handleLogout} sx={{ py: 1, mx: 1, borderRadius: 1.5, color: 'hsl(0 72% 51%)' }}><LogoutIcon sx={{ mr: 1.5, fontSize: 18 }} /><Typography variant="body2" fontSize={13} fontWeight={600}>Log out</Typography></MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>

            <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
                <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)} sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { width: drawerWidth, border: 'none' } }}>
                    {drawer}
                </Drawer>
                <Drawer variant="permanent" sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box', border: 'none', background: 'transparent' } }} open>
                    {drawer}
                </Drawer>
            </Box>

            <Box component="main" sx={{
                flexGrow: 1,
                p: { xs: 2, sm: 3, md: 4 },
                width: { sm: `calc(100% - ${drawerWidth}px)` },
                mt: 8,
                position: 'relative'
            }}>
                {children}
            </Box>
        </Box>
    );
}
