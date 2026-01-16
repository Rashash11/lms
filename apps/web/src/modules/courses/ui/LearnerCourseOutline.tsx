import React, { useState } from 'react';
import {
    Box,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Collapse,
    Button,
    ListItemButton,
    IconButton
} from '@mui/material';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

// Import icons for unit types
import DescriptionIcon from '@mui/icons-material/Description';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CodeIcon from '@mui/icons-material/Code';

interface Unit {
    id: string;
    title: string;
    type: string;
    status: string;
    completed?: boolean;
}

interface Section {
    id: string;
    title: string;
    units: Unit[];
}

interface LearnerCourseOutlineProps {
    sections: Section[];
    unassignedUnits: Unit[];
    onUnitClick: (id: string) => void;
    activeUnitId: string | null;
    courseTitle: string;
    onBack: () => void;
    progress: number;
    completedUnitIds: string[];
}

export default function LearnerCourseOutline({
    sections,
    unassignedUnits,
    onUnitClick,
    activeUnitId,
    courseTitle,
    onBack,
    progress = 0,
    completedUnitIds = []
}: LearnerCourseOutlineProps) {
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

    const handleExpandClick = (sectionId: string) => {
        setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
    };

    const isCompleted = (unitId: string) => completedUnitIds.includes(unitId);

    const getUnitIcon = (type: string, unitId: string) => {
        if (isCompleted(unitId)) return <CheckCircleIcon fontSize="small" sx={{ color: '#38a169' }} />;

        switch (type) {
            case 'VIDEO': return <OndemandVideoIcon fontSize="small" />;
            case 'FILE': return <InsertDriveFileIcon fontSize="small" />;
            case 'EMBED': return <CodeIcon fontSize="small" />;
            default: return <DescriptionIcon fontSize="small" />;
        }
    };

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#f7fafc', borderRight: '1px solid #e2e8f0' }}>
            <Box sx={{ p: 2, bgcolor: '#fff' }}>
                <Button
                    size="small"
                    startIcon={<ArrowBackIcon sx={{ fontSize: '0.8rem !important' }} />}
                    onClick={onBack}
                    sx={{
                        textTransform: 'none',
                        p: 0,
                        minWidth: 0,
                        color: '#3182ce',
                        fontSize: '0.75rem',
                        mb: 1,
                        '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' }
                    }}
                >
                    Back
                </Button>

                <Typography variant="h6" sx={{ fontWeight: 800, color: '#2d3748', fontSize: '1rem', mb: 2 }}>
                    {courseTitle}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ flex: 1, height: 8, bgcolor: '#edf2f7', borderRadius: 4, overflow: 'hidden' }}>
                        <Box sx={{ width: `${progress}%`, height: '100%', bgcolor: '#38a169' }} />
                    </Box>
                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#4a5568', minWidth: 25 }}>
                        {progress}%
                    </Typography>
                    <IconButton size="small" sx={{ border: '1px solid #e2e8f0', borderRadius: 1, p: 0.5 }}>
                        <DescriptionIcon sx={{ fontSize: '0.9rem', color: '#718096' }} />
                    </IconButton>
                </Box>
            </Box>

            <Box sx={{ flex: 1, overflowY: 'auto', mt: 1, bgcolor: '#fff' }}>
                <List component="nav" sx={{ p: 0 }}>
                    {unassignedUnits.map(unit => {
                        const active = activeUnitId === unit.id;
                        return (
                            <ListItem disablePadding key={unit.id} sx={{ borderLeft: active ? '3px solid #3182ce' : '3px solid transparent' }}>
                                <ListItemButton
                                    selected={active}
                                    onClick={() => onUnitClick(unit.id)}
                                    sx={{
                                        py: 1.5,
                                        '&.Mui-selected': {
                                            bgcolor: '#edf2f7',
                                            '& .MuiListItemText-primary': { color: '#2d3748', fontWeight: 600 },
                                            '&:hover': { bgcolor: '#e2e8f0' }
                                        }
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 32 }}>
                                        {getUnitIcon(unit.type, unit.id)}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={unit.title}
                                        primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: active ? 600 : 400, color: '#4a5568' }}
                                    />
                                </ListItemButton>
                            </ListItem>
                        );
                    })}

                    {sections.map(section => {
                        const isExpanded = expandedSections[section.id] ?? true;
                        return (
                            <React.Fragment key={section.id}>
                                <ListItem
                                    onClick={() => handleExpandClick(section.id)}
                                    sx={{
                                        bgcolor: '#f7fafc',
                                        py: 0.75,
                                        cursor: 'pointer',
                                        borderTop: '1px solid #edf2f7',
                                        borderBottom: '1px solid #edf2f7'
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 32 }}>
                                        {isExpanded ? <ExpandLess fontSize="small" sx={{ fontSize: '1rem' }} /> : <ExpandMore fontSize="small" sx={{ fontSize: '1rem' }} />}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={section.title}
                                        primaryTypographyProps={{ fontWeight: 700, fontSize: '0.8rem', color: '#718096', textTransform: 'uppercase' }}
                                    />
                                </ListItem>
                                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                    <List component="div" disablePadding>
                                        {section.units.map(unit => {
                                            const active = activeUnitId === unit.id;
                                            return (
                                                <ListItem disablePadding key={unit.id} sx={{ borderLeft: active ? '3px solid #3182ce' : '3px solid transparent' }}>
                                                    <ListItemButton
                                                        selected={active}
                                                        onClick={() => onUnitClick(unit.id)}
                                                        sx={{
                                                            py: 1.5,
                                                            pl: 4,
                                                            '&.Mui-selected': {
                                                                bgcolor: '#edf2f7',
                                                                '& .MuiListItemText-primary': { color: '#2d3748', fontWeight: 600 },
                                                                '&:hover': { bgcolor: '#e2e8f0' }
                                                            }
                                                        }}
                                                    >
                                                        <ListItemIcon sx={{ minWidth: 32 }}>
                                                            {getUnitIcon(unit.type, unit.id)}
                                                        </ListItemIcon>
                                                        <ListItemText
                                                            primary={unit.title}
                                                            primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: active ? 600 : 400, color: '#4a5568' }}
                                                        />
                                                    </ListItemButton>
                                                </ListItem>
                                            );
                                        })}
                                    </List>
                                </Collapse>
                            </React.Fragment>
                        );
                    })}
                </List>
            </Box>
        </Box>
    );
}
