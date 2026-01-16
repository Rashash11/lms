'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Checkbox,
  TablePagination,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FilterListIcon from '@mui/icons-material/FilterList';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  role: string;
  courses: number;
  lastLogin: string;
}

const mockUsers: User[] = [
  { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com', username: 'johnd', status: 'ACTIVE', role: 'Learner', courses: 5, lastLogin: '2 hours ago' },
  { id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', username: 'janes', status: 'ACTIVE', role: 'Instructor', courses: 12, lastLogin: '1 day ago' },
  { id: '3', firstName: 'Bob', lastName: 'Johnson', email: 'bob@example.com', username: 'bobj', status: 'INACTIVE', role: 'Learner', courses: 3, lastLogin: '1 week ago' },
  { id: '4', firstName: 'Alice', lastName: 'Brown', email: 'alice@example.com', username: 'aliceb', status: 'LOCKED', role: 'Learner', courses: 8, lastLogin: '3 days ago' },
  { id: '5', firstName: 'Super', lastName: 'Admin', email: 'admin@talentlms-clone.com', username: 'admin', status: 'ACTIVE', role: 'Admin', courses: 0, lastLogin: 'Just now' },
];

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelected(mockUsers.map(u => u.id));
    } else {
      setSelected([]);
    }
  };

  const handleSelect = (id: string) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected: string[] = [];

    if (selectedIndex === -1) {
      newSelected = [...selected, id];
    } else {
      newSelected = selected.filter(s => s !== id);
    }

    setSelected(newSelected);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'INACTIVE': return 'default';
      case 'LOCKED': return 'error';
      default: return 'default';
    }
  };

  const filteredUsers = mockUsers.filter(user =>
    `${user.firstName} ${user.lastName} ${user.email} ${user.username}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Users
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          Add User
        </Button>
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          placeholder="Search users..."
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
        <Button variant="outlined" startIcon={<FilterListIcon />} sx={{ textTransform: 'none' }}>
          Filters
        </Button>
      </Box>

      {/* Users Table */}
      <TableContainer
        component={Paper}
        className="glass-card"
        elevation={0}
        sx={{
          boxShadow: 'none',
          border: '1px solid rgba(141, 166, 166, 0.1)',
          background: 'rgba(13, 20, 20, 0.4)'
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selected.length > 0 && selected.length < mockUsers.length}
                  checked={selected.length === mockUsers.length}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell>User</TableCell>
              <TableCell>Username</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Courses</TableCell>
              <TableCell>Last Login</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id} hover selected={selected.includes(user.id)}>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selected.includes(user.id)}
                    onChange={() => handleSelect(user.id)}
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {user.firstName[0]}{user.lastName[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        {user.firstName} {user.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {user.email}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell>
                  <Chip label={user.role} size="small" variant="outlined" />
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.status}
                    size="small"
                    color={getStatusColor(user.status) as any}
                  />
                </TableCell>
                <TableCell>{user.courses}</TableCell>
                <TableCell>{user.lastLogin}</TableCell>
                <TableCell align="right">
                  <IconButton size="small">
                    <MoreVertIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={filteredUsers.length}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>
    </Box>
  );
}
