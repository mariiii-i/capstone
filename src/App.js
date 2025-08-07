import React, { useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation
} from 'react-router-dom';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  Tabs,
  Tab,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Store as StoreIcon,
  AdminPanelSettings as AdminIcon,
  Add as AddIcon,
  Inventory as InventoryIcon,
  Search as SearchIcon,
  Map as MapIcon
} from '@mui/icons-material';

// Import components
import AddProduct from './components/AddProduct';
import InventoryDisplay from './components/InventoryDisplay';
import KioskInterface from './components/KioskInterface';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});

// Navigation Component
const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isKioskMode, setIsKioskMode] = useState(location.pathname === '/kiosk');

  const handleModeSwitch = (event) => {
    const kioskMode = event.target.checked;
    setIsKioskMode(kioskMode);
    if (kioskMode) {
      navigate('/kiosk');
    } else {
      navigate('/admin');
    }
  };

  const getTabValue = () => {
    if (location.pathname === '/kiosk') return 'kiosk';
    if (location.pathname === '/admin/add-product') return 'add-product';
    if (location.pathname === '/admin/inventory') return 'inventory';
    if (location.pathname === '/admin/map-editor') return 'map-editor';
    return 'inventory'; // default
  };

  const handleTabChange = (event, newValue) => {
    switch (newValue) {
      case 'kiosk':
        navigate('/kiosk');
        break;
      case 'add-product':
        navigate('/admin/add-product');
        break;
      case 'inventory':
        navigate('/admin/inventory');
        break;
      case 'map-editor':
        navigate('/admin/map-editor');
        break;
      default:
        navigate('/admin/inventory');
    }
  };

  return (
    <AppBar position="static" elevation={2}>
      <Toolbar>
        <StoreIcon sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Dynamic Store Mapping & Inventory System
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={isKioskMode}
                onChange={handleModeSwitch}
                color="secondary"
              />
            }
            label={isKioskMode ? "Kiosk Mode" : "Admin Mode"}
            sx={{ color: 'white' }}
          />
        </Box>
      </Toolbar>
      
      {/* Tab Navigation */}
      <Box sx={{ bgcolor: 'primary.dark' }}>
        <Container maxWidth="lg">
          <Tabs
            value={getTabValue()}
            onChange={handleTabChange}
            textColor="inherit"
            indicatorColor="secondary"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab
              icon={<SearchIcon />}
              iconPosition="start"
              label="Product Search (Kiosk)"
              value="kiosk"
            />
            <Tab
              icon={<AddIcon />}
              iconPosition="start"
              label="Add Product"
              value="add-product"
              disabled={isKioskMode}
            />
            <Tab
              icon={<InventoryIcon />}
              iconPosition="start"
              label="Inventory Management"
              value="inventory"
              disabled={isKioskMode}
            />
            <Tab
              icon={<MapIcon />}
              iconPosition="start"
              label="Map Editor"
              value="map-editor"
              disabled={isKioskMode}
            />
          </Tabs>
        </Container>
      </Box>
    </AppBar>
  );
};

// Manager Dashboard Component
const ManagerDashboard = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleProductAdded = () => {
    // Trigger refresh of inventory display
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <Routes>
      <Route path="/" element={<Navigate to="inventory" replace />} />
      <Route 
        path="add-product" 
        element={<AddProduct onProductAdded={handleProductAdded} />} 
      />
      <Route 
        path="inventory" 
        element={<InventoryDisplay refreshTrigger={refreshTrigger} />} 
      />
      <Route 
        path="map-editor" 
        element={
          <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box sx={{ textAlign: 'center' }}>
              <MapIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h4" gutterBottom>
                Map Editor
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Map editor functionality will be implemented here.
                This will allow managers to create and edit store layouts dynamically.
              </Typography>
            </Box>
          </Container>
        } 
      />
    </Routes>
  );
};

// Main App Component
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
          <Navigation />
          
          <Routes>
            {/* Kiosk Route */}
            <Route path="/kiosk" element={<KioskInterface />} />
            
            {/* Admin Routes */}
            <Route path="/admin/*" element={<ManagerDashboard />} />
            
            {/* Default Route */}
            <Route path="/" element={<Navigate to="/kiosk" replace />} />
          </Routes>

          {/* Footer */}
          <Box
            component="footer"
            sx={{
              py: 3,
              px: 2,
              mt: 'auto',
              backgroundColor: 'grey.200',
              textAlign: 'center'
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Dynamic Store Mapping & Inventory System - Capstone Project
            </Typography>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
