'use client';
import React, { useEffect, useState } from 'react';
import { Grid, Box, Typography, CircularProgress, Alert, Button, Stack } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import api from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';

import FunnelChart from '../../components/dashboard/FunnelChart';
import CallbackWidget from '../../components/dashboard/CallbackWidget';
import SourceBreakdown from '../../components/dashboard/SourceBreakdown';
import TemperatureChart from '../../components/dashboard/TemperatureChart';
import AgentPerformance from '../../components/dashboard/AgentPerformance';
import ActivityFeed from '../../components/dashboard/ActivityFeed';
import PlotSummary from '../../components/dashboard/PlotSummary';

export default function DashboardPage() {
  const { user, hasRole } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isManagerOrAdmin = hasRole(['super_admin', 'manager']);

  const fetchDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const [
        funnelRes,
        callbacksRes,
        sourcesRes,
        tempRes,
        activityRes,
        agentPerfRes,
        plotsRes
      ] = await Promise.all([
        api.get('/api/dashboard/funnel/').catch(() => ({ data: [] })),
        api.get('/api/dashboard/callbacks/').catch(() => ({ data: [] })),
        api.get('/api/dashboard/sources/').catch(() => ({ data: [] })),
        api.get('/api/dashboard/temperature/').catch(() => ({ data: [] })),
        api.get('/api/dashboard/activity/').catch(() => ({ data: [] })),
        isManagerOrAdmin ? api.get('/api/dashboard/agent-performance/').catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
        isManagerOrAdmin ? api.get('/api/dashboard/plots-summary/').catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
      ]);

      setData({
        funnel: funnelRes.data,
        callbacks: callbacksRes.data,
        sources: sourcesRes.data,
        temperature: tempRes.data,
        activity: activityRes.data,
        agentPerformance: agentPerfRes.data,
        plotsSummary: plotsRes.data,
      });
    } catch (err: any) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [user]);

  if (loading && !data) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 5 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Real Estate CRM Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Welcome back, {user?.username} ({user?.role?.replace('_', ' ').toUpperCase()})
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchDashboard}
          disabled={loading}
        >
          Refresh Data
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* Row 1: Pipeline Funnel & Callbacks */}
        <Grid item xs={12} lg={8}>
          <FunnelChart data={data?.funnel || []} />
        </Grid>
        <Grid item xs={12} lg={4}>
          <CallbackWidget data={data?.callbacks || []} />
        </Grid>

        {/* Row 2: Lead Sources & Temperature Distribution */}
        <Grid item xs={12} md={6}>
          <SourceBreakdown data={data?.sources || []} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TemperatureChart data={data?.temperature || []} />
        </Grid>

        {/* Manager/Super Admin Analytics */}
        {isManagerOrAdmin && (
          <>
            {/* Row 3: Plots Inventory Summary */}
            <Grid item xs={12}>
              <PlotSummary data={data?.plotsSummary || []} />
            </Grid>

            {/* Row 4: Agent Performance */}
            <Grid item xs={12}>
              <AgentPerformance data={data?.agentPerformance || []} />
            </Grid>
          </>
        )}

        {/* Row 5: Recent Activity Feed */}
        <Grid item xs={12}>
          <ActivityFeed data={data?.activity || []} />
        </Grid>
      </Grid>
    </Box>
  );
}
