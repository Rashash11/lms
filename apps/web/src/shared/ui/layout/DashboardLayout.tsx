'use client';

import * as React from 'react';
import { styled, Theme, CSSObject } from '@mui/material/styles';
import Box from '@mui/material/Box';
import MuiDrawer from '@mui/material/Drawer';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SchoolIcon from '@mui/icons-material/School';
import PeopleIcon from '@mui/icons-material/People';
import CategoryIcon from '@mui/icons-material/Category';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Badge from '@mui/material/Badge';
import MailIcon from '@mui/icons-material/Mail';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import HistoryIcon from '@mui/icons-material/History';
import Tooltip from '@mui/material/Tooltip';
import { useRouter, usePathname } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { apiFetch } from '@shared/http/apiFetch';

const drawerWidth = 260;

const openedMixin = (theme: Theme): CSSObject => ({
    width: drawerWidth,
    transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
    }),
    overflowX: 'hidden',
});

const closedMixin = (theme: Theme): CSSObject => ({
    transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    overflowX: 'hidden',
    width: `calc(${theme.spacing(7)} + 1px)`,
    [theme.breakpoints.up('sm')]: {
        width: `calc(${theme.spacing(8)} + 1px)`,
    },
});

const DrawerHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing(0, 1),
    ...theme.mixins.toolbar,
}));

interface AppBarProps extends MuiAppBarProps {
    open?: boolean;
}

const AppBar = styled(MuiAppBar, {
    shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme, open }) => ({
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(['width', 'margin'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    ...(open && {
        marginLeft: drawerWidth,
        width: `calc(100% - ${drawerWidth}px)`,
        transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
        }),
    }),
}));

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
    ({ theme, open }) => ({
        width: drawerWidth,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        boxSizing: 'border-box',
        ...(open && {
            ...openedMixin(theme),
            '& .MuiDrawer-paper': openedMixin(theme),
        }),
        ...(!open && {
            ...closedMixin(theme),
            '& .MuiDrawer-paper': closedMixin(theme),
        }),
    }),
);

const menuItems = [
    { text: 'Home', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Courses', icon: <SchoolIcon />, path: '/courses', permission: 'course:read' },
    { text: 'Users', icon: <PeopleIcon />, path: '/users', permission: 'user:read' },
    { text: 'Candidates', icon: <PersonSearchIcon />, path: '/candidates', permission: 'user:read' },
    { text: 'Assignments', icon: <HistoryIcon />, path: '/admin/assignments', permission: 'assignment:create' },
    { text: 'Categories', icon: <CategoryIcon />, path: '/admin/courses', permission: 'course:create' },
    { text: 'Audit Log', icon: <HistoryIcon />, path: '/admin/security/audit', permission: 'security:audit:read' },
    { text: 'Reports', icon: <AssessmentIcon />, path: '/admin/reports', permission: 'reports:read' },
];

const bottomMenuItems = [
    { text: 'Settings', icon: <SettingsIcon />, path: '/admin/settings', permission: 'settings:read' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = React.useState(true);
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const router = useRouter();
    const pathname = usePathname();
    const { can } = usePermissions();

    const handleDrawerToggle = () => {
        setOpen(!open);
    };

    const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = async () => {
        handleMenuClose();
        await apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
        window.location.href = '/login';
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

    return (
        <Box sx={{ display: 'flex' }}>
            <AppBar
                position="fixed"
                open={open}
                elevation={0}
                sx={{
                    bgcolor: 'rgba(8, 12, 12, 0.8)',
                    backdropFilter: 'blur(20px)',
                    borderBottom: `1px solid ${drawerColors.border}`,
                    color: drawerColors.text
                }}
            >
                <Toolbar sx={{ px: { xs: 2, sm: 3 } }}>
                    <IconButton
                        color="inherit"
                        aria-label="toggle drawer"
                        onClick={handleDrawerToggle}
                        edge="start"
                        sx={{ mr: 2, color: drawerColors.icon }}
                    >
                        {open ? <ChevronLeftIcon /> : <MenuIcon />}
                    </IconButton>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, color: drawerColors.text, fontWeight: 700 }}>
                        Zedny LMS
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Tooltip title="Messages">
                            <IconButton color="inherit" sx={{ color: drawerColors.muted }}>
                                <Badge badgeContent={4} color="secondary">
                                    <MailIcon />
                                </Badge>
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Notifications">
                            <IconButton color="inherit" sx={{ color: drawerColors.muted }}>
                                <Badge badgeContent={17} color="secondary">
                                    <NotificationsIcon />
                                </Badge>
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Account">
                            <IconButton onClick={handleProfileMenuOpen} sx={{ p: 0, ml: 1 }}>
                                <Avatar sx={{ width: 36, height: 36, bgcolor: 'hsl(var(--primary))', fontWeight: 700 }}>A</Avatar>
                            </IconButton>
                        </Tooltip>
                    </Box>
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleMenuClose}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                        PaperProps={{
                            sx: {
                                mt: 1.5,
                                bgcolor: 'rgba(13, 20, 20, 0.9)',
                                backdropFilter: 'blur(20px)',
                                border: `1px solid ${drawerColors.border}`,
                                borderRadius: 3,
                                boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                                color: drawerColors.text
                            }
                        }}
                    >
                        <MenuItem onClick={handleMenuClose} sx={{ px: 2, py: 1, mx: 1, borderRadius: 1.5 }}>Profile</MenuItem>
                        <MenuItem onClick={handleMenuClose} sx={{ px: 2, py: 1, mx: 1, borderRadius: 1.5 }}>My Account</MenuItem>
                        <Divider sx={{ my: 1, opacity: 0.5 }} />
                        <MenuItem onClick={handleLogout} sx={{ px: 2, py: 1, mx: 1, borderRadius: 1.5, color: 'hsl(0 72% 51%)' }}>
                            <ListItemIcon><LogoutIcon fontSize="small" sx={{ color: 'inherit' }} /></ListItemIcon>
                            <Typography fontWeight={600}>Logout</Typography>
                        </MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>

            <Drawer
                variant="permanent"
                open={open}
                sx={{
                    '& .MuiDrawer-paper': {
                        bgcolor: drawerColors.bg,
                        backdropFilter: 'blur(24px)',
                        borderRight: `1px solid ${drawerColors.border}`,
                        color: drawerColors.text
                    }
                }}
            >
                <DrawerHeader>
                    {open && (
                        <Box sx={{ display: 'flex', alignItems: 'center', pl: 2 }}>
                            <Typography variant="h6" fontWeight="bold" sx={{ color: 'hsl(var(--primary))' }}>
                                Zedny LMS
                            </Typography>
                        </Box>
                    )}
                </DrawerHeader>
                <Divider sx={{ opacity: 0.1 }} />
                <List sx={{ flexGrow: 1, px: 1 }}>
                    {menuItems.filter(item => !item.permission || can(item.permission)).map((item) => (
                        <ListItem key={item.text} disablePadding sx={{ display: 'block', mb: 0.5 }}>
                            <ListItemButton
                                onClick={() => router.push(item.path)}
                                sx={{
                                    minHeight: 48,
                                    justifyContent: open ? 'initial' : 'center',
                                    px: 2.5,
                                    borderRadius: '10px',
                                    bgcolor: pathname === item.path ? drawerColors.active : 'transparent',
                                    color: pathname === item.path ? drawerColors.text : drawerColors.muted,
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        bgcolor: drawerColors.hover,
                                        transform: open ? 'translateX(4px)' : 'none'
                                    },
                                }}
                            >
                                <ListItemIcon
                                    sx={{
                                        minWidth: 0,
                                        mr: open ? 3 : 'auto',
                                        justifyContent: 'center',
                                        color: pathname === item.path ? drawerColors.icon : drawerColors.muted,
                                    }}
                                >
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.text}
                                    sx={{
                                        opacity: open ? 1 : 0,
                                        '& .MuiTypography-root': { fontWeight: pathname === item.path ? 700 : 500, fontSize: 13 }
                                    }}
                                />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
                <Divider sx={{ opacity: 0.1 }} />
                <List sx={{ px: 1 }}>
                    {bottomMenuItems.filter(item => !item.permission || can(item.permission)).map((item) => (
                        <ListItem key={item.text} disablePadding sx={{ display: 'block', mb: 0.5 }}>
                            <ListItemButton
                                onClick={() => router.push(item.path)}
                                sx={{
                                    minHeight: 48,
                                    justifyContent: open ? 'initial' : 'center',
                                    px: 2.5,
                                    borderRadius: '10px',
                                    color: drawerColors.muted,
                                    '&:hover': { bgcolor: drawerColors.hover }
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 0, mr: open ? 3 : 'auto', justifyContent: 'center', color: 'inherit' }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText primary={item.text} sx={{ opacity: open ? 1 : 0, '& .MuiTypography-root': { fontSize: 13, fontWeight: 500 } }} />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            </Drawer>

            <Box component="main" sx={{
                flexGrow: 1,
                p: { xs: 2, sm: 3 },
                bgcolor: 'hsl(var(--background))',
                minHeight: '100vh',
                position: 'relative'
            }}>
                <DrawerHeader />
                {children}
            </Box>
        </Box>
    );
}
