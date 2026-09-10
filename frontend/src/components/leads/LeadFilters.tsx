'use client';
import React from 'react';
import { Box, TextField, MenuItem, Stack, Button } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import { LEAD_STATUS_OPTIONS, LEAD_TEMPERATURE_OPTIONS, LEAD_SOURCE_OPTIONS } from '../../lib/constants';

interface LeadFiltersProps {
  search: string;
  setSearch: (val: string) => void;
  status: string;
  setStatus: (val: string) => void;
  temperature: string;
  setTemperature: (val: string) => void;
  source: string;
  setSource: (val: string) => void;
  onReset: () => void;
}

export default function LeadFilters({
  search,
  setSearch,
  status,
  setStatus,
  temperature,
  setTemperature,
  source,
  setSource,
  onReset,
}: LeadFiltersProps) {
  return (
    <Box sx={{ p: 2, mb: 3, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid #e0e0e0' }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
        <TextField
          size="small"
          label="Search Name or Phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: 2, minWidth: 200 }}
        />
        <TextField
          select
          size="small"
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          sx={{ flex: 1, minWidth: 140 }}
        >
          <MenuItem value="">All Statuses</MenuItem>
          {LEAD_STATUS_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Temperature"
          value={temperature}
          onChange={(e) => setTemperature(e.target.value)}
          sx={{ flex: 1, minWidth: 140 }}
        >
          <MenuItem value="">All Temperatures</MenuItem>
          {LEAD_TEMPERATURE_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Source"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          sx={{ flex: 1, minWidth: 130 }}
        >
          <MenuItem value="">All Sources</MenuItem>
          {LEAD_SOURCE_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>
        <Button
          variant="outlined"
          color="inherit"
          startIcon={<ClearIcon />}
          onClick={onReset}
          sx={{ minWidth: 100 }}
        >
          Reset
        </Button>
      </Stack>
    </Box>
  );
}
