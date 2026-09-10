'use client';
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  CircularProgress,
  Stack,
  Alert,
} from '@mui/material';
import GetAppIcon from '@mui/icons-material/GetApp';
import GroupIcon from '@mui/icons-material/Group';
import HandshakeIcon from '@mui/icons-material/Handshake';
import TerrainIcon from '@mui/icons-material/Terrain';
import api from '../../lib/api';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';

export default function ReportsPage() {
  const [downloading, setDownloading] = useState<string | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  const handleExport = async (endpoint: string, filenamePrefix: string, key: string) => {
    try {
      setDownloading(key);
      const response = await api.get(endpoint, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${filenamePrefix}_${dayjs().format('YYYY-MM-DD')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      enqueueSnackbar(`${filenamePrefix} export downloaded successfully`, { variant: 'success' });
    } catch (err) {
      enqueueSnackbar('Failed to download report', { variant: 'error' });
    } finally {
      setDownloading(null);
    }
  };

  return (
    <Box sx={{ pb: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Reports & Data Exports
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Download raw operational datasets in CSV / Excel compatible format
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center', p: 4 }}>
              <GroupIcon sx={{ fontSize: 50, color: 'primary.main', mb: 1.5 }} />
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Leads Export
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Complete list of all buyer inquiries, contact details, status transitions, and assigned agents.
              </Typography>
              <Button
                variant="contained"
                startIcon={<GetAppIcon />}
                disabled={downloading === 'leads'}
                onClick={() => handleExport('/api/leads/export/', 'leads_master_report', 'leads')}
              >
                {downloading === 'leads' ? <CircularProgress size={24} /> : 'Export Leads (CSV)'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center', p: 4 }}>
              <HandshakeIcon sx={{ fontSize: 50, color: 'success.main', mb: 1.5 }} />
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Deals & Bookings Export
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Plot bookings, agreed deal values, discounts, confirmations, and customer mappings.
              </Typography>
              <Button
                variant="contained"
                color="success"
                startIcon={<GetAppIcon />}
                disabled={downloading === 'deals'}
                onClick={() => handleExport('/api/deals/export/', 'deals_financial_report', 'deals')}
              >
                {downloading === 'deals' ? <CircularProgress size={24} /> : 'Export Deals (CSV)'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center', p: 4 }}>
              <TerrainIcon sx={{ fontSize: 50, color: 'warning.main', mb: 1.5 }} />
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Plot Inventory Export
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Master inventory of plots, sector/phases, square footage, pricing, and available vs sold statuses.
              </Typography>
              <Button
                variant="contained"
                color="warning"
                startIcon={<GetAppIcon />}
                disabled={downloading === 'plots'}
                onClick={() => handleExport('/api/plots/export/', 'plot_inventory_report', 'plots')}
              >
                {downloading === 'plots' ? <CircularProgress size={24} /> : 'Export Plots (CSV)'}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
