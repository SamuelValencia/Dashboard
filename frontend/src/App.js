import React, { useState, useEffect } from 'react';
import { Box, Container,Grid,Paper,Typography,Card,CardContent,FormControl,InputLabel,Select,MenuItem,TextField} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Line, Pie } from 'react-chartjs-2';
import {Chart as ChartJS,CategoryScale,LinearScale,PointElement,LineElement,ArcElement,Title,Tooltip,Legend} from 'chart.js';
import axios from 'axios';
import dayjs from 'dayjs';


ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  const [data, setData] = useState({
    totalSales: 0,
    salesBySegment: [],
    salesByDate: [],
    topCustomers: [],
    topProducts: [],
    salesByCategory: [],
  });

  useEffect(() => {
    setSubcategory('');
    if (category) {
      const fetchSubcategories = async () => {
        try {
          const response = await axios.get(`/api/subcategories/?category=${category}`);
          setSubcategories(response.data || []);
        } catch (error) {
          console.error('Error fetching subcategories:', error);
        }
      };
      fetchSubcategories();
    } else {
      setSubcategories([]);
    }
  }, [category]);

  useEffect(() => {
    setCity('');
    if (state) {
      const fetchCities = async () => {
        try {
          const response = await axios.get(`/api/cities/?state=${state}`);
          setCities(response.data || []);
        } catch (error) {
          console.error('Error fetching cities:', error);
        }
      };
      fetchCities();
    } else {
      setCities([]);
    }
  }, [state]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [categoriesRes, statesRes] = await Promise.all([
          axios.get('/api/categories/'),
          axios.get('/api/states/')
        ]);
        setCategories(categoriesRes.data || []);
        setStates(statesRes.data || []);
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        if (category) params.append('category', category);
        if (subcategory) params.append('subcategory', subcategory);
        if (state) params.append('state', state);
        if (city) params.append('city', city);

        const response = await axios.get(`/api/dashboard/stats/?${params.toString()}`);
        const responseData = response.data || {};
        setData({
          totalSales: responseData.total_sales || 0,
          salesBySegment: responseData.sales_by_segment || [],
          salesByDate: responseData.sales_by_date || [],
          topCustomers: responseData.top_customers || [],
          topProducts: responseData.top_products || [],
          salesByCategory: responseData.sales_by_category || []
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Error al cargar los datos.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate, category, subcategory, state, city]);

  const customerColumns = [
    {
      field: 'name',
      headerName: 'Cliente',
      width: 200,
      headerAlign: 'left',
      align: 'left',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'segment',
      headerName: 'Segmento',
      width: 120,
      headerAlign: 'left',
      align: 'left',
      renderCell: (params) => (
        <Typography variant="body2">
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'city',
      headerName: 'Ciudad',
      width: 150,
      headerAlign: 'left',
      align: 'left',
      renderCell: (params) => (
        <Typography variant="body2">
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'state',
      headerName: 'Estado',
      width: 120,
      headerAlign: 'left',
      align: 'left',
      renderCell: (params) => (
        <Typography variant="body2">
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'total',
      headerName: 'Total',
      width: 120,
      headerAlign: 'right',
      align: 'right',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 500, color: '#1976d2' }}>
          ${(params.value || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </Typography>
      ),
    },
  ];

  const productColumns = [
    {
      field: 'Product_ID',
      headerName: 'ID',
      width: 100,
      headerAlign: 'left',
      align: 'left',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ color: '#64748b' }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'Product_Name',
      headerName: 'Producto',
      width: 250,
      headerAlign: 'left',
      align: 'left',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'Category',
      headerName: 'Categoría',
      width: 130,
      headerAlign: 'left',
      align: 'left',
      renderCell: (params) => (
        <Typography variant="body2">
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'Sub_Category',
      headerName: 'Subcategoría',
      width: 130,
      headerAlign: 'left',
      align: 'left',
      renderCell: (params) => (
        <Typography variant="body2">
          {params.value}
        </Typography>
      ),
    },
  ];

  const salesByDateChart = {
    labels: data.salesByDate?.map(item => dayjs(item.date).format('DD/MM/YYYY')) || [],
    datasets: [{
      label: 'Ventas',
      data: data.salesByDate?.map(item => item.total) || [],
      borderColor: '#0ea5e9',
      backgroundColor: '#0ea5e933',
      tension: 0.3,
      fill: true,
      pointRadius: 4,
      pointBackgroundColor: '#0ea5e9',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointHoverRadius: 6
    }]
  };

  const salesByCategoryChart = {
    labels: data.salesByCategory?.map(item => item.category) || [],
    datasets: [{
      data: data.salesByCategory?.map(item => item.total) || [],
      backgroundColor: [
        'rgba(255, 99, 132, 0.7)',
        'rgba(54, 162, 235, 0.7)',
        'rgba(255, 206, 86, 0.7)',
        'rgba(75, 192, 192, 0.7)',
        'rgba(153, 102, 255, 0.7)',
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
      ],
      borderWidth: 1,
      hoverOffset: 4
    }]
  };

  return (
    <Container maxWidth="xl" sx={{ py: 6 }}>
      <Box sx={{ backgroundColor: '#f8fafc', minHeight: '100vh', borderRadius: 3, p: { xs: 2, sm: 4, md: 5 }, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}>
        <Typography
          variant="h3"
          component="h1"
          align="center"
          gutterBottom
          sx={{
            mb: 4,
            fontWeight: 'bold',
            color: '#334155',
            letterSpacing: '-0.5px',
            fontSize: { xs: '1.875rem', sm: '2.25rem', md: '3rem' },
            textTransform: 'uppercase'
          }}
        >
          Reporte de Ventas
        </Typography>
        <Paper sx={{ p: 3, mb: 4, backgroundColor: '#ffffff' }}>
          <Typography variant="h6" sx={{ mb: 3, color: '#475569', fontWeight: '500' }}>Filtros</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={4} lg={2}>
              <TextField
                label="Fecha Inicial"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
                size="small"
                inputProps={{
                  max: endDate || undefined
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={2}>
              <TextField
                label="Fecha Final"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
                size="small"
                inputProps={{
                  min: startDate || undefined
                }}
              />
            </Grid>
          
            <Grid item xs={12} sm={6} md={4} lg={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Categoría</InputLabel>
                <Select
                  value={category}
                  label="Categoría"
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <MenuItem value="">Todas</MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Subcategoría</InputLabel>
                <Select
                  value={subcategory}
                  label="Subcategoría"
                  onChange={(e) => setSubcategory(e.target.value)}
                  disabled={!category}
                >
                  <MenuItem value="">Todas</MenuItem>
                  {subcategories.map((subcat) => (
                    <MenuItem key={subcat} value={subcat}>{subcat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4} lg={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Estado</InputLabel>
                <Select
                  value={state}
                  label="Estado"
                  onChange={(e) => setState(e.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {states.map((st) => (
                    <MenuItem key={st} value={st}>{st}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Ciudad</InputLabel>
                <Select
                  value={city}
                  label="Ciudad"
                  onChange={(e) => setCity(e.target.value)}
                  disabled={!state}
                >
                  <MenuItem value="">Todas</MenuItem>
                  {cities.map((ct) => (
                    <MenuItem key={ct} value={ct}>{ct}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>
        <Grid container spacing={4}>
          {/* KPIs Section */}
          <Grid item xs={12}>
            <Typography variant="h5" sx={{ mb: 3, color: '#1976d2', fontWeight: 'bold', textAlign: 'center', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>Indicadores Clave</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, color: '#475569', fontWeight: '500', textAlign: 'center', fontSize: { xs: '1rem', sm: '1.1rem' } }}>Total de Ventas</Typography>
                  {loading ? (
                    <Typography>Loading...</Typography>
                  ) : error ? (
                    <Typography color="error">{error}</Typography>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, justifyContent: 'center' }}>
                      <Typography variant="h3" sx={{ color: '#0f172a', fontWeight: '600', fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }, textAlign: 'center' }}>
                        ${(data.totalSales || 0).toFixed(2)}
                      </Typography>
                      <Typography variant="subtitle1" sx={{ color: '#64748b' }}>
                        USD
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, color: '#475569', fontWeight: '500' }}>Ventas por Segmento</Typography>
                    {loading ? (
                      <Typography>Loading...</Typography>
                    ) : error ? (
                      <Typography color="error">{error}</Typography>
                    ) : (
                      (data.salesBySegment || []).map(segment => (
                        <Box
                          key={segment.customer__segment}
                          sx={{
                            mt: 2,
                            p: 2,
                            borderRadius: 1,
                            backgroundColor: '#f8fafc',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <Typography variant="subtitle1" sx={{ color: '#475569', fontWeight: '500' }}>
                            {segment.customer__segment}
                          </Typography>
                          <Typography variant="subtitle1" sx={{ color: '#0f172a', fontWeight: '600' }}>
                            ${segment.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </Typography>
                        </Box>
                      )))
                    }
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h5" sx={{ mb: 3, color: '#1976d2', fontWeight: 'bold', textAlign: 'center', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>Tablas de Datos</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="h6" sx={{ mb: 3, color: '#475569', fontWeight: '500' }}>Top Clientes</Typography>
                  {loading ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                      <Typography>Loading customer data...</Typography>
                    </Box>
                  ) : error ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                      <Typography color="error">{error}</Typography>
                    </Box>
                  ) : (
                    <DataGrid
                      rows={data.topCustomers || []}
                      columns={customerColumns}
                      pageSize={5}
                      rowsPerPageOptions={[5]}
                      autoHeight
                      disableSelectionOnClick
                      getRowId={(row) => row.name}
                      loading={loading}
                      density="compact"
                      sx={{
                        border: 'none',
                        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                        '& .MuiDataGrid-root': {
                          borderRadius: 1,
                          overflow: 'hidden'
                        },
                        '& .MuiDataGrid-cell': {
                          borderColor: '#f1f5f9',
                          padding: '8px 16px',
                        },
                        '& .MuiDataGrid-columnHeaders': {
                          backgroundColor: '#f8fafc',
                          borderBottom: '2px solid #e2e8f0',
                          '& .MuiDataGrid-columnHeader': {
                            padding: '12px 16px',
                            '& .MuiDataGrid-columnHeaderTitle': {
                              fontWeight: 600,
                              color: '#475569'
                            }
                          }
                        },
                        '& .MuiDataGrid-row': {
                          '&:nth-of-type(even)': {
                            backgroundColor: '#f8fafc'
                          },
                          '&:hover': {
                            backgroundColor: '#f1f5f9'
                          }
                        },
                        '& .MuiDataGrid-footerContainer': {
                          borderTop: '1px solid #e2e8f0',
                          backgroundColor: '#f8fafc'
                        },
                        '& .MuiTablePagination-root': {
                          color: '#475569'
                        }
                      }}
                    />
                  )}
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="h6" sx={{ mb: 3, color: '#475569', fontWeight: '500' }}>Top Productos</Typography>
                  {loading ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                      <Typography>Loading product data...</Typography>
                    </Box>
                  ) : error ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                      <Typography color="error">{error}</Typography>
                    </Box>
                  ) : (
                    <DataGrid
                      rows={data.topProducts || []}
                      columns={productColumns}
                      pageSize={5}
                      rowsPerPageOptions={[5]}
                      autoHeight
                      disableSelectionOnClick
                      getRowId={(row) => row.Product_ID}
                      loading={loading}
                      density="compact"
                      sx={{
                        border: 'none',
                        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                        '& .MuiDataGrid-root': {
                          borderRadius: 1,
                          overflow: 'hidden'
                        },
                        '& .MuiDataGrid-cell': {
                          borderColor: '#f1f5f9',
                          padding: '8px 16px',
                        },
                        '& .MuiDataGrid-columnHeaders': {
                          backgroundColor: '#f8fafc',
                          borderBottom: '2px solid #e2e8f0',
                          '& .MuiDataGrid-columnHeader': {
                            padding: '12px 16px',
                            '& .MuiDataGrid-columnHeaderTitle': {
                              fontWeight: 600,
                              color: '#475569'
                            }
                          }
                        },
                        '& .MuiDataGrid-row': {
                          '&:nth-of-type(even)': {
                            backgroundColor: '#f8fafc'
                          },
                          '&:hover': {
                            backgroundColor: '#f1f5f9'
                          }
                        },
                        '& .MuiDataGrid-footerContainer': {
                          borderTop: '1px solid #e2e8f0',
                          backgroundColor: '#f8fafc'
                        },
                        '& .MuiTablePagination-root': {
                          color: '#475569'
                        }
                      }}
                    />
                  )}
                </Paper>
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h5" sx={{ mb: 3, color: '#1976d2', fontWeight: 'bold', textAlign: 'center', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>Gráficos</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="h6" sx={{ mb: 3, color: '#475569', fontWeight: '500' }}>Ventas por Fecha</Typography>
                  {loading ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                      <Typography>Loading chart data...</Typography>
                    </Box>
                  ) : error ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                      <Typography color="error">{error}</Typography>
                    </Box>
                  ) : (
                    <Box sx={{ height: 300, position: 'relative' }}>
                      <Line
                        data={salesByDateChart}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: {
                            y: {
                              beginAtZero: true,
                              grid: {
                                color: '#f1f5f9'
                              },
                              ticks: {
                                color: '#64748b',
                                callback: (value) => `$${value.toLocaleString()}`
                              }
                            },
                            x: {
                              grid: {
                                color: '#f1f5f9'
                              },
                              ticks: {
                                color: '#64748b'
                              }
                            }
                          },
                          plugins: {
                            legend: {
                              display: false
                            },
                            tooltip: {
                              backgroundColor: '#334155',
                              titleColor: '#f8fafc',
                              bodyColor: '#f8fafc',
                              padding: 12,
                              displayColors: false,
                              callbacks: {
                                label: (context) => `$${context.parsed.y.toLocaleString()}`
                              }
                            }
                          }
                        }}
                      />
                    </Box>
                  )}
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="h6" sx={{ mb: 3, color: '#475569', fontWeight: '500' }}>Ventas por Categoria</Typography>
                  {loading ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                      <Typography>Loading chart data...</Typography>
                    </Box>
                  ) : error ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                      <Typography color="error">{error}</Typography>
                    </Box>
                  ) : (
                    <Box sx={{ height: { xs: 300, sm: 350, md: 400 }, position: 'relative', display: 'flex', justifyContent: 'center', width: '100%', '& canvas': { maxWidth: '95%' } }}>
                      <Pie
                        data={salesByCategoryChart}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'right',
                              labels: {
                                boxWidth: 12,
                                padding: 20,
                                font: {
                                  size: 12
                                },
                                color: '#475569'
                              }
                            },
                            tooltip: {
                              backgroundColor: '#334155',
                              titleColor: '#f8fafc',
                              bodyColor: '#f8fafc',
                              padding: 12,
                              displayColors: false,
                              callbacks: {
                                label: (context) => `$${context.parsed.toLocaleString()}`
                              }
                            }
                          }
                        }}
                      />
                    </Box>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}

export default App;

