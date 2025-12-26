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
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import AddIcon from '@mui/icons-material/Add';

// Icons for the Grid
import CheckBoxIcon from '@mui/icons-material/CheckBox'; // Multiple choice
import SubjectIcon from '@mui/icons-material/Subject'; // Free text
import LinearScaleIcon from '@mui/icons-material/LinearScale'; // Likert scale
import QueueIcon from '@mui/icons-material/Queue'; // Existing

import InlineTextEditor from './InlineTextEditor';

interface Answer {
    id: string;
    text: string;
}

interface Question {
    id: string;
    text: string;
    type: 'single' | 'multiple' | 'free_text' | 'likert';
    answers: Answer[]; // For MC and Likert columns
}

interface SurveyUnitConfig {
    html?: string;
    questions?: Question[];
}

interface SurveyUnitEditorProps {
    unitId: string;
    courseId: string;
    config: SurveyUnitConfig;
    onConfigChange: (config: SurveyUnitConfig) => void;
    onTitleChange?: (title: string) => void;
    title?: string;
}

export default function SurveyUnitEditor({
    unitId,
    courseId,
    config,
    onConfigChange,
    onTitleChange,
    title = '',
}: SurveyUnitEditorProps) {
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [localTitle, setLocalTitle] = useState(title);
    const [showGrid, setShowGrid] = useState(false);
    const titleInputRef = useRef<HTMLInputElement>(null);

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

    // --- Question Type Handler ---
    const handleAddQuestionType = (type: string) => {
        const newQuestion: Question = {
            id: Date.now().toString(),
            text: '',
            type: 'single', // Default fallback
            answers: [],
        };

        switch (type) {
            case 'multiple_choice':
                newQuestion.type = 'single'; // Default to single choice radio, can toggle
                newQuestion.answers = [
                    { id: Date.now().toString(), text: 'Option 1' },
                    { id: (Date.now() + 1).toString(), text: 'Option 2' },
                ];
                break;
            case 'free_text':
                newQuestion.type = 'free_text';
                break;
            case 'likert':
                newQuestion.type = 'likert';
                newQuestion.answers = [
                    { id: '1', text: 'Strongly Disagree' },
                    { id: '2', text: 'Disagree' },
                    { id: '3', text: 'Neutral' },
                    { id: '4', text: 'Agree' },
                    { id: '5', text: 'Strongly Agree' },
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
        };

        updateQuestion(qId, { answers: [...question.answers, newAnswer] });
    };

    const updateAnswer = (qId: string, aId: string, updates: Partial<Answer>) => {
        const question = questions.find((q) => q.id === qId);
        if (!question) return;

        const updatedAnswers = question.answers.map((a) => (a.id === aId ? { ...a, ...updates } : a));
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
                width: '100%', // Take full width of grid cell
                maxWidth: 200, // But limit max width
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
                            {localTitle || 'Survey unit'}
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
                                            placeholder={`Question ${index + 1}`}
                                            value={q.text}
                                            onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
                                            sx={{ mb: 2, '& .MuiOutlinedInput-root': { bgcolor: '#fff' } }}
                                        />

                                        {/* --- TYPE SPECIFIC EDITORS --- */}

                                        {/* Multiple / Single Choice & Likert (Similar structure) */}
                                        {(q.type === 'single' || q.type === 'multiple' || q.type === 'likert') && (
                                            <Box sx={{ pl: 1 }}>
                                                {q.type === 'likert' && (
                                                    <Typography variant="body2" sx={{ mb: 1, color: '#718096' }}>
                                                        Defining scale steps:
                                                    </Typography>
                                                )}
                                                {q.answers.map((a) => (
                                                    <Box key={a.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                                        {q.type === 'single' && <Radio disabled size="small" />}
                                                        {q.type === 'multiple' && <Checkbox disabled size="small" />}
                                                        {q.type === 'likert' && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#cbd5e0', mr: 1 }} />}

                                                        <TextField
                                                            fullWidth
                                                            size="small"
                                                            placeholder="Option text"
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
                                                    Add option
                                                </Button>
                                            </Box>
                                        )}

                                        {/* Free Text */}
                                        {q.type === 'free_text' && (
                                            <Box sx={{ p: 2, bgcolor: '#f7fafc', borderRadius: 1, color: '#718096', fontStyle: 'italic' }}>
                                                Free text response area will be shown to the user.
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
                                                label={<Typography variant="body2">Multiple answers allowed</Typography>}
                                            />
                                        )}
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
                                Add questions from the list below to create your survey.
                            </Typography>
                        </Box>
                    )}

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
                        {/* 1. Multiple Choice */}
                        <QuestionTypeCard
                            icon={<CheckBoxIcon sx={{ fontSize: 40 }} />}
                            label="Multiple choice"
                            onClick={() => handleAddQuestionType('multiple_choice')}
                        />
                        {/* 2. Free Text */}
                        <QuestionTypeCard
                            icon={<SubjectIcon sx={{ fontSize: 40 }} />}
                            label="Free text"
                            onClick={() => handleAddQuestionType('free_text')}
                        />
                        {/* 3. Likert scale */}
                        <QuestionTypeCard
                            icon={<LinearScaleIcon sx={{ fontSize: 40 }} />}
                            label="Likert scale"
                            onClick={() => handleAddQuestionType('likert')}
                        />

                        {/* 4. Existing */}
                        <Grid container justifyContent="center" sx={{ width: '100%', mt: 2 }}>
                            <QuestionTypeCard
                                icon={<QueueIcon sx={{ fontSize: 40 }} />}
                                label="Existing question"
                                onClick={() => { alert('Question bank selector coming soon.'); }}
                            />
                        </Grid>
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

        </Box>
    );
}
