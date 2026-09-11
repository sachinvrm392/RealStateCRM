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
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EmailIcon from '@mui/icons-material/Email';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import StraightenIcon from '@mui/icons-material/Straighten';
import HandshakeIcon from '@mui/icons-material/Handshake';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';

import { Lead } from '../../../types';
import api from '../../../lib/api';
import StatusBadge from '../../../components/common/StatusBadge';
import CallLogForm from '../../../components/leads/CallLogForm';
import { STATUS_LABELS } from '../../../lib/constants';

// Allowed pipeline transitions
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  new: ['contacted', 'lost'],
  contacted: ['interested', 'lost'],
  interested: ['site_visit_scheduled', 'lost'],
  site_visit_scheduled: ['site_visit_done', 'lost'],
  site_visit_done: ['negotiation', 'lost'],
  negotiation: ['booked', 'lost'],
  booked: ['deal_confirmed', 'lost'],
  lost: ['new'],
};

const TEMPERATURES = ['hot', 'warm', 'cold', 'unqualified'] as const;

export default function LeadDetailPage({ params }: { params: { id: string } }) {
  const [lead, setLead] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const router = useRouter();

  const fetchLead = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/leads/${params.id}/`);
      setLead(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLead();
  }, [params.id]);

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);
    setFeedback(null);
    try {
      const res = await api.patch(`/api/leads/${params.id}/`, { status: newStatus });
      setLead(res.data);
      setFeedback({ type: 'success', message: `Status updated to ${STATUS_LABELS[newStatus] || newStatus}` });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.response?.data?.status || 'Failed to update lead status',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleTemperatureChange = async (newTemp: string) => {
    setUpdating(true);
    setFeedback(null);
    try {
      const res = await api.patch(`/api/leads/${params.id}/`, { temperature: newTemp });
      setLead(res.data);
      setFeedback({ type: 'success', message: `Temperature updated to ${newTemp.toUpperCase()}` });
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'Failed to update temperature' });
    } finally {
      setUpdating(false);
    }
  };

  if (loading && !lead) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!lead) {
    return (
      <Box p={3}>
        <Alert severity="error">Lead not found</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/leads')} sx={{ mt: 2 }}>
          Back to Leads
        </Button>
      </Box>
    );
  }

  const nextAllowed = ALLOWED_TRANSITIONS[lead.status] || [];
  const isDealConverted = lead.status === 'booked' || lead.status === 'deal_confirmed' || Boolean(lead.linked_deal);

  return (
    <Box sx={{ pb: 5 }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={2} mb={2}>
        <IconButton onClick={() => router.push('/leads')}>
          <ArrowBackIcon />
        </IconButton>
        <Box flex={1}>
          <Typography variant="h4" fontWeight="bold">
            {lead.full_name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Lead #{lead.id} • Added on {dayjs(lead.created_at).format('DD MMMM YYYY, hh:mm A')}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          {!isDealConverted && (
            <Button
              variant="contained"
              color="secondary"
              startIcon={<HandshakeIcon />}
              onClick={() => router.push(`/deals/new?lead_id=${lead.id}`)}
            >
              Book Plot / Deal
            </Button>
          )}
          <Button
            variant="contained"
            color="primary"
            startIcon={<PhoneInTalkIcon />}
            onClick={() => setCallModalOpen(true)}
          >
            Log Call
          </Button>
        </Stack>
      </Stack>

      {feedback && (
        <Alert severity={feedback.type} sx={{ mb: 3 }} onClose={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      )}

      {/* Linked Deal Banner if Converted */}
      {isDealConverted && (
        <Paper
          elevation={1}
          sx={{
            p: 2.5,
            mb: 3,
            borderRadius: 2,
            bgcolor: lead.status === 'deal_confirmed' ? '#e8f5e9' : '#fff8e1',
            border: `1px solid ${lead.status === 'deal_confirmed' ? '#a5d6a7' : '#ffe082'}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <HandshakeIcon sx={{ fontSize: 40, color: lead.status === 'deal_confirmed' ? 'success.main' : 'warning.main' }} />
            <Box>
              <Typography variant="subtitle1" fontWeight="bold">
                {lead.status === 'deal_confirmed' ? 'Deal Confirmed & Finalized' : 'Plot Booking Reserved'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This lead is active in the Deals module and listed on the Deals & Plot Allocations page.
              </Typography>
            </Box>
          </Box>
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="contained"
              color={lead.status === 'deal_confirmed' ? 'success' : 'warning'}
              onClick={() => router.push(lead.linked_deal ? `/deals/${lead.linked_deal.id}` : '/deals')}
            >
              View in Deals Menu {lead.linked_deal ? `(#${lead.linked_deal.id})` : ''}
            </Button>
            <Button
              variant="outlined"
              onClick={() => router.push('/deals')}
            >
              All Deals Listing
            </Button>
          </Stack>
        </Paper>
      )}

      {/* Pipeline Status & Temperature Actions */}
      <Paper variant="outlined" sx={{ p: 2.5, mb: 3, borderRadius: 2, bgcolor: 'background.paper' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
              CURRENT STATUS & PIPELINE ACTIONS:
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" gap={1}>
              <StatusBadge status={lead.status} type="lead" />
              {nextAllowed.map((st) => (
                <Button
                  key={st}
                  variant="outlined"
                  size="small"
                  color={st === 'lost' ? 'error' : st === 'deal_confirmed' ? 'success' : 'primary'}
                  disabled={updating}
                  onClick={() => handleStatusChange(st)}
                >
                  Move to {STATUS_LABELS[st] || st}
                </Button>
              ))}
            </Stack>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
              LEAD TEMPERATURE:
            </Typography>
            <Stack direction="row" spacing={1}>
              {TEMPERATURES.map((temp) => (
                <Chip
                  key={temp}
                  label={temp.toUpperCase()}
                  clickable
                  variant={lead.temperature === temp ? 'filled' : 'outlined'}
                  color={
                    temp === 'hot'
                      ? 'error'
                      : temp === 'warm'
                      ? 'warning'
                      : temp === 'cold'
                      ? 'info'
                      : 'default'
                  }
                  onClick={() => handleTemperatureChange(temp)}
                />
              ))}
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        {/* Left Column: Lead Profile & Requirement */}
        <Grid item xs={12} md={4}>
          <Card elevation={2} sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Contact & Details
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Stack spacing={1.5}>
                <Typography variant="body2">
                  <strong>Primary Phone:</strong> {lead.phone_primary}
                </Typography>
                {lead.phone_alternate && (
                  <Typography variant="body2">
                    <strong>Alternate Phone:</strong> {lead.phone_alternate}
                  </Typography>
                )}
                {lead.whatsapp_number && (
                  <Typography variant="body2">
                    <WhatsAppIcon fontSize="inherit" color="success" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                    <strong>WhatsApp:</strong> {lead.whatsapp_number}
                  </Typography>
                )}
                <Typography variant="body2">
                  <EmailIcon fontSize="inherit" color="action" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                  <strong>Email:</strong> {lead.email || 'N/A'}
                </Typography>
                <Typography variant="body2">
                  <LocationOnIcon fontSize="inherit" color="action" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                  <strong>City / Location:</strong> {lead.city || 'N/A'}
                </Typography>
                <Typography variant="body2">
                  <strong>Source:</strong> <span style={{ textTransform: 'capitalize' }}>{lead.source}</span>
                </Typography>
                <Typography variant="body2">
                  <strong>Assigned Agent:</strong> {lead.assigned_agent?.username || 'Unassigned'}
                </Typography>
                {lead.next_callback_at && (
                  <Typography variant="body2" color="warning.main" fontWeight="bold">
                    <strong>Next Callback:</strong> {dayjs(lead.next_callback_at).format('DD MMM YYYY, hh:mm A')}
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>

          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Buyer Preferences
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Stack spacing={1.5}>
                <Typography variant="body2">
                  <strong>Interested Project:</strong> {lead.interested_project?.name || 'General Inquiry'}
                </Typography>
                <Typography variant="body2">
                  <MonetizationOnIcon fontSize="inherit" color="action" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                  <strong>Budget Range:</strong> {lead.budget_range || 'Not Specified'}
                </Typography>
                <Typography variant="body2">
                  <StraightenIcon fontSize="inherit" color="action" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                  <strong>Plot Size Preference:</strong> {lead.plot_size_preference || 'Not Specified'}
                </Typography>
                {lead.notes && (
                  <Box sx={{ mt: 1, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Initial Remarks:
                    </Typography>
                    <Typography variant="body2">{lead.notes}</Typography>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column: Call History & Engagement */}
        <Grid item xs={12} md={8}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight="bold">
                  Call History & Communication Log
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<PhoneInTalkIcon />}
                  onClick={() => setCallModalOpen(true)}
                >
                  Log New Call
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />

              {lead.call_attempts && lead.call_attempts.length > 0 ? (
                <Stack spacing={2}>
                  {lead.call_attempts.map((call: any) => (
                    <Paper
                      key={call.id}
                      variant="outlined"
                      sx={{ p: 2, borderRadius: 2, bgcolor: 'background.default' }}
                    >
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Chip
                          label={call.outcome.replace('_', ' ').toUpperCase()}
                          size="small"
                          color={
                            call.outcome === 'connected'
                              ? 'success'
                              : call.outcome === 'callback_scheduled'
                              ? 'warning'
                              : 'default'
                          }
                        />
                        <Typography variant="caption" color="text.secondary">
                          {dayjs(call.created_at).format('DD MMM YYYY, hh:mm A')}
                        </Typography>
                      </Box>

                      {call.notes && (
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Notes:</strong> {call.notes}
                        </Typography>
                      )}

                      {call.callback_scheduled_at && (
                        <Typography variant="caption" color="warning.dark" display="block" mb={1}>
                          ⏰ Scheduled Callback for: {dayjs(call.callback_scheduled_at).format('DD MMM YYYY, hh:mm A')}
                        </Typography>
                      )}

                      {call.recording_file && (
                        <Box sx={{ mt: 1.5, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                          <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                            🎧 Call Recording Audio:
                          </Typography>
                          <audio controls style={{ width: '100%', height: 36 }}>
                            <source src={call.recording_file} />
                            Your browser does not support the audio player.
                          </audio>
                        </Box>
                      )}
                    </Paper>
                  ))}
                </Stack>
              ) : (
                <Box py={5} textAlign="center">
                  <PhoneInTalkIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                  <Typography color="text.secondary">No call attempts logged yet.</Typography>
                  <Button
                    variant="contained"
                    size="small"
                    sx={{ mt: 2 }}
                    onClick={() => setCallModalOpen(true)}
                  >
                    Make & Log First Call
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Call Modal */}
      <CallLogForm
        open={callModalOpen}
        leadId={lead.id}
        leadName={lead.full_name}
        onClose={() => setCallModalOpen(false)}
        onSuccess={() => fetchLead()}
      />
    </Box>
  );
}
