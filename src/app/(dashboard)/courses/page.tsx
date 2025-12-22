'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  TextField,
  InputAdornment,
  Button,
  Chip,
  Rating,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Menu,
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import SortIcon from '@mui/icons-material/Sort';
import FilterListIcon from '@mui/icons-material/FilterList';
import MoreVertIcon from '@mui/icons-material/MoreVert';

interface Course {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  enrolledCount: number;
  rating: number;
  status: 'DRAFT' | 'PUBLISHED';
}

const mockCourses: Course[] = [
  {
    id: '1',
    title: 'Introduction to React',
    description: 'Learn the fundamentals of React including components, hooks, and state management.',
    image: '/api/placeholder/400/200',
    category: 'Web Development',
    enrolledCount: 234,
    rating: 4.5,
    status: 'PUBLISHED',
  },
  {
    id: '2',
    title: 'Advanced TypeScript',
    description: 'Master advanced TypeScript concepts including generics, decorators, and type guards.',
    image: '/api/placeholder/400/200',
    category: 'Programming',
    enrolledCount: 156,
    rating: 4.8,
    status: 'PUBLISHED',
  },
  {
    id: '3',
    title: 'Node.js Fundamentals',
    description: 'Build server-side applications with Node.js, Express, and MongoDB.',
    image: '/api/placeholder/400/200',
    category: 'Backend Development',
    enrolledCount: 312,
    rating: 4.2,
    status: 'PUBLISHED',
  },
  {
    id: '4',
    title: 'Database Design Patterns',
    description: 'Learn database design principles and best practices for scalable applications.',
    image: '/api/placeholder/400/200',
    category: 'Database',
    enrolledCount: 89,
    rating: 4.6,
    status: 'DRAFT',
  },
];

export default function CoursesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, courseId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedCourseId(courseId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCourseId(null);
  };

  const filteredCourses = mockCourses.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Courses
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          Add Course
        </Button>
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search courses..."
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 280 }}
        />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Sort by</InputLabel>
          <Select
            value={sortBy}
            label="Sort by"
            onChange={(e) => setSortBy(e.target.value)}
          >
            <MenuItem value="name">Name</MenuItem>
            <MenuItem value="date">Date</MenuItem>
            <MenuItem value="rating">Rating</MenuItem>
            <MenuItem value="enrolled">Enrolled</MenuItem>
          </Select>
        </FormControl>
        <Button variant="outlined" startIcon={<FilterListIcon />} sx={{ textTransform: 'none' }}>
          Filters
        </Button>
      </Box>

      {/* Course Grid */}
      <Grid container spacing={3}>
        {filteredCourses.map((course) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={course.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
              <CardMedia
                component="div"
                sx={{
                  height: 140,
                  bgcolor: 'primary.light',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="h6" color="white" fontWeight="bold">
                  {course.title.slice(0, 2).toUpperCase()}
                </Typography>
              </CardMedia>
              
              <IconButton
                size="small"
                sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(255,255,255,0.9)' }}
                onClick={(e) => handleMenuOpen(e, course.id)}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>

              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ flex: 1 }}>
                    {course.title}
                  </Typography>
                </Box>
                
                <Chip
                  label={course.status}
                  size="small"
                  color={course.status === 'PUBLISHED' ? 'success' : 'default'}
                  sx={{ mb: 1, fontSize: '0.7rem', height: 20 }}
                />
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                  {course.description.substring(0, 80)}...
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Rating value={course.rating} readOnly size="small" precision={0.5} />
                    <Typography variant="caption" color="text.secondary">
                      ({course.rating})
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {course.enrolledCount} enrolled
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Course Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>Edit</MenuItem>
        <MenuItem onClick={handleMenuClose}>Clone</MenuItem>
        <MenuItem onClick={handleMenuClose}>View Users</MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>Delete</MenuItem>
      </Menu>
    </Box>
  );
}
