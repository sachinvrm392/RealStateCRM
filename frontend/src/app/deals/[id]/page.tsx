'use client';
import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Divider,
  Button,
  Stack,
  Chip,
  Alert,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AddCardIcon from '@mui/icons-material/AddCard';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';

import { Deal, PaymentMilestone } from '../../../types';
import api from '../../../lib/api';
import StatusBadge from '../../../components/common/StatusBadge';
import { useSnackbar } from 'notistack';

export default function DealDetailPage({ params }: { params: { id: string } }) {
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [milestones, setMilestones] = useState<PaymentMilestone[]>([]);
  const [addMilestoneOpen, setAddMilestoneOpen] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState({
    milestone_type: 'token',
    amount: '',
    due_date: dayjs().add(7, 'day').format('YYYY-MM-DD'),
    notes: '',
  });

  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const fetchDeal = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/deals/${params.id}/`);
      setDeal(res.data);

      const msRes = await api.get(`/api/deals/${params.id}/milestones/`).catch(() => ({ data: [] }));
      setMilestones(msRes.data);
    } catch (err) {
      console.error('Failed to fetch deal', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeal();
  }, [params.id]);

  const handleUpdateStatus = async (newStatus: 'confirmed' | 'cancelled') => {
    try {
      const res = await api.patch(`/api/deals/${params.id}/`, { status: newStatus });
      setDeal(res.data);
      enqueueSnackbar(`Deal updated to ${newStatus.toUpperCase()}`, { variant: 'success' });
    } catch (err) {
      enqueueSnackbar('Failed to update deal status', { variant: 'error' });
    }
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/api/deals/${params.id}/milestones/`, milestoneForm);
      enqueueSnackbar('Payment milestone added', { variant: 'success' });
      setAddMilestoneOpen(false);
      fetchDeal();
    } catch (err) {
      enqueueSnackbar('Failed to create milestone', { variant: 'error' });
    }
  };

  const handleTogglePaymentPaid = async (milestone: PaymentMilestone) => {
    try {
      const nextPaidState = !milestone.is_paid;
      await api.patch(`/api/deals/${params.id}/milestones/${milestone.id}/`, {
        is_paid: nextPaidState,
        paid_date: nextPaidState ? dayjs().format('YYYY-MM-DD') : null,
      });
      enqueueSnackbar(`Payment marked as ${nextPaidState ? 'PAID' : 'PENDING'}`, { variant: 'info' });
      fetchDeal();
    } catch (err) {
      enqueueSnackbar('Failed to update milestone payment status', { variant: 'error' });
    }
  };

  const formatCurrency = (val: number | string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(val || 0));
  };

  if (loading && !deal) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!deal) {
    return (
      <Box p={3}>
        <Alert severity="error">Deal not found</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/deals')} sx={{ mt: 2 }}>
          Back to Deals
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 5 }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={2} mb={3}>
        <IconButton onClick={() => router.push('/deals')}>
          <ArrowBackIcon />
        </IconButton>
        <Box flex={1}>
          <Typography variant="h4" fontWeight="bold">
            Deal #{deal.id}: {deal.lead_name} (Plot #{deal.plot_number})
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Booked on {dayjs(deal.booking_date).format('DD MMMM YYYY')}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5}>
          {deal.status === 'booked' && (
            <>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircleIcon />}
                onClick={() => handleUpdateStatus('confirmed')}
              >
                Confirm Deal (Mark Plot Sold)
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<CancelIcon />}
                onClick={() => handleUpdateStatus('cancelled')}
              >
                Cancel Deal
              </Button>
            </>
          )}
          <StatusBadge status={deal.status} type="deal" />
        </Stack>
      </Stack>

      <Grid container spacing={3}>
        {/* Left Column: Financials & Deal Details */}
        <Grid item xs={12} md={4}>
          <Card elevation={2} sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Deal Financials
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Stack spacing={2}>
                <Box display="flex" justifyContent="space-between">
                  <Typography color="text.secondary">Agreed Price:</Typography>
                  <Typography fontWeight="bold">{formatCurrency(deal.deal_amount)}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography color="text.secondary">Discount Applied:</Typography>
                  <Typography color="error.main">- {formatCurrency(deal.discount)}</Typography>
                </Box>
                <Divider />
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="h6">Final Payable:</Typography>
                  <Typography variant="h6" color="primary.main" fontWeight="bold">
                    {formatCurrency(deal.final_amount)}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {deal.notes && (
            <Card elevation={2}>
              <CardContent>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Notes & Special Terms
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {deal.notes}
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Right Column: Payment Milestones */}
        <Grid item xs={12} md={8}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight="bold">
                  Payment Milestones & Schedule
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddCardIcon />}
                  onClick={() => setAddMilestoneOpen(true)}
                >
                  Add Milestone
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Milestone</strong></TableCell>
                      <TableCell><strong>Amount (₹)</strong></TableCell>
                      <TableCell><strong>Due Date</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                      <TableCell align="right"><strong>Action</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {milestones.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography color="text.secondary" py={2}>
                            No payment milestones defined.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      milestones.map((m) => (
                        <TableRow key={m.id} hover>
                          <TableCell sx={{ textTransform: 'capitalize' }}>
                            {m.milestone_type?.replace('_', ' ')}
                          </TableCell>
                          <TableCell fontWeight="bold">{formatCurrency(m.amount)}</TableCell>
                          <TableCell>{dayjs(m.due_date).format('DD MMM YYYY')}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={m.is_paid ? `Paid on ${m.paid_date ? dayjs(m.paid_date).format('DD/MM/YY') : ''}` : 'Pending'}
                              color={m.is_paid ? 'success' : 'warning'}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              size="small"
                              variant={m.is_paid ? 'outlined' : 'contained'}
                              color={m.is_paid ? 'inherit' : 'success'}
                              onClick={() => handleTogglePaymentPaid(m)}
                            >
                              {m.is_paid ? 'Mark Pending' : 'Mark Paid'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Add Milestone Modal */}
      <Dialog open={addMilestoneOpen} onClose={() => setAddMilestoneOpen(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleAddMilestone}>
          <DialogTitle>Add Payment Milestone</DialogTitle>
          <DialogContent dividers>
            <TextField
              fullWidth
              select
              label="Milestone Type"
              value={milestoneForm.milestone_type}
              onChange={(e) => setMilestoneForm({ ...milestoneForm, milestone_type: e.target.value })}
              sx={{ mb: 2 }}
            >
              <MenuItem value="token">Token Amount</MenuItem>
              <MenuItem value="down_payment">Down Payment</MenuItem>
              <MenuItem value="full_payment">Full / Final Payment</MenuItem>
            </TextField>

            <TextField
              fullWidth
              type="number"
              label="Milestone Amount (₹)"
              value={milestoneForm.amount}
              onChange={(e) => setMilestoneForm({ ...milestoneForm, amount: e.target.value })}
              required
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              type="date"
              label="Due Date"
              value={milestoneForm.due_date}
              onChange={(e) => setMilestoneForm({ ...milestoneForm, due_date: e.target.value })}
              InputLabelProps={{ shrink: true }}
              required
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              multiline
              rows={2}
              label="Notes"
              value={milestoneForm.notes}
              onChange={(e) => setMilestoneForm({ ...milestoneForm, notes: e.target.value })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddMilestoneOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Save Milestone</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
