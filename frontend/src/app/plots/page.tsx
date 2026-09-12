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
  Grid,
  CircularProgress,
  IconButton,
  Tooltip,
  Divider,
  Paper,
} from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LandscapeIcon from '@mui/icons-material/Landscape';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import dayjs from 'dayjs';

import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { Plot, Project } from '../../types';
import api from '../../lib/api';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../hooks/useAuth';

export default function PlotsPage() {
  const [plots, setPlots] = useState<Plot[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');

  // Edit Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingPlot, setEditingPlot] = useState<Plot | null>(null);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    project: '',
    plot_number: '',
    block_sector: '',
    area_sqft: '',
    plot_type: 'residential',
    facing: 'east',
    price_per_sqft: '',
    total_price: '',
    status: 'available',
    dimensions: '',
    amenities: '',
  });

  // View Modal
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedPlot, setSelectedPlot] = useState<any | null>(null);

  // Delete Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [plotToDelete, setPlotToDelete] = useState<Plot | null>(null);
  const [deleting, setDeleting] = useState(false);

  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const { hasRole } = useAuth();
  const isManagerOrAdmin = hasRole(['super_admin', 'manager']);

  const fetchPlotsAndProjects = async () => {
    try {
      setLoading(true);
      const [plotRes, projRes] = await Promise.all([
        api.get('/api/plots/'),
        api.get('/api/projects/').catch(() => ({ data: [] })),
      ]);
      setPlots(plotRes.data);
      setProjects(projRes.data);
    } catch (err) {
      console.error('Failed to load plots or projects', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlotsAndProjects();
  }, []);

  const formatCurrency = (val: number | string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(val || 0));
  };

  const handleResetFilters = () => {
    setSearch('');
    setFilterProject('');
    setFilterStatus('');
    setFilterType('');
  };

  const filteredPlots = plots.filter((plot) => {
    if (search) {
      const q = search.toLowerCase();
      const matchNum = plot.plot_number?.toLowerCase().includes(q);
      const matchBlock = plot.block_sector?.toLowerCase().includes(q);
      const matchProj = plot.project_name?.toLowerCase().includes(q);
      if (!matchNum && !matchBlock && !matchProj) return false;
    }
    if (filterProject && String(plot.project) !== filterProject) return false;
    if (filterStatus && plot.status !== filterStatus) return false;
    if (filterType && plot.plot_type !== filterType) return false;
    return true;
  });

  const handleOpenView = async (plot: Plot, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await api.get(`/api/plots/${plot.id}/`);
      setSelectedPlot(res.data);
    } catch (err) {
      setSelectedPlot(plot);
    }
    setViewModalOpen(true);
  };

  const handleOpenEdit = (plot: Plot, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingPlot(plot);
    setEditForm({
      project: String(plot.project || ''),
      plot_number: plot.plot_number || '',
      block_sector: plot.block_sector || '',
      area_sqft: String(plot.area_sqft || ''),
      plot_type: plot.plot_type || 'residential',
      facing: plot.facing || 'east',
      price_per_sqft: String(plot.price_per_sqft || ''),
      total_price: String(plot.total_price || ''),
      status: plot.status || 'available',
      dimensions: plot.dimensions || '',
      amenities: plot.amenities || '',
    });
    setEditModalOpen(true);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const next = { ...editForm, [name]: value };
    if (name === 'area_sqft' || name === 'price_per_sqft') {
      const area = Number(name === 'area_sqft' ? value : editForm.area_sqft);
      const rate = Number(name === 'price_per_sqft' ? value : editForm.price_per_sqft);
      if (area > 0 && rate > 0) {
        next.total_price = String(area * rate);
      }
    }
    setEditForm(next);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlot) return;

    if (!editForm.project) {
      enqueueSnackbar('Please select a Project / Society', { variant: 'error' });
      return;
    }
    if (!editForm.plot_number?.trim()) {
      enqueueSnackbar('Plot / Unit Number is required', { variant: 'error' });
      return;
    }
    if (!editForm.block_sector?.trim()) {
      enqueueSnackbar('Block / Sector / Phase is required', { variant: 'error' });
      return;
    }
    if (!editForm.plot_type) {
      enqueueSnackbar('Plot Type is required', { variant: 'error' });
      return;
    }
    if (!editForm.area_sqft || Number(editForm.area_sqft) <= 0) {
      enqueueSnackbar('Valid Area (Sq. Ft.) is required', { variant: 'error' });
      return;
    }
    if (!editForm.price_per_sqft || Number(editForm.price_per_sqft) <= 0) {
      enqueueSnackbar('Valid Rate (₹ / Sq. Ft.) is required', { variant: 'error' });
      return;
    }
    if (!editForm.total_price || Number(editForm.total_price) <= 0) {
      enqueueSnackbar('Valid Total Price (₹) is required', { variant: 'error' });
      return;
    }
    if (!editForm.facing) {
      enqueueSnackbar('Facing Direction is required', { variant: 'error' });
      return;
    }
    if (!editForm.dimensions?.trim()) {
      enqueueSnackbar('Dimensions (L x W) are required', { variant: 'error' });
      return;
    }
    if (!editForm.status) {
      enqueueSnackbar('Inventory Status is required', { variant: 'error' });
      return;
    }
    if (!editForm.amenities?.trim()) {
      enqueueSnackbar('Nearby Amenities / Highlights are required', { variant: 'error' });
      return;
    }

    setSaving(true);
    try {
      await api.patch(`/api/plots/${editingPlot.id}/`, editForm);
      enqueueSnackbar(`Plot ${editForm.plot_number} updated successfully`, { variant: 'success' });
      setEditModalOpen(false);
      fetchPlotsAndProjects();
    } catch (err) {
      enqueueSnackbar('Failed to update plot details', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleOpenDelete = (plot: Plot, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPlotToDelete(plot);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!plotToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/api/plots/${plotToDelete.id}/`);
      enqueueSnackbar(`Plot ${plotToDelete.plot_number} deleted successfully`, { variant: 'success' });
      setDeleteDialogOpen(false);
      setPlotToDelete(null);
      fetchPlotsAndProjects();
    } catch (err) {
      enqueueSnackbar('Failed to delete plot', { variant: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'plot_number',
      headerName: 'Plot No.',
      width: 110,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={700} color="primary.main">
          #{params.value}
        </Typography>
      ),
    },
    {
      field: 'project_name',
      headerName: 'Project / Society',
      flex: 1.2,
      minWidth: 160,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={500} noWrap>
          {params.value || 'General'}
        </Typography>
      ),
    },
    { field: 'block_sector', headerName: 'Block / Phase', flex: 0.9, minWidth: 120 },
    {
      field: 'area_sqft',
      headerName: 'Area (sqft)',
      flex: 0.8,
      minWidth: 110,
      renderCell: (params) => `${Number(params.value || 0).toLocaleString()} sqft`,
    },
    {
      field: 'plot_type',
      headerName: 'Type',
      flex: 0.8,
      minWidth: 110,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'facing',
      headerName: 'Facing',
      flex: 0.7,
      minWidth: 90,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
          {params.value || 'General'}
        </Typography>
      ),
    },
    {
      field: 'total_price',
      headerName: 'Total Price',
      flex: 1,
      minWidth: 130,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={600} color="success.dark">
          {formatCurrency(params.value)}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      minWidth: 120,
      renderCell: (params) => <StatusBadge status={params.value} type="plot" />,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      sortable: false,
      filterable: false,
      width: isManagerOrAdmin ? 150 : 80,
      minWidth: isManagerOrAdmin ? 150 : 80,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
          <Tooltip title="View Plot Details">
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
              <Tooltip title="Edit Plot">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={(e) => handleOpenEdit(params.row, e)}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Delete Plot">
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
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
        mb={3}
      >
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Plot Inventory
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage real estate plot stock, pricing, and availability
          </Typography>
        </Box>

        {isManagerOrAdmin && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => router.push('/plots/new')}
          >
            Add New Plot
          </Button>
        )}
      </Stack>

      {/* Filter / Search Bar */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          bgcolor: 'background.paper',
          borderRadius: 2,
          border: '1px solid #e2e8f0',
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <TextField
            size="small"
            label="Search Plot No. / Sector / Project"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: 2, minWidth: 200 }}
          />
          <TextField
            select
            size="small"
            label="Project"
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            sx={{ flex: 1.2, minWidth: 150 }}
          >
            <MenuItem value="">All Projects</MenuItem>
            {projects.map((proj) => (
              <MenuItem key={proj.id} value={String(proj.id)}>
                {proj.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            sx={{ flex: 1, minWidth: 130 }}
          >
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="available">Available</MenuItem>
            <MenuItem value="reserved">Reserved</MenuItem>
            <MenuItem value="sold">Sold</MenuItem>
          </TextField>
          <TextField
            select
            size="small"
            label="Type"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            sx={{ flex: 1, minWidth: 130 }}
          >
            <MenuItem value="">All Types</MenuItem>
            <MenuItem value="residential">Residential</MenuItem>
            <MenuItem value="commercial">Commercial</MenuItem>
            <MenuItem value="mixed">Mixed</MenuItem>
          </TextField>
          <Button
            variant="outlined"
            color="inherit"
            onClick={handleResetFilters}
            sx={{ minWidth: 90 }}
          >
            Reset
          </Button>
        </Stack>
      </Paper>

      <DataTable
        columns={columns}
        rows={filteredPlots}
        loading={loading}
        onRowClick={(params) => handleOpenView(params.row)}
      />


      {/* View Plot Modal */}
      <Dialog open={viewModalOpen} onClose={() => setViewModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LandscapeIcon color="primary" /> Plot #{selectedPlot?.plot_number} Details
        </DialogTitle>
        <DialogContent dividers>
          {selectedPlot && (
            <Stack spacing={2}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    PROJECT / SOCIETY
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {selectedPlot.project_name || 'General Project'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    STATUS
                  </Typography>
                  <StatusBadge status={selectedPlot.status} type="plot" />
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    BLOCK / PHASE
                  </Typography>
                  <Typography variant="body2">
                    {selectedPlot.block_sector || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    PLOT TYPE
                  </Typography>
                  <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                    {selectedPlot.plot_type || 'Residential'}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    AREA & DIMENSIONS
                  </Typography>
                  <Typography variant="body2">
                    {Number(selectedPlot.area_sqft || 0).toLocaleString()} Sq. Ft. {selectedPlot.dimensions ? `(${selectedPlot.dimensions})` : ''}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    FACING DIRECTION
                  </Typography>
                  <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                    {selectedPlot.facing || 'East'}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    RATE PER SQFT
                  </Typography>
                  <Typography variant="body2">
                    ₹{Number(selectedPlot.price_per_sqft || 0).toLocaleString()} / sqft
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    TOTAL ASKING PRICE
                  </Typography>
                  <Typography variant="body1" fontWeight="bold" color="primary">
                    {formatCurrency(selectedPlot.total_price)}
                  </Typography>
                </Grid>
              </Grid>

              {selectedPlot.amenities && (
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                    AMENITIES & HIGHLIGHTS
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'grey.50' }}>
                    <Typography variant="body2">{selectedPlot.amenities}</Typography>
                  </Paper>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          {isManagerOrAdmin && selectedPlot && (
            <Button
              startIcon={<EditIcon />}
              onClick={() => {
                setViewModalOpen(false);
                handleOpenEdit(selectedPlot);
              }}
            >
              Edit Plot
            </Button>
          )}
          <Button variant="contained" onClick={() => setViewModalOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Plot Modal */}
      <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleSaveEdit}>
          <DialogTitle>Edit Plot #{editingPlot?.plot_number}</DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Project / Society"
                  name="project"
                  value={editForm.project}
                  onChange={handleEditChange}
                  required
                >
                  {projects.map((proj) => (
                    <MenuItem key={proj.id} value={proj.id}>
                      {proj.name} ({proj.location || 'General'})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Plot / Unit Number"
                  name="plot_number"
                  value={editForm.plot_number}
                  onChange={handleEditChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Block / Sector / Phase"
                  name="block_sector"
                  value={editForm.block_sector}
                  onChange={handleEditChange}
                  placeholder="e.g. Phase 2, Sector B"
                  required
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  select
                  label="Plot Type"
                  name="plot_type"
                  value={editForm.plot_type}
                  onChange={handleEditChange}
                  required
                >
                  <MenuItem value="residential">Residential</MenuItem>
                  <MenuItem value="commercial">Commercial</MenuItem>
                  <MenuItem value="mixed">Mixed / Semi-Commercial</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  select
                  label="Inventory Status"
                  name="status"
                  value={editForm.status}
                  onChange={handleEditChange}
                  required
                >
                  <MenuItem value="available">Available</MenuItem>
                  <MenuItem value="reserved">Reserved</MenuItem>
                  <MenuItem value="sold">Sold</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Area (Sq. Ft.)"
                  name="area_sqft"
                  value={editForm.area_sqft}
                  onChange={handleEditChange}
                  required
                  placeholder="e.g. 1500"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Rate (₹ / Sq. Ft.)"
                  name="price_per_sqft"
                  value={editForm.price_per_sqft}
                  onChange={handleEditChange}
                  required
                  placeholder="e.g. 3500"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Total Price (₹)"
                  name="total_price"
                  value={editForm.total_price}
                  onChange={handleEditChange}
                  required
                  placeholder="e.g. 5250000"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Facing Direction"
                  name="facing"
                  value={editForm.facing}
                  onChange={handleEditChange}
                  required
                >
                  <MenuItem value="east">East</MenuItem>
                  <MenuItem value="west">West</MenuItem>
                  <MenuItem value="north">North</MenuItem>
                  <MenuItem value="south">South</MenuItem>
                  <MenuItem value="corner">Corner Facing</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Dimensions (L x W)"
                  name="dimensions"
                  value={editForm.dimensions}
                  onChange={handleEditChange}
                  placeholder="e.g. 30 x 50"
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Nearby Amenities / Highlights"
                  name="amenities"
                  value={editForm.amenities}
                  onChange={handleEditChange}
                  placeholder="Park-facing, 40ft wide road, near clubhouse, gated security..."
                  required
                  helperText="Key features and plot highlights (Mandatory)"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? <CircularProgress size={24} /> : 'Save Changes'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Plot from Inventory"
        content={`Are you sure you want to delete Plot "${plotToDelete?.plot_number}"? This action cannot be undone.`}
        confirmText={deleting ? 'Deleting...' : 'Delete Plot'}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setPlotToDelete(null);
        }}
      />
    </Box>
  );
}
