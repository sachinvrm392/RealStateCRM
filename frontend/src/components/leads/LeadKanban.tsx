'use client';
import React from 'react';
import { Box, Paper, Typography, Card, CardContent, Chip, Stack, IconButton } from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Lead } from '../../types';
import StatusBadge from '../common/StatusBadge';
import { LEAD_STATUS_OPTIONS } from '../../lib/constants';
import { useRouter } from 'next/navigation';

interface LeadKanbanProps {
  leads: Lead[];
  onLeadClick?: (lead: Lead) => void;
  onCallClick?: (lead: Lead) => void;
}

export default function LeadKanban({ leads, onLeadClick, onCallClick }: LeadKanbanProps) {
  const router = useRouter();

  const getLeadsByStatus = (statusValue: string) => {
    return leads.filter((lead) => lead.status === statusValue);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 2,
        overflowX: 'auto',
        pb: 2,
        minHeight: '65vh',
        alignItems: 'flex-start',
      }}
    >
      {LEAD_STATUS_OPTIONS.map((column) => {
        const columnLeads = getLeadsByStatus(column.value);
        return (
          <Paper
            key={column.value}
            variant="outlined"
            sx={{
              minWidth: 280,
              maxWidth: 320,
              bgcolor: 'grey.50',
              borderRadius: 2,
              p: 1.5,
              flexShrink: 0,
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
              <Typography variant="subtitle2" fontWeight="bold">
                {column.label}
              </Typography>
              <Chip
                label={columnLeads.length}
                size="small"
                color={columnLeads.length > 0 ? 'primary' : 'default'}
                sx={{ height: 20, fontSize: '0.75rem' }}
              />
            </Box>

            <Stack spacing={1.5} sx={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {columnLeads.length === 0 ? (
                <Box py={3} textAlign="center">
                  <Typography variant="caption" color="text.secondary">
                    No leads
                  </Typography>
                </Box>
              ) : (
                columnLeads.map((lead) => (
                  <Card
                    key={lead.id}
                    elevation={1}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { elevation: 3, borderColor: 'primary.main' },
                      border: '1px solid #e0e0e0',
                      borderRadius: 1.5,
                    }}
                    onClick={() => onLeadClick ? onLeadClick(lead) : router.push(`/leads/${lead.id}`)}
                  >
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="subtitle2" fontWeight="bold" noWrap>
                        {lead.full_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', mb: 1 }}>
                        {lead.phone_primary}
                      </Typography>

                      <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" gap={0.5}>
                        <StatusBadge status={lead.temperature} type="temperature" />
                        <Chip label={lead.source} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                      </Stack>

                      {lead.assigned_agent && (
                        <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                          Agent: {lead.assigned_agent.username}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </Stack>
          </Paper>
        );
      })}
    </Box>
  );
}
