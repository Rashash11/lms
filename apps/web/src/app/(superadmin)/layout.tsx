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
import DomainOutlinedIcon from '@mui/icons-material/DomainOutlined';
import MonitorHeartOutlinedIcon from '@mui/icons-material/MonitorHeartOutlined';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LogoutIcon from '@mui/icons-material/Logout';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

const drawerWidth = 260;

const menuItems = [
    { text: 'Home', icon: <HomeIcon />, path: '/superadmin' },
    { text: 'Tenants', icon: <DomainOutlinedIcon />, path: '/superadmin/tenants' },
    { text: 'System health', icon: <MonitorHeartOutlinedIcon />, path: '/superadmin/system-health' },
    // TODO: Add these pages when implementing full superadmin module
    // { text: 'Job queue', icon: <WorkOutlineIcon />, path: '/superadmin/jobs' },
    // { text: 'Audit logs', icon: <HistoryOutlinedIcon />, path: '/superadmin/audit-logs' },
    // { text: 'Feature flags', icon: <FlagOutlinedIcon />, path: '/superadmin/feature-flags' },
    // { text: 'Global settings', icon: <SettingsOutlinedIcon />, path: '/superadmin/settings' },
];

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const pathname = usePathname();
    const router = useRouter();

    const drawerColors = {
        bg: 'rgba(25, 10, 10, 0.4)',
        active: 'rgba(211, 47, 47, 0.15)',
        hover: 'rgba(211, 47, 47, 0.08)',
        text: 'hsl(0 10% 95%)',
        muted: 'hsl(0 10% 60%)',
        icon: 'hsl(0 75% 65%)',
        border: 'rgba(211, 47, 47, 0.1)',
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
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5, height: 70 }}>
                <Box sx={{
                    width: 32, height: 32, borderRadius: 1,
                    bgcolor: 'hsl(0 72% 51%)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 15px rgba(211, 47, 47, 0.4)'
                }}>
                    <Typography sx={{ color: 'white', fontWeight: 900, fontSize: 18 }}>t</Typography>
                </Box>
                <Typography sx={{ color: drawerColors.text, fontWeight: 700, fontSize: 18, letterSpacing: -0.5 }}>
                    talentlms
                </Typography>
                <Chip
                    label="SA"
                    size="small"
                    sx={{
                        bgcolor: 'rgba(211, 47, 47, 0.2)',
                        color: drawerColors.icon,
                        height: 18,
                        fontSize: 9,
                        fontWeight: 700,
                        border: `1px solid ${drawerColors.border}`
                    }}
                />
            </Box>

            <List sx={{ flex: 1, pt: 0, px: 1.5 }}>
                {menuItems.map((item) => {
                    const isSelected = pathname === item.path;
                    return (
                        <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                            <ListItemButton
                                selected={isSelected}
                                onClick={() => router.push(item.path)}
                                sx={{
                                    height: 42,
                                    px: 1.5,
                                    borderRadius: '10px',
                                    color: isSelected ? drawerColors.text : drawerColors.muted,
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    '&.Mui-selected': {
                                        bgcolor: drawerColors.active,
                                        boxShadow: 'inset 0 0 0 1px rgba(211, 47, 47, 0.2)',
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

                    <TextField
                        placeholder="Search system..."
                        size="small"
                        sx={{
                            flex: 1, maxWidth: 400,
                            '& .MuiOutlinedInput-root': {
                                bgcolor: 'rgba(211, 47, 47, 0.03)',
                                height: 40,
                                borderRadius: 20,
                                border: `1px solid ${drawerColors.border}`,
                                '& fieldset': { border: 'none' },
                                '&:hover': { bgcolor: 'rgba(211, 47, 47, 0.06)', borderColor: 'rgba(211, 47, 47, 0.3)' },
                            }
                        }}
                        InputProps={{
                            endAdornment: <InputAdornment position="end"><SearchIcon sx={{ color: drawerColors.icon, fontSize: 20 }} /></InputAdornment>
                        }}
                    />

                    <Box sx={{ flexGrow: 1 }} />

                    <IconButton sx={{ color: drawerColors.muted }}><NotificationsOutlinedIcon /></IconButton>

                    <Box
                        onClick={(e) => setAnchorEl(e.currentTarget)}
                        sx={{
                            display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer',
                            bgcolor: 'rgba(211, 47, 47, 0.1)', border: `1px solid ${drawerColors.border}`, borderRadius: 20,
                            px: 1, py: 0.5, height: 40,
                            transition: 'all 0.2s',
                            '&:hover': { bgcolor: 'rgba(211, 47, 47, 0.15)', borderColor: 'rgba(211, 47, 47, 0.3)' }
                        }}
                    >
                        <Avatar sx={{ width: 30, height: 30, bgcolor: 'hsl(0 72% 51%)', fontSize: 13, fontWeight: 700 }}>S</Avatar>
                        <Box sx={{ display: { xs: 'none', md: 'block' }, mx: 0.5 }}>
                            <Typography variant="body2" fontWeight={700} fontSize={13} color={drawerColors.text}>Super Admin</Typography>
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
                        <MenuItem onClick={() => router.push('/admin')} sx={{ py: 1, mx: 1, borderRadius: 1.5 }}><Radio size="small" sx={{ p: 0.5, mr: 1, color: drawerColors.icon }} /><Typography variant="body2" fontSize={13}>Administrator</Typography></MenuItem>
                        <MenuItem onClick={() => router.push('/instructor')} sx={{ py: 1, mx: 1, borderRadius: 1.5 }}><Radio size="small" sx={{ p: 0.5, mr: 1, color: drawerColors.icon }} /><Typography variant="body2" fontSize={13}>Instructor</Typography></MenuItem>
                        <MenuItem onClick={() => router.push('/learner')} sx={{ py: 1, mx: 1, borderRadius: 1.5 }}><Radio size="small" sx={{ p: 0.5, mr: 1, color: drawerColors.icon }} /><Typography variant="body2" fontSize={13}>Learner</Typography></MenuItem>
                        <Divider sx={{ my: 1, opacity: 0.5 }} />
                        <MenuItem sx={{ py: 1, mx: 1, borderRadius: 1.5 }}><PersonOutlineIcon sx={{ mr: 1.5, fontSize: 18, color: drawerColors.icon }} /><Typography variant="body2" fontSize={13}>My profile</Typography></MenuItem>
                        <MenuItem onClick={() => { window.location.href = '/login'; }} sx={{ py: 1, mx: 1, borderRadius: 1.5, color: 'hsl(0 72% 51%)' }}><LogoutIcon sx={{ mr: 1.5, fontSize: 18 }} /><Typography variant="body2" fontSize={13} fontWeight={600}>Log out</Typography></MenuItem>
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
