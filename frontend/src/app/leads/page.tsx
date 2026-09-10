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
} from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import TableViewIcon from '@mui/icons-material/TableView';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';

import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import LeadFilters from '../../components/leads/LeadFilters';
import LeadKanban from '../../components/leads/LeadKanban';
import CallLogForm from '../../components/leads/CallLogForm';
import { Lead } from '../../types';
import api from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
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

  const router = useRouter();
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

  useEffect(() => {
    fetchLeads();
  }, [status, temperature, source]);

  const handleSearchTrigger = () => {
    fetchLeads();
  };

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
    { field: 'full_name', headerName: 'Full Name', flex: 1.2, minWidth: 150 },
    { field: 'phone_primary', headerName: 'Primary Phone', flex: 1, minWidth: 120 },
    {
      field: 'source',
      headerName: 'Source',
      flex: 0.8,
      minWidth: 100,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      minWidth: 140,
      renderCell: (params) => <StatusBadge status={params.value} type="lead" />,
    },
    {
      field: 'temperature',
      headerName: 'Temperature',
      flex: 0.8,
      minWidth: 110,
      renderCell: (params) => <StatusBadge status={params.value} type="temperature" />,
    },
    {
      field: 'assigned_agent',
      headerName: 'Assigned Agent',
      flex: 1,
      minWidth: 120,
      valueGetter: (params) => params.row?.assigned_agent?.username || 'Unassigned',
    },
    {
      field: 'created_at',
      headerName: 'Added On',
      flex: 0.9,
      minWidth: 110,
      valueFormatter: (params) => (params.value ? dayjs(params.value).format('DD MMM YYYY') : '-'),
    },
    {
      field: 'actions',
      headerName: 'Call',
      sortable: false,
      filterable: false,
      width: 80,
      renderCell: (params) => (
        <Tooltip title="Log Call">
          <IconButton
            size="small"
            color="primary"
            onClick={(e) => openCallDialog(params.row, e)}
          >
            <PhoneInTalkIcon fontSize="small" />
          </IconButton>
        </Tooltip>
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
            <>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleExportCSV}
                size="small"
              >
                Export CSV
              </Button>
              <Button
                variant="outlined"
                startIcon={<UploadFileIcon />}
                onClick={() => router.push('/import')}
                size="small"
              >
                Import CSV
              </Button>
            </>
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
    </Box>
  );
}
