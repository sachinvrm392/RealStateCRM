'use client';
import React from 'react';
import { Box, Paper, Typography, Card, CardContent, Chip, Stack, IconButton, Button, Tooltip } from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { Lead } from '../../types';
import StatusBadge from '../common/StatusBadge';
import { LEAD_STATUS_OPTIONS, STATUS_LABELS } from '../../lib/constants';
import { useRouter } from 'next/navigation';

interface LeadKanbanProps {
  leads: Lead[];
  onLeadClick?: (lead: Lead) => void;
  onCallClick?: (lead: Lead) => void;
  onStatusChangeClick?: (lead: Lead, targetStatus: string) => void;
}

const NEXT_STAGE_MAP: Record<string, string> = {
  new: 'contacted',
  contacted: 'interested',
  interested: 'site_visit_scheduled',
  site_visit_scheduled: 'site_visit_done',
  site_visit_done: 'negotiation',
  negotiation: 'booked',
  booked: 'deal_confirmed',
};

export default function LeadKanban({
  leads,
  onLeadClick,
  onCallClick,
  onStatusChangeClick,
}: LeadKanbanProps) {
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
              minWidth: 290,
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
                columnLeads.map((lead) => {
                  const nextStage = NEXT_STAGE_MAP[lead.status];
                  return (
                    <Card
                      key={lead.id}
                      elevation={1}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { elevation: 3, borderColor: 'primary.main' },
                        border: '1px solid #e0e0e0',
                        borderRadius: 1.5,
                        transition: 'all 0.2s ease',
                      }}
                      onClick={() => (onLeadClick ? onLeadClick(lead) : router.push(`/leads/${lead.id}`))}
                    >
                      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={0.5}>
                          <Typography variant="subtitle2" fontWeight="bold" noWrap sx={{ maxWidth: '75%' }}>
                            {lead.full_name}
                          </Typography>
                          <StatusBadge status={lead.temperature} type="temperature" />
                        </Box>

                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', mb: 1 }}>
                          {lead.phone_primary}
                        </Typography>

                        <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" gap={0.5} mb={1}>
                          <Chip
                            label={lead.source}
                            size="small"
                            variant="outlined"
                            sx={{ height: 20, fontSize: '0.7rem', textTransform: 'capitalize' }}
                          />
                          {lead.city && (
                            <Chip
                              label={lead.city}
                              size="small"
                              variant="outlined"
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          )}
                        </Stack>

                        {lead.assigned_agent && (
                          <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                            Agent: {lead.assigned_agent.username}
                          </Typography>
                        )}

                        <Box display="flex" justifyContent="space-between" alignItems="center" pt={1} borderTop="1px solid #f0f0f0">
                          <Stack direction="row" spacing={0.5}>
                            <Tooltip title="Log Call / Interaction">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onCallClick) onCallClick(lead);
                                }}
                              >
                                <PhoneIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="View Lead Details">
                              <IconButton
                                size="small"
                                color="info"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/leads/${lead.id}`);
                                }}
                              >
                                <VisibilityIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          </Stack>

                          {nextStage && onStatusChangeClick && (
                            <Button
                              size="small"
                              variant="text"
                              color="primary"
                              startIcon={<SwapHorizIcon sx={{ fontSize: 14 }} />}
                              sx={{ fontSize: '0.7rem', py: 0, px: 0.5 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                onStatusChangeClick(lead, nextStage);
                              }}
                            >
                              Move Next
                            </Button>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </Stack>
          </Paper>
        );
      })}
    </Box>
  );
}
