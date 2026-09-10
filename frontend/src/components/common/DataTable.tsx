'use client';
import React from 'react';
import { DataGrid, GridColDef, GridSlotsComponent } from '@mui/x-data-grid';
import { Box, LinearProgress } from '@mui/material';

interface DataTableProps {
  columns: GridColDef[];
  rows: any[];
  loading?: boolean;
  getRowId?: (row: any) => string;
  onRowClick?: (params: any) => void;
}

const DataTable: React.FC<DataTableProps> = ({ columns, rows, loading, getRowId, onRowClick }) => {
  return (
    <Box sx={{ height: 600, width: '100%', bgcolor: 'background.paper', borderRadius: 1, boxShadow: 1 }}>
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
        pageSizeOptions={[10, 25, 50]}
        disableRowSelectionOnClick
        sx={{
          border: 'none',
          '& .MuiDataGrid-cell:focus': { outline: 'none' },
        }}
      />
    </Box>
  );
};

export default DataTable;
