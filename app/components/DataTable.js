"use client"
import React, { useState, useMemo, useCallback } from 'react';
import {
  IconButton,
  Drawer,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Typography,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  Slider,
  Modal,
  TextField
} from '@mui/material';
import FilterAltIcon from '@mui/icons-material/FilterAlt'; 
import { CreatableSelect } from 'react-select/creatable';
import { DateRangePicker } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import TableChartIcon from '@mui/icons-material/TableChart';
import Stack from '@mui/material/Stack';
import SortIcon from '@mui/icons-material/Sort';
import FilterListIcon from '@mui/icons-material/FilterList';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { MaterialReactTable } from 'material-react-table';
import moment from 'moment';
import Fuse from 'fuse.js';

const DataTable = ({ data }) => {
  const [isGroupDrawerOpen, setIsGroupDrawerOpen] = useState(false);
  const [isSortDrawerOpen, setIsSortDrawerOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [selectedGroupBy, setSelectedGroupBy] = useState('');
  const [groupBy, setGroupBy] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: '', direction: '' });
  const [filterConfig, setFilterConfig] = useState({ name: '', id: '' });
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [salePriceRange, setSalePriceRange] = useState([0, 1000]);
  const [dateRanges, setDateRanges] = useState({
    createdAt: {
      startDate: null,
      endDate: null,
      key: 'createdAt'
    },
    updatedAt: {
      startDate: null,
      endDate: null,
      key: 'updatedAt'
    }
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [activeDateField, setActiveDateField] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({});

  const columns = useMemo(
    () => [
      { accessorKey: 'id', header: 'ID' },
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'category', header: 'Category' },
      { accessorKey: 'subcategory', header: 'Subcategory' },
      { accessorKey: 'price', header: 'Price', filterFn: 'between' },
      { accessorKey: 'sale_price', header: 'Sale Price', filterFn: 'between' },
      { 
        accessorKey: 'createdAt', 
        header: 'Created At', 
        Cell: ({ cell }) => moment(cell.getValue()).format('DD-MMM-YY'),
        filterFn: 'betweenDates'
      },
      { 
        accessorKey: 'updatedAt', 
        header: 'Updated At', 
        Cell: ({ cell }) => moment(cell.getValue()).format('DD-MMM-YY'),
        filterFn: 'betweenDates'
      },
    ],
    []
  );

  const uniqueValues = useMemo(() => {
    const values = {};
    columns.forEach(column => {
      values[column.accessorKey] = [...new Set(data.map(item => item[column.accessorKey]))];
    });
    return values;
  }, [columns, data]);

  const handleGroupByChange = useCallback((event) => {
    setSelectedGroupBy(event.target.value);
  }, []);

  const handleDateRangeChange = (item) => {
    setDateRanges((prev) => ({
      ...prev,
      [activeDateField]: item[activeDateField]
    }));
    handleFilterChange(activeDateField, [item[activeDateField].startDate, item[activeDateField].endDate]);
    setIsDatePickerOpen(false);
  };

  const handleApplyGrouping = useCallback(() => {
    setGroupBy(selectedGroupBy);
    setIsGroupDrawerOpen(false);
  }, [selectedGroupBy]);

  const handleSort = useCallback((key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  }, [sortConfig]);

  const handleClearSort = useCallback(() => {
    setSortConfig({ key: '', direction: '' });
  }, []);

  const handleFilterChange = useCallback((columnKey, value) => {
    setFilterConfig(prev => ({
      ...prev,
      [columnKey]: value,
    }));
  }, []);

  const handlePriceRangeChange = (event, newValue) => {
    setPriceRange(newValue);
    handleFilterChange('price', newValue);
  };

  const handleSalePriceRangeChange = (event, newValue) => {
    setSalePriceRange(newValue);
    handleFilterChange('sale_price', newValue);
  };

  const handleClearFilters = useCallback(() => {
    setFilterConfig({ name: '', id: '' });
    setPriceRange([0, 1000]);
    setSalePriceRange([0, 1000]);
    setDateRanges({
      createdAt: { startDate: null, endDate: null, key: 'createdAt' },
      updatedAt: { startDate: null, endDate: null, key: 'updatedAt' }
    });
  }, []);

  const fuzzySearch = (list, keys, pattern) => {
    const fuse = new Fuse(list, {
      keys: keys,
      includeScore: true,
      threshold: 0.3,
    });
    return fuse.search(pattern).map(result => result.item);
  };

  const filteredData = useMemo(() => {
    let filtered = data;

    // Fuzzy filter for name and id
    if (filterConfig.name) {
      filtered = fuzzySearch(filtered, ['name'], filterConfig.name);
    }
    if (filterConfig.id) {
      filtered = fuzzySearch(filtered, ['id'], filterConfig.id);
    }

    // Range filters
    filtered = filtered.filter((row) =>
      Object.entries(filterConfig).every(([key, values]) => {
        if (!values || values.length === 0) return true;

        if (key === 'price' || key === 'sale_price') {
          const [min, max] = values;
          return row[key] >= min && row[key] <= max;
        }

        if (key === 'createdAt' || key === 'updatedAt') {
          const [start, end] = values;
          const date = new Date(row[key]);
          return (!start || date >= start) && (!end || date <= end);
        }
          // Check if the row matches the category or subcategory
          if (key === 'category' || key === 'subcategory') {
            return values.includes(row[key]);
          }

        return true;
      })
    );
    return filtered;
  }, [data, filterConfig]);

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;

    return [...filteredData].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  const groupedData = useMemo(() => {
    if (!groupBy) return sortedData;

    return sortedData.reduce((acc, row) => {
      const key = row[groupBy];
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(row);
      return acc;
    }, {});
  }, [sortedData, groupBy]);

  const handleDateFieldClick = (field) => {
    setActiveDateField(field);
    setIsDatePickerOpen(true);
  };

  const toggleGroupExpansion = (groupKey) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  const renderGroupedRows = useCallback(() => {
    if (!groupBy) return sortedData;
    return Object.entries(groupedData).flatMap(([groupKey, rows]) => [
      {    
        [groupBy]: (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton size="small" onClick={() => toggleGroupExpansion(groupKey)}>
              {expandedGroups[groupKey] ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
            </IconButton>
            {groupKey} ({rows.length})
          </Box>
        ),
        isGroupHeader: true,
      },
      ...(expandedGroups[groupKey] ? rows : [])
    ]);
  }, [groupedData, groupBy, expandedGroups]);

  return (
    <>
      <Drawer
        anchor="right"
        open={isGroupDrawerOpen}
        onClose={() => setIsGroupDrawerOpen(false)}
      >
        <Box sx={{ width: 300, padding: 3 }}>
          <Typography variant="h6" sx={{ marginBottom: 2 }}>
            Grouping Options
          </Typography>
          <FormControl fullWidth variant="outlined" sx={{ marginBottom: 2 }}>
            <InputLabel>Group by</InputLabel>
            <Select
              value={selectedGroupBy}
              onChange={handleGroupByChange}
              label="Group by"
            >
              <MenuItem value="">No Grouping</MenuItem>
              <MenuItem value="category">Category</MenuItem>
              <MenuItem value="subcategory">Subcategory</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            color="primary"
            onClick={handleApplyGrouping}
            fullWidth
          >
            Apply Grouping
          </Button>
        </Box>
      </Drawer>

      <Drawer
        anchor="right"
        open={isSortDrawerOpen}
        onClose={() => setIsSortDrawerOpen(false)}
      >
        <Box sx={{ width: 300, padding: 3 }}>
          <Typography variant="h6" sx={{ marginBottom: 2 }}>
            Sorting Options
          </Typography>
          <List>
            {columns.map((column) => (
              <ListItem
                key={column.accessorKey}
                onClick={() => handleSort(column.accessorKey)}
              >
                <ListItemIcon>
                  {sortConfig.key === column.accessorKey ? (
                    sortConfig.direction === 'asc' ? (
                      <ArrowUpwardIcon />
                    ) : (
                      <ArrowDownwardIcon />
                    )
                  ) : (
                    <SortIcon />
                  )}
                </ListItemIcon>
                <ListItemText primary={column.header} />
              </ListItem>
            ))}
          </List>
          <Button
            variant="outlined"
            onClick={handleClearSort}
            fullWidth
            sx={{ marginTop: 2 }}
          >
            Clear Sort
          </Button>
        </Box>
      </Drawer>

      <Drawer
        anchor="right"
        open={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
      >
        <Box sx={{ width: 350, padding: 3, backgroundColor: 'background.paper' }}>
          <Typography variant="h6" sx={{ marginBottom: 2, color: 'text.primary' }}>
            Filtering Options
          </Typography>
          {columns.map((column) => (
            <FormControl key={column.accessorKey} fullWidth variant="outlined" sx={{ marginBottom: 2 }}>
              {column.accessorKey === 'price' || column.accessorKey === 'sale_price' ? (
                <>
                  <Typography gutterBottom>
                    {column.header} Range
                  </Typography>
                  <Slider
                    value={column.accessorKey === 'price' ? priceRange : salePriceRange}
                    onChange={column.accessorKey === 'price' ? handlePriceRangeChange : handleSalePriceRangeChange}
                    valueLabelDisplay="auto"
                    min={0}
                    max={1000}
                  />
                </>
              ) : column.accessorKey === 'createdAt' || column.accessorKey === 'updatedAt' ? (
                <FormControl fullWidth variant="outlined">
                  <TextField
                    label={column.header}
                    value={
                      dateRanges[column.accessorKey].startDate && dateRanges[column.accessorKey].endDate
                        ? `${moment(dateRanges[column.accessorKey].startDate).format('YYYY-MM-DD')} - ${moment(dateRanges[column.accessorKey].endDate).format('YYYY-MM-DD')}`
                        : ''
                    }
                    onClick={() => handleDateFieldClick(column.accessorKey)}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    InputProps={{
                      readOnly: true,
                    }}
                  />
                </FormControl>
              ) : column.accessorKey === 'name' || column.accessorKey === 'id' ? (
                <FormControl fullWidth variant="outlined">
                  <TextField
                    label={column.header}
                    value={filterConfig[column.accessorKey] || ''}
                    onChange={(e) => handleFilterChange(column.accessorKey, e.target.value)}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </FormControl>
              ) : (
                <>
                  <InputLabel id={`filter-label-${column.accessorKey}`}>{column.header}</InputLabel>
                  <Select
                    labelId={`filter-label-${column.accessorKey}`}
                    id={`filter-${column.accessorKey}`}
                    multiple
                    value={filterConfig[column.accessorKey] || []}
                    onChange={(e) => handleFilterChange(column.accessorKey, e.target.value)}
                    input={<OutlinedInput label={column.header} />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} />
                        ))}
                      </Box>
                    )}
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 48 * 4.5 + 8,
                          width: 250,
                        },
                      },
                    }}
                  >
                    {uniqueValues[column.accessorKey].map((value) => (
                      <MenuItem key={value} value={value}>
                        <Checkbox
                          checked={(filterConfig[column.accessorKey] || []).includes(value)}
                        />
                        <ListItemText primary={value} />
                      </MenuItem>
                    ))}
                  </Select>
                </>
              )}
            </FormControl>
          ))}
          <Button
            variant="outlined"
            onClick={handleClearFilters}
            fullWidth
            sx={{ marginTop: 2, color: 'text.primary', borderColor: 'text.primary' }}
          >
            Clear Filters
          </Button>
        </Box>
      </Drawer>

      <Modal
        open={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        aria-labelledby="date-range-modal"
        aria-describedby="date-range-picker-modal"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          color: 'black',
        }}>
          <DateRangePicker
            ranges={[dateRanges[activeDateField]]}
            onChange={(item) => handleDateRangeChange(item)}
          />
        </Box>
      </Modal>

      <MaterialReactTable
        columns={columns}
        data={groupBy ? renderGroupedRows() : sortedData}
        enableColumnResizing
        enableColumnFilters={false}
        enableColumnOrdering
        enableStickyHeader
        enableStickyFooter
        enableGlobalFilter
        muiTableBodyRowProps={({ row }) => ({
          sx: {
            backgroundColor: row.original.isGroupHeader ? '#f0f0f0' : 'inherit',
          },
        })}
        renderTopToolbarCustomActions={() => (
          <>
            <IconButton
              onClick={() => setIsGroupDrawerOpen(true)}
              sx={{
                marginLeft: 'auto',
                backgroundColor: 'white',
                border: '1px solid #ccc',
                '&:hover': {
                  backgroundColor: '#f0f0f0'
                }
              }}
            >
              <TableChartIcon />
            </IconButton>
            <IconButton
              onClick={() => setIsSortDrawerOpen(true)}
              sx={{
                marginLeft: 1,
                backgroundColor: 'white',
                border: '1px solid #ccc',
                '&:hover': {
                  backgroundColor: '#f0f0f0'
                }
              }}
            >
              <Stack direction="row">
                <ArrowUpwardIcon />
                <ArrowDownwardIcon />
              </Stack>
            </IconButton>
            <IconButton
              onClick={() => setIsFilterDrawerOpen(true)}
              sx={{
                marginLeft: 1,
                backgroundColor: 'white',
                border: '1px solid #ccc',
                '&:hover': {
                  backgroundColor: '#f0f0f0'
                }
              }}
            >
              <FilterAltIcon />
            </IconButton>
          </>
        )}
      />
    </>
  );
};

export default DataTable;
