'use client';

import React from 'react';
import { Box, Typography, Paper, Button, Accordion, AccordionSummary, AccordionDetails, Link } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HelpIcon from '@mui/icons-material/Help';
import EmailIcon from '@mui/icons-material/Email';
import ChatIcon from '@mui/icons-material/Chat';

const faqs = [
    { q: 'How do I start an exam?', a: 'Navigate to "My Exams" and click "Start Exam" on any available exam. Make sure you meet all eligibility requirements first.' },
    { q: 'What happens if I lose connection during an exam?', a: 'Your answers are auto-saved every 30 seconds. You can resume the exam as long as the time window is still active.' },
    { q: 'How do I complete onboarding?', a: 'Go to "My Profile" and complete all required steps: verify email, upload ID, take profile photo, and run system check.' },
    { q: 'Can I retake an exam?', a: 'Retakes depend on the exam settings. Check the "Attempts" field in your exam list to see how many attempts are allowed.' },
];

export default function CandidateHelpPage() {
    return (
        <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>Help & Support</Typography>

            <Paper sx={{ p: 3, mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <HelpIcon sx={{ fontSize: 48, color: 'info.main' }} />
                <Box>
                    <Typography variant="h6">Need assistance?</Typography>
                    <Typography variant="body2" color="text.secondary">Browse FAQs below or contact support</Typography>
                </Box>
                <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                    <Button variant="outlined" startIcon={<EmailIcon />}>Email Support</Button>
                    <Button variant="contained" startIcon={<ChatIcon />}>Live Chat</Button>
                </Box>
            </Paper>

            <Typography variant="h6" sx={{ mb: 2 }}>Frequently Asked Questions</Typography>
            {faqs.map((faq, i) => (
                <Accordion key={i}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography fontWeight={500}>{faq.q}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography variant="body2">{faq.a}</Typography>
                    </AccordionDetails>
                </Accordion>
            ))}
        </Box>
    );
}
