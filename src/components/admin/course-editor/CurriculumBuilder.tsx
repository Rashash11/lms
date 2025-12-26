'use client';

import React, { useMemo } from 'react';
import {
    Box,
    Typography,
    IconButton,
    Paper,
    Divider,
    Button,
    Tooltip,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText
} from '@mui/material';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LinkIcon from '@mui/icons-material/Link';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ExtensionIcon from '@mui/icons-material/Extension';
import LanguageIcon from '@mui/icons-material/Language';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SettingsIcon from '@mui/icons-material/Settings';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

interface Unit {
    id: string;
    title: string;
    type: string;
    status?: string | 'DRAFT' | 'PUBLISHED';
    sectionId?: string | null;
    linkSourceUnitId?: string | null;
}

interface Section {
    id: string;
    title: string;
    units: Unit[];
}

interface CurriculumBuilderProps {
    sections: Section[];
    unassignedUnits: Unit[];
    onReorder: (sections: any[], units: any[]) => void;
    onEditSection: (id: string) => void;
    onDeleteSection: (id: string) => void;
    onEditUnit: (id: string) => void;
    onDeleteUnit: (id: string) => void;
    onPublishUnit?: (id: string) => void;
    onUnpublishUnit?: (id: string) => void;
    onDuplicateUnit?: (id: string) => void;
    onOptionsUnit?: (id: string) => void;
    onMoveUnit?: (id: string) => void;
}

function SortableItem({ id, children, isSection = false }: { id: string, children: React.ReactNode, isSection?: boolean }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 100 : 1,
    };

    return (
        <Box ref={setNodeRef} style={style} {...attributes}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton size="small" {...listeners} sx={{ cursor: 'grab' }}>
                    <DragIndicatorIcon fontSize="small" />
                </IconButton>
                <Box sx={{ flex: 1 }}>{children}</Box>
            </Box>
        </Box>
    );
}

export default function CurriculumBuilder({
    sections,
    unassignedUnits,
    onReorder,
    onEditSection,
    onDeleteSection,
    onEditUnit,
    onDeleteUnit,
    onPublishUnit,
    onUnpublishUnit,
    onDuplicateUnit,
    onOptionsUnit,
    onMoveUnit
}: CurriculumBuilderProps) {
    const [unitAnchorEl, setUnitAnchorEl] = React.useState<null | HTMLElement>(null);
    const [activeUnitId, setActiveUnitId] = React.useState<string | null>(null);
    const [sectionAnchorEl, setSectionAnchorEl] = React.useState<null | HTMLElement>(null);
    const [activeSectionId, setActiveSectionId] = React.useState<string | null>(null);

    const handleUnitMenuOpen = (event: React.MouseEvent<HTMLElement>, unitId: string) => {
        setUnitAnchorEl(event.currentTarget);
        setActiveUnitId(unitId);
    };

    const handleUnitMenuClose = () => {
        setUnitAnchorEl(null);
        setActiveUnitId(null);
    };
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return;

        // 1. Identify what is being dragged
        const isSection = sections.some(s => s.id === activeId);

        if (isSection) {
            // Reordering sections
            const oldIndex = sections.findIndex(s => s.id === activeId);
            const newIndex = sections.findIndex(s => s.id === overId);
            if (newIndex !== -1) {
                const newSections = arrayMove(sections, oldIndex, newIndex);
                onReorder(
                    newSections.map((s, i) => ({ id: s.id, order_index: i })),
                    []
                );
            }
            return;
        }

        // 2. Handling unit movement
        let activeUnit: Unit | undefined;
        let sourceSectionId: string | null = null;

        // Find unit in sections or unassigned
        for (const s of sections) {
            const u = s.units.find(u => u.id === activeId);
            if (u) {
                activeUnit = u;
                sourceSectionId = s.id;
                break;
            }
        }
        if (!activeUnit) {
            activeUnit = unassignedUnits.find(u => u.id === activeId);
            sourceSectionId = null;
        }

        if (!activeUnit) return;

        // Find target section or target unit's section
        let targetSectionId: string | null = null;
        let targetIndex = 0;

        const overIsSection = sections.some(s => s.id === overId);
        if (overIsSection) {
            targetSectionId = overId;
            targetIndex = sections.find(s => s.id === overId)?.units.length || 0;
        } else {
            // Over is another unit
            for (const s of sections) {
                const idx = s.units.findIndex(u => u.id === overId);
                if (idx !== -1) {
                    targetSectionId = s.id;
                    targetIndex = idx;
                    break;
                }
            }
            if (targetSectionId === null) {
                const idx = unassignedUnits.findIndex(u => u.id === overId);
                if (idx !== -1) {
                    targetSectionId = null;
                    targetIndex = idx;
                }
            }
        }

        // Perform the move
        const unitUpdate = [{ id: activeUnit.id, sectionId: targetSectionId, order_index: targetIndex }];

        // To be safer, we should probably send all units in the target section if it changed
        // but for now, the API handles single updates fine. We just need to ensure property names match.
        onReorder([], unitUpdate);
    };

    const getUnitIcon = (type: string) => {
        switch (type) {
            case 'TEXT': return <TextFieldsIcon sx={{ color: '#4a5568' }} />;
            case 'VIDEO': return <OndemandVideoIcon sx={{ color: '#e53e3e' }} />;
            case 'TEST': return <AssessmentIcon sx={{ color: '#38a169' }} />;
            case 'SCORM': return <ExtensionIcon sx={{ color: '#805ad5' }} />;
            case 'WEB': return <LanguageIcon sx={{ color: '#3182ce' }} />;
            default: return <InsertDriveFileIcon sx={{ color: '#718096' }} />;
        }
    };

    return (
        <Box sx={{ p: 0 }}>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                {/* Unassigned Units */}
                {unassignedUnits.length > 0 && (
                    <Box sx={{ mb: 6 }}>
                        <Typography variant="overline" sx={{ color: '#718096', fontWeight: 800, mb: 2, display: 'block', letterSpacing: 1 }}>
                            UNASSIGNED CONTENT
                        </Typography>
                        <SortableContext items={unassignedUnits.map(u => u.id)} strategy={verticalListSortingStrategy}>
                            {unassignedUnits.map((unit) => (
                                <SortableItem key={unit.id} id={unit.id}>
                                    <Paper sx={{
                                        p: 2,
                                        mb: 1.5,
                                        border: '1px solid #edf2f7',
                                        borderRadius: '10px',
                                        boxShadow: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 2,
                                        '&:hover': { borderColor: '#cbd5e0', bgcolor: '#fff' }
                                    }}>
                                        {getUnitIcon(unit.type)}
                                        <Typography variant="body2" sx={{ flex: 1, fontWeight: 600, color: '#2d3748' }}>
                                            {unit.title}
                                        </Typography>
                                        {unit.linkSourceUnitId && (
                                            <Tooltip title="Linked Unit">
                                                <LinkIcon fontSize="small" sx={{ color: '#3182ce' }} />
                                            </Tooltip>
                                        )}
                                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                                            <IconButton size="small" onClick={(e) => handleUnitMenuOpen(e, unit.id)} sx={{ color: '#a0aec0' }}>
                                                <MoreVertIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    </Paper>
                                </SortableItem>
                            ))}
                        </SortableContext>
                    </Box>
                )}

                {/* Sections */}
                <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                    {sections.map((section) => (
                        <Box key={section.id} sx={{ mb: 4 }}>
                            <SortableItem id={section.id} isSection>
                                <Paper sx={{
                                    p: 2,
                                    bgcolor: '#f1f5f9',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '10px',
                                    boxShadow: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2
                                }}>
                                    <FolderIcon sx={{ color: '#475569' }} />
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b', flex: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        {section.title}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                        <IconButton size="small" onClick={() => onEditSection(section.id)} sx={{ color: '#64748b' }}><EditIcon fontSize="small" /></IconButton>
                                        <IconButton size="small" onClick={() => onDeleteSection(section.id)} sx={{ color: '#64748b' }}><DeleteIcon fontSize="small" /></IconButton>
                                    </Box>
                                </Paper>
                            </SortableItem>

                            <Box sx={{ ml: 6, mt: 1.5 }}>
                                <SortableContext items={section.units.map(u => u.id)} strategy={verticalListSortingStrategy}>
                                    {section.units.map((unit) => (
                                        <SortableItem key={unit.id} id={unit.id}>
                                            <Paper sx={{
                                                p: 1.5,
                                                mb: 1,
                                                border: '1px solid #edf2f7',
                                                borderRadius: '8px',
                                                boxShadow: 'none',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 2,
                                                '&:hover': { borderColor: '#cbd5e0', bgcolor: '#fff' }
                                            }}>
                                                {getUnitIcon(unit.type)}
                                                <Typography variant="body2" sx={{ flex: 1, fontWeight: 500, color: '#4a5568' }}>
                                                    {unit.title}
                                                </Typography>
                                                {unit.linkSourceUnitId && <LinkIcon fontSize="small" sx={{ color: '#3182ce' }} />}
                                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                    <IconButton size="small" onClick={(e) => handleUnitMenuOpen(e, unit.id)} sx={{ color: '#a0aec0' }}>
                                                        <MoreVertIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            </Paper>
                                        </SortableItem>
                                    ))}
                                </SortableContext>
                            </Box>
                        </Box>
                    ))}
                </SortableContext>

                {sections.length === 0 && unassignedUnits.length === 0 && (
                    <Box sx={{
                        p: 10,
                        textAlign: 'center',
                        bgcolor: 'transparent'
                    }}>
                        <Box sx={{ mb: 1 }}>
                            <Box component="img"
                                src="https://img.icons8.com/isometric/100/3182ce/repository.png"
                                sx={{ width: 64, height: 64, opacity: 0.8 }}
                            />
                        </Box>
                        <Typography variant="body1" sx={{ color: '#004282', fontWeight: 800 }}>
                            This course is empty
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#a0aec0', mt: 1, maxWidth: 600, mx: 'auto' }}>
                            Drag and drop files here, or click the Add button to the left, to build your course.
                        </Typography>
                    </Box>
                )}
            </DndContext>

            {/* Unit Action Menu */}
            <Menu
                anchorEl={unitAnchorEl}
                open={Boolean(unitAnchorEl)}
                onClose={handleUnitMenuClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <MenuItem onClick={() => { if (activeUnitId) onEditUnit(activeUnitId); handleUnitMenuClose(); }}>
                    <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>Edit</ListItemText>
                </MenuItem>
                {activeUnitId && (unassignedUnits.find(u => u.id === activeUnitId)?.status === 'PUBLISHED' || sections.some(s => s.units.find(u => u.id === activeUnitId)?.status === 'PUBLISHED')) ? (
                    <MenuItem onClick={() => { if (activeUnitId) onUnpublishUnit?.(activeUnitId); handleUnitMenuClose(); }}>
                        <ListItemIcon><VisibilityOffIcon fontSize="small" /></ListItemIcon>
                        <ListItemText>Unpublish</ListItemText>
                    </MenuItem>
                ) : (
                    <MenuItem onClick={() => { if (activeUnitId) onPublishUnit?.(activeUnitId); handleUnitMenuClose(); }}>
                        <ListItemIcon><VisibilityIcon fontSize="small" /></ListItemIcon>
                        <ListItemText>Publish</ListItemText>
                    </MenuItem>
                )}
                <MenuItem onClick={() => { if (activeUnitId) onDuplicateUnit?.(activeUnitId); handleUnitMenuClose(); }}>
                    <ListItemIcon><ContentCopyIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>Duplicate</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => { if (activeUnitId) onOptionsUnit?.(activeUnitId); handleUnitMenuClose(); }}>
                    <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>Unit Options</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => { if (activeUnitId) onMoveUnit?.(activeUnitId); handleUnitMenuClose(); }}>
                    <ListItemIcon><OpenInNewIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>Move to section...</ListItemText>
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => { if (activeUnitId) onDeleteUnit(activeUnitId); handleUnitMenuClose(); }} sx={{ color: '#e53e3e' }}>
                    <ListItemIcon><DeleteIcon fontSize="small" sx={{ color: '#e53e3e' }} /></ListItemIcon>
                    <ListItemText>Delete</ListItemText>
                </MenuItem>
            </Menu>
        </Box>
    );
}
