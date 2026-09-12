'use client';
import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  CircularProgress,
} from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import TableViewIcon from '@mui/icons-material/TableView';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/Download';
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';

import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LeadFilters from '../../components/leads/LeadFilters';
import LeadKanban from '../../components/leads/LeadKanban';
import CallLogForm from '../../components/leads/CallLogForm';
import StatusChangeDialog from '../../components/leads/StatusChangeDialog';
import { Lead, Project, User } from '../../types';
import api from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { useSnackbar } from 'notistack';
import { LEAD_SOURCE_OPTIONS, LEAD_TEMPERATURE_OPTIONS, LEAD_STATUS_OPTIONS, STATUS_LABELS } from '../../lib/constants';

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [agents, setAgents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [temperature, setTemperature] = useState('');
  const [source, setSource] = useState('');

  // Call modal
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [selectedLeadForCall, setSelectedLeadForCall] = useState<Lead | null>(null);

  // Status Change Dialog (Kanban / Stage actions)
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusLead, setStatusLead] = useState<Lead | null>(null);
  const [targetStatus, setTargetStatus] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);

  // Edit Lead Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [savingLead, setSavingLead] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    phone_primary: '',
    phone_alternate: '',
    email: '',
    whatsapp_number: '',
    source: 'facebook',
    city: '',
    interested_project: '',
    budget_range: '',
    plot_size_preference: '',
    notes: '',
    status: 'new',
    temperature: 'warm',
    assigned_agent: '',
  });

  // Delete Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [deletingLead, setDeletingLead] = useState(false);

  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const { hasRole } = useAuth();
  const isManagerOrAdmin = hasRole(['super_admin', 'manager']);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (status) params.status = status;
      if (temperature) params.temperature = temperature;
      if (source) params.source = source;
      if (search) params.search = search;

      const res = await api.get('/api/leads/', { params });
      setLeads(res.data);
    } catch (error) {
      console.error('Failed to fetch leads', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [projRes, agentRes] = await Promise.all([
        api.get('/api/projects/').catch(() => ({ data: [] })),
        api.get('/api/users/agents/').catch(() => ({ data: [] })),
      ]);
      setProjects(projRes.data);
      setAgents(agentRes.data);
    } catch (e) {
      console.error('Error fetching dependencies', e);
    }
  };

  useEffect(() => {
    fetchLeads();
    fetchDependencies();
  }, [status, temperature, source]);

  const handleResetFilters = () => {
    setSearch('');
    setStatus('');
    setTemperature('');
    setSource('');
  };

  const handleExportCSV = async () => {
    try {
      const response = await api.get('/api/leads/export/', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `leads_export_${dayjs().format('YYYY-MM-DD')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Export failed', err);
    }
  };

  const openCallDialog = (lead: Lead, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedLeadForCall(lead);
    setCallModalOpen(true);
  };

  const handleOpenEdit = (lead: Lead, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingLead(lead);
    setEditForm({
      full_name: lead.full_name || '',
      phone_primary: lead.phone_primary || '',
      phone_alternate: lead.phone_alternate || '',
      email: lead.email || '',
      whatsapp_number: lead.whatsapp_number || '',
      source: lead.source || 'facebook',
      city: lead.city || '',
      interested_project: lead.interested_project ? String((lead.interested_project as any).id || lead.interested_project) : '',
      budget_range: lead.budget_range || '',
      plot_size_preference: lead.plot_size_preference || '',
      notes: lead.notes || '',
      status: lead.status || 'new',
      temperature: lead.temperature || 'warm',
      assigned_agent: lead.assigned_agent ? String((lead.assigned_agent as any).id || lead.assigned_agent) : '',
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead) return;

    if (!editForm.full_name?.trim()) {
      enqueueSnackbar('Full Name is required', { variant: 'error' });
      return;
    }
    if (!editForm.phone_primary?.trim()) {
      enqueueSnackbar('Primary Phone Number is required', { variant: 'error' });
      return;
    }
    if (!editForm.email?.trim()) {
      enqueueSnackbar('Email Address is required', { variant: 'error' });
      return;
    }
    if (!editForm.city?.trim()) {
      enqueueSnackbar('City / Location is required', { variant: 'error' });
      return;
    }
    if (!editForm.interested_project) {
      enqueueSnackbar('Please select an Interested Project / Society', { variant: 'error' });
      return;
    }
    if (!editForm.budget_range?.trim()) {
      enqueueSnackbar('Budget Range is required', { variant: 'error' });
      return;
    }
    if (!editForm.plot_size_preference?.trim()) {
      enqueueSnackbar('Plot Size Preference is required', { variant: 'error' });
      return;
    }

    setSavingLead(true);
    try {
      const payload: any = { ...editForm };
      payload.interested_project = payload.interested_project ? Number(payload.interested_project) : null;
      payload.assigned_agent = payload.assigned_agent ? Number(payload.assigned_agent) : null;

      await api.patch(`/api/leads/${editingLead.id}/`, payload);
      enqueueSnackbar(`Lead ${editForm.full_name} updated successfully`, { variant: 'success' });
      setEditModalOpen(false);
      fetchLeads();
    } catch (err) {
      enqueueSnackbar('Failed to update lead', { variant: 'error' });
    } finally {
      setSavingLead(false);
    }
  };

  const handleOpenDelete = (lead: Lead, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setLeadToDelete(lead);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!leadToDelete) return;
    setDeletingLead(true);
    try {
      await api.delete(`/api/leads/${leadToDelete.id}/`);
      enqueueSnackbar(`Lead "${leadToDelete.full_name}" deleted successfully`, { variant: 'success' });
      setDeleteDialogOpen(false);
      setLeadToDelete(null);
      fetchLeads();
    } catch (err) {
      enqueueSnackbar('Failed to delete lead', { variant: 'error' });
    } finally {
      setDeletingLead(false);
    }
  };

  const handleOpenStatusModal = (lead: Lead, targetSt: string) => {
    setStatusLead(lead);
    setTargetStatus(targetSt);
    setStatusModalOpen(true);
  };

  const handleConfirmStatusChange = async (data: { status: string; comments: string; callbackDate?: string }) => {
    if (!statusLead) return;
    setSavingStatus(true);
    try {
      await api.patch(`/api/leads/${statusLead.id}/`, {
        status: data.status,
        status_comments: data.comments,
        next_callback_at: data.callbackDate || null,
      });
      enqueueSnackbar(
        `Lead "${statusLead.full_name}" moved to ${STATUS_LABELS[data.status] || data.status} & logged in Communication History`,
        { variant: 'success' }
      );
      setStatusModalOpen(false);
      setStatusLead(null);
      fetchLeads();
    } catch (err) {
      enqueueSnackbar('Failed to update lead status', { variant: 'error' });
    } finally {
      setSavingStatus(false);
    }
  };

  const filteredLeads = leads.filter((lead) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      lead.full_name?.toLowerCase().includes(q) ||
      lead.phone_primary?.includes(q) ||
      lead.city?.toLowerCase().includes(q)
    );
  });

  const columns: GridColDef[] = [
    {
      field: 'full_name',
      headerName: 'Lead Name',
      flex: 1.2,
      minWidth: 160,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={600} color="primary.main">
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'phone_primary',
      headerName: 'Primary Phone',
      flex: 1,
      minWidth: 130,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={500}>
          {params.value || '-'}
        </Typography>
      ),
    },
    {
      field: 'source',
      headerName: 'Source',
      flex: 0.8,
      minWidth: 110,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Stage Status',
      flex: 1,
      minWidth: 140,
      renderCell: (params) => <StatusBadge status={params.value} type="lead" />,
    },
    {
      field: 'temperature',
      headerName: 'Temperature',
      flex: 0.8,
      minWidth: 120,
      renderCell: (params) => <StatusBadge status={params.value} type="temperature" />,
    },
    {
      field: 'assigned_agent',
      headerName: 'Assigned Agent',
      flex: 1,
      minWidth: 130,
      renderCell: (params) => params.row?.assigned_agent?.username || 'Unassigned',
    },
    {
      field: 'created_at',
      headerName: 'Added On',
      flex: 0.9,
      minWidth: 110,
      valueFormatter: (value: any) => (value ? dayjs(value).format('DD MMM YYYY') : '-'),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      sortable: false,
      filterable: false,
      width: isManagerOrAdmin ? 170 : 100,
      minWidth: isManagerOrAdmin ? 170 : 100,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
          <Tooltip title="View Lead Details">
            <IconButton
              size="small"
              color="info"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/leads/${params.row.id}`);
              }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Log Call">
            <IconButton
              size="small"
              color="success"
              onClick={(e) => openCallDialog(params.row, e)}
            >
              <PhoneInTalkIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {isManagerOrAdmin && (
            <>
              <Tooltip title="Edit Lead">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={(e) => handleOpenEdit(params.row, e)}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Delete Lead">
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
            Leads Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track, qualify, and convert real estate buyer inquiries
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, val) => val && setViewMode(val)}
            size="small"
          >
            <ToggleButton value="table" aria-label="table view">
              <TableViewIcon fontSize="small" sx={{ mr: 0.5 }} /> Table
            </ToggleButton>
            <ToggleButton value="kanban" aria-label="kanban view">
              <ViewKanbanIcon fontSize="small" sx={{ mr: 0.5 }} /> Pipeline
            </ToggleButton>
          </ToggleButtonGroup>

          {isManagerOrAdmin && (
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExportCSV}
              size="small"
            >
              Export CSV
            </Button>
          )}

          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => router.push('/leads/new')}
            size="small"
          >
            Add Lead
          </Button>
        </Stack>
      </Stack>

      {/* Filters Bar */}
      <LeadFilters
        search={search}
        setSearch={setSearch}
        status={status}
        setStatus={setStatus}
        temperature={temperature}
        setTemperature={setTemperature}
        source={source}
        setSource={setSource}
        onReset={handleResetFilters}
      />

      {/* Main View */}
      {viewMode === 'table' ? (
        <DataTable
          columns={columns}
          rows={filteredLeads}
          loading={loading}
          onRowClick={(params) => router.push(`/leads/${params.row.id}`)}
        />
      ) : (
        <LeadKanban
          leads={filteredLeads}
          onLeadClick={(lead) => router.push(`/leads/${lead.id}`)}
          onCallClick={(lead) => openCallDialog(lead)}
          onStatusChangeClick={(lead, newSt) => handleOpenStatusModal(lead, newSt)}
        />
      )}

      {/* Call Log Dialog */}
      {selectedLeadForCall && (
        <CallLogForm
          open={callModalOpen}
          leadId={selectedLeadForCall.id}
          leadName={selectedLeadForCall.full_name}
          onClose={() => {
            setCallModalOpen(false);
            setSelectedLeadForCall(null);
          }}
          onSuccess={() => {
            fetchLeads();
          }}
        />
      )}

      {/* Edit Lead Modal */}
      <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleSaveEdit}>
          <DialogTitle>Edit Lead: {editingLead?.full_name}</DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Primary Phone"
                  value={editForm.phone_primary}
                  onChange={(e) => setEditForm({ ...editForm, phone_primary: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Alternate Phone"
                  value={editForm.phone_alternate}
                  onChange={(e) => setEditForm({ ...editForm, phone_alternate: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="WhatsApp Number"
                  value={editForm.whatsapp_number}
                  onChange={(e) => setEditForm({ ...editForm, whatsapp_number: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="City / Location"
                  value={editForm.city}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Lead Source"
                  value={editForm.source}
                  onChange={(e) => setEditForm({ ...editForm, source: e.target.value })}
                  required
                >
                  {LEAD_SOURCE_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Pipeline Stage Status"
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  required
                >
                  {LEAD_STATUS_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Temperature"
                  value={editForm.temperature}
                  onChange={(e) => setEditForm({ ...editForm, temperature: e.target.value })}
                  required
                >
                  {LEAD_TEMPERATURE_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Interested Project / Society"
                  value={editForm.interested_project}
                  onChange={(e) => setEditForm({ ...editForm, interested_project: e.target.value })}
                  required
                >
                  <MenuItem value="" disabled>
                    -- Select Project / Society (Required) --
                  </MenuItem>
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
                  select
                  label="Assigned Agent"
                  value={editForm.assigned_agent}
                  onChange={(e) => setEditForm({ ...editForm, assigned_agent: e.target.value })}
                >
                  <MenuItem value="">-- Unassigned / Round-Robin --</MenuItem>
                  {agents.map((ag) => (
                    <MenuItem key={ag.id} value={ag.id}>
                      {ag.username} {ag.first_name ? `(${ag.first_name} ${ag.last_name})` : ''}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Budget Range"
                  value={editForm.budget_range}
                  onChange={(e) => setEditForm({ ...editForm, budget_range: e.target.value })}
                  required
                  placeholder="e.g. 30L - 50L"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Plot Size Preference"
                  value={editForm.plot_size_preference}
                  onChange={(e) => setEditForm({ ...editForm, plot_size_preference: e.target.value })}
                  required
                  placeholder="e.g. 1500 sqft / 30x50"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Inquiry Notes"
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditModalOpen(false)} disabled={savingLead}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={savingLead}>
              {savingLead ? <CircularProgress size={24} /> : 'Save Lead'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Lead"
        content={`Are you sure you want to delete lead "${leadToDelete?.full_name}"? All call logs and activity for this lead will also be removed.`}
        confirmText={deletingLead ? 'Deleting...' : 'Delete Lead'}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setLeadToDelete(null);
        }}
      />

      {/* Status Change & Communication Log Dialog */}
      {statusLead && (
        <StatusChangeDialog
          open={statusModalOpen}
          leadName={statusLead.full_name}
          currentStatus={statusLead.status}
          newStatus={targetStatus}
          loading={savingStatus}
          onClose={() => {
            setStatusModalOpen(false);
            setStatusLead(null);
            setTargetStatus('');
          }}
          onConfirm={handleConfirmStatusChange}
        />
      )}
    </Box>
  );
}

