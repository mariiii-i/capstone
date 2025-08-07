import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Grid,
  TextField,
  InputAdornment,
  Chip,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Divider,
  Container,
  Fade,
  Zoom
} from '@mui/material';
import {
  Search as SearchIcon,
  Store as StoreIcon,
  LocationOn as LocationIcon,
  Inventory as InventoryIcon,
  AttachMoney as PriceIcon,
  Info as InfoIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { productAPI } from '../services/api';

const KioskInterface = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productDialog, setProductDialog] = useState(false);

  useEffect(() => {
    fetchAllProducts();
  }, []);

  const fetchAllProducts = async () => {
    try {
      const response = await productAPI.getAllProducts();
      const availableProducts = response.data.filter(product => product.stock > 0);
      setAllProducts(availableProducts);
      setSearchResults(availableProducts.slice(0, 12)); // Show first 12 products initially
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults(allProducts.slice(0, 12));
      return;
    }

    setLoading(true);
    try {
      const response = await productAPI.searchProducts(query);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Search failed:', error);
      // Fallback to local search
      const filtered = allProducts.filter(product =>
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.description.toLowerCase().includes(query.toLowerCase()) ||
        product.category.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filtered);
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setProductDialog(true);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const getStockStatus = (stock) => {
    if (stock === 0) return { label: 'Out of Stock', color: 'error' };
    if (stock <= 10) return { label: 'Low Stock', color: 'warning' };
    return { label: 'In Stock', color: 'success' };
  };

  const ProductCard = ({ product }) => {
    const stockStatus = getStockStatus(product.stock);
    
    return (
      <Zoom in={true} timeout={300}>
        <Card 
          sx={{ 
            height: '100%', 
            cursor: 'pointer',
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: 6
            }
          }}
          onClick={() => handleProductClick(product)}
        >
          <CardMedia
            component="div"
            sx={{
              height: 200,
              backgroundImage: product.imageUrl ? `url(${product.imageUrl})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'grey.100'
            }}
          >
            {!product.imageUrl && (
              <Avatar sx={{ width: 80, height: 80, fontSize: '2rem' }}>
                {product.name.charAt(0)}
              </Avatar>
            )}
          </CardMedia>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="h6" component="h3" noWrap sx={{ mb: 1 }}>
              {product.name}
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                mb: 2,
                height: '40px',
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical'
              }}
            >
              {product.description}
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6" color="primary" fontWeight="bold">
                {formatPrice(product.price)}
              </Typography>
              <Chip 
                label={stockStatus.label}
                color={stockStatus.color}
                size="small"
                variant="outlined"
              />
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Chip 
                label={product.category}
                size="small"
                variant="outlined"
                color="primary"
              />
              <Typography variant="caption" color="text.secondary">
                {product.location.floor}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Zoom>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <StoreIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
        <Typography variant="h3" component="h1" gutterBottom color="primary">
          Store Product Finder
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Search for products and find their location in our store
        </Typography>
      </Box>

      {/* Search Bar */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search for products, categories, or descriptions..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="primary" />
              </InputAdornment>
            ),
            sx: { fontSize: '1.2rem', py: 1 }
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              '&:hover fieldset': {
                borderColor: 'primary.main',
              }
            }
          }}
        />
      </Paper>

      {/* Search Results */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          {searchQuery ? `Search Results for "${searchQuery}"` : 'Available Products'}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {searchResults.length} products found
        </Typography>
      </Box>

      {/* Loading State */}
      {loading && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography>Searching...</Typography>
        </Box>
      )}

      {/* Products Grid */}
      <Grid container spacing={3}>
        {searchResults.map((product) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={product._id}>
            <ProductCard product={product} />
          </Grid>
        ))}
      </Grid>

      {/* No Results */}
      {!loading && searchResults.length === 0 && (
        <Paper elevation={1} sx={{ p: 6, textAlign: 'center', mt: 4 }}>
          <SearchIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom color="text.secondary">
            No products found
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {searchQuery 
              ? `No products match "${searchQuery}". Try a different search term.`
              : 'No products are currently available.'
            }
          </Typography>
        </Paper>
      )}

      {/* Product Detail Dialog */}
      <Dialog 
        open={productDialog} 
        onClose={() => setProductDialog(false)}
        maxWidth="md"
        fullWidth
        TransitionComponent={Fade}
      >
        {selectedProduct && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <InfoIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h5">Product Details</Typography>
                </Box>
                <Button
                  onClick={() => setProductDialog(false)}
                  sx={{ minWidth: 'auto', p: 1 }}
                >
                  <CloseIcon />
                </Button>
              </Box>
            </DialogTitle>
            
            <DialogContent>
              <Grid container spacing={3}>
                {/* Product Image */}
                <Grid item xs={12} md={5}>
                  <Box
                    sx={{
                      width: '100%',
                      height: 300,
                      backgroundImage: selectedProduct.imageUrl ? `url(${selectedProduct.imageUrl})` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'grey.100',
                      border: '1px solid',
                      borderColor: 'grey.300'
                    }}
                  >
                    {!selectedProduct.imageUrl && (
                      <Avatar sx={{ width: 120, height: 120, fontSize: '3rem' }}>
                        {selectedProduct.name.charAt(0)}
                      </Avatar>
                    )}
                  </Box>
                </Grid>

                {/* Product Information */}
                <Grid item xs={12} md={7}>
                  <Typography variant="h4" gutterBottom color="primary">
                    {selectedProduct.name}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip 
                      label={selectedProduct.category}
                      color="primary"
                      variant="outlined"
                    />
                    <Chip 
                      label={getStockStatus(selectedProduct.stock).label}
                      color={getStockStatus(selectedProduct.stock).color}
                      variant="outlined"
                    />
                  </Box>

                  <Typography variant="body1" paragraph>
                    {selectedProduct.description}
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  {/* Price and Stock Info */}
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <PriceIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="subtitle1" fontWeight="bold">
                          Price
                        </Typography>
                      </Box>
                      <Typography variant="h5" color="primary" fontWeight="bold">
                        {formatPrice(selectedProduct.price)}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <InventoryIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="subtitle1" fontWeight="bold">
                          Stock Available
                        </Typography>
                      </Box>
                      <Typography variant="h5" color="text.primary" fontWeight="bold">
                        {selectedProduct.stock} units
                      </Typography>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 2 }} />

                  {/* Location Information */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <LocationIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6" fontWeight="bold">
                      Store Location
                    </Typography>
                  </Box>
                  
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'primary.50' }}>
                    <Typography variant="subtitle1" gutterBottom>
                      <strong>Floor:</strong> {selectedProduct.location.floor}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Map Coordinates:</strong> X: {selectedProduct.location.x}, Y: {selectedProduct.location.y}
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      Ask store staff for assistance in locating this product
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </DialogContent>
            
            <DialogActions sx={{ p: 3 }}>
              <Button 
                onClick={() => setProductDialog(false)}
                variant="contained"
                size="large"
                fullWidth
              >
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
};

export default KioskInterface;