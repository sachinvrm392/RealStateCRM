'use client';
import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Stack, Chip } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import { Plot } from '../../types';
import api from '../../lib/api';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';

export default function PlotsPage() {
  const [plots, setPlots] = useState<Plot[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { hasRole } = useAuth();
  const isManagerOrAdmin = hasRole(['super_admin', 'manager']);

  useEffect(() => {
    fetchPlots();
  }, []);

  const fetchPlots = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/plots/');
      setPlots(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number | string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(val || 0));
  };

  const columns: GridColDef[] = [
    { field: 'plot_number', headerName: 'Plot No.', width: 110 },
    { field: 'project_name', headerName: 'Project / Society', flex: 1.2, minWidth: 150 },
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
        <Typography variant="body2" fontWeight="bold">
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
  ];

  return (
    <Box sx={{ pb: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
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

      <DataTable columns={columns} rows={plots} loading={loading} />
    </Box>
  );
}
