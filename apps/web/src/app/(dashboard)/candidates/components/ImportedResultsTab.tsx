'use client';

import React, { useState } from 'react';
import {
    Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TablePagination, Typography, Chip, IconButton, Button, Dialog, DialogTitle,
    DialogContent, DialogActions, Alert, LinearProgress, Tooltip,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import DescriptionIcon from '@mui/icons-material/Description';
import InfoIcon from '@mui/icons-material/Info';

interface ImportBatch {
    id: string;
    testName: string | null;
    sessionName: string | null;
    createdAt: string;
    processedAt: string | null;
    status: 'pending' | 'processed' | 'failed';
    totalRecords: number;
    successCount: number;
    errorCount: number;
    importLog: string[];
}

const mockBatches: ImportBatch[] = [
    { id: '1', testName: 'CCNA Certification', sessionName: 'Dec 15 Batch', createdAt: '2024-12-15T10:00:00Z', processedAt: '2024-12-15T10:05:00Z', status: 'processed', totalRecords: 50, successCount: 48, errorCount: 2, importLog: ['Imported 48 records successfully', 'Error: Invalid email for record #23', 'Error: Duplicate ID for record #41'] },
    { id: '2', testName: 'AWS Solutions Architect', sessionName: 'Dec 14 Batch', createdAt: '2024-12-14T14:30:00Z', processedAt: '2024-12-14T14:32:00Z', status: 'processed', totalRecords: 35, successCount: 35, errorCount: 0, importLog: ['Imported 35 records successfully', 'All records validated', 'Batch completed'] },
    { id: '3', testName: 'PMP Exam', sessionName: null, createdAt: '2024-12-16T09:00:00Z', processedAt: null, status: 'pending', totalRecords: 75, successCount: 0, errorCount: 0, importLog: ['Batch queued for processing', 'Awaiting validation'] },
    { id: '4', testName: 'CompTIA Security+', sessionName: 'Dec 13 Batch', createdAt: '2024-12-13T11:00:00Z', processedAt: '2024-12-13T11:01:00Z', status: 'failed', totalRecords: 20, successCount: 0, errorCount: 20, importLog: ['Validation failed', 'Error: Invalid file format', 'Error: Missing required columns'] },
];

const FEATURE_FLAG_PEARSON_VUE = false; // Feature flag for Pearson VUE

export default function ImportedResultsTab() {
    const [batches] = useState<ImportBatch[]>(mockBatches);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [logDialogOpen, setLogDialogOpen] = useState(false);
    const [selectedBatch, setSelectedBatch] = useState<ImportBatch | null>(null);

    const handleViewLog = (batch: ImportBatch) => {
        setSelectedBatch(batch);
        setLogDialogOpen(true);
    };

    const statusIcons = {
        pending: <HourglassEmptyIcon color="warning" />,
        processed: <CheckCircleIcon color="success" />,
        failed: <ErrorIcon color="error" />,
    };

    const stats = {
        total: batches.length,
        processed: batches.filter(b => b.status === 'processed').length,
        pending: batches.filter(b => b.status === 'pending').length,
        failed: batches.filter(b => b.status === 'failed').length,
        totalRecords: batches.reduce((a, b) => a + b.successCount, 0),
    };

    return (
        <Box>
            {/* Feature flag notice */}
            {!FEATURE_FLAG_PEARSON_VUE && (
                <Alert severity="info" sx={{ mb: 3 }} icon={<InfoIcon />}>
                    <Typography variant="body2">
                        <strong>Pearson VUE Integration</strong> is not configured. Contact your administrator to enable external result imports.
                    </Typography>
                </Alert>
            )}

            {/* Stats */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} sm={2.4}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h5" fontWeight="bold">{stats.total}</Typography>
                        <Typography variant="caption" color="text.secondary">Total Batches</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={6} sm={2.4}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h5" fontWeight="bold" color="success.main">{stats.processed}</Typography>
                        <Typography variant="caption" color="text.secondary">Processed</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={6} sm={2.4}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h5" fontWeight="bold" color="warning.main">{stats.pending}</Typography>
                        <Typography variant="caption" color="text.secondary">Pending</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={6} sm={2.4}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h5" fontWeight="bold" color="error.main">{stats.failed}</Typography>
                        <Typography variant="caption" color="text.secondary">Failed</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={2.4}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h5" fontWeight="bold" color="primary.main">{stats.totalRecords}</Typography>
                        <Typography variant="caption" color="text.secondary">Records Imported</Typography>
                    </Paper>
                </Grid>
            </Grid>

            {/* Upload button */}
            <Paper sx={{ p: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Import Batches</Typography>
                <Button variant="contained" startIcon={<CloudUploadIcon />} disabled={!FEATURE_FLAG_PEARSON_VUE}>
                    Import New Batch
                </Button>
            </Paper>

            {/* Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Test</TableCell>
                            <TableCell>Session</TableCell>
                            <TableCell>Created</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Records</TableCell>
                            <TableCell>Progress</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {batches.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((batch) => (
                            <TableRow key={batch.id} hover>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <DescriptionIcon fontSize="small" color="action" />
                                        <Typography variant="body2">{batch.testName || 'N/A'}</Typography>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">{batch.sessionName || '-'}</Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">{new Date(batch.createdAt).toLocaleDateString()}</Typography>
                                    <Typography variant="caption" color="text.secondary">{new Date(batch.createdAt).toLocaleTimeString()}</Typography>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        icon={statusIcons[batch.status]}
                                        label={batch.status}
                                        size="small"
                                        color={batch.status === 'processed' ? 'success' : batch.status === 'failed' ? 'error' : 'warning'}
                                        sx={{ textTransform: 'capitalize' }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">
                                        {batch.successCount}/{batch.totalRecords}
                                        {batch.errorCount > 0 && (
                                            <Typography component="span" color="error.main" variant="body2"> ({batch.errorCount} errors)</Typography>
                                        )}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    {batch.status === 'pending' ? (
                                        <LinearProgress sx={{ height: 8, borderRadius: 4 }} />
                                    ) : (
                                        <LinearProgress
                                            variant="determinate"
                                            value={(batch.successCount / batch.totalRecords) * 100}
                                            color={batch.status === 'failed' ? 'error' : 'success'}
                                            sx={{ height: 8, borderRadius: 4 }}
                                        />
                                    )}
                                </TableCell>
                                <TableCell align="right">
                                    <Tooltip title="View Import Log">
                                        <IconButton size="small" onClick={() => handleViewLog(batch)}>
                                            <VisibilityIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                        {batches.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                    <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                                    <Typography color="text.secondary">No import batches found</Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                <TablePagination
                    rowsPerPageOptions={[10, 25, 50]}
                    component="div"
                    count={batches.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(_, newPage) => setPage(newPage)}
                    onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                />
            </TableContainer>

            {/* Log Dialog */}
            <Dialog open={logDialogOpen} onClose={() => setLogDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Import Log - {selectedBatch?.testName}</DialogTitle>
                <DialogContent>
                    {selectedBatch && (
                        <Box sx={{ py: 2 }}>
                            <Grid container spacing={2} sx={{ mb: 2 }}>
                                <Grid item xs={4}>
                                    <Typography variant="caption" color="text.secondary">Status</Typography>
                                    <Box><Chip icon={statusIcons[selectedBatch.status]} label={selectedBatch.status} size="small" /></Box>
                                </Grid>
                                <Grid item xs={4}>
                                    <Typography variant="caption" color="text.secondary">Created</Typography>
                                    <Typography variant="body2">{new Date(selectedBatch.createdAt).toLocaleString()}</Typography>
                                </Grid>
                                <Grid item xs={4}>
                                    <Typography variant="caption" color="text.secondary">Processed</Typography>
                                    <Typography variant="body2">{selectedBatch.processedAt ? new Date(selectedBatch.processedAt).toLocaleString() : '-'}</Typography>
                                </Grid>
                            </Grid>
                            <Paper sx={{ p: 2, bgcolor: 'grey.900', color: 'grey.100', fontFamily: 'monospace', fontSize: 12, maxHeight: 300, overflow: 'auto' }}>
                                {selectedBatch.importLog.map((line, index) => (
                                    <Box key={index} sx={{ py: 0.5, color: line.includes('Error') ? 'error.light' : line.includes('success') ? 'success.light' : 'grey.100' }}>
                                        [{index + 1}] {line}
                                    </Box>
                                ))}
                            </Paper>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setLogDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
