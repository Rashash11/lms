'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import {
    Box, Typography, Tabs, Tab, TextField, InputAdornment,
    MenuItem, Select, IconButton, Card, CardContent,
    CardMedia, Skeleton, Button, Stack, Chip, LinearProgress,
    Tooltip, CircularProgress, Dialog, DialogTitle, DialogContent,
    DialogActions, List, ListItem, ListItemAvatar, Avatar, ListItemText,
    ListItemButton, Autocomplete
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import SearchIcon from '@mui/icons-material/Search';
import SortIcon from '@mui/icons-material/Sort';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import EmojiObjectsOutlinedIcon from '@mui/icons-material/EmojiObjectsOutlined';
import BusinessCenterOutlinedIcon from '@mui/icons-material/BusinessCenterOutlined';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { apiFetch } from '@shared/http/apiFetch';

interface Skill {
    id: string;
    name: string;
    description: string;
    image: string | null;
    level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | null;
    progress: number;
    popularity: number;
}

interface JobRole {
    id: string;
    name: string;
    description: string;
    skills: {
        id: string;
        name: string;
        requiredLevel: string;
        weight: number;
    }[];
}

interface Candidate {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    level: string;
    progress: number;
}

function SkillsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    const [tab, setTab] = useState(searchParams.get('tab') || 'all');
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState('suggested');
    const [skills, setSkills] = useState<Skill[]>([]);
    const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });

    // Recommendation Modal State
    const [openRecModal, setOpenRecModal] = useState(false);
    const [recSkill, setRecSkill] = useState<Skill | null>(null);
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loadingCandidates, setLoadingCandidates] = useState(false);
    const [selectedUser, setSelectedUser] = useState<Candidate | null>(null);
    const [recNote, setRecNote] = useState('');
    const [submittingRec, setSubmittingRec] = useState(false);

    const fetchSkills = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                tab,
                search,
                sort,
                page: pagination.page.toString()
            });
            const res = await fetch(`/api/instructor/skills?${params.toString()}`);
            const data = await res.json();
            if (data.skills) {
                setSkills(data.skills);
                setPagination(data.pagination || { total: data.skills.length, page: 1, pages: 1 });
            }
        } catch (error) {
            console.error('Failed to fetch skills:', error);
        } finally {
            setLoading(false);
        }
    }, [tab, search, sort, pagination.page]);

    const fetchJobRoles = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/instructor/job-roles');
            const data = await res.json();
            if (data.jobRoles) {
                setJobRoles(data.jobRoles);
            }
        } catch (error) {
            console.error('Failed to fetch job roles:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (tab === 'job-pathfinder') {
            fetchJobRoles();
        } else {
            fetchSkills();
        }
    }, [tab, fetchSkills, fetchJobRoles]);

    const fetchCandidates = async (skillId: string) => {
        setLoadingCandidates(true);
        try {
            const res = await fetch(`/api/instructor/recommendations/candidates?skillId=${skillId}`);
            const data = await res.json();
            if (data.candidates) {
                setCandidates(data.candidates);
            }
        } catch (error) {
            console.error('Failed to fetch candidates:', error);
        } finally {
            setLoadingCandidates(false);
        }
    };

    useEffect(() => {
        if (recSkill) {
            fetchCandidates(recSkill.id);
        } else {
            setCandidates([]);
        }
    }, [recSkill]);

    const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
        setTab(newValue);
        const params = new URLSearchParams(searchParams);
        params.set('tab', newValue);
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleSkillClick = (skillId: string) => {
        router.push(`/instructor/skills/${skillId}`);
    };

    const handleRecommendSubmit = async () => {
        if (!recSkill || !selectedUser) return;
        setSubmittingRec(true);
        try {
            const data = await apiFetch<{ success: boolean }>('/api/instructor/recommendations', {
                method: 'POST',
                body: {
                    skillId: recSkill.id,
                    userId: selectedUser.id,
                    note: recNote
                }
            });
            if (data.success) {
                setOpenRecModal(false);
                setRecSkill(null);
                setSelectedUser(null);
                setRecNote('');
            }
        } catch (error) {
            console.error('Failed to submit recommendation:', error);
        } finally {
            setSubmittingRec(false);
        }
    };

    return (
        <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h5" fontWeight={600} color="#172B4D">
                        Skills
                    </Typography>
                    <Typography
                        variant="body2"
                        color="primary"
                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', mt: 0.5, fontWeight: 500 }}
                    >
                        How Skills work <InfoOutlinedIcon sx={{ fontSize: 16 }} />
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenRecModal(true)}
                    sx={{
                        bgcolor: '#0052CC',
                        textTransform: 'none',
                        fontWeight: 600,
                        px: 3,
                        '&:hover': { bgcolor: '#0747A6' }
                    }}
                >
                    Recommend skilled users
                </Button>
            </Box>

            {/* Tabs and Controls */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Tabs value={tab} onChange={handleTabChange} sx={{
                    '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: 15, minWidth: 100 },
                    '& .Mui-selected': { color: '#0052CC' },
                    '& .MuiTabs-indicator': { backgroundColor: '#0052CC' }
                }}>
                    <Tab label="All" value="all" />
                    <Tab label="My Skills" value="my" />
                    <Tab label="Job pathfinder" value="job-pathfinder" />
                </Tabs>

                {tab !== 'job-pathfinder' && (
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 1 }}>
                        <TextField
                            placeholder="Search skills"
                            size="small"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon sx={{ color: '#6B778C', fontSize: 20 }} />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ width: 240, '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#F4F5F7', border: 'none' } }}
                        />
                        <Select
                            value={sort}
                            onChange={(e) => setSort(e.target.value)}
                            size="small"
                            startAdornment={<SortIcon sx={{ color: '#6B778C', mr: 1, fontSize: 20 }} />}
                            sx={{ minWidth: 160, borderRadius: 1.5, bgcolor: '#F4F5F7' }}
                        >
                            <MenuItem value="suggested">Suggested</MenuItem>
                            <MenuItem value="alphabetical">Alphabetical</MenuItem>
                            <MenuItem value="popularity">Popularity</MenuItem>
                            <MenuItem value="relevance">Relevance</MenuItem>
                        </Select>
                    </Box>
                )}
            </Box>

            {/* Content Area */}
            {tab === 'job-pathfinder' ? (
                <Grid container spacing={3}>
                    {loading ? (
                        [1, 2, 3].map(i => (
                            <Grid item xs={12} key={i}>
                                <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2 }} />
                            </Grid>
                        ))
                    ) : jobRoles.length > 0 ? (
                        jobRoles.map(role => (
                            <Grid item xs={12} key={role.id}>
                                <Card sx={{ border: '1px solid #DFE1E6', boxShadow: 'none', borderRadius: 2 }}>
                                    <CardContent sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Box>
                                            <Typography variant="h6" fontWeight={600} fontSize={17} color="#172B4D">
                                                {role.name}
                                            </Typography>
                                            <Typography variant="body2" color="#6B778C" sx={{ mb: 2 }}>
                                                {role.description}
                                            </Typography>
                                            <Stack direction="row" spacing={1}>
                                                {role.skills.slice(0, 3).map(skill => (
                                                    <Chip
                                                        key={skill.id}
                                                        label={skill.name}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ fontSize: 12, borderRadius: 1 }}
                                                    />
                                                ))}
                                                {role.skills.length > 3 && (
                                                    <Typography variant="caption" color="primary" sx={{ alignSelf: 'center', cursor: 'pointer' }}>
                                                        +{role.skills.length - 3} more
                                                    </Typography>
                                                )}
                                            </Stack>
                                        </Box>
                                        <Button variant="outlined" sx={{ textTransform: 'none', fontWeight: 600 }}>
                                            View path
                                        </Button>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))
                    ) : (
                        <Box sx={{ p: 4, textAlign: 'center', width: '100%' }}>
                            <BusinessCenterOutlinedIcon sx={{ fontSize: 48, color: '#DFE1E6', mb: 2 }} />
                            <Typography variant="body1" color="#6B778C">No job roles found.</Typography>
                        </Box>
                    )}
                </Grid>
            ) : (
                <Grid container spacing={3}>
                    {loading ? (
                        [1, 2, 3, 4, 5, 6].map(i => (
                            <Grid item xs={12} sm={6} md={3} key={i}>
                                <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 2 }} />
                            </Grid>
                        ))
                    ) : skills.length > 0 ? (
                        skills.map(skill => (
                            <Grid item xs={12} sm={6} md={3} key={skill.id}>
                                <Card
                                    onClick={() => handleSkillClick(skill.id)}
                                    sx={{
                                        border: '1px solid #E8ECEF',
                                        boxShadow: 'none',
                                        borderRadius: 2,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.08)', transform: 'translateY(-2px)' }
                                    }}
                                >
                                    <Box sx={{ position: 'relative', height: 140, bgcolor: '#F4F5F7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {skill.image ? (
                                            <CardMedia component="img" image={skill.image} sx={{ width: 'auto', height: 80 }} />
                                        ) : (
                                            <EmojiObjectsOutlinedIcon sx={{ fontSize: 64, color: '#DFE1E6' }} />
                                        )}
                                        {skill.level && (
                                            <Chip
                                                label={skill.level}
                                                size="small"
                                                sx={{
                                                    position: 'absolute',
                                                    top: 8,
                                                    right: 8,
                                                    bgcolor: 'rgba(255,255,255,0.9)',
                                                    fontSize: 10,
                                                    fontWeight: 700,
                                                    color: '#172B4D'
                                                }}
                                            />
                                        )}
                                    </Box>
                                    <CardContent sx={{ p: 2 }}>
                                        <Typography variant="subtitle1" fontWeight={600} color="#172B4D" noWrap>
                                            {skill.name}
                                        </Typography>
                                        <Box sx={{ mt: 1 }}>
                                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                                                <Typography variant="caption" color="#6B778C">Level</Typography>
                                                <Typography variant="caption" fontWeight={600}>{skill.progress}%</Typography>
                                            </Stack>
                                            <LinearProgress
                                                variant="determinate"
                                                value={skill.progress}
                                                sx={{ height: 6, borderRadius: 3, bgcolor: '#F4F5F7', '& .MuiLinearProgress-bar': { bgcolor: '#F58220' } }}
                                            />
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))
                    ) : (
                        <Box sx={{ p: 8, textAlign: 'center', width: '100%' }}>
                            <EmojiObjectsOutlinedIcon sx={{ fontSize: 64, color: '#DFE1E6', mb: 2 }} />
                            <Typography variant="h6" color="#172B4D" gutterBottom>No skills to show</Typography>
                            <Typography variant="body2" color="#6B778C">
                                {search ? "Try a different search term" : "Check back later for suggested skills"}
                            </Typography>
                        </Box>
                    )}
                </Grid>
            )}

            {/* Recommendation Modal */}
            <Dialog
                open={openRecModal}
                onClose={() => setOpenRecModal(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 700, color: '#172B4D' }}>
                    Recommend skilled users
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="#6B778C" sx={{ mb: 3 }}>
                        Select a skill and search for users you want to recommend.
                    </Typography>

                    <Stack spacing={3}>
                        <Box>
                            <Typography variant="subtitle2" fontWeight={600} gutterBottom>Select Skill</Typography>
                            <Autocomplete
                                options={skills}
                                getOptionLabel={(option) => option.name}
                                value={recSkill}
                                onChange={(e, newValue) => setRecSkill(newValue)}
                                renderInput={(params) => (
                                    <TextField {...params} placeholder="Choose a skill" size="small" />
                                )}
                            />
                        </Box>

                        {recSkill && (
                            <Box>
                                <Typography variant="subtitle2" fontWeight={600} gutterBottom>Select User</Typography>
                                {loadingCandidates ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}><CircularProgress size={24} /></Box>
                                ) : (
                                    <List sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid #DFE1E6', borderRadius: 2 }}>
                                        {candidates.length > 0 ? candidates.map((user) => (
                                            <ListItemButton
                                                key={user.id}
                                                selected={selectedUser?.id === user.id}
                                                onClick={() => setSelectedUser(user)}
                                                sx={{ '&.Mui-selected': { bgcolor: '#DEEBFF' } }}
                                            >
                                                <ListItemAvatar>
                                                    <Avatar src={user.avatar || undefined} sx={{ bgcolor: '#F4F5F7', color: '#6B778C' }}>
                                                        {user.name.charAt(0)}
                                                    </Avatar>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={user.name}
                                                    secondary={`Level: ${user.level} (${user.progress}%)`}
                                                    primaryTypographyProps={{ fontWeight: 600, fontSize: 14 }}
                                                />
                                                {selectedUser?.id === user.id && <CheckCircleIcon sx={{ color: '#0052CC', fontSize: 20 }} />}
                                            </ListItemButton>
                                        )) : (
                                            <ListItem><Typography variant="body2" color="text.secondary">No candidates found for this skill.</Typography></ListItem>
                                        )}
                                    </List>
                                )}
                            </Box>
                        )}

                        <Box>
                            <Typography variant="subtitle2" fontWeight={600} gutterBottom>Add a note (optional)</Typography>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                placeholder="Why are you recommending this user?"
                                value={recNote}
                                onChange={(e) => setRecNote(e.target.value)}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                        </Box>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 0 }}>
                    <Button onClick={() => setOpenRecModal(false)} sx={{ textTransform: 'none', color: '#6B778C' }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        disabled={!recSkill || !selectedUser || submittingRec}
                        onClick={handleRecommendSubmit}
                        sx={{
                            textTransform: 'none',
                            bgcolor: '#0052CC',
                            fontWeight: 600,
                            '&:hover': { bgcolor: '#0747A6' }
                        }}
                    >
                        {submittingRec ? 'Recommending...' : 'Recommend'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Pagination placeholder */}
            {tab !== 'job-pathfinder' && pagination.pages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <Button
                        disabled={pagination.page >= pagination.pages}
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                        Load more skills
                    </Button>
                </Box>
            )}
        </Box>
    );
}

export default function SkillsPage() {
    return (
        <Suspense fallback={
            <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
                <Skeleton variant="rectangular" height={40} sx={{ mb: 3, width: 200 }} />
                <Skeleton variant="rectangular" height={48} sx={{ mb: 3 }} />
                <Grid container spacing={3}>
                    {[1, 2, 3, 4].map(i => (
                        <Grid item xs={12} sm={6} md={3} key={i}>
                            <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
                        </Grid>
                    ))}
                </Grid>
            </Box>
        }>
            <SkillsContent />
        </Suspense>
    );
}
