'use client';
import React, { useState, useEffect } from 'react';
import { Box, Typography, Stack, Chip } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import { Deal } from '../../types';
import api from '../../lib/api';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/deals/');
      setDeals(res.data);
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
    { field: 'id', headerName: 'Deal #', width: 90 },
    { field: 'lead_name', headerName: 'Lead Customer', flex: 1.2, minWidth: 160 },
    { field: 'plot_number', headerName: 'Plot Number', flex: 0.9, minWidth: 120 },
    {
      field: 'final_amount',
      headerName: 'Deal Value',
      flex: 1,
      minWidth: 130,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="bold">
          {formatCurrency(params.value)}
        </Typography>
      ),
    },
    {
      field: 'booking_date',
      headerName: 'Booking Date',
      flex: 1,
      minWidth: 120,
      valueFormatter: (value: any) => (value ? dayjs(value).format('DD MMM YYYY') : '-'),
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      minWidth: 130,
      renderCell: (params) => <StatusBadge status={params.value} type="deal" />,
    },
    {
      field: 'payments',
      headerName: 'Milestones',
      flex: 1,
      minWidth: 130,
      renderCell: (params) => {
        const milestones = params.row.milestones || [];
        const paidCount = milestones.filter((m: any) => m.is_paid).length;
        return (
          <Chip
            size="small"
            label={`${paidCount} of ${milestones.length} Paid`}
            color={paidCount === milestones.length && milestones.length > 0 ? 'success' : 'default'}
          />
        );
      },
    },
  ];

  return (
    <Box sx={{ pb: 4 }}>
      <Box mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Deals & Plot Allocations
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage booked, confirmed, and finalized plot reservations
        </Typography>
      </Box>

      <DataTable
        columns={columns}
        rows={deals}
        loading={loading}
        onRowClick={(params) => router.push(`/deals/${params.row.id}`)}
      />
    </Box>
  );
}
