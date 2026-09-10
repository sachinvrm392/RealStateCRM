'use client';
import React from 'react';
import { Card, CardContent, Typography, Box, Grid, Paper } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

export interface LeadAgingData {
  '>30 days'?: number;
  '>14 days'?: number;
  '>7 days'?: number;
}

export default function LeadAgingReport({ data }: { data: LeadAgingData }) {
  const over7 = data?.['>7 days'] || 0;
  const over14 = data?.['>14 days'] || 0;
  const over30 = data?.['>30 days'] || 0;

  return (
    <Card elevation={2} sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Lead Aging (Stuck Leads)
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Active leads that haven't moved or received follow-ups
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', borderColor: 'warning.main', bgcolor: 'warning.lighter' }}>
              <AccessTimeIcon color="warning" sx={{ fontSize: 32 }} />
              <Typography variant="h4" fontWeight="bold" color="warning.dark">{over7}</Typography>
              <Typography variant="caption" color="text.secondary">&gt; 7 Days Inactive</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', borderColor: 'orange', bgcolor: '#fff3e0' }}>
              <WarningAmberIcon sx={{ fontSize: 32, color: '#e65100' }} />
              <Typography variant="h4" fontWeight="bold" sx={{ color: '#e65100' }}>{over14}</Typography>
              <Typography variant="caption" color="text.secondary">&gt; 14 Days Inactive</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', borderColor: 'error.main', bgcolor: 'error.lighter' }}>
              <ErrorOutlineIcon color="error" sx={{ fontSize: 32 }} />
              <Typography variant="h4" fontWeight="bold" color="error.main">{over30}</Typography>
              <Typography variant="caption" color="text.secondary">&gt; 30 Days Inactive</Typography>
            </Paper>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
