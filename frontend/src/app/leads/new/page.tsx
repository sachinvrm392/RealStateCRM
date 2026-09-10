'use client';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  Alert,
  CircularProgress,
  Stack,
  IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import api from '../../../lib/api';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';
import { LEAD_SOURCE_OPTIONS, LEAD_TEMPERATURE_OPTIONS } from '../../../lib/constants';
import { Project, User } from '../../../types';

export default function NewLeadPage() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const [projects, setProjects] = useState<Project[]>([]);
  const [agents, setAgents] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<any[] | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    phone_primary: '',
    phone_alternate: '',
    email: '',
    whatsapp_number: '',
    source: 'facebook',
    city: '',
    interested_project: '',
    budget_range: '',
    plot_size_preference: '',
    notes: '',
    temperature: 'unqualified',
    assigned_agent: '',
  });

  useEffect(() => {
    // Fetch projects and agents
    const loadDependencies = async () => {
      try {
        const [projRes, agentRes] = await Promise.all([
          api.get('/api/projects/').catch(() => ({ data: [] })),
          api.get('/api/users/agents/').catch(() => ({ data: [] })),
        ]);
        setProjects(projRes.data);
        setAgents(agentRes.data);
      } catch (err) {
        console.error('Failed to load projects/agents', err);
      }
    };
    loadDependencies();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhoneBlur = async () => {
    if (!formData.phone_primary || formData.phone_primary.length < 6) return;
    try {
      const res = await api.get(`/api/leads/check_duplicates/?phone=${formData.phone_primary}`);
      if (res.data && res.data.length > 0) {
        setDuplicateWarning(res.data);
      } else {
        setDuplicateWarning(null);
      }
    } catch (err) {
      console.error('Duplicate check error', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: any = { ...formData };
      if (!payload.interested_project) delete payload.interested_project;
      if (!payload.assigned_agent) delete payload.assigned_agent;

      await api.post('/api/leads/', payload);
      enqueueSnackbar('Lead registered successfully (Auto-assigned to agent)', { variant: 'success' });
      router.push('/leads');
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.phone_primary?.[0] ||
        err.response?.data?.detail ||
        'Failed to create lead';
      enqueueSnackbar(errorMsg, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ pb: 5 }}>
      <Stack direction="row" alignItems="center" spacing={2} mb={3}>
        <IconButton onClick={() => router.push('/leads')}>
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Add New Lead
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Capture lead inquiry details. Leads without an assigned agent will be auto-assigned via round-robin.
          </Typography>
        </Box>
      </Stack>

      {duplicateWarning && (
        <Alert severity="warning" sx={{ mb: 3 }} onClose={() => setDuplicateWarning(null)}>
          <strong>Duplicate Warning!</strong> A lead with phone {formData.phone_primary} already exists:
          {duplicateWarning.map((d) => (
            <span key={d.id} style={{ display: 'block', marginTop: 4 }}>
              • {d.full_name} (Status: {d.status}) - Assigned to: {d.assigned_agent__username || 'Unassigned'}
            </span>
          ))}
        </Alert>
      )}

      <Card elevation={2} sx={{ maxWidth: 900 }}>
        <CardContent sx={{ p: 4 }}>
          <form onSubmit={handleSubmit}>
            <Typography variant="h6" fontWeight="bold" gutterBottom color="primary">
              1. Contact Information
            </Typography>
            <Grid container spacing={2.5} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Primary Phone Number"
                  name="phone_primary"
                  value={formData.phone_primary}
                  onChange={handleChange}
                  onBlur={handlePhoneBlur}
                  required
                  placeholder="+91 9876543210"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Alternate Phone"
                  name="phone_alternate"
                  value={formData.phone_alternate}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="WhatsApp Number"
                  name="whatsapp_number"
                  value={formData.whatsapp_number}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="City / Location"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Lead Source"
                  name="source"
                  value={formData.source}
                  onChange={handleChange}
                  required
                >
                  {LEAD_SOURCE_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>

            <Typography variant="h6" fontWeight="bold" gutterBottom color="primary">
              2. Property Preferences & Pipeline
            </Typography>
            <Grid container spacing={2.5} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Interested Project / Society"
                  name="interested_project"
                  value={formData.interested_project}
                  onChange={handleChange}
                >
                  <MenuItem value="">-- Select Project (Optional) --</MenuItem>
                  {projects.map((proj) => (
                    <MenuItem key={proj.id} value={proj.id}>
                      {proj.name} ({proj.location || 'General'})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Initial Lead Temperature"
                  name="temperature"
                  value={formData.temperature}
                  onChange={handleChange}
                >
                  {LEAD_TEMPERATURE_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Budget Range (e.g., 25L - 40L)"
                  name="budget_range"
                  value={formData.budget_range}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Plot Size Preference (e.g., 1200 sqft / 30x40)"
                  name="plot_size_preference"
                  value={formData.plot_size_preference}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Assign to Agent"
                  name="assigned_agent"
                  value={formData.assigned_agent}
                  onChange={handleChange}
                  helperText="Leave empty to auto-assign via Round-Robin"
                >
                  <MenuItem value="">-- Auto-Assign (Round Robin) --</MenuItem>
                  {agents.map((ag) => (
                    <MenuItem key={ag.id} value={ag.id}>
                      {ag.username} {ag.first_name ? `(${ag.first_name} ${ag.last_name})` : ''}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Inquiry Notes / Remarks"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Customer background, specific block preference, timeline to buy..."
                />
              </Grid>
            </Grid>

            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button variant="outlined" onClick={() => router.push('/leads')} disabled={loading}>
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
                {loading ? <CircularProgress size={24} /> : 'Save & Register Lead'}
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
