'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    IconButton,
    Alert,
} from '@mui/material';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import StopIcon from '@mui/icons-material/Stop';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import CloseIcon from '@mui/icons-material/Close';

interface MediaRecorderDialogProps {
    open: boolean;
    onClose: () => void;
    mode: 'video' | 'audio' | 'screen';
    onRecordingComplete: (blob: Blob, mimeType: string) => Promise<void>;
}

export default function MediaRecorderDialog({
    open,
    onClose,
    mode,
    onRecordingComplete,
}: MediaRecorderDialogProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const liveVideoRef = useRef<HTMLVideoElement>(null);
    const playbackVideoRef = useRef<HTMLVideoElement>(null);
    const playbackAudioRef = useRef<HTMLAudioElement>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const getTitle = () => {
        switch (mode) {
            case 'video':
                return 'Record Video';
            case 'audio':
                return 'Record Audio';
            case 'screen':
                return 'Record Screen';
        }
    };

    const startRecording = async () => {
        try {
            setError(null);
            chunksRef.current = [];

            let stream: MediaStream;

            if (mode === 'screen') {
                stream = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                    audio: true,
                });
            } else if (mode === 'video') {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true,
                });
            } else {
                // audio only
                stream = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                });
            }

            streamRef.current = stream;

            // Set up live preview for video/screen
            if ((mode === 'video' || mode === 'screen') && liveVideoRef.current) {
                liveVideoRef.current.srcObject = stream;
                liveVideoRef.current.play();
            }

            // Create MediaRecorder
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: mode === 'audio'
                    ? 'audio/webm'
                    : 'video/webm',
            });

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, {
                    type: mode === 'audio' ? 'audio/webm' : 'video/webm',
                });
                setRecordedBlob(blob);

                // Stop all tracks
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach((track) => track.stop());
                }
            };

            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            // Start timer
            timerRef.current = setInterval(() => {
                setRecordingTime((prev) => prev + 1);
            }, 1000);
        } catch (err: any) {
            console.error('Recording error:', err);
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setError('Permission denied. Please allow access to your camera/microphone.');
            } else if (err.name === 'NotFoundError') {
                setError('No camera or microphone found.');
            } else {
                setError(err.message || 'Failed to start recording');
            }
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setIsPaused(false);

            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
    };

    const pauseRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            if (isPaused) {
                mediaRecorderRef.current.resume();
                setIsPaused(false);
            } else {
                mediaRecorderRef.current.pause();
                setIsPaused(true);
            }
        }
    };

    const playRecording = () => {
        if (!recordedBlob) return;

        if (mode === 'audio' && playbackAudioRef.current) {
            playbackAudioRef.current.src = URL.createObjectURL(recordedBlob);
            playbackAudioRef.current.play();
            setIsPlaying(true);
        } else if (playbackVideoRef.current) {
            playbackVideoRef.current.src = URL.createObjectURL(recordedBlob);
            playbackVideoRef.current.play();
            setIsPlaying(true);
        }
    };

    const handleUseRecording = async () => {
        if (!recordedBlob) return;

        setIsProcessing(true);
        try {
            const mimeType = mode === 'audio' ? 'audio/webm' : 'video/webm';
            await onRecordingComplete(recordedBlob, mimeType);
            handleClose();
        } catch (err: any) {
            setError(err.message || 'Failed to save recording');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleClose = () => {
        // Clean up
        if (isRecording) {
            stopRecording();
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
        }
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        setRecordedBlob(null);
        setIsRecording(false);
        setIsPaused(false);
        setIsPlaying(false);
        setError(null);
        setRecordingTime(0);
        onClose();
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {getTitle()}
                    </Typography>
                    <IconButton onClick={handleClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {/* Live Preview */}
                {!recordedBlob && (mode === 'video' || mode === 'screen') && (
                    <Box
                        sx={{
                            width: '100%',
                            aspectRatio: '16/9',
                            bgcolor: '#000',
                            borderRadius: 2,
                            overflow: 'hidden',
                            mb: 2,
                            position: 'relative',
                        }}
                    >
                        <video
                            ref={liveVideoRef}
                            autoPlay
                            muted
                            playsInline
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                        {isRecording && (
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: 16,
                                    left: 16,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    bgcolor: 'rgba(0,0,0,0.7)',
                                    px: 2,
                                    py: 1,
                                    borderRadius: 2,
                                }}
                            >
                                <FiberManualRecordIcon sx={{ color: '#e53e3e', fontSize: 16 }} />
                                <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600 }}>
                                    {formatTime(recordingTime)}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                )}

                {/* Audio Recording Indicator */}
                {!recordedBlob && mode === 'audio' && (
                    <Box
                        sx={{
                            textAlign: 'center',
                            py: 8,
                            bgcolor: '#f7fafc',
                            borderRadius: 2,
                            mb: 2,
                        }}
                    >
                        {isRecording && (
                            <>
                                <FiberManualRecordIcon
                                    sx={{
                                        fontSize: 64,
                                        color: '#e53e3e',
                                        animation: 'pulse 1.5s ease-in-out infinite',
                                        '@keyframes pulse': {
                                            '0%, 100%': { opacity: 1 },
                                            '50%': { opacity: 0.5 },
                                        },
                                    }}
                                />
                                <Typography variant="h6" sx={{ mt: 2, fontWeight: 700 }}>
                                    {formatTime(recordingTime)}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#718096' }}>
                                    Recording...
                                </Typography>
                            </>
                        )}
                        {!isRecording && (
                            <Typography variant="body2" sx={{ color: '#a0aec0' }}>
                                Click "Start Recording" to begin
                            </Typography>
                        )}
                    </Box>
                )}

                {/* Playback Preview */}
                {recordedBlob && (
                    <Box sx={{ mb: 2 }}>
                        {mode === 'audio' ? (
                            <Box sx={{ textAlign: 'center', py: 4, bgcolor: '#f7fafc', borderRadius: 2 }}>
                                <audio
                                    ref={playbackAudioRef}
                                    controls
                                    style={{ width: '100%', maxWidth: 400 }}
                                    onEnded={() => setIsPlaying(false)}
                                />
                            </Box>
                        ) : (
                            <Box
                                sx={{
                                    width: '100%',
                                    aspectRatio: '16/9',
                                    bgcolor: '#000',
                                    borderRadius: 2,
                                    overflow: 'hidden',
                                }}
                            >
                                <video
                                    ref={playbackVideoRef}
                                    controls
                                    playsInline
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                    onEnded={() => setIsPlaying(false)}
                                />
                            </Box>
                        )}
                    </Box>
                )}

                {/* Recording Controls */}
                {!recordedBlob && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                        {!isRecording ? (
                            <Button
                                variant="contained"
                                color="error"
                                startIcon={<FiberManualRecordIcon />}
                                onClick={startRecording}
                                sx={{ px: 4 }}
                            >
                                Start Recording
                            </Button>
                        ) : (
                            <>
                                <Button
                                    variant="outlined"
                                    startIcon={isPaused ? <PlayArrowIcon /> : <PauseIcon />}
                                    onClick={pauseRecording}
                                >
                                    {isPaused ? 'Resume' : 'Pause'}
                                </Button>
                                <Button
                                    variant="contained"
                                    color="error"
                                    startIcon={<StopIcon />}
                                    onClick={stopRecording}
                                    sx={{ px: 4 }}
                                >
                                    Stop
                                </Button>
                            </>
                        )}
                    </Box>
                )}
            </DialogContent>

            {recordedBlob && (
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button onClick={() => setRecordedBlob(null)} disabled={isProcessing}>
                        Re-record
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleUseRecording}
                        disabled={isProcessing}
                        sx={{ bgcolor: '#3182ce', px: 3 }}
                    >
                        {isProcessing ? 'Uploading...' : 'Use this recording'}
                    </Button>
                </DialogActions>
            )}
        </Dialog>
    );
}
