'use client';
import React from 'react';
import { DataGrid, GridColDef, GridSlotsComponent } from '@mui/x-data-grid';
import { Box, LinearProgress, Paper } from '@mui/material';

interface DataTableProps {
  columns: GridColDef[];
  rows: any[];
  loading?: boolean;
  getRowId?: (row: any) => string | number;
  onRowClick?: (params: any) => void;
  height?: number | string;
}

const DataTable: React.FC<DataTableProps> = ({
  columns,
  rows,
  loading,
  getRowId,
  onRowClick,
  height = 620,
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        height,
        width: '100%',
        bgcolor: 'background.paper',
        borderRadius: 2,
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04)',
      }}
    >
      <DataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        getRowId={getRowId || ((row) => row.id)}
        onRowClick={onRowClick}
        slots={{
          loadingOverlay: LinearProgress as GridSlotsComponent['loadingOverlay'],
        }}
        initialState={{
          pagination: { paginationModel: { pageSize: 10 } },
        }}
        pageSizeOptions={[10, 25, 50, 100]}
        disableRowSelectionOnClick
        sx={{
          border: 'none',
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            fontWeight: 700,
            fontSize: '0.8125rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#475569',
          },
          '& .MuiDataGrid-columnHeaderTitle': {
            fontWeight: 700,
          },
          '& .MuiDataGrid-row': {
            cursor: onRowClick ? 'pointer' : 'default',
            '&:hover': {
              backgroundColor: '#f8fafc',
            },
          },
          '& .MuiDataGrid-cell': {
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            '&:focus': { outline: 'none' },
            '&:focus-within': { outline: 'none' },
          },
          '& .MuiDataGrid-footerContainer': {
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
          },
        }}
      />
    </Paper>
  );
};

export default DataTable;

