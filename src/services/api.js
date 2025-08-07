import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Product API calls
export const productAPI = {
  // Get all products
  getAllProducts: () => api.get('/products'),
  
  // Get product by ID
  getProductById: (id) => api.get(`/products/${id}`),
  
  // Add new product
  addProduct: (productData) => api.post('/products', productData),
  
  // Update product
  updateProduct: (id, productData) => api.put(`/products/${id}`, productData),
  
  // Delete product
  deleteProduct: (id) => api.delete(`/products/${id}`),
  
  // Search products (for kiosk)
  searchProducts: (query) => api.get(`/products/search/${query}`)
};

// Map API calls
export const mapAPI = {
  // Get all maps
  getAllMaps: () => api.get('/maps'),
  
  // Get map by floor
  getMapByFloor: (floor) => api.get(`/maps/${floor}`),
  
  // Save/Update map
  saveMap: (mapData) => api.post('/maps', mapData)
};

export default api;