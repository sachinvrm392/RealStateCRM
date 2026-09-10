import React from 'react';
import { Chip, ChipProps } from '@mui/material';
import { STATUS_LABELS, TEMPERATURE_COLORS, PLOT_STATUS_COLORS, DEAL_STATUS_COLORS } from '../../lib/constants';

interface StatusBadgeProps extends Omit<ChipProps, 'color'> {
  status: string;
  type?: 'lead' | 'temperature' | 'plot' | 'deal';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'lead', ...props }) => {
  let label = status;
  let color: ChipProps['color'] = 'default';

  if (type === 'lead') {
    label = STATUS_LABELS[status] || status;
    // Default blue mapping for leads except certain stages
    color = 'info';
    if (['booked', 'deal_confirmed'].includes(status)) color = 'success';
    if (status === 'lost') color = 'error';
    if (['site_visit_scheduled', 'negotiation'].includes(status)) color = 'warning';
  } else if (type === 'temperature') {
    label = status.charAt(0).toUpperCase() + status.slice(1);
    color = TEMPERATURE_COLORS[status] || 'default';
  } else if (type === 'plot') {
    label = status.charAt(0).toUpperCase() + status.slice(1);
    color = PLOT_STATUS_COLORS[status] || 'default';
  } else if (type === 'deal') {
    label = status.charAt(0).toUpperCase() + status.slice(1);
    color = DEAL_STATUS_COLORS[status] || 'default';
  }

  return <Chip label={label} color={color} size="small" {...props} />;
};

export default StatusBadge;
