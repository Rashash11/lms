'use client';

import React, { useState } from 'react';
import {
    Box,
    Typography,
    Popover,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Divider,
    Paper,
    Icon
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ArticleIcon from '@mui/icons-material/Article';
import AssignmentIcon from '@mui/icons-material/Assignment';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import LanguageIcon from '@mui/icons-material/Language';
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import CoPresentIcon from '@mui/icons-material/CoPresent';
import CodeIcon from '@mui/icons-material/Code';
import QuizIcon from '@mui/icons-material/Quiz';
import PollIcon from '@mui/icons-material/Poll';
import BorderColorIcon from '@mui/icons-material/BorderColor';
import GroupsIcon from '@mui/icons-material/Groups';
import ExtensionIcon from '@mui/icons-material/Extension';
import FolderIcon from '@mui/icons-material/Folder';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LinkIcon from '@mui/icons-material/Link';

interface AddMenuProps {
    anchorEl: HTMLElement | null;
    open: boolean;
    onClose: () => void;
    onSelectType: (type: string, subType?: string) => void;
}

export default function AddMenuGrouped({ anchorEl, open, onClose, onSelectType }: AddMenuProps) {
    const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null);
    const [subMenuAnchorEl, setSubMenuAnchorEl] = useState<HTMLElement | null>(null);

    const handleMainItemClick = (e: React.MouseEvent<HTMLElement>, key: string) => {
        if (key === 'TALENTCRAFT') {
            onSelectType('TALENTCRAFT');
            onClose();
        } else {
            setActiveSubMenu(key);
            setSubMenuAnchorEl(e.currentTarget);
        }
    };

    const handleSubItemClick = (subType: string) => {
        if (activeSubMenu) {
            onSelectType(subType);
        }
        setActiveSubMenu(null);
        onClose();
    };

    const mainItems = [
        {
            key: 'TALENTCRAFT',
            title: 'TalentCraft',
            description: 'Create rich content, with the power of AI',
            icon: <AutoAwesomeIcon sx={{ color: '#9c27b0' }} />,
            hasSubMenu: false
        },
        {
            key: 'STANDARD',
            title: 'Standard Content',
            description: 'Add Text, Video, Presentation, etc',
            icon: <ArticleIcon sx={{ color: '#3182ce' }} />,
            hasSubMenu: true
        },
        {
            key: 'ACTIVITY',
            title: 'Learning Activities',
            description: 'Add Test, Scorm, Survey, ILT etc',
            icon: <AssignmentIcon sx={{ color: '#48bb78' }} />,
            hasSubMenu: true
        },
        {
            key: 'MORE',
            title: 'More',
            description: 'Add section, clone units, etc',
            icon: <MoreHorizIcon sx={{ color: '#ed8936' }} />,
            hasSubMenu: true
        }
    ];

    const subMenus: Record<string, any[]> = {
        STANDARD: [
            { id: 'TEXT', title: 'Content', icon: <ArticleIcon /> },
            { id: 'WEB', title: 'Web content', icon: <LanguageIcon /> },
            { id: 'VIDEO', title: 'Video', icon: <PlayCircleOutlineIcon /> },
            { id: 'AUDIO', title: 'Audio', icon: <AudiotrackIcon /> },
            { id: 'DOCUMENT', title: 'Presentation | Document', icon: <CoPresentIcon /> },
            { id: 'IFRAME', title: 'iFrame', icon: <CodeIcon /> },
        ],
        ACTIVITY: [
            { id: 'TEST', title: 'Test', icon: <QuizIcon /> },
            { id: 'SURVEY', title: 'Survey', icon: <PollIcon /> },
            { id: 'ASSIGNMENT', title: 'Assignment', icon: <BorderColorIcon /> },
            { id: 'ILT', title: 'Instructor-led training', icon: <GroupsIcon /> },
            { id: 'SCORM', title: 'SCORM | xAPI | cmi5', icon: <ExtensionIcon /> },
        ],
        MORE: [
            { id: 'SECTION', title: 'Section', icon: <FolderIcon /> },
            { id: 'CLONE', title: 'Clone from another course', icon: <ContentCopyIcon /> },
            { id: 'LINK', title: 'Link from another course', icon: <LinkIcon /> },
        ]
    };

    return (
        <Box>
            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={onClose}
                disableRestoreFocus
                disableAutoFocus
                disableEnforceFocus
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                PaperProps={{
                    sx: {
                        width: 340,
                        mt: 1.5,
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                        border: '1px solid #edf2f7',
                        overflow: 'hidden'
                    }
                }}
            >
                <Box sx={{ p: 1.5 }}>
                    <List disablePadding>
                        {mainItems.map((item) => (
                            <ListItem key={item.key} disablePadding>
                                <ListItemButton
                                    onClick={(e) => handleMainItemClick(e, item.key)}
                                    onMouseEnter={(e) => {
                                        if (item.hasSubMenu) {
                                            handleMainItemClick(e, item.key);
                                        }
                                    }}
                                    sx={{
                                        borderRadius: '8px',
                                        py: 1.5,
                                        mb: 0.5,
                                        '&:hover': { bgcolor: '#f7fafc' }
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 44 }}>
                                        <Box sx={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: '6px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            bgcolor: item.key === 'TALENTCRAFT' ? '#faf5ff' :
                                                item.key === 'STANDARD' ? '#ebf8ff' :
                                                    item.key === 'ACTIVITY' ? '#f0fff4' : '#fffaf0'
                                        }}>
                                            {React.cloneElement(item.icon as React.ReactElement, { sx: { fontSize: 20, color: (item.icon as any).props.sx.color } })}
                                        </Box>
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={item.title}
                                        secondary={item.description}
                                        primaryTypographyProps={{ fontWeight: 700, fontSize: '0.9rem', color: '#2d3748' }}
                                        secondaryTypographyProps={{ fontSize: '0.75rem', color: '#718096' }}
                                    />
                                    {item.hasSubMenu && <ChevronRightIcon fontSize="small" sx={{ color: '#a0aec0' }} />}
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                </Box>
            </Popover>

            <Popover
                open={!!activeSubMenu}
                anchorEl={subMenuAnchorEl}
                onClose={() => setActiveSubMenu(null)}
                disableRestoreFocus
                disableAutoFocus
                disableEnforceFocus
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                PaperProps={{
                    sx: {
                        width: 280,
                        ml: 0.5,
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                        border: '1px solid #edf2f7',
                        overflow: 'hidden'
                    }
                }}
            >
                <Box sx={{ p: 1.5 }}>
                    <Typography variant="overline" sx={{ px: 2, mb: 1, display: 'block', color: '#a0aec0', fontWeight: 700 }}>
                        {activeSubMenu}
                    </Typography>
                    <List disablePadding>
                        {activeSubMenu && subMenus[activeSubMenu]?.map((subItem) => (
                            <ListItem key={subItem.id} disablePadding>
                                <ListItemButton
                                    onClick={() => handleSubItemClick(subItem.id)}
                                    sx={{
                                        borderRadius: '8px',
                                        '&:hover': { bgcolor: '#f7fafc' }
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 36, color: '#4a5568' }}>
                                        {React.cloneElement(subItem.icon, { sx: { fontSize: 18 } })}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={subItem.title}
                                        primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500, color: '#2d3748' }}
                                    />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                </Box>
            </Popover>
        </Box>
    );
}
