import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Chip, Box } from '@mui/material';

interface DomainsEditorProps {
    open: boolean;
    domains: string[];
    onSave: (domains: string[]) => void;
    onClose: () => void;
}

export default function DomainsEditor({ open, domains, onSave, onClose }: DomainsEditorProps) {
    const [inputValue, setInputValue] = useState('');
    const [currentDomains, setCurrentDomains] = useState<string[]>(domains);

    const handleAddDomain = () => {
        const trimmed = inputValue.trim();
        if (trimmed && !currentDomains.includes(trimmed)) {
            setCurrentDomains([...currentDomains, trimmed]);
            setInputValue('');
        }
    };

    const handleRemoveDomain = (domain: string) => {
        setCurrentDomains(currentDomains.filter(d => d !== domain));
    };

    const handleSave = () => {
        onSave(currentDomains);
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Restrict registration to specific domains</DialogTitle>
            <DialogContent>
                <TextField
                    fullWidth
                    label="Domain (e.g., example.com)"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddDomain();
                        }
                    }}
                    helperText="Press Enter to add"
                    sx={{ mt: 2, mb: 2 }}
                />
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {currentDomains.map((domain) => (
                        <Chip
                            key={domain}
                            label={domain}
                            onDelete={() => handleRemoveDomain(domain)}
                        />
                    ))}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave} variant="contained">Save</Button>
            </DialogActions>
        </Dialog>
    );
}
