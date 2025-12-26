'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
    Divider
} from '@mui/material';

interface GenericUnitModalProps {
    open: boolean;
    onClose: () => void;
    courseId: string;
    type: string;
    onSave: () => void;
    editUnit?: any;
}

export default function GenericUnitModal({ open, onClose, courseId, type, onSave, editUnit }: GenericUnitModalProps) {
    const [title, setTitle] = useState('');
    const [config, setConfig] = useState<any>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (editUnit) {
            setTitle(editUnit.title || '');
            setConfig(editUnit.config || {});
        } else {
            setTitle('');
            setConfig({});
        }
    }, [editUnit, open]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const url = editUnit ? `/api/units/${editUnit.id}` : `/api/courses/${courseId}/units`;
            const method = editUnit ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    type,
                    config: type === 'WEB' ? { url: config.url || (typeof config === 'string' ? config : '') } : config
                })
            });

            if (res.ok) {
                onSave();
                onClose();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="sm"
            PaperProps={{
                sx: { borderRadius: '16px', p: 1 }
            }}
        >
            <DialogTitle sx={{ fontWeight: 800, color: '#2d3748', borderBottom: '1px solid #edf2f7', pb: 2 }}>
                {editUnit ? 'Edit' : 'Add'} {type} Unit
            </DialogTitle>
            <DialogContent sx={{ mt: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <TextField
                        label="Unit Title"
                        fullWidth
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        autoFocus
                        required
                        sx={{
                            '& .MuiOutlinedInput-root': { borderRadius: '10px' },
                            '& .MuiInputLabel-root': { fontWeight: 600 }
                        }}
                    />
                    {type === 'WEB' ? (
                        <TextField
                            label="Web URL"
                            fullWidth
                            value={config.url || (typeof config === 'string' ? config : '')}
                            onChange={(e) => setConfig({ ...config, url: e.target.value })}
                            placeholder="https://example.com"
                            sx={{
                                '& .MuiOutlinedInput-root': { borderRadius: '10px' }
                            }}
                        />
                    ) : (
                        <TextField
                            label="Configuration / Content"
                            fullWidth
                            multiline
                            rows={4}
                            value={typeof config === 'string' ? config : JSON.stringify(config)}
                            onChange={(e) => setConfig(e.target.value)}
                            sx={{
                                '& .MuiOutlinedInput-root': { borderRadius: '10px' }
                            }}
                        />
                    )}
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3, borderTop: '1px solid #edf2f7' }}>
                <Button onClick={onClose} sx={{ textTransform: 'none', fontWeight: 600, color: '#718096' }}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={saving || !title}
                    sx={{
                        textTransform: 'none',
                        fontWeight: 700,
                        px: 4,
                        borderRadius: '8px',
                        bgcolor: '#3182ce',
                        '&:hover': { bgcolor: '#2b6cb0' }
                    }}
                >
                    {saving ? 'Saving...' : `Save ${type} Unit`}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
