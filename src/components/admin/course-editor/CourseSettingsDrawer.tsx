import React from 'react';
import {
    Drawer,
    Box,
    Typography,
    IconButton,
    Tabs,
    Tab,
    TextField,
    Button,
    FormControlLabel,
    Switch,
    Select,
    MenuItem,
    FormControl,
    Chip,
    ToggleButton,
    ToggleButtonGroup,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

interface CourseSettingsDrawerProps {
    open: boolean;
    onClose: () => void;
    courseId: string;
    settings: any;
    onSave: (settings: any) => void;
}

export default function CourseSettingsDrawer({
    open,
    onClose,
    courseId,
    settings = {},
    onSave,
}: CourseSettingsDrawerProps) {
    const [currentTab, setCurrentTab] = React.useState(0);
    const [localSettings, setLocalSettings] = React.useState(settings);

    React.useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);

    const handleChange = (field: string, value: any) => {
        const updated = { ...localSettings, [field]: value };
        setLocalSettings(updated);
        onSave(updated);
    };

    const handleSave = () => {
        onSave(localSettings);
        onClose();
    };

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: { width: 580 }
            }}
        >
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#fff' }}>
                {/* Header */}
                <Box sx={{
                    p: 2.5,
                    borderBottom: '1px solid #e0e0e0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.25rem', color: '#000' }}>
                        Course options
                    </Typography>
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>

                {/* Tabs */}
                <Tabs
                    value={currentTab}
                    onChange={(e, v) => setCurrentTab(v)}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                        borderBottom: '1px solid #e0e0e0',
                        minHeight: 48,
                        '& .MuiTabs-indicator': {
                            backgroundColor: '#1976d2',
                            height: 3,
                        },
                        '& .MuiTab-root': {
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            minHeight: 48,
                            color: '#666',
                            letterSpacing: '0.3px',
                            px: 2,
                            minWidth: 'auto',
                            '&.Mui-selected': {
                                color: '#1976d2',
                            }
                        }
                    }}
                >
                    <Tab label="Info" />
                    <Tab label="Availability" />
                    <Tab label="Limits" />
                    <Tab label="Completion" />
                    <Tab label="Clone and translate with AI" />
                </Tabs>

                {/* Tab Content */}
                <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
                    {/* INFO Tab */}
                    {currentTab === 0 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {/* Activation status */}
                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <Box component="span" sx={{ fontSize: '1.2rem' }}>✓</Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                                        Activation status
                                    </Typography>
                                </Box>
                                <Typography variant="body2" sx={{ color: '#666', mb: 2, fontSize: '0.875rem' }}>
                                    Activate course to publish it and allow learners to enroll.
                                </Typography>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={localSettings.isActive || false}
                                            onChange={(e) => handleChange('isActive', e.target.checked)}
                                        />
                                    }
                                    label="Activate course"
                                    sx={{ ml: 0 }}
                                />
                            </Box>

                            {/* Coach */}
                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <Box component="span" sx={{ fontSize: '1.2rem' }}>🎓</Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                                        Coach
                                    </Typography>
                                    <Chip
                                        icon={<AutoAwesomeIcon sx={{ fontSize: 14 }} />}
                                        label="AI"
                                        size="small"
                                        sx={{
                                            height: 20,
                                            fontSize: '0.7rem',
                                            bgcolor: '#ff9800',
                                            color: '#fff',
                                            fontWeight: 600,
                                            '& .MuiChip-icon': { color: '#fff' }
                                        }}
                                    />
                                </Box>
                                <Typography variant="body2" sx={{ color: '#666', mb: 2, fontSize: '0.875rem' }}>
                                    Activate to enhance learning with AI. Coach offers content summarization, question generation, and interactive support to help learners progress faster.
                                </Typography>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={localSettings.coachEnabled || false}
                                            onChange={(e) => handleChange('coachEnabled', e.target.checked)}
                                        />
                                    }
                                    label="Activate Coach"
                                    sx={{ ml: 0 }}
                                />
                            </Box>

                            {/* Code */}
                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <Box component="span" sx={{ fontSize: '1.2rem' }}>🔢</Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                                        Code
                                    </Typography>
                                </Box>
                                <Typography variant="body2" sx={{ color: '#666', mb: 2, fontSize: '0.875rem' }}>
                                    Assign a unique identifier to sort courses in an alphabetical order.
                                </Typography>
                                <TextField
                                    fullWidth
                                    placeholder="Insert code"
                                    value={localSettings.code || ''}
                                    onChange={(e) => handleChange('code', e.target.value)}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: '#f5f5f5',
                                            '& fieldset': { borderColor: '#e0e0e0' },
                                        }
                                    }}
                                />
                            </Box>

                            {/* Category */}
                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <Box component="span" sx={{ fontSize: '1.2rem' }}>📁</Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                                        Category
                                    </Typography>
                                </Box>
                                <Typography variant="body2" sx={{ color: '#666', mb: 2, fontSize: '0.875rem' }}>
                                    Add the course to a suitable category (e.g., Programming, Marketing, etc.).
                                </Typography>
                                <FormControl fullWidth>
                                    <Select
                                        value={localSettings.categoryId || ''}
                                        onChange={(e) => handleChange('categoryId', e.target.value)}
                                        displayEmpty
                                        sx={{
                                            bgcolor: '#f5f5f5',
                                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e0e0e0' },
                                        }}
                                    >
                                        <MenuItem value="" sx={{ fontStyle: 'italic' }}>Select a category</MenuItem>
                                        <MenuItem value="programming">Programming</MenuItem>
                                        <MenuItem value="marketing">Marketing</MenuItem>
                                        <MenuItem value="design">Design</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>

                            {/* Intro video */}
                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <Box component="span" sx={{ fontSize: '1.2rem' }}>▶</Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                                        Intro video
                                    </Typography>
                                </Box>
                                <ToggleButtonGroup
                                    value={localSettings.introVideoType || 'youtube'}
                                    exclusive
                                    onChange={(e, newValue) => newValue && handleChange('introVideoType', newValue)}
                                    fullWidth
                                    sx={{ mb: 2 }}
                                >
                                    <ToggleButton
                                        value="youtube"
                                        sx={{
                                            textTransform: 'none',
                                            fontWeight: 500,
                                            '&.Mui-selected': {
                                                bgcolor: '#e3f2fd',
                                                color: '#1976d2',
                                                '&:hover': { bgcolor: '#bbdefb' }
                                            }
                                        }}
                                    >
                                        Youtube Video
                                    </ToggleButton>
                                    <ToggleButton
                                        value="custom"
                                        sx={{
                                            textTransform: 'none',
                                            fontWeight: 500,
                                            '&.Mui-selected': {
                                                bgcolor: '#e3f2fd',
                                                color: '#1976d2',
                                                '&:hover': { bgcolor: '#bbdefb' }
                                            }
                                        }}
                                    >
                                        Custom Video
                                    </ToggleButton>
                                </ToggleButtonGroup>
                                <Typography variant="body2" sx={{ color: '#666', mb: 2, fontSize: '0.875rem' }}>
                                    Display a YouTube video preview video as part of the course description.
                                </Typography>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, fontSize: '0.875rem' }}>
                                    URL
                                </Typography>
                                <TextField
                                    fullWidth
                                    placeholder="Insert URL"
                                    value={localSettings.introVideoUrl || ''}
                                    onChange={(e) => handleChange('introVideoUrl', e.target.value)}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: '#f5f5f5',
                                            '& fieldset': { borderColor: '#e0e0e0' },
                                        }
                                    }}
                                />
                            </Box>

                            {/* Price */}
                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <Box component="span" sx={{ fontSize: '1.2rem' }}>💰</Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                                        Price
                                    </Typography>
                                </Box>
                                <Typography variant="body2" sx={{ color: '#666', mb: 2, fontSize: '0.875rem' }}>
                                    Set a selling price for the course. You must set up a payment method or activate the Credits feature before entering your price. Otherwise, the listed price will only be indicative.
                                </Typography>
                                <TextField
                                    fullWidth
                                    placeholder="Set price"
                                    type="number"
                                    value={localSettings.price || ''}
                                    onChange={(e) => handleChange('price', parseFloat(e.target.value) || null)}
                                    InputProps={{
                                        endAdornment: <Typography sx={{ color: '#666', fontWeight: 600 }}>$</Typography>
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: '#f5f5f5',
                                            '& fieldset': { borderColor: '#e0e0e0' },
                                        }
                                    }}
                                />
                            </Box>

                            {/* Content lock */}
                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <Box component="span" sx={{ fontSize: '1.2rem' }}>🔒</Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                                        Content lock
                                    </Typography>
                                </Box>
                                <Typography variant="body2" sx={{ color: '#666', mb: 2, fontSize: '0.875rem' }}>
                                    Lock the content of the course to prevent any editing.
                                </Typography>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={localSettings.contentLocked || false}
                                            onChange={(e) => handleChange('contentLocked', e.target.checked)}
                                        />
                                    }
                                    label="Lock content"
                                    sx={{ ml: 0 }}
                                />
                            </Box>
                        </Box>
                    )}

                    {/* AVAILABILITY Tab */}
                    {currentTab === 1 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {/* Catalog visibility */}
                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <Box component="span" sx={{ fontSize: '1.2rem' }}>👁</Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                                        Catalog visibility
                                    </Typography>
                                </Box>
                                <Typography variant="body2" sx={{ color: '#666', mb: 2, fontSize: '0.875rem' }}>
                                    Set whether learners can see this course in the catalog.
                                </Typography>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={localSettings.showInCatalog !== false}
                                            onChange={(e) => handleChange('showInCatalog', e.target.checked)}
                                        />
                                    }
                                    label="Show in catalog"
                                    sx={{ ml: 0 }}
                                />
                            </Box>

                            {/* Capacity */}
                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <Box component="span" sx={{ fontSize: '1.2rem' }}>👥</Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                                        Capacity
                                    </Typography>
                                </Box>
                                <Typography variant="body2" sx={{ color: '#666', mb: 2, fontSize: '0.875rem' }}>
                                    Set a maximum number of learners allowed to self-enroll in the course. Once maximum enrollment is reached, the course will be automatically hidden from the catalog without restricting you from manually enrolling additional learners.
                                </Typography>
                                <TextField
                                    fullWidth
                                    placeholder="Set maximum number"
                                    type="number"
                                    value={localSettings.capacity || ''}
                                    onChange={(e) => handleChange('capacity', parseInt(e.target.value) || null)}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: '#f5f5f5',
                                            '& fieldset': { borderColor: '#e0e0e0' },
                                        }
                                    }}
                                />
                            </Box>

                            {/* Public sharing */}
                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <Box component="span" sx={{ fontSize: '1.2rem' }}>🔗</Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                                        Public sharing
                                    </Typography>
                                    <Chip
                                        icon={<AutoAwesomeIcon sx={{ fontSize: 14 }} />}
                                        label="AI"
                                        size="small"
                                        sx={{
                                            height: 20,
                                            fontSize: '0.7rem',
                                            bgcolor: '#ff9800',
                                            color: '#fff',
                                            fontWeight: 600,
                                            '& .MuiChip-icon': { color: '#fff' }
                                        }}
                                    />
                                </Box>
                                <Typography variant="body2" sx={{ color: '#666', mb: 2, fontSize: '0.875rem' }}>
                                    Make this course public and share it with non-registered users with a link. Users can complete the course anonymously and save their progress upon signing up.
                                </Typography>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={localSettings.publicSharingEnabled || false}
                                            onChange={(e) => handleChange('publicSharingEnabled', e.target.checked)}
                                        />
                                    }
                                    label="Enable public sharing"
                                    sx={{ ml: 0 }}
                                />
                            </Box>

                            {/* Enrollment requests */}
                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <Box component="span" sx={{ fontSize: '1.2rem' }}>📝</Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                                        Enrollment requests
                                    </Typography>
                                </Box>
                                <Typography variant="body2" sx={{ color: '#666', mb: 2, fontSize: '0.875rem' }}>
                                    Enable learners to request enrollment in this course. Available for free courses only.
                                </Typography>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={localSettings.enrollmentRequestEnabled || false}
                                            onChange={(e) => handleChange('enrollmentRequestEnabled', e.target.checked)}
                                            disabled={localSettings.price > 0}
                                        />
                                    }
                                    label="Enable enrollment requests"
                                    sx={{ ml: 0 }}
                                />
                            </Box>
                        </Box>
                    )}

                    {/* LIMITS Tab */}
                    {currentTab === 2 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {/* Time */}
                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <Box component="span" sx={{ fontSize: '1.2rem' }}>🕐</Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                                        Time
                                    </Typography>
                                </Box>
                                <ToggleButtonGroup
                                    value={localSettings.timeLimitType || 'limit'}
                                    exclusive
                                    onChange={(e, newValue) => newValue && handleChange('timeLimitType', newValue)}
                                    fullWidth
                                    sx={{ mb: 2 }}
                                >
                                    <ToggleButton
                                        value="limit"
                                        sx={{
                                            textTransform: 'none',
                                            fontWeight: 500,
                                            '&.Mui-selected': {
                                                bgcolor: '#e3f2fd',
                                                color: '#1976d2',
                                                '&:hover': { bgcolor: '#bbdefb' }
                                            }
                                        }}
                                    >
                                        Time limit
                                    </ToggleButton>
                                    <ToggleButton
                                        value="timeframe"
                                        sx={{
                                            textTransform: 'none',
                                            fontWeight: 500,
                                            '&.Mui-selected': {
                                                bgcolor: '#e3f2fd',
                                                color: '#1976d2',
                                                '&:hover': { bgcolor: '#bbdefb' }
                                            }
                                        }}
                                    >
                                        Timeframe
                                    </ToggleButton>
                                </ToggleButtonGroup>
                                <Typography variant="body2" sx={{ color: '#666', mb: 2, fontSize: '0.875rem' }}>
                                    Set a specific number of days in which learners have to complete the course after enrollment.
                                </Typography>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, fontSize: '0.875rem' }}>
                                    Number of days
                                </Typography>
                                <TextField
                                    fullWidth
                                    placeholder="Set number of days"
                                    type="number"
                                    value={localSettings.timeLimit || ''}
                                    onChange={(e) => handleChange('timeLimit', parseInt(e.target.value) || null)}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: '#f5f5f5',
                                            '& fieldset': { borderColor: '#e0e0e0' },
                                        }
                                    }}
                                />
                            </Box>

                            {/* Access retention */}
                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <Box component="span" sx={{ fontSize: '1.2rem' }}>📂</Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                                        Access retention
                                    </Typography>
                                </Box>
                                <Typography variant="body2" sx={{ color: '#666', mb: 2, fontSize: '0.875rem' }}>
                                    Set if users retain access to course materials after completing the course.
                                </Typography>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={localSettings.accessRetentionEnabled || false}
                                            onChange={(e) => handleChange('accessRetentionEnabled', e.target.checked)}
                                        />
                                    }
                                    label="Activate access retention"
                                    sx={{ ml: 0 }}
                                />
                            </Box>

                            {/* Level */}
                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <Box component="span" sx={{ fontSize: '1.2rem' }}>🏆</Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                                        Level
                                    </Typography>
                                </Box>
                                <Typography variant="body2" sx={{ color: '#666', mb: 2, fontSize: '0.875rem' }}>
                                    Set the gamification level learners must reach to unlock this course.
                                </Typography>
                                <TextField
                                    fullWidth
                                    placeholder="Level"
                                    type="number"
                                    value={localSettings.requiredLevel || ''}
                                    onChange={(e) => handleChange('requiredLevel', parseInt(e.target.value) || null)}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: '#f5f5f5',
                                            '& fieldset': { borderColor: '#e0e0e0' },
                                        }
                                    }}
                                />
                            </Box>
                        </Box>
                    )}

                    {/* COMPLETION Tab */}
                    {currentTab === 3 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {/* Units ordering */}
                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <Box component="span" sx={{ fontSize: '1.2rem' }}>🔀</Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                                        Units ordering
                                    </Typography>
                                </Box>
                                <Typography variant="body2" sx={{ color: '#666', mb: 2, fontSize: '0.875rem' }}>
                                    Set the order in which course units must be completed.
                                </Typography>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, fontSize: '0.875rem' }}>
                                    Show units
                                </Typography>
                                <FormControl fullWidth>
                                    <Select
                                        value={localSettings.unitsOrdering || 'sequential'}
                                        onChange={(e) => handleChange('unitsOrdering', e.target.value)}
                                        sx={{
                                            bgcolor: '#f5f5f5',
                                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e0e0e0' },
                                        }}
                                    >
                                        <MenuItem value="sequential">In a sequential order</MenuItem>
                                        <MenuItem value="any">In any order</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>

                            {/* Completion rules */}
                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <Box component="span" sx={{ fontSize: '1.2rem' }}>✅</Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                                        Completion rules
                                    </Typography>
                                </Box>
                                <Typography variant="body2" sx={{ color: '#666', mb: 2, fontSize: '0.875rem' }}>
                                    Define the conditions required for the course to be marked as completed.
                                </Typography>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, fontSize: '0.875rem' }}>
                                    Course is completed when
                                </Typography>
                                <FormControl fullWidth>
                                    <Select
                                        value={localSettings.completionRule || 'all'}
                                        onChange={(e) => handleChange('completionRule', e.target.value)}
                                        sx={{
                                            bgcolor: '#f5f5f5',
                                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e0e0e0' },
                                        }}
                                    >
                                        <MenuItem value="all">All units are completed</MenuItem>
                                        <MenuItem value="any">Any unit is completed</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>

                            {/* Score calculation */}
                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <Box component="span" sx={{ fontSize: '1.2rem' }}>📊</Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                                        Score calculation
                                    </Typography>
                                </Box>
                                <Typography variant="body2" sx={{ color: '#666', mb: 2, fontSize: '0.875rem' }}>
                                    Choose how the average course score is calculated.
                                </Typography>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, fontSize: '0.875rem' }}>
                                    Calculate score by
                                </Typography>
                                <FormControl fullWidth>
                                    <Select
                                        value={localSettings.scoreCalculation || 'all'}
                                        onChange={(e) => handleChange('scoreCalculation', e.target.value)}
                                        sx={{
                                            bgcolor: '#f5f5f5',
                                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e0e0e0' },
                                        }}
                                    >
                                        <MenuItem value="all">All tests & assignments</MenuItem>
                                        <MenuItem value="tests">Tests only</MenuItem>
                                        <MenuItem value="assignments">Assignments only</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>

                            {/* Certificate */}
                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <Box component="span" sx={{ fontSize: '1.2rem' }}>🎖</Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                                        Certificate
                                    </Typography>
                                </Box>
                                <Typography variant="body2" sx={{ color: '#666', mb: 2, fontSize: '0.875rem' }}>
                                    Assign a certificate to be issued upon course completion.
                                </Typography>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, fontSize: '0.875rem' }}>
                                    Type
                                </Typography>
                                <FormControl fullWidth>
                                    <Select
                                        value={localSettings.certificateTemplateId || ''}
                                        onChange={(e) => handleChange('certificateTemplateId', e.target.value)}
                                        displayEmpty
                                        sx={{
                                            bgcolor: '#f5f5f5',
                                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e0e0e0' },
                                        }}
                                    >
                                        <MenuItem value="" sx={{ fontStyle: 'italic' }}>Select a certificate type</MenuItem>
                                        <MenuItem value="classic">Classic Certificate</MenuItem>
                                        <MenuItem value="modern">Modern Certificate</MenuItem>
                                        <MenuItem value="simple">Simple Certificate</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                        </Box>
                    )}

                    {/* CLONE AND TRANSLATE WITH AI Tab */}
                    {currentTab === 4 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <Typography variant="body2" sx={{ color: '#999', fontStyle: 'italic', fontSize: '0.875rem' }}>
                                Translate this course and a copy of it will be created in your selected language
                            </Typography>

                            {/* Language */}
                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <Box component="span" sx={{ fontSize: '1.2rem' }}>🌐</Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                                        Language
                                    </Typography>
                                </Box>
                                <Typography variant="body2" sx={{ color: '#666', mb: 2, fontSize: '0.875rem' }}>
                                    Translate your course into another language with AI for a more personalised learning experience.
                                </Typography>
                                <FormControl fullWidth>
                                    <Select
                                        value={localSettings.translationLanguage || ''}
                                        onChange={(e) => handleChange('translationLanguage', e.target.value)}
                                        displayEmpty
                                        sx={{
                                            bgcolor: '#f5f5f5',
                                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e0e0e0' },
                                        }}
                                    >
                                        <MenuItem value="" sx={{ fontStyle: 'italic' }}>Select language</MenuItem>
                                        <MenuItem value="es">Spanish</MenuItem>
                                        <MenuItem value="fr">French</MenuItem>
                                        <MenuItem value="de">German</MenuItem>
                                        <MenuItem value="it">Italian</MenuItem>
                                        <MenuItem value="pt">Portuguese</MenuItem>
                                        <MenuItem value="zh">Chinese</MenuItem>
                                        <MenuItem value="ja">Japanese</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>

                            {/* Writing style */}
                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <Box component="span" sx={{ fontSize: '1.2rem' }}>✏️</Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                                        Writing style
                                    </Typography>
                                </Box>
                                <Typography variant="body2" sx={{ color: '#666', mb: 2, fontSize: '0.875rem' }}>
                                    Choose the writing style that best suits your learning preferences.
                                </Typography>
                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                                    {[
                                        { value: 'original', label: 'Original', icon: '[]' },
                                        { value: 'academic', label: 'Academic', icon: '🎓' },
                                        { value: 'simple', label: 'Simple', icon: '///' },
                                        { value: 'creative', label: 'Creative', icon: '🎨' }
                                    ].map((style) => (
                                        <Button
                                            key={style.value}
                                            variant={localSettings.writingStyle === style.value ? 'contained' : 'outlined'}
                                            onClick={() => handleChange('writingStyle', style.value)}
                                            sx={{
                                                textTransform: 'none',
                                                fontWeight: 500,
                                                py: 1.5,
                                                borderRadius: 2,
                                                borderColor: '#e0e0e0',
                                                color: localSettings.writingStyle === style.value ? '#fff' : '#333',
                                                bgcolor: localSettings.writingStyle === style.value ? '#1976d2' : 'transparent',
                                                '&:hover': {
                                                    borderColor: '#1976d2',
                                                    bgcolor: localSettings.writingStyle === style.value ? '#1565c0' : '#f5f5f5',
                                                },
                                                gap: 1,
                                                display: 'flex',
                                                alignItems: 'center'
                                            }}
                                        >
                                            <Box component="span" sx={{ fontSize: '1rem' }}>{style.icon}</Box>
                                            {style.label}
                                        </Button>
                                    ))}
                                </Box>
                            </Box>
                        </Box>
                    )}
                </Box>

                {/* Footer */}
                <Box sx={{
                    p: 2.5,
                    borderTop: '1px solid #e0e0e0',
                    display: 'flex',
                    gap: 2,
                    justifyContent: 'flex-start'
                }}>
                    <Button
                        variant="contained"
                        onClick={handleSave}
                        sx={{
                            textTransform: 'none',
                            bgcolor: '#1976d2',
                            fontWeight: 600,
                            px: 4,
                            '&:hover': { bgcolor: '#1565c0' }
                        }}
                    >
                        Save
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={onClose}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 600,
                            px: 4,
                            color: '#666',
                            borderColor: '#e0e0e0',
                            '&:hover': { borderColor: '#bbb' }
                        }}
                    >
                        Cancel
                    </Button>
                </Box>
            </Box>
        </Drawer>
    );
}
