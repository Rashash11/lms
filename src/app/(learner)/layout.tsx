'use client';

import React, { useState } from 'react';
import {
    Box, Drawer, AppBar, Toolbar, Typography, List, ListItem, ListItemButton,
    ListItemIcon, ListItemText, IconButton, Avatar, Menu, MenuItem, Divider,
    Chip, TextField, InputAdornment, Radio,
} from '@mui/material';
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
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import MessageOutlinedIcon from '@mui/icons-material/MessageOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LogoutIcon from '@mui/icons-material/Logout';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

const drawerWidth = 240;

const menuItems = [
    { text: 'Home', icon: <HomeIcon />, path: '/learner' },
    { text: 'My courses', icon: <MenuBookOutlinedIcon />, path: '/learner/courses' },
    { text: 'Catalog', icon: <ExploreOutlinedIcon />, path: '/learner/catalog' },
    { text: 'ILT sessions', icon: <EventOutlinedIcon />, path: '/learner/ilt' },
    { text: 'Certificates', icon: <CardMembershipOutlinedIcon />, path: '/learner/certificates' },
    { text: 'Achievements', icon: <EmojiEventsOutlinedIcon />, path: '/learner/achievements', disabled: true },
    { text: 'Leaderboard', icon: <LeaderboardOutlinedIcon />, path: '/learner/leaderboard', disabled: true },
    { text: 'Discussions', icon: <ForumOutlinedIcon />, path: '/learner/discussions' },
    { text: 'Messages', icon: <MessageOutlinedIcon />, path: '/learner/messages', disabled: true },
];

export default function LearnerLayout({ children }: { children: React.ReactNode }) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedRole, setSelectedRole] = useState('Learner');
    const pathname = usePathname();
    const router = useRouter();

    const handleRoleChange = (role: string) => {
        setSelectedRole(role);
        setAnchorEl(null);
        if (role === 'Administrator') router.push('/admin');
        else if (role === 'Instructor') router.push('/instructor');
        else if (role === 'Learner') router.push('/learner');
    };

    const drawer = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#1a2b4a' }}>
            {/* Logo at top of sidebar */}
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{
                    width: 36, height: 36, borderRadius: '50%',
                    bgcolor: '#ff6b00', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Typography sx={{ color: 'white', fontWeight: 700, fontSize: 20 }}>t</Typography>
                </Box>
                <Typography sx={{ color: 'white', fontWeight: 700, fontSize: 18 }}>
                    talentlms
                </Typography>
            </Box>

            <List sx={{ flex: 1, pt: 0 }}>
                {menuItems.map((item) => {
                    const isSelected = pathname === item.path;
                    return (
                        <ListItem key={item.text} disablePadding>
                            <ListItemButton
                                selected={isSelected}
                                onClick={() => !item.disabled && router.push(item.path)}
                                sx={{
                                    py: 1.2,
                                    px: 2,
                                    color: item.disabled ? 'rgba(255,255,255,0.4)' : 'white',
                                    '&.Mui-selected': {
                                        bgcolor: '#2d4a7c',
                                        '&:hover': { bgcolor: '#2d4a7c' },
                                    },
                                    '&:hover': { bgcolor: item.disabled ? 'transparent' : 'rgba(255,255,255,0.1)' },
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 36, color: item.disabled ? 'rgba(255,255,255,0.4)' : 'white' }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.text}
                                    primaryTypographyProps={{ fontSize: 14, fontWeight: isSelected ? 500 : 400 }}
                                />
                                {item.disabled && (
                                    <Chip label="OFF" size="small" sx={{ height: 18, fontSize: 10, bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
                                )}
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', bgcolor: '#f5f7fa', minHeight: '100vh' }}>
            <AppBar
                position="fixed"
                sx={{
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    ml: { sm: `${drawerWidth}px` },
                    bgcolor: 'white',
                    color: 'text.primary',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                }}
            >
                <Toolbar sx={{ gap: 2 }}>
                    <IconButton edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={{ display: { sm: 'none' } }}>
                        <MenuIcon />
                    </IconButton>

                    <TextField
                        placeholder="Search"
                        size="small"
                        sx={{
                            flex: 1, maxWidth: 400,
                            '& .MuiOutlinedInput-root': {
                                bgcolor: '#f5f7fa',
                                '& fieldset': { border: 'none' },
                            }
                        }}
                        InputProps={{
                            endAdornment: <InputAdornment position="end"><SearchIcon sx={{ color: 'grey.500' }} /></InputAdornment>
                        }}
                    />

                    <Box sx={{ flexGrow: 1 }} />

                    <IconButton><NotificationsOutlinedIcon /></IconButton>

                    <Box
                        onClick={(e) => setAnchorEl(e.currentTarget)}
                        sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}
                    >
                        <Avatar sx={{ width: 36, height: 36, bgcolor: '#2196f3' }}>J</Avatar>
                        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                            <Typography variant="body2" fontWeight={600} lineHeight={1.2}>John Doe</Typography>
                            <Typography variant="caption" color="text.secondary">Learner</Typography>
                        </Box>
                        <KeyboardArrowDownIcon sx={{ color: 'grey.500' }} />
                    </Box>

                    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)} PaperProps={{ sx: { width: 220, mt: 1 } }}>
                        <Box sx={{ px: 2, py: 1 }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={500}>Switch role</Typography>
                        </Box>
                        {['Administrator', 'Instructor', 'Learner'].map((role) => (
                            <MenuItem key={role} onClick={() => handleRoleChange(role)} sx={{ py: 0.5 }}>
                                <Radio checked={selectedRole === role} size="small" sx={{ p: 0.5, mr: 1 }} />
                                <Typography variant="body2">{role}</Typography>
                            </MenuItem>
                        ))}
                        <Divider sx={{ my: 1 }} />
                        <MenuItem><PersonOutlineIcon sx={{ mr: 1.5, fontSize: 20 }} /><Typography variant="body2">My profile</Typography></MenuItem>
                        <MenuItem onClick={() => router.push('/login')}><LogoutIcon sx={{ mr: 1.5, fontSize: 20 }} /><Typography variant="body2">Log out</Typography></MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>

            <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
                <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)} sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { width: drawerWidth, bgcolor: '#1a2b4a' } }}>
                    {drawer}
                </Drawer>
                <Drawer variant="permanent" sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box', bgcolor: '#1a2b4a', border: 'none' } }} open>
                    {drawer}
                </Drawer>
            </Box>

            <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` }, mt: 8 }}>
                {children}
            </Box>
        </Box>
    );
}
