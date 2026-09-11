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
  Paper,
  Chip,
  Avatar,
  Alert,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import BadgeIcon from '@mui/icons-material/Badge';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

import DataTable from '../../components/common/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import StatusBadge from '../../components/common/StatusBadge';
import api from '../../lib/api';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function AgentsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Add Agent Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addForm, setAddForm] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
  });
  const [addError, setAddError] = useState('');

  // Edit Agent Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<any | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    is_active: true,
    password: '',
  });

  // View Agent Modal
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Delete Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { enqueueSnackbar } = useSnackbar();
  const { hasRole } = useAuth();
  const router = useRouter();
  const isManagerOrAdmin = hasRole(['super_admin', 'manager']);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/agents/');
      setAgents(res.data);
    } catch (err) {
      console.error('Failed to load agents', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleOpenAdd = () => {
    setAddError('');
    setAddForm({
      username: '',
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      password: 'agent' + Math.floor(100 + Math.random() * 900),
    });
    setAddModalOpen(true);
  };

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    setAddError('');

    try {
      await api.post('/api/agents/', addForm);
      enqueueSnackbar(`Agent account "${addForm.username}" created successfully`, { variant: 'success' });
      setAddModalOpen(false);
      fetchAgents();
    } catch (err: any) {
      setAddError(err.response?.data?.detail || 'Failed to create agent account.');
    } finally {
      setAdding(false);
    }
  };

  const handleOpenEdit = (agent: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingAgent(agent);
    setEditForm({
      first_name: agent.first_name || '',
      last_name: agent.last_name || '',
      email: agent.email || '',
      phone: agent.phone || '',
      is_active: agent.is_active !== false,
      password: '',
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAgent) return;
    setSavingEdit(true);

    try {
      const payload: any = { ...editForm };
      if (!payload.password) delete payload.password;

      await api.patch(`/api/agents/${editingAgent.id}/`, payload);
      enqueueSnackbar(`Agent "${editingAgent.username}" updated successfully`, { variant: 'success' });
      setEditModalOpen(false);
      fetchAgents();
    } catch (err: any) {
      enqueueSnackbar(err.response?.data?.detail || 'Failed to update agent', { variant: 'error' });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleOpenView = async (agent: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedAgent(agent);
    setViewModalOpen(true);
    try {
      setLoadingDetails(true);
      const res = await api.get(`/api/agents/${agent.id}/`);
      setSelectedAgent(res.data);
    } catch (err) {
      // fallback
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleOpenDelete = (agent: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setAgentToDelete(agent);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!agentToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/api/agents/${agentToDelete.id}/`);
      enqueueSnackbar(`Agent "${agentToDelete.username}" deleted successfully`, { variant: 'success' });
      setDeleteDialogOpen(false);
      setAgentToDelete(null);
      fetchAgents();
    } catch (err) {
      enqueueSnackbar('Failed to delete agent', { variant: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const filteredAgents = agents.filter((ag) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const fullName = `${ag.first_name || ''} ${ag.last_name || ''}`.toLowerCase();
    return (
      ag.username?.toLowerCase().includes(q) ||
      fullName.includes(q) ||
      ag.email?.toLowerCase().includes(q) ||
      ag.phone?.includes(q)
    );
  });

  const columns: GridColDef[] = [
    {
      field: 'id',
      headerName: 'ID',
      width: 70,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          #{params.value}
        </Typography>
      ),
    },
    {
      field: 'full_name',
      headerName: 'Agent Name',
      flex: 1.3,
      minWidth: 180,
      renderCell: (params) => {
        const name = `${params.row.first_name || ''} ${params.row.last_name || ''}`.trim() || params.row.username;
        return (
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.875rem' }}>
              {name.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight={600} color="text.primary">
                {name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                @{params.row.username}
              </Typography>
            </Box>
          </Stack>
        );
      },
    },
    {
      field: 'email',
      headerName: 'Email Address',
      flex: 1.2,
      minWidth: 180,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          {params.value || '-'}
        </Typography>
      ),
    },
    {
      field: 'phone',
      headerName: 'Phone Number',
      flex: 1,
      minWidth: 140,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={500}>
          {params.value || '-'}
        </Typography>
      ),
    },
    {
      field: 'leads_count',
      headerName: 'Assigned Leads',
      flex: 0.9,
      minWidth: 130,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Chip
          label={`${params.value || 0} Leads`}
          size="small"
          color={Number(params.value) > 0 ? 'primary' : 'default'}
          variant="outlined"
        />
      ),
    },
    {
      field: 'is_active',
      headerName: 'Status',
      flex: 0.8,
      minWidth: 110,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Chip
          icon={params.value !== false ? <CheckCircleIcon /> : <CancelIcon />}
          label={params.value !== false ? 'Active' : 'Inactive'}
          size="small"
          color={params.value !== false ? 'success' : 'default'}
        />
      ),
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
          <Tooltip title="View Agent Profile & Leads">
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
              <Tooltip title="Edit Agent">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={(e) => handleOpenEdit(params.row, e)}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Delete Agent">
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
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <SupportAgentIcon color="primary" sx={{ fontSize: 32 }} />
            <Typography variant="h4" fontWeight="bold">
              Sales Agents & Calling Team
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Manage real estate sales agents, onboard callers, and inspect assigned lead pipelines
          </Typography>
        </Box>

        {isManagerOrAdmin && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<PersonAddIcon />}
            onClick={handleOpenAdd}
          >
            Add New Agent
          </Button>
        )}
      </Stack>

      {/* Search Bar */}
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
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            fullWidth
            size="small"
            label="Search Agent by Name, Username, Email, or Phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => setSearch('')}
              sx={{ minWidth: 90 }}
            >
              Clear
            </Button>
          )}
        </Stack>
      </Paper>

      <DataTable
        columns={columns}
        rows={filteredAgents}
        loading={loading}
        onRowClick={(params) => handleOpenView(params.row)}
      />

      {/* Add New Agent Modal */}
      <Dialog open={addModalOpen} onClose={() => setAddModalOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleCreateAgent}>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonAddIcon color="primary" /> Onboard New Sales Agent
          </DialogTitle>
          <DialogContent dividers>
            {addError && <Alert severity="error" sx={{ mb: 2 }}>{addError}</Alert>}

            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Agent Username"
                value={addForm.username}
                onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
                required
                placeholder="e.g. agent_vikas"
                helperText="Used by the agent to log into CRM"
              />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={addForm.first_name}
                    onChange={(e) => setAddForm({ ...addForm, first_name: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={addForm.last_name}
                    onChange={(e) => setAddForm({ ...addForm, last_name: e.target.value })}
                  />
                </Grid>
              </Grid>

              <TextField
                fullWidth
                type="email"
                label="Email Address"
                value={addForm.email}
                onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                required
                placeholder="agent@realestatecrm.com"
              />

              <TextField
                fullWidth
                label="Primary Phone / WhatsApp"
                value={addForm.phone}
                onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                required
                placeholder="+91 98XXXXXXXX"
              />

              <TextField
                fullWidth
                type="text"
                label="Initial Password"
                value={addForm.password}
                onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                required
                helperText="Temporary login password for the agent"
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddModalOpen(false)} disabled={adding}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={adding}>
              {adding ? <CircularProgress size={24} /> : 'Create Agent Account'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Edit Agent Modal */}
      <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSaveEdit}>
          <DialogTitle>Edit Agent: @{editingAgent?.username}</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={editForm.first_name}
                    onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={editForm.last_name}
                    onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                  />
                </Grid>
              </Grid>

              <TextField
                fullWidth
                type="email"
                label="Email Address"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                required
              />

              <TextField
                fullWidth
                label="Phone Number"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />

              <TextField
                fullWidth
                type="password"
                label="Reset Password (leave blank to keep current)"
                value={editForm.password}
                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditModalOpen(false)} disabled={savingEdit}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={savingEdit}>
              {savingEdit ? <CircularProgress size={24} /> : 'Save Changes'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* View Agent Modal */}
      <Dialog open={viewModalOpen} onClose={() => setViewModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SupportAgentIcon color="primary" /> Agent Profile: {selectedAgent?.first_name} {selectedAgent?.last_name} (@{selectedAgent?.username})
        </DialogTitle>
        <DialogContent dividers>
          {selectedAgent && (
            <Stack spacing={3}>
              <Paper variant="outlined" sx={{ p: 2.5, bgcolor: 'grey.50', borderRadius: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="text.secondary">USERNAME</Typography>
                    <Typography variant="body1" fontWeight="bold">@{selectedAgent.username}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="text.secondary">EMAIL</Typography>
                    <Typography variant="body1">{selectedAgent.email || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="text.secondary">PHONE</Typography>
                    <Typography variant="body1">{selectedAgent.phone || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="text.secondary">TOTAL ASSIGNED LEADS</Typography>
                    <Typography variant="h6" color="primary.main" fontWeight="bold">
                      {selectedAgent.leads_count || selectedAgent.assigned_leads?.length || 0}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="text.secondary">STATUS</Typography>
                    <Box mt={0.5}>
                      <Chip
                        label={selectedAgent.is_active !== false ? 'Active Calling Agent' : 'Inactive'}
                        size="small"
                        color={selectedAgent.is_active !== false ? 'success' : 'default'}
                      />
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              <Box>
                <Typography variant="subtitle1" fontWeight="bold" mb={1}>
                  Assigned Leads In Pipeline ({selectedAgent.assigned_leads?.length || 0})
                </Typography>
                {selectedAgent.assigned_leads && selectedAgent.assigned_leads.length > 0 ? (
                  <Paper variant="outlined" sx={{ maxHeight: 280, overflowY: 'auto' }}>
                    <List dense>
                      {selectedAgent.assigned_leads.map((lead: any) => (
                        <ListItem
                          key={lead.id}
                          divider
                          button
                          onClick={() => router.push(`/leads/${lead.id}`)}
                        >
                          <ListItemText
                            primary={
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Typography variant="body2" fontWeight="bold">{lead.full_name}</Typography>
                                <Typography variant="caption" color="text.secondary">({lead.phone_primary})</Typography>
                              </Stack>
                            }
                            secondary={`City: ${lead.city || 'N/A'} • Budget: ${lead.budget_range || 'N/A'}`}
                          />
                          <Stack direction="row" spacing={1} alignItems="center">
                            <StatusBadge status={lead.status} type="lead" />
                            <StatusBadge status={lead.temperature} type="temperature" />
                          </Stack>
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No leads currently assigned to this agent.
                  </Typography>
                )}
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          {isManagerOrAdmin && selectedAgent && (
            <Button
              startIcon={<EditIcon />}
              onClick={() => {
                setViewModalOpen(false);
                handleOpenEdit(selectedAgent);
              }}
            >
              Edit Agent
            </Button>
          )}
          <Button variant="contained" onClick={() => setViewModalOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Agent Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Sales Agent"
        content={`Are you sure you want to remove agent "${agentToDelete?.username}"? Their assigned leads will become unassigned.`}
        confirmText={deleting ? 'Deleting...' : 'Delete Agent'}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setAgentToDelete(null);
        }}
      />
    </Box>
  );
}
