import React, { useState, useEffect } from 'react';
import {
    Drawer,
    Box,
    Typography,
    IconButton,
    TextField,
    Button,
    Divider,
    FormControlLabel,
    Switch,
    Alert
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface Unit {
    id: string;
    title: string;
    status: string;
    config?: any;
}

interface UnitOptionsDrawerProps {
    open: boolean;
    onClose: () => void;
    unit: Unit | null;
    onSave: (unitId: string, options: any) => void;
}

export default function UnitOptionsDrawer({ open, onClose, unit, onSave }: UnitOptionsDrawerProps) {
    const [title, setTitle] = useState('');
    const [isPublished, setIsPublished] = useState(false);

    useEffect(() => {
        if (unit) {
            setTitle(unit.title);
            setIsPublished(unit.status === 'PUBLISHED');
        }
    }, [unit]);

    const handleSave = () => {
        if (!unit) return;
        onSave(unit.id, {
            title,
            status: isPublished ? 'PUBLISHED' : 'DRAFT'
        });
        onClose();
    };

    if (!unit) return null;

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            PaperProps={{ sx: { width: 400 } }}
        >
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e0e0e0' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        Unit Options
                    </Typography>
                    <IconButton onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>

                <Box sx={{ p: 3, flex: 1, overflowY: 'auto' }}>
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                            Unit Title
                        </Typography>
                        <TextField
                            fullWidth
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            size="small"
                        />
                    </Box>

                    <Box sx={{ mb: 3 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={isPublished}
                                    onChange={(e) => setIsPublished(e.target.checked)}
                                />
                            }
                            label="Published (Visible to learners)"
                        />
                    </Box>

                    <Alert severity="info" sx={{ mb: 2 }}>
                        More advanced options like prerequisites and availability rules will be available here soon.
                    </Alert>
                </Box>

                <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0', display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button variant="contained" onClick={handleSave} sx={{ bgcolor: '#004282' }}>
                        Save Changes
                    </Button>
                </Box>
            </Box>
        </Drawer>
    );
}
