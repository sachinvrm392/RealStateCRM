'use client';
import React from 'react';
import { Card, CardContent, Typography, Grid, Box, Paper } from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';

export interface RevenueItem {
  status: string;
  total_revenue: number | string | null;
}

export default function RevenueSummary({ data }: { data: RevenueItem[] }) {
  const getRevenue = (status: string) => {
    const item = (data || []).find((d) => d.status === status);
    return Number(item?.total_revenue || 0);
  };

  const booked = getRevenue('booked');
  const confirmed = getRevenue('confirmed');
  const cancelled = getRevenue('cancelled');
  const totalPipeline = booked + confirmed;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <Card elevation={2} sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Deal Value & Revenue Summary
        </Typography>
        <Grid container spacing={2} mt={0.5}>
          <Grid item xs={12} sm={6}>
            <Paper variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', bgcolor: 'success.light', color: 'success.contrastText' }}>
              <CheckCircleOutlineIcon sx={{ fontSize: 36, mr: 1.5 }} />
              <Box>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>Confirmed Deals</Typography>
                <Typography variant="h6" fontWeight="bold">{formatCurrency(confirmed)}</Typography>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Paper variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', bgcolor: 'warning.light', color: 'warning.contrastText' }}>
              <AccountBalanceWalletIcon sx={{ fontSize: 36, mr: 1.5 }} />
              <Box>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>Booked Deals (Pipeline)</Typography>
                <Typography variant="h6" fontWeight="bold">{formatCurrency(booked)}</Typography>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Paper variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Total Active Deal Pipeline</Typography>
                <Typography variant="h6" color="primary.main" fontWeight="bold">{formatCurrency(totalPipeline)}</Typography>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Paper variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
              <HighlightOffIcon sx={{ fontSize: 32, mr: 1.5, color: 'error.main' }} />
              <Box>
                <Typography variant="caption" color="text.secondary">Cancelled Deals Value</Typography>
                <Typography variant="body1" color="error.main" fontWeight="bold">{formatCurrency(cancelled)}</Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
