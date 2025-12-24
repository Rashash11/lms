import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';

interface TextEditorModalProps {
    open: boolean;
    title: string;
    label: string;
    value: string;
    onSave: (value: string) => void;
    onClose: () => void;
    multiline?: boolean;
    maxLength?: number;
}

export default function TextEditorModal({
    open,
    title,
    label,
    value,
    onSave,
    onClose,
    multiline = false,
    maxLength
}: TextEditorModalProps) {
    const [text, setText] = useState(value || '');

    const handleSave = () => {
        onSave(text);
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <TextField
                    fullWidth
                    label={label}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    multiline={multiline}
                    rows={multiline ? 4 : 1}
                    inputProps={{ maxLength }}
                    helperText={maxLength ? `${text.length}/${maxLength}` : ''}
                    sx={{ mt: 2 }}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave} variant="contained">Save</Button>
            </DialogActions>
        </Dialog>
    );
}
