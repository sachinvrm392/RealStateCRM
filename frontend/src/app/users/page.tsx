'use client';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Chip,
  Alert,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { GridColDef } from '@mui/x-data-grid';
import DataTable from '../../components/common/DataTable';
import { User } from '../../types';
import api from '../../lib/api';
import { ROLES } from '../../lib/constants';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../hooks/useAuth';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    username: '',
    email: '',
    phone: '',
    role: 'agent',
    password: '',
    first_name: '',
    last_name: '',
  });

  const { enqueueSnackbar } = useSnackbar();
  const { hasRole } = useAuth();
  const isSuperAdmin = hasRole(['super_admin']);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/users/');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/api/users/', form);
      enqueueSnackbar(`User account ${form.username} created successfully`, { variant: 'success' });
      setOpenModal(false);
      setForm({
        username: '',
        email: '',
        phone: '',
        role: 'agent',
        password: '',
        first_name: '',
        last_name: '',
      });
      fetchUsers();
    } catch (err: any) {
      setError(
        err?.response?.data?.username?.[0] ||
        err?.response?.data?.password?.[0] ||
        err?.response?.data?.detail ||
        'Failed to create user'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <Box p={3}>
        <Alert severity="error">Access Denied: Only Super Admins can manage CRM user accounts.</Alert>
      </Box>
    );
  }

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'username', headerName: 'Username', flex: 1, minWidth: 130 },
    {
      field: 'full_name',
      headerName: 'Full Name',
      flex: 1.2,
      minWidth: 150,
      valueGetter: (params) =>
        `${params.row.first_name || ''} ${params.row.last_name || ''}`.trim() || params.row.username,
    },
    { field: 'email', headerName: 'Email Address', flex: 1.2, minWidth: 180 },
    { field: 'phone', headerName: 'Phone', flex: 1, minWidth: 130 },
    {
      field: 'role',
      headerName: 'Assigned Role',
      flex: 1,
      minWidth: 140,
      renderCell: (params) => (
        <Chip
          label={ROLES[params.value] || params.value}
          size="small"
          color={
            params.value === 'super_admin'
              ? 'error'
              : params.value === 'manager'
              ? 'primary'
              : 'default'
          }
        />
      ),
    },
  ];

  return (
    <Box sx={{ pb: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            User Accounts & Roles
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage agents, sales managers, and administrator credentials
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<PersonAddIcon />}
          onClick={() => setOpenModal(true)}
        >
          Create New User
        </Button>
      </Stack>

      <DataTable columns={columns} rows={users} loading={loading} />

      {/* Add User Modal */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleCreateUser}>
          <DialogTitle>Create CRM User Account</DialogTitle>
          <DialogContent dividers>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
              />

              <Stack direction="row" spacing={2}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                />
                <TextField
                  fullWidth
                  label="Last Name"
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                />
              </Stack>

              <TextField
                fullWidth
                type="email"
                label="Email Address"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />

              <TextField
                fullWidth
                label="Phone Number"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />

              <TextField
                fullWidth
                select
                label="System Role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <MenuItem value="agent">Agent (Calling & Own Leads)</MenuItem>
                <MenuItem value="manager">Manager (All Leads, Deals, Inventory & Reports)</MenuItem>
                <MenuItem value="super_admin">Super Admin (Full System Control)</MenuItem>
              </TextField>

              <TextField
                fullWidth
                type="password"
                label="Initial Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenModal(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? <CircularProgress size={24} /> : 'Create Account'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
