'use client';

import React, { useState } from 'react';
import {
    Box, Drawer, AppBar, Toolbar, Typography, List, ListItem, ListItemButton,
    ListItemIcon, ListItemText, IconButton, Avatar, Menu, MenuItem, Divider,
    Chip, TextField, InputAdornment, Radio,
} from '@mui/material';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import HomeIcon from '@mui/icons-material/Home';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import ExploreOutlinedIcon from '@mui/icons-material/ExploreOutlined';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import CardMembershipOutlinedIcon from '@mui/icons-material/CardMembershipOutlined';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import LeaderboardOutlinedIcon from '@mui/icons-material/LeaderboardOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import MessageOutlinedIcon from '@mui/icons-material/MessageOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LogoutIcon from '@mui/icons-material/Logout';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

const drawerWidth = 260; // Standardize with admin

const menuItems = [
    { text: 'Home', icon: <HomeIcon />, path: '/learner' },
    { text: 'My courses', icon: <MenuBookOutlinedIcon />, path: '/learner/courses' },
    { text: 'Catalog', icon: <ExploreOutlinedIcon />, path: '/learner/catalog' },
    { text: 'ILT sessions', icon: <EventOutlinedIcon />, path: '/learner/ilt' },
    { text: 'Certificates', icon: <CardMembershipOutlinedIcon />, path: '/learner/certificates' },
    { text: 'Achievements', icon: <EmojiEventsOutlinedIcon />, path: '/learner/achievements', disabled: true },
    { text: 'Leaderboard', icon: <LeaderboardOutlinedIcon />, path: '/learner/leaderboard', disabled: true },
    { text: 'Assignments', icon: <AssignmentOutlinedIcon />, path: '/learner/assignments' },
    { text: 'Discussions', icon: <ForumOutlinedIcon />, path: '/learner/discussions' },
    { text: 'Messages', icon: <MessageOutlinedIcon />, path: '/learner/messages', disabled: true },
];

export default function LearnerLayout({ children }: { children: React.ReactNode }) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedRole, setSelectedRole] = useState('Learner');
    const [user, setUser] = useState<{ firstName: string; lastName: string; } | null>(null);
    const pathname = usePathname();
    const router = useRouter();

    React.useEffect(() => {
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


    const handleRoleChange = (role: string) => {
        setSelectedRole(role);
        setAnchorEl(null);
        if (role === 'Administrator') router.push('/admin');
        else if (role === 'Instructor') router.push('/instructor');
        else if (role === 'Learner') router.push('/learner');
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
                {menuItems.map((item) => {
                    const isSelected = pathname === item.path;
                    return (
                        <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                            <ListItemButton
                                selected={isSelected}
                                onClick={() => !item.disabled && router.push(item.path)}
                                sx={{
                                    height: 42,
                                    px: 1.5,
                                    borderRadius: '10px',
                                    color: item.disabled ? 'rgba(255,255,255,0.2)' : (isSelected ? drawerColors.text : drawerColors.muted),
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    opacity: item.disabled ? 0.6 : 1,
                                    '&.Mui-selected': {
                                        bgcolor: drawerColors.active,
                                        boxShadow: 'inset 0 0 0 1px rgba(26, 84, 85, 0.2)',
                                        '&:hover': { bgcolor: drawerColors.active },
                                        '& .MuiListItemIcon-root': { color: drawerColors.icon }
                                    },
                                    '&:hover': {
                                        bgcolor: item.disabled ? 'transparent' : drawerColors.hover,
                                        transform: item.disabled ? 'none' : 'translateX(4px)'
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
                                {item.disabled && (
                                    <Chip label="OFF" size="small" sx={{ height: 16, fontSize: 9, bgcolor: 'rgba(141, 166, 166, 0.1)', color: drawerColors.muted, fontWeight: 700 }} />
                                )}
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>
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
                        placeholder="Search courses..."
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
                            endAdornment: <InputAdornment position="end"><SearchIcon sx={{ color: drawerColors.icon }} /></InputAdornment>
                        }}
                    />

                    <Box sx={{ flexGrow: 1 }} />

                    <IconButton sx={{ color: drawerColors.muted }}><NotificationsOutlinedIcon /></IconButton>

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
                            {user?.firstName ? user.firstName[0] : 'U'}
                        </Avatar>
                        <Box sx={{ display: { xs: 'none', md: 'block' }, mx: 0.5 }}>
                            <Typography variant="body2" fontWeight={700} fontSize={13} color={drawerColors.text}>
                                {user ? `${user.firstName} ${user.lastName}` : 'Learner'}
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
                        <Box sx={{ px: 2, py: 1 }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ letterSpacing: '0.05em', textTransform: 'uppercase' }}>Switch role</Typography>
                        </Box>
                        {['Administrator', 'Instructor', 'Learner'].map((role) => (
                            <MenuItem key={role} onClick={() => handleRoleChange(role)} sx={{ py: 1, mx: 1, borderRadius: 1.5 }}>
                                <Radio checked={selectedRole === role} size="small" sx={{ p: 0.5, mr: 1, color: drawerColors.icon, '&.Mui-checked': { color: drawerColors.icon } }} />
                                <Typography variant="body2" fontSize={13} fontWeight={500}>{role}</Typography>
                            </MenuItem>
                        ))}
                        <Divider sx={{ my: 1, opacity: 0.5 }} />
                        <MenuItem sx={{ py: 1, mx: 1, borderRadius: 1.5 }}><PersonOutlineIcon sx={{ mr: 1.5, fontSize: 18, color: drawerColors.icon }} /><Typography variant="body2" fontSize={13}>My profile</Typography></MenuItem>
                        <MenuItem onClick={() => router.push('/login')} sx={{ py: 1, mx: 1, borderRadius: 1.5, color: 'hsl(0 72% 51%)' }}><LogoutIcon sx={{ mr: 1.5, fontSize: 18 }} /><Typography variant="body2" fontSize={13} fontWeight={600}>Log out</Typography></MenuItem>
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
