'use client';

import React from 'react';
import {
    Box, Typography, Card, CardContent, Button, Chip, Paper,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import DownloadIcon from '@mui/icons-material/Download';
import ShareIcon from '@mui/icons-material/Share';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import VerifiedIcon from '@mui/icons-material/Verified';

interface Certificate {
    id: string;
    courseName: string;
    issuedAt: string;
    validUntil: string | null;
    credentialId: string;
    status: 'active' | 'expired';
}

const myCertificates: Certificate[] = [
    { id: '1', courseName: 'Node.js Backend Development', issuedAt: 'Dec 10, 2024', validUntil: 'Dec 10, 2026', credentialId: 'CERT-2024-NJS-001', status: 'active' },
    { id: '2', courseName: 'Python for Data Science', issuedAt: 'Nov 15, 2024', validUntil: null, credentialId: 'CERT-2024-PDS-002', status: 'active' },
];

export default function CertificatesPage() {
    return (
        <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>My Certificates</Typography>

            {/* Stats */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                    <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'success.lighter', color: 'success.main' }}>
                            <CardMembershipIcon />
                        </Box>
                        <Box>
                            <Typography variant="h4" fontWeight={700}>{myCertificates.length}</Typography>
                            <Typography variant="body2" color="text.secondary">Certificates Earned</Typography>
                        </Box>
                    </Paper>
                </Grid>
                <Grid item xs={6}>
                    <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'info.lighter', color: 'info.main' }}>
                            <VerifiedIcon />
                        </Box>
                        <Box>
                            <Typography variant="h4" fontWeight={700}>{myCertificates.filter(c => c.status === 'active').length}</Typography>
                            <Typography variant="body2" color="text.secondary">Active Credentials</Typography>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* Certificates Grid */}
            <Grid container spacing={3}>
                {myCertificates.map((cert) => (
                    <Grid item xs={12} md={6} key={cert.id}>
                        <Card sx={{ bgcolor: 'grey.50', border: 2, borderColor: 'success.main' }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                    <Box>
                                        <Chip label="Certificate" size="small" color="success" sx={{ mb: 1 }} />
                                        <Typography variant="h6" fontWeight={600}>{cert.courseName}</Typography>
                                    </Box>
                                    <VerifiedIcon color="success" sx={{ fontSize: 40 }} />
                                </Box>

                                <Grid container spacing={2} sx={{ mb: 2 }}>
                                    <Grid item xs={6}>
                                        <Typography variant="caption" color="text.secondary">Issued</Typography>
                                        <Typography variant="body2" fontWeight={500}>{cert.issuedAt}</Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="caption" color="text.secondary">Valid Until</Typography>
                                        <Typography variant="body2" fontWeight={500}>{cert.validUntil || 'No Expiration'}</Typography>
                                    </Grid>
                                </Grid>

                                <Box sx={{ bgcolor: 'white', p: 1.5, borderRadius: 1, mb: 2 }}>
                                    <Typography variant="caption" color="text.secondary">Credential ID</Typography>
                                    <Typography variant="body2" fontFamily="monospace">{cert.credentialId}</Typography>
                                </Box>

                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button variant="contained" startIcon={<DownloadIcon />} fullWidth>
                                        Download PDF
                                    </Button>
                                    <IconButton><ShareIcon /></IconButton>
                                    <IconButton><VisibilityIcon /></IconButton>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {myCertificates.length === 0 && (
                <Paper sx={{ p: 6, textAlign: 'center' }}>
                    <CardMembershipIcon sx={{ fontSize: 64, color: 'grey.400' }} />
                    <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>No certificates yet</Typography>
                    <Typography variant="body2" color="text.secondary">Complete courses to earn certificates</Typography>
                    <Button variant="contained" sx={{ mt: 2 }}>Browse Courses</Button>
                </Paper>
            )}
        </Box>
    );
}
