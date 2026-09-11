'use client';
import React, { useState, useEffect, Suspense } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  Stack,
  IconButton,
  CircularProgress,
  Divider,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import api from '../../../lib/api';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSnackbar } from 'notistack';
import { Lead, Plot } from '../../../types';
import dayjs from 'dayjs';

function NewDealForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedLeadId = searchParams.get('lead_id') || searchParams.get('lead') || '';
  const { enqueueSnackbar } = useSnackbar();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    lead: preselectedLeadId,
    plot: '',
    booking_date: dayjs().format('YYYY-MM-DD'),
    deal_amount: '',
    discount: '0',
    final_amount: '',
    notes: '',
  });

  useEffect(() => {
    if (preselectedLeadId) {
      setFormData((prev) => ({ ...prev, lead: preselectedLeadId }));
    }
  }, [preselectedLeadId]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [leadsRes, plotsRes] = await Promise.all([
          api.get('/api/leads/').catch(() => ({ data: [] })),
          api.get('/api/plots/?status=available').catch(() => ({ data: [] })),
        ]);
        setLeads(leadsRes.data);
        setPlots(plotsRes.data);

        // If preselected lead has interested project, prioritize available plots
        if (preselectedLeadId && leadsRes.data.length > 0) {
          const matchedLead = leadsRes.data.find((l: Lead) => String(l.id) === String(preselectedLeadId));
          if (matchedLead && matchedLead.interested_project && plotsRes.data.length > 0) {
            const projectPlots = plotsRes.data.filter((p: Plot) => p.project === (matchedLead.interested_project?.id || matchedLead.interested_project));
            if (projectPlots.length > 0) {
              const defaultPlot = projectPlots[0];
              const price = String(defaultPlot.total_price);
              setFormData((prev) => ({
                ...prev,
                plot: String(defaultPlot.id),
                deal_amount: price,
                final_amount: price,
              }));
            }
          }
        }
      } catch (err) {
        console.error('Failed to load leads/plots', err);
      }
    };
    fetchData();
  }, [preselectedLeadId]);

  const handlePlotSelect = (plotId: string) => {
    const selected = plots.find((p) => String(p.id) === String(plotId));
    const price = selected ? String(selected.total_price) : '';
    const discount = Number(formData.discount || 0);
    const finalAmt = price ? Math.max(0, Number(price) - discount).toString() : '';

    setFormData((prev) => ({
      ...prev,
      plot: plotId,
      deal_amount: price,
      final_amount: finalAmt,
    }));
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const nextForm = { ...formData, [name]: value };

    const total = Number(nextForm.deal_amount || 0);
    const disc = Number(nextForm.discount || 0);
    nextForm.final_amount = Math.max(0, total - disc).toString();

    setFormData(nextForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/deals/', {
        lead: formData.lead,
        plot: formData.plot,
        booking_date: formData.booking_date,
        deal_amount: formData.deal_amount,
        discount: formData.discount || '0',
        final_amount: formData.final_amount,
        notes: formData.notes,
      });

      enqueueSnackbar('Deal created successfully! Plot marked as Reserved and Lead updated to Booked.', {
        variant: 'success',
      });
      router.push('/deals');
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.non_field_errors?.[0] ||
        err?.response?.data?.plot?.[0] ||
        err?.response?.data?.detail ||
        'Failed to create deal';
      enqueueSnackbar(errorMsg, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ pb: 5 }}>
      <Stack direction="row" alignItems="center" spacing={2} mb={3}>
        <IconButton onClick={() => router.push('/deals')}>
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Create Deal / Plot Booking
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Map an interested lead customer to an available plot inventory item
          </Typography>
        </Box>
      </Stack>

      <Card elevation={2} sx={{ maxWidth: 850, mx: 'auto' }}>
        <CardContent sx={{ p: 4 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Select Customer Lead"
                  value={formData.lead}
                  onChange={(e) => setFormData({ ...formData, lead: e.target.value })}
                  required
                >
                  <MenuItem value="">-- Choose Lead --</MenuItem>
                  {leads.map((l) => (
                    <MenuItem key={l.id} value={l.id}>
                      {l.full_name} ({l.phone_primary}) - Status: {l.status}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Select Available Plot"
                  value={formData.plot}
                  onChange={(e) => handlePlotSelect(e.target.value)}
                  required
                >
                  <MenuItem value="">-- Choose Available Plot --</MenuItem>
                  {plots.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      Plot #{p.plot_number} ({p.area_sqft} sqft) - Price: ₹{Number(p.total_price).toLocaleString('en-IN')}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Booking Date"
                  value={formData.booking_date}
                  onChange={(e) => setFormData({ ...formData, booking_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Agreed Plot Amount (₹)"
                  name="deal_amount"
                  value={formData.deal_amount}
                  onChange={handleAmountChange}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Discount / Offer (₹)"
                  name="discount"
                  value={formData.discount}
                  onChange={handleAmountChange}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Final Deal Amount (₹)"
                  name="final_amount"
                  value={formData.final_amount}
                  InputProps={{ readOnly: true }}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Deal Remarks / Terms"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Special payment milestones, registry schedule, token details..."
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button variant="outlined" onClick={() => router.push('/deals')} disabled={loading}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                startIcon={<SaveIcon />}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Book Plot & Confirm Deal'}
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}

export default function NewDealPage() {
  return (
    <Suspense fallback={<Box p={4} textAlign="center"><CircularProgress /></Box>}>
      <NewDealForm />
    </Suspense>
  );
}
