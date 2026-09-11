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
  IconButton,
  Tooltip,
  Divider,
  Paper,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DomainIcon from '@mui/icons-material/Domain';
import { GridColDef } from '@mui/x-data-grid';
import dayjs from 'dayjs';

import DataTable from '../../components/common/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { Project } from '../../types';
import api from '../../lib/api';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../hooks/useAuth';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Add / Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', location: '', description: '' });

  // View Details Modal
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);

  // Delete Confirmation Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { enqueueSnackbar } = useSnackbar();
  const { hasRole } = useAuth();
  const isManagerOrAdmin = hasRole(['super_admin', 'manager']);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/projects/');
      setProjects(res.data);
    } catch (err) {
      console.error('Failed to load projects', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleOpenAdd = () => {
    setEditingProject(null);
    setForm({ name: '', location: '', description: '' });
    setModalOpen(true);
  };

  const handleOpenEdit = (proj: Project, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingProject(proj);
    setForm({
      name: proj.name || '',
      location: proj.location || '',
      description: proj.description || '',
    });
    setModalOpen(true);
  };

  const handleOpenView = async (proj: Project, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await api.get(`/api/projects/${proj.id}/`);
      setSelectedProject(res.data);
    } catch (err) {
      setSelectedProject(proj);
    }
    setViewModalOpen(true);
  };

  const handleOpenDelete = (proj: Project, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setProjectToDelete(proj);
    setDeleteDialogOpen(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingProject) {
        await api.patch(`/api/projects/${editingProject.id}/`, form);
        enqueueSnackbar('Project updated successfully', { variant: 'success' });
      } else {
        await api.post('/api/projects/', form);
        enqueueSnackbar('Project added successfully', { variant: 'success' });
      }
      setModalOpen(false);
      fetchProjects();
    } catch (err) {
      enqueueSnackbar(editingProject ? 'Failed to update project' : 'Failed to create project', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/api/projects/${projectToDelete.id}/`);
      enqueueSnackbar(`Project "${projectToDelete.name}" deleted successfully`, { variant: 'success' });
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
      fetchProjects();
    } catch (err) {
      enqueueSnackbar('Failed to delete project', { variant: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'name', headerName: 'Project / Society Name', flex: 1.2, minWidth: 180 },
    { field: 'location', headerName: 'Location / City', flex: 1, minWidth: 150 },
    { field: 'description', headerName: 'Description & Master Plan', flex: 2, minWidth: 250 },
    {
      field: 'actions',
      headerName: 'Actions',
      sortable: false,
      filterable: false,
      minWidth: isManagerOrAdmin ? 150 : 80,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Tooltip title="View Project Details">
            <IconButton
              size="small"
              color="info"
              onClick={(e) => handleOpenView(params.row, e)}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {isManagerOrAdmin && (
            <>
              <Tooltip title="Edit Project">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={(e) => handleOpenEdit(params.row, e)}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Delete Project">
                <IconButton
                  size="small"
                  color="error"
                  onClick={(e) => handleOpenDelete(params.row, e)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Stack>
      ),
    },
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
            onClick={handleOpenAdd}
          >
            Add New Project
          </Button>
        )}
      </Stack>

      <DataTable
        columns={columns}
        rows={projects}
        loading={loading}
        onRowClick={(params) => handleOpenView(params.row)}
      />

      {/* Add / Edit Project Modal */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSaveProject}>
          <DialogTitle>
            {editingProject ? `Edit Project: ${editingProject.name}` : 'Add New Real Estate Project'}
          </DialogTitle>
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
            <Button onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? <CircularProgress size={24} /> : editingProject ? 'Update Project' : 'Save Project'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* View Project Details Modal */}
      <Dialog open={viewModalOpen} onClose={() => setViewModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DomainIcon color="primary" /> {selectedProject?.name || 'Project Details'}
        </DialogTitle>
        <DialogContent dividers>
          {selectedProject && (
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  PROJECT NAME
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {selectedProject.name}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  LOCATION & SITE LANDMARK
                </Typography>
                <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LocationOnIcon fontSize="small" color="action" /> {selectedProject.location}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  PROJECT OVERVIEW & AMENITIES
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1.5 }}>
                  <Typography variant="body2">
                    {selectedProject.description || 'No description provided.'}
                  </Typography>
                </Paper>
              </Box>

              {selectedProject.plots && (
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    PLOTS INVENTORY IN THIS PROJECT
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {selectedProject.plots.length} Total Plots Registered
                  </Typography>
                </Box>
              )}

              {selectedProject.created_at && (
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    ADDED ON
                  </Typography>
                  <Typography variant="body2">
                    {dayjs(selectedProject.created_at).format('DD MMMM YYYY, hh:mm A')}
                  </Typography>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          {isManagerOrAdmin && selectedProject && (
            <Button
              startIcon={<EditIcon />}
              onClick={() => {
                setViewModalOpen(false);
                handleOpenEdit(selectedProject);
              }}
            >
              Edit
            </Button>
          )}
          <Button variant="contained" onClick={() => setViewModalOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Real Estate Project"
        content={`Are you sure you want to delete "${projectToDelete?.name}"? This action cannot be undone.`}
        confirmText={deleting ? 'Deleting...' : 'Delete Project'}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setProjectToDelete(null);
        }}
      />
    </Box>
  );
}
