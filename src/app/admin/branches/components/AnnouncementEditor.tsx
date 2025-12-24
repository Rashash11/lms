import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, FormControlLabel, Switch, TextField } from '@mui/material';

interface AnnouncementEditorProps {
    open: boolean;
    title: string;
    enabled: boolean;
    message: string;
    onSave: (enabled: boolean, message: string) => void;
    onClose: () => void;
}

export default function AnnouncementEditor({
    open,
    title,
    enabled,
    message,
    onSave,
    onClose
}: AnnouncementEditorProps) {
    const [isEnabled, setIsEnabled] = useState(enabled);
    const [text, setText] = useState(message || '');

    const handleSave = () => {
        onSave(isEnabled, text);
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <FormControlLabel
                    control={<Switch checked={isEnabled} onChange={(e) => setIsEnabled(e.target.checked)} />}
                    label="Enable announcement"
                    sx={{ mb: 2, mt: 1 }}
                />
                <TextField
                    fullWidth
                    label="Message"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    multiline
                    rows={4}
                    disabled={!isEnabled}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave} variant="contained">Save</Button>
            </DialogActions>
        </Dialog>
    );
}
