import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Grid,
  Alert,
  Snackbar,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  InputAdornment,
  Checkbox,
  FormControlLabel,
  Chip,
  Paper,
  Divider
} from '@mui/material';
import { 
  Add as AddIcon, 
  Save as SaveIcon, 
  Cancel as CancelIcon,
  CloudUpload as UploadIcon,
  Category as CategoryIcon
} from '@mui/icons-material';
import { productAPI } from '../services/api';
import axios from 'axios';

const AddProduct = ({ onProductAdded }) => {
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    details: '',
    brand: '',
    category: '',
    stockQty: 0,
    unit: '',
    price: '',
    image: null,
    sizeOptions: [],
    colorOptions: [],
    sizeColorQuantities: [],
    colorQuantities: [],
    sizeQuantities: [],
    variantSize: '',
    variantColor: '',
    location: {
      x: 0,
      y: 0,
      floor: 'Ground Floor'
    }
  });

  const [hasVariant, setHasVariant] = useState(false);
  const [newSize, setNewSize] = useState('');
  const [newColor, setNewColor] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const floors = [
    'Ground Floor',
    'First Floor',
    'Second Floor',
    'Basement'
  ];

  const predefinedSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  useEffect(() => {
    // Fetch categories from backend
    axios.get('http://localhost:5000/categories')
      .then(res => {
        const sorted = res.data.sort((a, b) =>
          a.name.localeCompare(b.name, 'en', { sensitivity: 'base' })
        );
        setCategories(sorted);
      })
      .catch(err => console.error('Error fetching categories:', err));
  }, []);

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;

    if (name.startsWith('location.')) {
      const locationField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          [locationField]: locationField === 'floor' ? value : Number(value) || 0
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'image'
          ? files[0]
          : name === 'stockQty'
          ? parseInt(value) || 0
          : name === 'price'
          ? parseFloat(value) || 0
          : value,
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleQuantityChange = (size, color, value) => {
    setFormData(prev => {
      const updated = [...prev.sizeColorQuantities];
      const index = updated.findIndex(q => q.size === size && q.color === color);
      if (index > -1) {
        updated[index].quantity = parseInt(value) || 0;
      } else {
        updated.push({ size, color, quantity: parseInt(value) || 0 });
      }
      return { ...prev, sizeColorQuantities: updated };
    });
  };

  const handleColorQuantityChange = (color, value) => {
    setFormData(prev => {
      const updated = [...prev.colorQuantities];
      const index = updated.findIndex(c => c.color === color);
      if (index > -1) {
        updated[index].quantity = parseInt(value) || 0;
      } else {
        updated.push({ color, quantity: parseInt(value) || 0 });
      }
      return { ...prev, colorQuantities: updated };
    });
  };

  const handleSizeQuantityChange = (size, value) => {
    setFormData(prev => {
      const updated = [...prev.sizeQuantities];
      const index = updated.findIndex(s => s.size === size);
      if (index > -1) {
        updated[index].quantity = parseInt(value) || 0;
      } else {
        updated.push({ size, quantity: parseInt(value) || 0 });
      }
      return { ...prev, sizeQuantities: updated };
    });
  };

  const addSize = () => {
    if (newSize && !formData.sizeOptions.includes(newSize)) {
      setFormData(prev => ({ 
        ...prev, 
        sizeOptions: [...prev.sizeOptions, newSize] 
      }));
      setNewSize('');
    }
  };

  const addColor = () => {
    if (newColor && !formData.colorOptions.includes(newColor)) {
      setFormData(prev => ({ 
        ...prev, 
        colorOptions: [...prev.colorOptions, newColor] 
      }));
      setNewColor('');
    }
  };

  const removeSize = (sizeToRemove) => {
    setFormData(prev => ({
      ...prev,
      sizeOptions: prev.sizeOptions.filter(size => size !== sizeToRemove),
      sizeColorQuantities: prev.sizeColorQuantities.filter(q => q.size !== sizeToRemove),
      sizeQuantities: prev.sizeQuantities.filter(q => q.size !== sizeToRemove)
    }));
  };

  const removeColor = (colorToRemove) => {
    setFormData(prev => ({
      ...prev,
      colorOptions: prev.colorOptions.filter(color => color !== colorToRemove),
      sizeColorQuantities: prev.sizeColorQuantities.filter(q => q.color !== colorToRemove),
      colorQuantities: prev.colorQuantities.filter(q => q.color !== colorToRemove)
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!formData.details.trim()) {
      newErrors.details = 'Product details are required';
    }

    if (!formData.brand.trim()) {
      newErrors.brand = 'Brand is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.unit.trim()) {
      newErrors.unit = 'Unit is required';
    }

    if (!formData.price || formData.price <= 0) {
      newErrors.price = 'Valid price is required';
    }

    if (formData.stockQty < 0) {
      newErrors.stockQty = 'Stock quantity cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setSnackbar({
        open: true,
        message: 'Please fix the errors in the form',
        severity: 'error'
      });
      return;
    }

    setLoading(true);

    try {
      const uploadData = new FormData();

      // Add all form fields to FormData
      Object.entries(formData).forEach(([key, val]) => {
        if (['sizeColorQuantities', 'colorQuantities', 'sizeQuantities', 'location'].includes(key)) {
          uploadData.append(key, JSON.stringify(val));
        } else if (key === 'sizeOptions' && Array.isArray(val)) {
          uploadData.append(key, val.join(','));
        } else if (key === 'colorOptions' && Array.isArray(val)) {
          uploadData.append(key, val.join(','));
        } else if (key === 'image' && val instanceof File) {
          uploadData.append(key, val);
        } else if (val !== null && val !== undefined) {
          uploadData.append(key, val);
        }
      });

      const response = await axios.post('http://localhost:5000/api/products', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSnackbar({
        open: true,
        message: '✅ Product added successfully!',
        severity: 'success'
      });

      // Reset form
      setFormData({
        name: '',
        details: '',
        brand: '',
        category: '',
        stockQty: 0,
        unit: '',
        price: '',
        image: null,
        sizeOptions: [],
        colorOptions: [],
        sizeColorQuantities: [],
        colorQuantities: [],
        sizeQuantities: [],
        variantSize: '',
        variantColor: '',
        location: {
          x: 0,
          y: 0,
          floor: 'Ground Floor'
        }
      });
      setHasVariant(false);
      setNewSize('');
      setNewColor('');

      // Notify parent component if callback provided
      if (onProductAdded) {
        onProductAdded(response.data);
      }

    } catch (err) {
      setSnackbar({
        open: true,
        message: '❌ Error saving product',
        severity: 'error'
      });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: 2 }}>
      <Card elevation={3}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <AddIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h5" component="h1">
              Add New Product
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Basic Product Information */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Product Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  error={!!errors.name}
                  helperText={errors.name}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Brand"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  error={!!errors.brand}
                  helperText={errors.brand}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Product Details"
                  name="details"
                  value={formData.details}
                  onChange={handleInputChange}
                  error={!!errors.details}
                  helperText={errors.details}
                  multiline
                  rows={3}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!errors.category}>
                  <InputLabel>Category</InputLabel>
                  <Select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    label="Category"
                    required
                  >
                    {categories.map((cat) => (
                      <MenuItem key={cat._id} value={cat.name}>
                        {cat.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.category && (
                    <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5 }}>
                      {errors.category}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Unit (e.g. pcs, box, kg)"
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  error={!!errors.unit}
                  helperText={errors.unit}
                  required
                />
              </Grid>

              {/* Price and Stock */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Price"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleInputChange}
                  error={!!errors.price}
                  helperText={errors.price}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Stock Quantity"
                  name="stockQty"
                  type="number"
                  value={formData.stockQty}
                  onChange={handleInputChange}
                  error={!!errors.stockQty}
                  helperText={errors.stockQty}
                />
              </Grid>

              {/* Image Upload */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<UploadIcon />}
                  >
                    Upload Image
                    <input
                      type="file"
                      name="image"
                      accept="image/*"
                      onChange={handleInputChange}
                      hidden
                    />
                  </Button>
                  {formData.image && (
                    <Typography variant="body2" color="success.main">
                      {formData.image.name} selected
                    </Typography>
                  )}
                </Box>
              </Grid>

              {/* Variants Section */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={hasVariant}
                      onChange={(e) => {
                        const checked = e.target.checked;

                        if (!checked) {
                          const confirmClear = window.confirm(
                            'Unchecking will remove all size and color options and their quantities. Continue?'
                          );
                          if (!confirmClear) return;

                          setFormData(prev => ({
                            ...prev,
                            sizeOptions: [],
                            colorOptions: [],
                            sizeColorQuantities: [],
                            colorQuantities: [],
                            sizeQuantities: [],
                            variantSize: '',
                            variantColor: ''
                          }));

                          setNewSize('');
                          setNewColor('');
                        }

                        setHasVariant(checked);
                      }}
                    />
                  }
                  label="Has Variants (Size/Color)?"
                />
              </Grid>

              {hasVariant && (
                <>
                  {/* Size Management */}
                  <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom>Size Options</Typography>
                      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <FormControl sx={{ minWidth: 120 }}>
                          <InputLabel>Select Size</InputLabel>
                          <Select
                            value={newSize}
                            onChange={(e) => setNewSize(e.target.value)}
                            label="Select Size"
                          >
                            {predefinedSizes.map(size => (
                              <MenuItem key={size} value={size}>{size}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <Button 
                          variant="contained" 
                          onClick={addSize}
                          disabled={!newSize || formData.sizeOptions.includes(newSize)}
                        >
                          Add Size
                        </Button>
                      </Box>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {formData.sizeOptions.map(size => (
                          <Chip
                            key={size}
                            label={size}
                            onDelete={() => removeSize(size)}
                            color="primary"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Paper>
                  </Grid>

                  {/* Color Management */}
                  <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom>Color Options</Typography>
                      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <TextField
                          value={newColor}
                          onChange={(e) => setNewColor(e.target.value)}
                          placeholder="Add Color"
                          size="small"
                        />
                        <Button 
                          variant="contained" 
                          onClick={addColor}
                          disabled={!newColor || formData.colorOptions.includes(newColor)}
                        >
                          Add Color
                        </Button>
                      </Box>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {formData.colorOptions.map(color => (
                          <Chip
                            key={color}
                            label={color}
                            onDelete={() => removeColor(color)}
                            color="secondary"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Paper>
                  </Grid>

                  {/* Size/Color Quantity Grid */}
                  {formData.sizeOptions.length > 0 && formData.colorOptions.length > 0 && (
                    <Grid item xs={12}>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                          Size / Color Combination Quantities
                        </Typography>
                        {formData.sizeOptions.map(size => (
                          <Box key={size} sx={{ mb: 3 }}>
                            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                              Size: {size}
                            </Typography>
                            <Grid container spacing={2}>
                              {formData.colorOptions.map(color => {
                                const existing = formData.sizeColorQuantities.find(
                                  q => q.size === size && q.color === color
                                );
                                return (
                                  <Grid item xs={6} sm={4} md={3} lg={2} key={`${size}-${color}`}>
                                    <TextField
                                      fullWidth
                                      label={color}
                                      type="number"
                                      size="small"
                                      value={existing?.quantity || ''}
                                      onChange={(e) => handleQuantityChange(size, color, e.target.value)}
                                      InputProps={{
                                        inputProps: { min: 0 }
                                      }}
                                    />
                                  </Grid>
                                );
                              })}
                            </Grid>
                          </Box>
                        ))}
                      </Paper>
                    </Grid>
                  )}
                </>
              )}

              {/* Location Information */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Store Location
                </Typography>
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Floor</InputLabel>
                  <Select
                    name="location.floor"
                    value={formData.location.floor}
                    onChange={handleInputChange}
                    label="Floor"
                  >
                    {floors.map((floor) => (
                      <MenuItem key={floor} value={floor}>
                        {floor}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="X Coordinate"
                  name="location.x"
                  type="number"
                  value={formData.location.x}
                  onChange={handleInputChange}
                  helperText="Position on store map (X-axis)"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Y Coordinate"
                  name="location.y"
                  type="number"
                  value={formData.location.y}
                  onChange={handleInputChange}
                  helperText="Position on store map (Y-axis)"
                />
              </Grid>

              {/* Submit Buttons */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    startIcon={<SaveIcon />}
                    disabled={loading}
                    sx={{ minWidth: 150 }}
                  >
                    {loading ? 'Adding Product...' : 'Save Product'}
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<CancelIcon />}
                    onClick={() => {
                      // Reset form
                      setFormData({
                        name: '',
                        details: '',
                        brand: '',
                        category: '',
                        stockQty: 0,
                        unit: '',
                        price: '',
                        image: null,
                        sizeOptions: [],
                        colorOptions: [],
                        sizeColorQuantities: [],
                        colorQuantities: [],
                        sizeQuantities: [],
                        variantSize: '',
                        variantColor: '',
                        location: {
                          x: 0,
                          y: 0,
                          floor: 'Ground Floor'
                        }
                      });
                      setHasVariant(false);
                      setErrors({});
                    }}
                    sx={{ minWidth: 150 }}
                  >
                    Cancel
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AddProduct;