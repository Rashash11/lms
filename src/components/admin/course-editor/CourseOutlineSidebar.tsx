import React, { useState } from 'react';
import {
    Box,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    IconButton,
    Collapse,
    Button,
    Paper,
    Menu,
    MenuItem,
    Tooltip,
    Divider,
    ListItemButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FolderIcon from '@mui/icons-material/Folder';

// Import icons for unit types
import DescriptionIcon from '@mui/icons-material/Description'; // Text/Assignment
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo'; // Video
import AssignmentIcon from '@mui/icons-material/Assignment'; // Test
import QuizIcon from '@mui/icons-material/Quiz'; // Survey
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'; // File
import CodeIcon from '@mui/icons-material/Code'; // Embed

interface Unit {
    id: string;
    title: string;
    type: string;
    status: string;
    sectionId?: string | null;
}

interface Section {
    id: string;
    title: string;
    units: Unit[];
}

interface CourseOutlineSidebarProps {
    sections: Section[];
    unassignedUnits: Unit[];
    onAddClick: (e: React.MouseEvent<HTMLElement>) => void;
    onUnitClick: (id: string) => void;
    onSectionClick: (id: string) => void;
    onPublishUnit: (id: string) => void;
    onUnpublishUnit: (id: string) => void;
    onDuplicateUnit: (id: string) => void;
    onDeleteUnit: (id: string) => void;
    onOptionsUnit: (id: string) => void;
    onMoveUnit: (id: string) => void;
    courseTitle: string;
    onOpenSettings: () => void;
    onOpenUsers: () => void;
    activeUnitId: string | null;
}

export default function CourseOutlineSidebar({
    sections,
    unassignedUnits,
    onAddClick,
    onUnitClick,
    onSectionClick,
    onPublishUnit,
    onUnpublishUnit,
    onDuplicateUnit,
    onDeleteUnit,
    onOptionsUnit,
    onMoveUnit,
    courseTitle,
    onOpenSettings,
    onOpenUsers,
    activeUnitId
}: CourseOutlineSidebarProps) {
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
    const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
    const [activeMenuUnitId, setActiveMenuUnitId] = useState<string | null>(null);

    const handleExpandClick = (sectionId: string) => {
        setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, unitId: string) => {
        event.stopPropagation();
        setMenuAnchorEl(event.currentTarget);
        setActiveMenuUnitId(unitId);
    };

    const handleMenuClose = () => {
        setMenuAnchorEl(null);
        setActiveMenuUnitId(null);
    };

    const getUnitIcon = (type: string) => {
        switch (type) {
            case 'VIDEO': return <OndemandVideoIcon fontSize="small" />;
            case 'TEST': return <AssignmentIcon fontSize="small" />;
            case 'SURVEY': return <QuizIcon fontSize="small" />;
            case 'FILE': return <InsertDriveFileIcon fontSize="small" />;
            case 'EMBED': return <CodeIcon fontSize="small" />;
            case 'ASSIGNMENT': return <DescriptionIcon fontSize="small" />;
            default: return <DescriptionIcon fontSize="small" />;
        }
    };

    const findUnit = (unitId: string | null) => {
        if (!unitId) return null;
        const u = unassignedUnits.find(u => u.id === unitId);
        if (u) return u;
        for (const s of sections) {
            const su = s.units.find(u => u.id === unitId);
            if (su) return su;
        }
        return null;
    };

    return (
        <Paper
            sx={{
                width: 300,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRight: '1px solid #e0e0e0',
                bgcolor: '#fff',
                borderRadius: 0
            }}
        >
            {/* Header: Title and Top Actions Row */}
            <Box sx={{ px: 2, pt: 1, pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1" noWrap sx={{ fontWeight: 800, color: '#2d3748', fontSize: '1rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {courseTitle || 'New course'}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Users">
                        <IconButton
                            onClick={onOpenUsers}
                            size="small"
                            sx={{
                                color: '#718096',
                                '&:hover': { bgcolor: '#f7fafc' }
                            }}
                        >
                            <PeopleOutlineIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Clone/Files">
                        <IconButton
                            onClick={() => { }}
                            size="small"
                            sx={{
                                color: '#718096',
                                '&:hover': { bgcolor: '#f7fafc' }
                            }}
                        >
                            <ContentCopyIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Course Settings">
                        <IconButton
                            onClick={onOpenSettings}
                            size="small"
                            sx={{
                                color: '#718096',
                                '&:hover': { bgcolor: '#f7fafc' }
                            }}
                        >
                            <SettingsIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* Header: Add Button Row */}
            <Box sx={{ px: 2, pb: 2, borderBottom: '1px solid #e2e8f0' }}>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={onAddClick}
                    fullWidth
                    sx={{
                        textTransform: 'none',
                        bgcolor: '#004282',
                        fontWeight: 700,
                        boxShadow: 'none',
                        fontSize: '0.875rem',
                        '&:hover': { bgcolor: '#003366', boxShadow: 'none' }
                    }}
                >
                    Add
                </Button>
            </Box>

            {/* Course Content List */}
            <Box sx={{ flex: 1, overflowY: 'auto' }}>
                <List component="nav" sx={{ p: 0 }}>
                    {/* Unassigned Units */}
                    {unassignedUnits.map(unit => (
                        <ListItem
                            disablePadding
                            key={unit.id}
                            secondaryAction={
                                <IconButton size="small" onClick={(e) => handleMenuOpen(e, unit.id)}>
                                    <MoreVertIcon fontSize="small" />
                                </IconButton>
                            }
                            sx={{
                                borderBottom: '1px solid #f0f4f8',
                                '&:hover': { bgcolor: '#f7fafc' }
                            }}
                        >
                            <ListItemButton
                                selected={activeUnitId === unit.id}
                                onClick={() => onUnitClick(unit.id)}
                                sx={{
                                    py: 1.5,
                                    pl: 2,
                                    '&.Mui-selected': {
                                        bgcolor: '#fff',
                                        '& .MuiListItemText-primary': { color: '#004282', fontWeight: 700 },
                                        '& .MuiListItemIcon-root': { color: '#004282' },
                                        '&:hover': { bgcolor: '#fafafa' }
                                    }
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 32 }}>
                                    {getUnitIcon(unit.type)}
                                </ListItemIcon>
                                <ListItemText
                                    primary={unit.title}
                                    primaryTypographyProps={{ fontSize: '0.9rem', noWrap: true }}
                                />
                                {unit.status === 'PUBLISHED' && <CheckCircleIcon sx={{ fontSize: 14, color: 'success.main', mr: 1 }} />}
                            </ListItemButton>
                        </ListItem>
                    ))}

                    {/* Sections */}
                    {sections.map(section => {
                        const isExpanded = expandedSections[section.id] ?? true;

                        return (
                            <React.Fragment key={section.id}>
                                <ListItem
                                    sx={{
                                        bgcolor: '#f5f5f5',
                                        py: 1,
                                        borderTop: '1px solid #e0e0e0',
                                        borderBottom: '1px solid #e0e0e0'
                                    }}
                                >
                                    <IconButton size="small" onClick={() => handleExpandClick(section.id)} sx={{ mr: 1, p: 0.5 }}>
                                        {isExpanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                                    </IconButton>
                                    <ListItemText
                                        primary={section.title}
                                        primaryTypographyProps={{ fontWeight: 700, fontSize: '0.9rem' }}
                                    />
                                </ListItem>
                                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                    <List component="div" disablePadding>
                                        {section.units.map(unit => (
                                            <ListItem
                                                disablePadding
                                                key={unit.id}
                                                secondaryAction={
                                                    <IconButton size="small" onClick={(e) => handleMenuOpen(e, unit.id)}>
                                                        <MoreVertIcon fontSize="small" />
                                                    </IconButton>
                                                }
                                                sx={{
                                                    borderBottom: '1px solid #f0f4f8',
                                                    '&:hover': { bgcolor: '#f7fafc' }
                                                }}
                                            >
                                                <ListItemButton
                                                    selected={activeUnitId === unit.id}
                                                    onClick={() => onUnitClick(unit.id)}
                                                    sx={{
                                                        py: 1.5,
                                                        pl: 4,
                                                        '&.Mui-selected': {
                                                            bgcolor: '#fff',
                                                            '& .MuiListItemText-primary': { color: '#004282', fontWeight: 700 },
                                                            '& .MuiListItemIcon-root': { color: '#004282' },
                                                            '&:hover': { bgcolor: '#fafafa' }
                                                        }
                                                    }}
                                                >
                                                    <ListItemIcon sx={{ minWidth: 32 }}>
                                                        {getUnitIcon(unit.type)}
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={unit.title}
                                                        primaryTypographyProps={{ fontSize: '0.9rem', noWrap: true }}
                                                    />
                                                    {unit.status === 'PUBLISHED' && <CheckCircleIcon sx={{ fontSize: 14, color: 'success.main', mr: 1 }} />}
                                                </ListItemButton>
                                            </ListItem>
                                        ))}
                                        {section.units.length === 0 && (
                                            <ListItem sx={{ pl: 4 }}>
                                                <ListItemText secondary="No content yet" secondaryTypographyProps={{ fontSize: '0.8rem' }} />
                                            </ListItem>
                                        )}
                                    </List>
                                </Collapse>
                            </React.Fragment>
                        );
                    })}
                </List>
            </Box>

            {/* Unit Context Menu */}
            <Menu
                anchorEl={menuAnchorEl}
                open={Boolean(menuAnchorEl)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={() => {
                    if (activeMenuUnitId) {
                        const unit = findUnit(activeMenuUnitId);
                        if (unit?.status === 'PUBLISHED') onUnpublishUnit(activeMenuUnitId);
                        else onPublishUnit(activeMenuUnitId);
                    }
                    handleMenuClose();
                }}>
                    {activeMenuUnitId && findUnit(activeMenuUnitId)?.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                </MenuItem>
                <MenuItem onClick={() => { activeMenuUnitId && onOptionsUnit(activeMenuUnitId); handleMenuClose(); }}>
                    Options
                </MenuItem>
                <MenuItem onClick={() => { activeMenuUnitId && onMoveUnit(activeMenuUnitId); handleMenuClose(); }}>
                    Move to...
                </MenuItem>
                <MenuItem onClick={() => { activeMenuUnitId && onDuplicateUnit(activeMenuUnitId); handleMenuClose(); }}>
                    Clone
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => { activeMenuUnitId && onDeleteUnit(activeMenuUnitId); handleMenuClose(); }} sx={{ color: 'error.main' }}>
                    Delete
                </MenuItem>
            </Menu>
        </Paper>
    );
}
