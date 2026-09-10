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
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { GridColDef } from '@mui/x-data-grid';
import DataTable from '../../components/common/DataTable';
import { Project } from '../../types';
import api from '../../lib/api';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../hooks/useAuth';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', location: '', description: '' });

  const { enqueueSnackbar } = useSnackbar();
  const { hasRole } = useAuth();
  const isManagerOrAdmin = hasRole(['super_admin', 'manager']);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/projects/');
      setProjects(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/api/projects/', form);
      enqueueSnackbar('Project added successfully', { variant: 'success' });
      setOpenModal(false);
      setForm({ name: '', location: '', description: '' });
      fetchProjects();
    } catch (err) {
      enqueueSnackbar('Failed to create project', { variant: 'error' });
    } finally {
      setCreating(false);
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'name', headerName: 'Project / Society Name', flex: 1.2, minWidth: 180 },
    { field: 'location', headerName: 'Location / City', flex: 1, minWidth: 150 },
    { field: 'description', headerName: 'Description & Master Plan', flex: 2, minWidth: 250 },
  ];

  return (
    <Box sx={{ pb: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Real Estate Projects & Societies
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage projects, societies, layouts, and site developments
          </Typography>
        </Box>
        {isManagerOrAdmin && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setOpenModal(true)}
          >
            Add New Project
          </Button>
        )}
      </Stack>

      <DataTable columns={columns} rows={projects} loading={loading} />

      {/* Add Project Modal */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleCreateProject}>
          <DialogTitle>Add New Real Estate Project</DialogTitle>
          <DialogContent dividers>
            <TextField
              fullWidth
              label="Project / Society Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              sx={{ mb: 2 }}
              placeholder="e.g. Green Valley Enclave, Palm Meadows"
            />
            <TextField
              fullWidth
              label="Location / Landmark / City"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              required
              sx={{ mb: 2 }}
              placeholder="e.g. Sector 82, Airport Road, Bangalore"
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Project Description / Amenities"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Total 150 plots, gated community with 40ft wide roads, underground electricity..."
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenModal(false)} disabled={creating}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={creating}>
              {creating ? <CircularProgress size={24} /> : 'Save Project'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
