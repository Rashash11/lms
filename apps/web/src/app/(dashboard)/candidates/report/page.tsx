'use client';

import React, { useState } from 'react';
import {
    Box, Paper, Tabs, Tab, Typography, Button, Chip, Avatar, Card, CardContent,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, LinearProgress,
    IconButton, Tooltip, Divider, TextField, Dialog, DialogTitle, DialogContent,
    DialogActions, Alert, Rating, Menu, MenuItem, ListItemIcon, ListItemText,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableChartIcon from '@mui/icons-material/TableChart';
import ShareIcon from '@mui/icons-material/Share';
import EditIcon from '@mui/icons-material/Edit';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import HistoryIcon from '@mui/icons-material/History';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import NoteIcon from '@mui/icons-material/Note';
import BarChartIcon from '@mui/icons-material/BarChart';
import QuizIcon from '@mui/icons-material/Quiz';
import InsightsIcon from '@mui/icons-material/Insights';
import SecurityIcon from '@mui/icons-material/Security';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import { useRouter } from 'next/navigation';

// Feature flag for AI grading
const AI_GRADING_ENABLED = true;

// Mock data for the report
const mockAttemptData = {
    id: '1',
    candidateName: 'John Doe',
    candidateEmail: 'john@example.com',
    testName: 'Advanced JavaScript Certification',
    sessionName: 'Dec 18 Morning Session',
    status: 'completed',
    score: 85,
    passingScore: 70,
    grade: 'Pass',
    startedAt: '2024-12-18T09:00:00Z',
    completedAt: '2024-12-18T10:30:00Z',
    duration: '1h 30m',
    totalQuestions: 50,
    answeredQuestions: 50,
    correctAnswers: 42,
    verified: true,
    verifiedBy: 'Admin',
    verifiedAt: '2024-12-18T11:00:00Z',
    isVisible: true,
};

const mockCertificates = [
    { id: '1', name: 'JavaScript Developer Level 2', issuedAt: '2024-12-18', validUntil: '2026-12-18', status: 'active' },
];

const mockNotes = [
    { id: '1', section: 'Section 1: Basics', question: 'Q5', text: 'Need to review closures concept', createdAt: '09:15 AM' },
    { id: '2', section: 'Section 2: Advanced', question: 'Q12', text: 'This question was confusing', createdAt: '09:32 AM' },
    { id: '3', section: 'Section 3: Async', question: null, text: 'General note about async patterns', createdAt: '10:05 AM' },
];

const mockQuestions = [
    { id: '1', section: 'Basics', number: 1, type: 'Multiple Choice', points: 2, awarded: 2, status: 'correct', gradedBy: 'Auto' },
    { id: '2', section: 'Basics', number: 2, type: 'Multiple Choice', points: 2, awarded: 2, status: 'correct', gradedBy: 'Auto' },
    { id: '3', section: 'Basics', number: 3, type: 'Essay', points: 10, awarded: 8, status: 'partial', gradedBy: 'Manual', feedback: 'Good explanation but missing key points' },
    { id: '4', section: 'Advanced', number: 4, type: 'Multiple Choice', points: 2, awarded: 0, status: 'incorrect', gradedBy: 'Auto' },
    { id: '5', section: 'Advanced', number: 5, type: 'Essay', points: 10, awarded: null, status: 'ungraded', gradedBy: null },
];

const mockGraders = [
    { id: '1', name: 'Dr. Smith', status: 'submitted', questionsGraded: 5, result: 'passed' },
    { id: '2', name: 'Prof. Johnson', status: 'pending', questionsGraded: 2, result: null },
];

const mockPoolStats = [
    { pool: 'JavaScript Fundamentals', questions: 15, correct: 13, score: 87 },
    { pool: 'Advanced Concepts', questions: 20, correct: 16, score: 80 },
    { pool: 'Async Programming', questions: 15, correct: 13, score: 87 },
];

const mockProctoringEvents = [
    { id: '1', time: '09:05:23', event: 'Face not detected', severity: 'warning' },
    { id: '2', time: '09:12:45', event: 'Gaze away from screen', severity: 'info' },
    { id: '3', time: '09:25:10', event: 'Audio detected', severity: 'warning' },
];

// Summary Tab Component
function SummaryTab({ data }: { data: typeof mockAttemptData }) {
    const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);

    return (
        <Box>
            <Grid container spacing={3}>
                {/* Left Column - Main Info */}
                <Grid item xs={12} md={8}>
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Avatar sx={{ width: 64, height: 64, fontSize: 24 }}>JD</Avatar>
                                    <Box>
                                        <Typography variant="h5" fontWeight={600}>{data.candidateName}</Typography>
                                        <Typography color="text.secondary">{data.candidateEmail}</Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Tooltip title={data.isVisible ? 'Hide from candidate' : 'Show to candidate'}>
                                        <IconButton>{data.isVisible ? <VisibilityIcon /> : <VisibilityOffIcon />}</IconButton>
                                    </Tooltip>
                                    <Button variant="outlined" startIcon={<DownloadIcon />} onClick={(e) => setExportMenuAnchor(e.currentTarget)}>
                                        Export
                                    </Button>
                                    <Menu anchorEl={exportMenuAnchor} open={Boolean(exportMenuAnchor)} onClose={() => setExportMenuAnchor(null)}>
                                        <MenuItem><ListItemIcon><PictureAsPdfIcon fontSize="small" /></ListItemIcon>Export as PDF</MenuItem>
                                        <MenuItem><ListItemIcon><TableChartIcon fontSize="small" /></ListItemIcon>Export as Excel</MenuItem>
                                        <MenuItem><ListItemIcon><BarChartIcon fontSize="small" /></ListItemIcon>Score by Pools</MenuItem>
                                        <MenuItem><ListItemIcon><InsightsIcon fontSize="small" /></ListItemIcon>Knowledge Deficiency</MenuItem>
                                    </Menu>
                                </Box>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            <Grid container spacing={2}>
                                <Grid item xs={6} md={3}>
                                    <Typography variant="caption" color="text.secondary">Test</Typography>
                                    <Typography variant="body2" fontWeight={500}>{data.testName}</Typography>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Typography variant="caption" color="text.secondary">Session</Typography>
                                    <Typography variant="body2">{data.sessionName}</Typography>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Typography variant="caption" color="text.secondary">Started</Typography>
                                    <Typography variant="body2">{new Date(data.startedAt).toLocaleString()}</Typography>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Typography variant="caption" color="text.secondary">Duration</Typography>
                                    <Typography variant="body2">{data.duration}</Typography>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>

                    {/* Score Card */}
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Results</Typography>
                            <Grid container spacing={3} alignItems="center">
                                <Grid item xs={12} md={4}>
                                    <Box sx={{ textAlign: 'center', p: 2 }}>
                                        <Typography variant="h2" fontWeight={700} color={data.score >= data.passingScore ? 'success.main' : 'error.main'}>
                                            {data.score}%
                                        </Typography>
                                        <Chip label={data.grade} color={data.grade === 'Pass' ? 'success' : 'error'} sx={{ mt: 1 }} />
                                    </Box>
                                </Grid>
                                <Grid item xs={12} md={8}>
                                    <Box sx={{ mb: 2 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                            <Typography variant="body2">Score Progress</Typography>
                                            <Typography variant="body2">{data.score}% (Passing: {data.passingScore}%)</Typography>
                                        </Box>
                                        <LinearProgress variant="determinate" value={data.score} sx={{ height: 10, borderRadius: 5 }} color={data.score >= data.passingScore ? 'success' : 'error'} />
                                    </Box>
                                    <Grid container spacing={2}>
                                        <Grid item xs={4}><Typography variant="caption" color="text.secondary">Questions</Typography><Typography fontWeight={600}>{data.totalQuestions}</Typography></Grid>
                                        <Grid item xs={4}><Typography variant="caption" color="text.secondary">Answered</Typography><Typography fontWeight={600}>{data.answeredQuestions}</Typography></Grid>
                                        <Grid item xs={4}><Typography variant="caption" color="text.secondary">Correct</Typography><Typography fontWeight={600} color="success.main">{data.correctAnswers}</Typography></Grid>
                                    </Grid>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>

                    {/* Grading Report */}
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6">Grading Report</Typography>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button size="small" startIcon={<AutoFixHighIcon />}>Auto-Assign</Button>
                                    <Button size="small" startIcon={<PersonAddIcon />}>Add Grader</Button>
                                </Box>
                            </Box>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Grader</TableCell>
                                            <TableCell>Status</TableCell>
                                            <TableCell>Questions Graded</TableCell>
                                            <TableCell>Result</TableCell>
                                            <TableCell>Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {mockGraders.map((grader) => (
                                            <TableRow key={grader.id}>
                                                <TableCell>{grader.name}</TableCell>
                                                <TableCell><Chip label={grader.status} size="small" color={grader.status === 'submitted' ? 'success' : 'warning'} /></TableCell>
                                                <TableCell>{grader.questionsGraded}</TableCell>
                                                <TableCell>{grader.result ? <Chip label={grader.result} size="small" color="success" /> : '-'}</TableCell>
                                                <TableCell><Button size="small">View Report</Button></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Right Column - Verification & Certificates */}
                <Grid item xs={12} md={4}>
                    {/* Verification Status */}
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Verification</Typography>
                            {data.verified ? (
                                <Alert severity="success" icon={<CheckCircleIcon />}>
                                    <Typography variant="body2">Verified by {data.verifiedBy}</Typography>
                                    <Typography variant="caption">{new Date(data.verifiedAt).toLocaleString()}</Typography>
                                </Alert>
                            ) : (
                                <Box>
                                    <Alert severity="warning">Not yet verified</Alert>
                                    <Button fullWidth variant="contained" sx={{ mt: 2 }} startIcon={<CheckCircleIcon />}>
                                        Verify Report
                                    </Button>
                                </Box>
                            )}
                        </CardContent>
                    </Card>

                    {/* Certificates */}
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Certificates Achieved</Typography>
                            {mockCertificates.map((cert) => (
                                <Paper key={cert.id} variant="outlined" sx={{ p: 2, mb: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <CardGiftcardIcon color="primary" />
                                        <Typography variant="subtitle2">{cert.name}</Typography>
                                    </Box>
                                    <Typography variant="caption" color="text.secondary">Valid until: {cert.validUntil}</Typography>
                                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                        <Button size="small" startIcon={<PictureAsPdfIcon />}>PDF</Button>
                                        <Button size="small" startIcon={<ShareIcon />}>Share</Button>
                                        <IconButton size="small"><EditIcon fontSize="small" /></IconButton>
                                    </Box>
                                </Paper>
                            ))}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}

// Notes Tab Component
function NotesTab() {
    return (
        <Box>
            <Typography variant="h6" gutterBottom>Candidate Notes</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Notes taken by the candidate during the test</Typography>
            {mockNotes.map((note) => (
                <Paper key={note.id} sx={{ p: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <NoteIcon fontSize="small" color="primary" />
                        <Typography variant="subtitle2">{note.section}</Typography>
                        {note.question && <Chip label={note.question} size="small" />}
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>{note.createdAt}</Typography>
                    </Box>
                    <Typography variant="body2">{note.text}</Typography>
                </Paper>
            ))}
        </Box>
    );
}

// Aggregated Reports Tab Component
function AggregatedReportsTab() {
    return (
        <Box>
            <Typography variant="h6" gutterBottom>Score by Question Pools</Typography>
            <TableContainer component={Paper} sx={{ mb: 4 }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Question Pool</TableCell>
                            <TableCell align="center">Questions</TableCell>
                            <TableCell align="center">Correct</TableCell>
                            <TableCell align="center">Score</TableCell>
                            <TableCell>Performance</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {mockPoolStats.map((pool, index) => (
                            <TableRow key={index}>
                                <TableCell>{pool.pool}</TableCell>
                                <TableCell align="center">{pool.questions}</TableCell>
                                <TableCell align="center">{pool.correct}</TableCell>
                                <TableCell align="center"><Typography fontWeight={600} color={pool.score >= 70 ? 'success.main' : 'error.main'}>{pool.score}%</Typography></TableCell>
                                <TableCell><LinearProgress variant="determinate" value={pool.score} sx={{ height: 8, borderRadius: 4 }} color={pool.score >= 70 ? 'success' : 'error'} /></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Typography variant="h6" gutterBottom>Performance Summary</Typography>
            <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" fontWeight={700} color="success.main">87%</Typography>
                        <Typography variant="caption">Strongest Pool</Typography>
                        <Typography variant="body2">JavaScript Fundamentals</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" fontWeight={700} color="warning.main">80%</Typography>
                        <Typography variant="caption">Weakest Pool</Typography>
                        <Typography variant="body2">Advanced Concepts</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" fontWeight={700}>42</Typography>
                        <Typography variant="caption">Total Correct</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" fontWeight={700}>8</Typography>
                        <Typography variant="caption">Total Incorrect</Typography>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}

// Questions Tab Component with AI Grading
function QuestionsTab() {
    const [aiDialogOpen, setAiDialogOpen] = useState(false);
    const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);

    const handleAiGrade = (questionId: string) => {
        setSelectedQuestion(questionId);
        setAiDialogOpen(true);
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Question Details</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip label="All" variant="outlined" />
                    <Chip label="Ungraded (1)" color="warning" />
                    <Chip label="Essay Only" variant="outlined" />
                </Box>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>#</TableCell>
                            <TableCell>Section</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell align="center">Points</TableCell>
                            <TableCell align="center">Awarded</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Graded By</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {mockQuestions.map((q) => (
                            <TableRow key={q.id} sx={{ bgcolor: q.status === 'ungraded' ? 'warning.lighter' : 'inherit' }}>
                                <TableCell>{q.number}</TableCell>
                                <TableCell>{q.section}</TableCell>
                                <TableCell><Chip label={q.type} size="small" variant="outlined" /></TableCell>
                                <TableCell align="center">{q.points}</TableCell>
                                <TableCell align="center">
                                    {q.awarded !== null ? (
                                        <Typography fontWeight={600} color={q.awarded === q.points ? 'success.main' : q.awarded === 0 ? 'error.main' : 'warning.main'}>
                                            {q.awarded}
                                        </Typography>
                                    ) : '-'}
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={q.status}
                                        size="small"
                                        color={q.status === 'correct' ? 'success' : q.status === 'incorrect' ? 'error' : q.status === 'partial' ? 'warning' : 'default'}
                                    />
                                </TableCell>
                                <TableCell>{q.gradedBy || '-'}</TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                        <Tooltip title="View Answer"><IconButton size="small"><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
                                        {q.type === 'Essay' && (
                                            <>
                                                <Tooltip title="Manual Grade"><IconButton size="small"><EditIcon fontSize="small" /></IconButton></Tooltip>
                                                {AI_GRADING_ENABLED && (
                                                    <Tooltip title="AI Grade">
                                                        <IconButton size="small" color="primary" onClick={() => handleAiGrade(q.id)}>
                                                            <SmartToyIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                <Tooltip title="Score History"><IconButton size="small"><HistoryIcon fontSize="small" /></IconButton></Tooltip>
                                            </>
                                        )}
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* AI Grading Dialog */}
            <Dialog open={aiDialogOpen} onClose={() => setAiDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SmartToyIcon color="primary" />
                    AI-Assisted Grading
                </DialogTitle>
                <DialogContent>
                    <Alert severity="info" sx={{ mb: 2 }}>
                        AI grading is a <strong>suggestion tool</strong>. Always review and confirm the grade before saving.
                    </Alert>
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" gutterBottom>Candidate's Answer:</Typography>
                        <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                            <Typography variant="body2">
                                "Closures in JavaScript are functions that have access to variables from their outer (enclosing) function scope, even after the outer function has returned. This is possible because JavaScript functions form closures around the data they reference..."
                            </Typography>
                        </Paper>
                    </Box>
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" gutterBottom>Reference Answer / Rubric:</Typography>
                        <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                            <Typography variant="body2">
                                Key points: 1) Definition of closure 2) Lexical scoping 3) Use cases 4) Memory implications
                            </Typography>
                        </Paper>
                    </Box>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Typography variant="subtitle2">AI Suggested Score:</Typography>
                        <Typography variant="h5" fontWeight={700} color="primary.main">8 / 10</Typography>
                    </Box>
                    <Typography variant="subtitle2" gutterBottom>AI Feedback:</Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        defaultValue="Good explanation of closures and lexical scoping. Missing discussion of memory implications and practical use cases like data privacy."
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAiDialogOpen(false)}>Cancel</Button>
                    <Button variant="outlined">Adjust Score</Button>
                    <Button variant="contained" startIcon={<CheckCircleIcon />}>Accept & Save</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

// Charts Tab Component
function ChartsTab() {
    return (
        <Box>
            <Typography variant="h6" gutterBottom>Performance Charts</Typography>
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="subtitle2" gutterBottom>Score by Category</Typography>
                            <Box sx={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100', borderRadius: 1 }}>
                                <Typography color="text.secondary">[Radar Chart Placeholder]</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="subtitle2" gutterBottom>Time per Section</Typography>
                            <Box sx={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100', borderRadius: 1 }}>
                                <Typography color="text.secondary">[Bar Chart Placeholder]</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
            <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>Categories Table</Typography>
            <TableContainer component={Paper}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Category</TableCell>
                            <TableCell align="center">Questions</TableCell>
                            <TableCell align="center">Score</TableCell>
                            <TableCell>Level</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {[{ cat: 'Syntax', q: 10, s: 90, l: 'Expert' }, { cat: 'Functions', q: 15, s: 85, l: 'Proficient' }, { cat: 'Async', q: 10, s: 80, l: 'Proficient' }, { cat: 'OOP', q: 15, s: 75, l: 'Intermediate' }].map((row, i) => (
                            <TableRow key={i}>
                                <TableCell>{row.cat}</TableCell>
                                <TableCell align="center">{row.q}</TableCell>
                                <TableCell align="center"><Typography fontWeight={600} color={row.s >= 80 ? 'success.main' : 'warning.main'}>{row.s}%</Typography></TableCell>
                                <TableCell><Chip label={row.l} size="small" color={row.l === 'Expert' ? 'success' : row.l === 'Proficient' ? 'info' : 'warning'} /></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}

// Special Requests Tab Component
function SpecialRequestsTab() {
    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Special Requests</Typography>
                <Button variant="contained" size="small">Create Request</Button>
            </Box>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="text.secondary">No special requests for this attempt</Typography>
            </Paper>
        </Box>
    );
}

// Proctoring Report Tab Component
function ProctoringReportTab() {
    return (
        <Box>
            <Typography variant="h6" gutterBottom>Proctoring Report</Typography>
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="warning.main">3</Typography>
                        <Typography variant="caption">Total Events</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="error.main">2</Typography>
                        <Typography variant="caption">Warnings</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Chip label="Neutral" />
                        <Typography variant="caption" display="block" sx={{ mt: 1 }}>Proctor Grade</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4">✓</Typography>
                        <Typography variant="caption">Recording Available</Typography>
                    </Paper>
                </Grid>
            </Grid>

            <Typography variant="subtitle2" gutterBottom>Event Log</Typography>
            <TableContainer component={Paper}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Time</TableCell>
                            <TableCell>Event</TableCell>
                            <TableCell>Severity</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {mockProctoringEvents.map((event) => (
                            <TableRow key={event.id}>
                                <TableCell>{event.time}</TableCell>
                                <TableCell>{event.event}</TableCell>
                                <TableCell><Chip label={event.severity} size="small" color={event.severity === 'warning' ? 'warning' : 'info'} /></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button variant="outlined" startIcon={<SecurityIcon />}>View Recording</Button>
                <Button variant="outlined" startIcon={<EditIcon />}>Grade Proctoring</Button>
            </Box>
        </Box>
    );
}

export default function PersonalReportPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState(0);

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <IconButton onClick={() => router.push('/candidates')}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h4" fontWeight="bold">Personal Report</Typography>
            </Box>

            {/* Tabs */}
            <Paper sx={{ mb: 3 }}>
                <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto">
                    <Tab label="Summary" />
                    <Tab label="Notes" icon={<NoteIcon />} iconPosition="start" />
                    <Tab label="Aggregated Reports" icon={<BarChartIcon />} iconPosition="start" />
                    <Tab label="Questions" icon={<QuizIcon />} iconPosition="start" />
                    <Tab label="Charts" icon={<InsightsIcon />} iconPosition="start" />
                    <Tab label="Special Requests" />
                    <Tab label="Proctoring" icon={<SecurityIcon />} iconPosition="start" />
                </Tabs>
            </Paper>

            {/* Tab Content */}
            <Box sx={{ py: 2 }}>
                {activeTab === 0 && <SummaryTab data={mockAttemptData} />}
                {activeTab === 1 && <NotesTab />}
                {activeTab === 2 && <AggregatedReportsTab />}
                {activeTab === 3 && <QuestionsTab />}
                {activeTab === 4 && <ChartsTab />}
                {activeTab === 5 && <SpecialRequestsTab />}
                {activeTab === 6 && <ProctoringReportTab />}
            </Box>
        </Box>
    );
}
