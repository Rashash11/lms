'use client';

import React, { useState, useEffect } from 'react';
import {
    Drawer,
    Box,
    Typography,
    TextField,
    Button,
    Autocomplete,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Alert,
    CircularProgress,
    IconButton,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloseIcon from '@mui/icons-material/Close';
import { ALL_NOTIFICATION_EVENTS, getEventByKey } from '@/lib/notifications/events';
import { ALL_SMART_TAGS, getTagsByCategory } from '@/lib/notifications/smartTags';
import { RECIPIENT_TYPES } from '@/lib/notifications/recipientTypes';

interface NotificationDrawerProps {
    open: boolean;
    notification: any | null;
    onClose: () => void;
    onSave: () => void;
}

export default function NotificationDrawer({
    open,
    notification,
    onClose,
    onSave,
}: NotificationDrawerProps) {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [hoursOffset, setHoursOffset] = useState<number | null>(null);
    const [selectedCourses, setSelectedCourses] = useState<any[]>([]);
    const [selectedGroups, setSelectedGroups] = useState<any[]>([]);
    const [selectedBranches, setSelectedBranches] = useState<any[]>([]);
    const [recipientType, setRecipientType] = useState('');
    const [recipientUserId, setRecipientUserId] = useState('');
    const [messageSubject, setMessageSubject] = useState('');
    const [messageBody, setMessageBody] = useState('');
    const [previewEmail, setPreviewEmail] = useState('');

    // Options for dropdowns
    const [courses, setCourses] = useState<any[]>([]);
    const [groups, setGroups] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);

    useEffect(() => {
        if (open) {
            loadOptions();
            if (notification) {
                populateForm(notification);
            } else {
                resetForm();
            }
        }
    }, [open, notification]);

    const loadOptions = async () => {
        try {
            // Load courses, groups, branches, users for dropdowns
            const [coursesRes, groupsRes, branchesRes] = await Promise.all([
                fetch('/api/courses'),
                fetch('/api/groups'),
                fetch('/api/branches'),
            ]);

            const coursesData = await coursesRes.json();
            const groupsData = await groupsRes.json();
            const branchesData = await branchesRes.json();

            setCourses(coursesData.courses || []);
            setGroups(groupsData.groups || []);
            setBranches(branchesData.branches || []);
        } catch (error) {
            console.error('Error loading options:', error);
        }
    };

    const populateForm = (notif: any) => {
        setName(notif.name || '');

        const event = getEventByKey(notif.eventKey);
        setSelectedEvent(event);

        setHoursOffset(notif.hoursOffset);
        setSelectedCourses(notif.filterCourses || []);
        setSelectedGroups(notif.filterGroups || []);
        setSelectedBranches(notif.filterBranches || []);
        setRecipientType(notif.recipientType || '');
        setRecipientUserId(notif.recipientUserId || '');
        setMessageSubject(notif.messageSubject || '');
        setMessageBody(notif.messageBody || '');
    };

    const resetForm = () => {
        setName('');
        setSelectedEvent(null);
        setHoursOffset(null);
        setSelectedCourses([]);
        setSelectedGroups([]);
        setSelectedBranches([]);
        setRecipientType('');
        setRecipientUserId('');
        setMessageSubject('');
        setMessageBody('');
        setPreviewEmail('');
    };

    const handleSave = async () => {
        if (!isFormValid()) {
            alert('Please fill in all required fields');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                name,
                eventKey: selectedEvent.key,
                isActive: true,
                hoursOffset: selectedEvent.supportsHoursOffset ? hoursOffset : null,
                offsetDirection: selectedEvent.offsetDirection || null,
                filterCourses: selectedCourses.map(c => c.id),
                filterGroups: selectedGroups.map(g => g.id),
                filterBranches: selectedBranches.map(b => b.id),
                recipientType,
                recipientUserId: recipientType === 'SPECIFIC_USER' ? recipientUserId : null,
                messageSubject,
                messageBody,
            };

            const url = notification
                ? `/api/admin/notifications/${notification.id}`
                : '/api/admin/notifications';

            const method = notification ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                onSave();
                resetForm();
            } else {
                const error = await response.json();
                alert(error.error || 'Failed to save notification');
            }
        } catch (error) {
            console.error('Error saving notification:', error);
            alert('Failed to save notification');
        } finally {
            setSaving(false);
        }
    };

    const handleSendPreview = async () => {
        if (!previewEmail || !notification) {
            alert('Enter an email address');
            return;
        }

        try {
            const response = await fetch(`/api/admin/notifications/${notification.id}/preview`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: previewEmail }),
            });

            const result = await response.json();
            if (response.ok) {
                alert(result.note);
            } else {
                alert(result.error || 'Failed to send preview');
            }
        } catch (error) {
            console.error('Error sending preview:', error);
            alert('Failed to send preview');
        }
    };

    const insertSmartTag = (tag: string) => {
        const cursorPos = (document.querySelector('#message-body') as HTMLTextAreaElement)?.selectionStart || messageBody.length;
        const newBody = messageBody.slice(0, cursorPos) + tag + messageBody.slice(cursorPos);
        setMessageBody(newBody);
    };

    const isFormValid = () => {
        return (
            name &&
            selectedEvent &&
            recipientType &&
            messageSubject &&
            messageBody &&
            (!selectedEvent.supportsHoursOffset || hoursOffset)
        );
    };

    const showWhenSection = selectedEvent !== null;
    const showFilterSection = selectedEvent?.supportsFilter;
    const filterTypes = selectedEvent?.filterTypes || [];

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            sx={{
                '& .MuiDrawer-paper': {
                    width: 600,
                    maxWidth: '90vw',
                },
            }}
        >
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">
                        {notification ? 'Edit notification' : 'Add notification'}
                    </Typography>
                    <IconButton onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>

                {/* Body */}
                <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
                    {/* Name */}
                    <TextField
                        label="Name"
                        fullWidth
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        sx={{ mb: 3 }}
                    />

                    {/* Event */}
                    <Autocomplete
                        options={ALL_NOTIFICATION_EVENTS}
                        groupBy={(option) => option.category}
                        getOptionLabel={(option) => option.label}
                        value={selectedEvent}
                        onChange={(_, value) => {
                            setSelectedEvent(value);
                            if (!value?.supportsHoursOffset) {
                                setHoursOffset(null);
                            }
                            if (!value?.supportsFilter) {
                                setSelectedCourses([]);
                                setSelectedGroups([]);
                                setSelectedBranches([]);
                            }
                        }}
                        renderInput={(params) => (
                            <TextField {...params} label="Event" required />
                        )}
                        sx={{ mb: 3 }}
                    />

                    {selectedEvent?.specialLogic && (
                        <Alert severity="warning" sx={{ mb: 3 }}>
                            {selectedEvent.specialLogic}
                        </Alert>
                    )}

                    {/* Rulesets */}
                    {selectedEvent && (
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                                Ruleset
                            </Typography>

                            {/* WHEN Section */}
                            <Accordion defaultExpanded>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Typography variant="body2" fontWeight={600}>
                                        WHEN
                                    </Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    {selectedEvent.supportsHoursOffset ? (
                                        <Box>
                                            <TextField
                                                type="number"
                                                label={`Hours ${selectedEvent.offsetDirection?.toLowerCase() || ''}`}
                                                fullWidth
                                                required
                                                value={hoursOffset || ''}
                                                onChange={(e) => setHoursOffset(parseInt(e.target.value) || null)}
                                                helperText={`Notification will be sent ${hoursOffset || 'X'} hours ${selectedEvent.offsetDirection?.toLowerCase() || ''} the event`}
                                            />
                                        </Box>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">
                                            {selectedEvent.description || 'Triggered when the event occurs'}
                                        </Typography>
                                    )}
                                </AccordionDetails>
                            </Accordion>

                            {/* FILTER BY Section */}
                            {showFilterSection && (
                                <Accordion>
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Typography variant="body2" fontWeight={600}>
                                            FILTER BY
                                        </Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                            {filterTypes.includes('COURSES') && (
                                                <Autocomplete
                                                    multiple
                                                    options={courses}
                                                    getOptionLabel={(option) => option.title || option.name}
                                                    value={selectedCourses}
                                                    onChange={(_, value) => setSelectedCourses(value)}
                                                    renderInput={(params) => (
                                                        <TextField {...params} label="Courses" placeholder="Select courses" />
                                                    )}
                                                    renderTags={(value, getTagProps) =>
                                                        value.map((option, index) => (
                                                            <Chip
                                                                label={option.title || option.name}
                                                                {...getTagProps({ index })}
                                                                size="small"
                                                            />
                                                        ))
                                                    }
                                                />
                                            )}

                                            {filterTypes.includes('GROUPS') && (
                                                <Autocomplete
                                                    multiple
                                                    options={groups}
                                                    getOptionLabel={(option) => option.name}
                                                    value={selectedGroups}
                                                    onChange={(_, value) => setSelectedGroups(value)}
                                                    renderInput={(params) => (
                                                        <TextField {...params} label="Groups" placeholder="Select groups" />
                                                    )}
                                                    renderTags={(value, getTagProps) =>
                                                        value.map((option, index) => (
                                                            <Chip label={option.name} {...getTagProps({ index })} size="small" />
                                                        ))
                                                    }
                                                />
                                            )}

                                            {filterTypes.includes('BRANCHES') && (
                                                <Autocomplete
                                                    multiple
                                                    options={branches}
                                                    getOptionLabel={(option) => option.name}
                                                    value={selectedBranches}
                                                    onChange={(_, value) => setSelectedBranches(value)}
                                                    renderInput={(params) => (
                                                        <TextField {...params} label="Branches" placeholder="Select branches" />
                                                    )}
                                                    renderTags={(value, getTagProps) =>
                                                        value.map((option, index) => (
                                                            <Chip label={option.name} {...getTagProps({ index })} size="small" />
                                                        ))
                                                    }
                                                />
                                            )}
                                        </Box>
                                    </AccordionDetails>
                                </Accordion>
                            )}

                            {/* NOTIFY (Recipient) Section */}
                            <Accordion defaultExpanded>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Typography variant="body2" fontWeight={600}>
                                        NOTIFY
                                    </Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <FormControl fullWidth required>
                                        <InputLabel>Recipient</InputLabel>
                                        <Select
                                            value={recipientType}
                                            onChange={(e) => setRecipientType(e.target.value)}
                                            label="Recipient"
                                        >
                                            {RECIPIENT_TYPES.map((type) => (
                                                <MenuItem key={type.value} value={type.value}>
                                                    {type.label}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </AccordionDetails>
                            </Accordion>
                        </Box>
                    )}

                    {/* Message Body */}
                    {selectedEvent && recipientType && (
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                                Message body
                            </Typography>

                            <TextField
                                label="Subject"
                                fullWidth
                                required
                                value={messageSubject}
                                onChange={(e) => setMessageSubject(e.target.value)}
                                sx={{ mb: 2 }}
                            />

                            <TextField
                                id="message-body"
                                label="Body"
                                fullWidth
                                required
                                multiline
                                rows={8}
                                value={messageBody}
                                onChange={(e) => setMessageBody(e.target.value)}
                                sx={{ mb: 2 }}
                            />

                            {/* Smart Tags */}
                            <Accordion>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Typography variant="body2" fontWeight={600} color="primary">
                                        Smart Tags
                                    </Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        {ALL_SMART_TAGS.map((tag) => (
                                            <Chip
                                                key={tag.tag}
                                                label={tag.tag}
                                                size="small"
                                                onClick={() => insertSmartTag(tag.tag)}
                                                sx={{ cursor: 'pointer' }}
                                            />
                                        ))}
                                    </Box>
                                    <Alert severity="info" sx={{ mt: 2 }}>
                                        Click a tag to insert it at the cursor position in the message body.
                                    </Alert>
                                </AccordionDetails>
                            </Accordion>
                        </Box>
                    )}

                    {/* Send Preview Email */}
                    {notification && (
                        <Box sx={{ mb: 3 }}>
                            <Accordion>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Typography variant="body2" fontWeight={600}>
                                        Send preview email
                                    </Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <TextField
                                            label="Recipient email"
                                            fullWidth
                                            size="small"
                                            value={previewEmail}
                                            onChange={(e) => setPreviewEmail(e.target.value)}
                                        />
                                        <Button variant="outlined" onClick={handleSendPreview}>
                                            Send
                                        </Button>
                                    </Box>
                                    <Alert severity="info" sx={{ mt: 2 }}>
                                        Smart tags will appear as-is in preview emails and will be replaced with actual data when sent to users.
                                    </Alert>
                                </AccordionDetails>
                            </Accordion>
                        </Box>
                    )}
                </Box>

                {/* Footer */}
                <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button onClick={onClose} disabled={saving}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSave}
                        disabled={!isFormValid() || saving}
                    >
                        {saving ? <CircularProgress size={24} /> : 'Save'}
                    </Button>
                </Box>
            </Box>
        </Drawer>
    );
}
