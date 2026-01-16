import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, RadioGroup, FormControlLabel, Radio } from '@mui/material';

interface SignupModeEditorProps {
    open: boolean;
    value: string;
    onSave: (value: string) => void;
    onClose: () => void;
}

export default function SignupModeEditor({ open, value, onSave, onClose }: SignupModeEditorProps) {
    const [selected, setSelected] = useState(value);

    const handleSave = () => {
        onSave(selected);
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Sign up</DialogTitle>
            <DialogContent>
                <RadioGroup value={selected} onChange={(e) => setSelected(e.target.value)}>
                    <FormControlLabel value="direct" control={<Radio />} label="Direct" />
                    <FormControlLabel value="invitation" control={<Radio />} label="Invitation only" />
                    <FormControlLabel value="approval" control={<Radio />} label="Approval required" />
                </RadioGroup>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave} variant="contained">Save</Button>
            </DialogActions>
        </Dialog>
    );
}
