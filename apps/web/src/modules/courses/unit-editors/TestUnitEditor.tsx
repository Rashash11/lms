'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    IconButton,
    Paper,
    FormControlLabel,
    Checkbox,
    Radio,
    Divider,
    Grid,
    Tooltip,
    Alert,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';

// Icons for the Grid
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CheckBoxIcon from '@mui/icons-material/CheckBox'; // Multiple choice
import LinearScaleIcon from '@mui/icons-material/LinearScale'; // Fill gaps
import SwapVertIcon from '@mui/icons-material/SwapVert'; // Ordering
import CompareArrowsIcon from '@mui/icons-material/CompareArrows'; // Match pairs
import SubjectIcon from '@mui/icons-material/Subject'; // Free text
import CasinoIcon from '@mui/icons-material/Casino'; // Randomized (Dice)
import InputIcon from '@mui/icons-material/Input'; // Import
import QueueIcon from '@mui/icons-material/Queue'; // Existing

import InlineTextEditor from './InlineTextEditor';

interface Answer {
    id: string;
    text: string;
    correct: boolean;
    matchText?: string; // For pair matching
}

interface Question {
    id: string;
    text: string;
    type: 'single' | 'multiple' | 'free_text' | 'ordering' | 'match' | 'gap';
    answers: Answer[];
    points: number;
}

interface TestUnitConfig {
    html?: string;
    questions?: Question[];
    duration?: number;
    passScore?: number;
    shuffle?: boolean;
}

interface TestUnitEditorProps {
    unitId: string;
    courseId: string;
    config: TestUnitConfig;
    onConfigChange: (config: TestUnitConfig) => void;
    onTitleChange?: (title: string) => void;
    title?: string;
}

export default function TestUnitEditor({
    unitId,
    courseId,
    config,
    onConfigChange,
    onTitleChange,
    title = '',
}: TestUnitEditorProps) {
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [localTitle, setLocalTitle] = useState(title);
    const [showGrid, setShowGrid] = useState(false);
    const titleInputRef = useRef<HTMLInputElement>(null);

    // AI Generation State
    const [aiModalOpen, setAiModalOpen] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const questions = config.questions || [];

    useEffect(() => {
        setLocalTitle(title);
    }, [title]);

    const handleTitleBlur = () => {
        setIsEditingTitle(false);
        if (localTitle.trim() && localTitle !== title) {
            onTitleChange?.(localTitle);
        } else {
            setLocalTitle(title);
        }
    };

    const handleTitleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleTitleBlur();
        if (e.key === 'Escape') {
            setLocalTitle(title);
            setIsEditingTitle(false);
        }
    };

    // --- AI Generation Logic ---
    const handleOpenAI = () => {
        setAiPrompt('');
        setAiModalOpen(true);
    };

    const handleGenerateQuestion = async () => {
        if (!aiPrompt.trim()) return;
        setIsGenerating(true);

        // Simulate API call for now
        setTimeout(() => {
            const generatedQuestion: Question = {
                id: Date.now().toString(),
                text: `Generated: What is the primary concept behind ${aiPrompt}?`,
                type: 'single',
                answers: [
                    { id: '1', text: 'Option A (Correct)', correct: true },
                    { id: '2', text: 'Option B', correct: false },
                    { id: '3', text: 'Option C', correct: false },
                    { id: '4', text: 'Option D', correct: false },
                ],
                points: 1,
            };

            onConfigChange({
                ...config,
                questions: [...questions, generatedQuestion],
            });
            setIsGenerating(false);
            setAiModalOpen(false);
            setShowGrid(false);
        }, 1500);
    };

    // --- Question Type Handler ---
    const handleAddQuestionType = (type: string) => {
        const newQuestion: Question = {
            id: Date.now().toString(),
            text: '',
            type: 'single', // Default fallback
            answers: [], // Initial state depends on type
            points: 1,
        };

        switch (type) {
            case 'multiple_choice':
                newQuestion.type = 'single'; // Default to single choice radio, can toggle
                newQuestion.answers = [
                    { id: Date.now().toString(), text: '', correct: true },
                    { id: (Date.now() + 1).toString(), text: '', correct: false },
                ];
                break;
            case 'free_text':
                newQuestion.type = 'free_text';
                break;
            case 'fill_gaps':
                newQuestion.type = 'gap';
                newQuestion.text = 'The capital of France is [Paris] and it is in [Europe].';
                break;
            case 'ordering':
                newQuestion.type = 'ordering';
                newQuestion.answers = [
                    { id: Date.now().toString(), text: 'First Step', correct: true },
                    { id: (Date.now() + 1).toString(), text: 'Second Step', correct: true },
                    { id: (Date.now() + 2).toString(), text: 'Third Step', correct: true },
                ];
                break;
            case 'match_pairs':
                newQuestion.type = 'match';
                newQuestion.answers = [
                    { id: Date.now().toString(), text: 'Apple', matchText: 'Red', correct: true },
                    { id: (Date.now() + 1).toString(), text: 'Banana', matchText: 'Yellow', correct: true },
                ];
                break;
            default:
                break;
        }

        onConfigChange({
            ...config,
            questions: [...questions, newQuestion],
        });
        setShowGrid(false);
    };

    const handleDeleteQuestion = (qId: string) => {
        onConfigChange({
            ...config,
            questions: questions.filter((q) => q.id !== qId),
        });
    };

    const updateQuestion = (qId: string, updates: Partial<Question>) => {
        onConfigChange({
            ...config,
            questions: questions.map((q) => (q.id === qId ? { ...q, ...updates } : q)),
        });
    };

    const handleAddAnswer = (qId: string) => {
        const question = questions.find((q) => q.id === qId);
        if (!question) return;

        const newAnswer: Answer = {
            id: Date.now().toString(),
            text: '',
            matchText: question.type === 'match' ? '' : undefined,
            correct: question.type !== 'single' && question.type !== 'multiple', // True by default for ordering/matching
        };

        updateQuestion(qId, { answers: [...question.answers, newAnswer] });
    };

    const updateAnswer = (qId: string, aId: string, updates: Partial<Answer>) => {
        const question = questions.find((q) => q.id === qId);
        if (!question) return;

        const updatedAnswers = question.answers.map((a) => (a.id === aId ? { ...a, ...updates } : a));

        // Logic for single choice exclusivity
        if (question.type === 'single' && updates.correct) {
            updatedAnswers.forEach((a) => {
                if (a.id !== aId) a.correct = false;
            });
        }

        updateQuestion(qId, { answers: updatedAnswers });
    };

    const handleDeleteAnswer = (qId: string, aId: string) => {
        const question = questions.find((q) => q.id === qId);
        if (!question) return;
        updateQuestion(qId, { answers: question.answers.filter((a) => a.id !== aId) });
    };

    // Components for the Grid Logic
    const QuestionTypeCard = ({ icon, label, onClick, highlight = false }: { icon: React.ReactNode, label: string, onClick: () => void, highlight?: boolean }) => (
        <Paper
            onClick={onClick}
            elevation={0}
            sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                border: '1px solid',
                borderColor: highlight ? '#3182ce' : '#e2e8f0',
                borderRadius: '8px',
                height: 160,
                transition: 'all 0.2s',
                '&:hover': {
                    borderColor: '#3182ce',
                    boxShadow: '0 4px 12px rgba(49, 130, 206, 0.1)',
                    transform: 'translateY(-2px)'
                }
            }}
        >
            <Box sx={{ color: highlight ? '#3182ce' : '#4a5568', mb: 2 }}>
                {icon}
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#2d3748', textAlign: 'center' }}>
                {label}
            </Typography>
        </Paper>
    );

    return (
        <Box sx={{ minHeight: '60vh' }}>
            {/* Header */}
            <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                    {isEditingTitle ? (
                        <TextField
                            variant="standard"
                            value={localTitle}
                            onChange={(e) => setLocalTitle(e.target.value)}
                            onBlur={handleTitleBlur}
                            onKeyDown={handleTitleKeyDown}
                            autoFocus
                            inputRef={titleInputRef}
                            fullWidth
                            sx={{
                                '& .MuiInput-root': {
                                    fontSize: '1.75rem',
                                    fontWeight: 700,
                                    color: '#2d3748',
                                    fontFamily: '"Inter", "Segoe UI", sans-serif',
                                    '&:before, &:after': { display: 'none' }
                                },
                                '& input': { padding: '4px 0' }
                            }}
                        />
                    ) : (
                        <Typography
                            variant="h1"
                            onClick={() => setIsEditingTitle(true)}
                            sx={{
                                fontSize: '1.75rem',
                                fontWeight: 700,
                                color: '#2d3748',
                                fontFamily: '"Inter", "Segoe UI", sans-serif',
                                cursor: 'text',
                                '&:hover': { bgcolor: 'rgba(0,0,0,0.02)', borderRadius: '4px' }
                            }}
                        >
                            {localTitle || 'Test unit'}
                        </Typography>
                    )}
                </Box>
            </Box>

            {/* Description */}
            <Box sx={{ mb: 4 }}>
                <InlineTextEditor
                    content={config.html || ''}
                    onChange={(html) => onConfigChange({ ...config, html })}
                    placeholder="Add description here"
                />
            </Box>

            {/* Question List */}
            {questions.length > 0 && (
                <Box sx={{ mb: 6 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {questions.map((q, index) => (
                            <Paper key={q.id} sx={{ p: 3, border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                                    <Box sx={{ mt: 1, color: '#cbd5e0', cursor: 'grab' }}>
                                        <DragIndicatorIcon />
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        {/* Question Text / Prompt */}
                                        <TextField
                                            fullWidth
                                            multiline
                                            variant="outlined"
                                            placeholder={q.type === 'gap' ? "Enter text with [answers] in brackets..." : `Question ${index + 1}`}
                                            value={q.text}
                                            onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
                                            helperText={q.type === 'gap' ? "Use square brackets [] to define the matching words." : undefined}
                                            sx={{ mb: 2, '& .MuiOutlinedInput-root': { bgcolor: '#fff' } }}
                                        />

                                        {/* --- TYPE SPECIFIC EDITORS --- */}

                                        {/* Multiple / Single Choice */}
                                        {(q.type === 'single' || q.type === 'multiple') && (
                                            <Box sx={{ pl: 1 }}>
                                                {q.answers.map((a) => (
                                                    <Box key={a.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                                        {q.type === 'single' ? (
                                                            <Radio
                                                                checked={a.correct}
                                                                onChange={() => updateAnswer(q.id, a.id, { correct: true })}
                                                                size="small"
                                                                sx={{ color: a.correct ? '#48bb78' : undefined }}
                                                            />
                                                        ) : (
                                                            <Checkbox
                                                                checked={a.correct}
                                                                onChange={(e) => updateAnswer(q.id, a.id, { correct: e.target.checked })}
                                                                size="small"
                                                                sx={{ color: a.correct ? '#48bb78' : undefined }}
                                                            />
                                                        )}
                                                        <TextField
                                                            fullWidth
                                                            size="small"
                                                            placeholder="Answer text"
                                                            value={a.text}
                                                            onChange={(e) => updateAnswer(q.id, a.id, { text: e.target.value })}
                                                            sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#f9fafb' } }}
                                                        />
                                                        <IconButton size="small" onClick={() => handleDeleteAnswer(q.id, a.id)}>
                                                            <DeleteIcon fontSize="small" sx={{ color: '#cbd5e0' }} />
                                                        </IconButton>
                                                    </Box>
                                                ))}
                                                <Button
                                                    size="small"
                                                    startIcon={<AddIcon />}
                                                    onClick={() => handleAddAnswer(q.id)}
                                                    sx={{ mt: 1, textTransform: 'none', color: '#718096' }}
                                                >
                                                    Add answer
                                                </Button>
                                            </Box>
                                        )}

                                        {/* Free Text */}
                                        {q.type === 'free_text' && (
                                            <Box sx={{ p: 2, bgcolor: '#f7fafc', borderRadius: 1, color: '#718096', fontStyle: 'italic' }}>
                                                This requires a manual grading or keyword match. Users will see a text area.
                                            </Box>
                                        )}

                                        {/* Ordering */}
                                        {q.type === 'ordering' && (
                                            <Box sx={{ pl: 1 }}>
                                                <Typography variant="body2" sx={{ mb: 1, color: '#718096' }}>
                                                    Define the correct order:
                                                </Typography>
                                                {q.answers.map((a, i) => (
                                                    <Box key={a.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                                        <Typography sx={{ color: '#a0aec0', fontWeight: 600, width: 20 }}>{i + 1}.</Typography>
                                                        <TextField
                                                            fullWidth
                                                            size="small"
                                                            placeholder={`Item ${i + 1}`}
                                                            value={a.text}
                                                            onChange={(e) => updateAnswer(q.id, a.id, { text: e.target.value })}
                                                            sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#f9fafb' } }}
                                                        />
                                                        <IconButton size="small" onClick={() => handleDeleteAnswer(q.id, a.id)}>
                                                            <DeleteIcon fontSize="small" sx={{ color: '#cbd5e0' }} />
                                                        </IconButton>
                                                    </Box>
                                                ))}
                                                <Button
                                                    size="small"
                                                    startIcon={<AddIcon />}
                                                    onClick={() => handleAddAnswer(q.id)}
                                                    sx={{ mt: 1, textTransform: 'none', color: '#718096' }}
                                                >
                                                    Add item
                                                </Button>
                                            </Box>
                                        )}

                                        {/* Match Pairs */}
                                        {q.type === 'match' && (
                                            <Box sx={{ pl: 1 }}>
                                                <Typography variant="body2" sx={{ mb: 1, color: '#718096' }}>
                                                    Define the matching pairs:
                                                </Typography>
                                                {q.answers.map((a) => (
                                                    <Box key={a.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                                        <TextField
                                                            fullWidth
                                                            size="small"
                                                            placeholder="Item A"
                                                            value={a.text}
                                                            onChange={(e) => updateAnswer(q.id, a.id, { text: e.target.value })}
                                                            sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#f9fafb' } }}
                                                        />
                                                        <CompareArrowsIcon sx={{ color: '#cbd5e0' }} />
                                                        <TextField
                                                            fullWidth
                                                            size="small"
                                                            placeholder="Item B (Match)"
                                                            value={a.matchText || ''}
                                                            onChange={(e) => updateAnswer(q.id, a.id, { matchText: e.target.value })}
                                                            sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#f9fafb' } }}
                                                        />
                                                        <IconButton size="small" onClick={() => handleDeleteAnswer(q.id, a.id)}>
                                                            <DeleteIcon fontSize="small" sx={{ color: '#cbd5e0' }} />
                                                        </IconButton>
                                                    </Box>
                                                ))}
                                                <Button
                                                    size="small"
                                                    startIcon={<AddIcon />}
                                                    onClick={() => handleAddAnswer(q.id)}
                                                    sx={{ mt: 1, textTransform: 'none', color: '#718096' }}
                                                >
                                                    Add pair
                                                </Button>
                                            </Box>
                                        )}

                                        {/* Fill Gaps */}
                                        {q.type === 'gap' && (
                                            <Box sx={{ p: 2, bgcolor: '#f7fafc', borderRadius: 1 }}>
                                                <Typography variant="body2" sx={{ color: '#718096', mb: 1 }}>
                                                    Preview of gaps:
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                                                    {q.text.split(/(\[.*?\])/).map((part, i) => (
                                                        part.startsWith('[') && part.endsWith(']') ? (
                                                            <span key={i} style={{ backgroundColor: '#fed7d7', padding: '0 4px', borderRadius: '4px', color: '#c53030' }}>
                                                                {part}
                                                            </span>
                                                        ) : <span key={i}>{part}</span>
                                                    ))}
                                                </Typography>
                                            </Box>
                                        )}

                                    </Box>
                                    <IconButton onClick={() => handleDeleteQuestion(q.id)} sx={{ color: '#e53e3e' }}>
                                        <DeleteIcon />
                                    </IconButton>
                                </Box>

                                <Divider sx={{ my: 2 }} />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        {(q.type === 'single' || q.type === 'multiple') && (
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={q.type === 'multiple'}
                                                        onChange={(e) => updateQuestion(q.id, { type: e.target.checked ? 'multiple' : 'single' })}
                                                        size="small"
                                                    />
                                                }
                                                label={<Typography variant="body2">Multiple correct answers</Typography>}
                                            />
                                        )}
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="body2" sx={{ color: '#718096' }}>Points:</Typography>
                                        <TextField
                                            type="number"
                                            size="small"
                                            value={q.points}
                                            onChange={(e) => updateQuestion(q.id, { points: parseInt(e.target.value) || 0 })}
                                            sx={{ width: 80 }}
                                        />
                                    </Box>
                                </Box>
                            </Paper>
                        ))}
                    </Box>
                </Box>
            )}

            {/* Empty State / Add Question Grid */}
            {(questions.length === 0 || showGrid) ? (
                <Box>
                    {questions.length === 0 && (
                        <Box sx={{ textAlign: 'center', mb: 4 }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#2d3748', mb: 1 }}>
                                There are no questions yet!
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#718096' }}>
                                Add questions from the list below to create your test.
                            </Typography>
                        </Box>
                    )}

                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                        {/* 1. AI Generation */}
                        <QuestionTypeCard
                            icon={<AutoAwesomeIcon sx={{ fontSize: 40 }} />}
                            label="AI generation"
                            onClick={handleOpenAI}
                            highlight
                        />
                        {/* 2. Multiple Choice */}
                        <QuestionTypeCard
                            icon={<CheckBoxIcon sx={{ fontSize: 40 }} />}
                            label="Multiple choice"
                            onClick={() => handleAddQuestionType('multiple_choice')}
                        />
                        {/* 3. Fill gaps */}
                        <QuestionTypeCard
                            icon={<LinearScaleIcon sx={{ fontSize: 40 }} />}
                            label="Fill the gaps"
                            onClick={() => handleAddQuestionType('fill_gaps')}
                        />

                        {/* 4. Ordering */}
                        <QuestionTypeCard
                            icon={<SwapVertIcon sx={{ fontSize: 40 }} />}
                            label="Ordering"
                            onClick={() => handleAddQuestionType('ordering')}
                        />
                        {/* 5. Match pairs */}
                        <QuestionTypeCard
                            icon={<CompareArrowsIcon sx={{ fontSize: 40 }} />}
                            label="Match the pairs"
                            onClick={() => handleAddQuestionType('match_pairs')}
                        />
                        {/* 6. Free text */}
                        <QuestionTypeCard
                            icon={<SubjectIcon sx={{ fontSize: 40 }} />}
                            label="Free text"
                            onClick={() => handleAddQuestionType('free_text')}
                        />

                        {/* 7. Randomized */}
                        <QuestionTypeCard
                            icon={<CasinoIcon sx={{ fontSize: 40 }} />}
                            label="Randomized"
                            onClick={() => { alert('Randomized needs a question bank to function.'); }}
                        />
                        {/* 8. Import */}
                        <QuestionTypeCard
                            icon={<InputIcon sx={{ fontSize: 40 }} />}
                            label="Import questions"
                            onClick={() => { alert('Import wizard coming soon.'); }}
                        />
                        {/* 9. Existing */}
                        <QuestionTypeCard
                            icon={<QueueIcon sx={{ fontSize: 40 }} />}
                            label="Existing question"
                            onClick={() => { alert('Question bank selector coming soon.'); }}
                        />
                    </Box>
                </Box>
            ) : (
                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                    <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => setShowGrid(true)}
                        sx={{
                            borderWidth: 2,
                            borderColor: '#3182ce',
                            color: '#3182ce',
                            fontWeight: 700,
                            px: 4, py: 1,
                            textTransform: 'none',
                            '&:hover': { borderWidth: 2, bgcolor: '#ebf8ff' }
                        }}
                    >
                        Add question
                    </Button>
                </Box>
            )}

            {/* AI Generation Modal */}
            <Dialog open={aiModalOpen} onClose={() => setAiModalOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Generate Questions with AI</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                        Describe the topic or content you want to generate a question for.
                    </Typography>
                    <TextField
                        autoFocus
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="E.g., Key concepts of Quantum Physics..."
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        disabled={isGenerating}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAiModalOpen(false)} disabled={isGenerating}>Cancel</Button>
                    <Button
                        onClick={handleGenerateQuestion}
                        variant="contained"
                        disabled={!aiPrompt.trim() || isGenerating}
                        startIcon={isGenerating ? <CircularProgress size={20} color="inherit" /> : <AutoAwesomeIcon />}
                    >
                        {isGenerating ? 'Generating...' : 'Generate'}
                    </Button>
                </DialogActions>
            </Dialog>

        </Box>
    );
}
