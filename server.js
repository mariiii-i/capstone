const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Static file serving for uploaded images
app.use('/uploads', express.static('uploads'));

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/inventory_kiosk', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('Connected to MongoDB');
});

// Product Schema
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  details: { type: String, required: true }, // Changed from description to details
  brand: { type: String, required: true },
  category: { type: String, required: true },
  stockQty: { type: Number, required: true }, // Changed from stock to stockQty
  unit: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, default: '' }, // For file path/URL
  
  // Variant system
  sizeOptions: [{ type: String }],
  colorOptions: [{ type: String }],
  sizeColorQuantities: [{
    size: String,
    color: String,
    quantity: Number
  }],
  colorQuantities: [{
    color: String,
    quantity: Number
  }],
  sizeQuantities: [{
    size: String,
    quantity: Number
  }],
  variantSize: { type: String, default: '' },
  variantColor: { type: String, default: '' },
  
  // Location tracking
  location: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    floor: { type: String, default: 'Ground Floor' }
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', productSchema);

// Category Schema
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const Category = mongoose.model('Category', categorySchema);

// Map Schema for dynamic mapping
const mapSchema = new mongoose.Schema({
  mapName: { type: String, required: true },
  mapData: { type: Object, required: true }, // Store map layout data
  floor: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Map = mongoose.model('Map', mapSchema);

// Routes

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get product by ID
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add new product with file upload
app.post('/api/products', upload.single('image'), async (req, res) => {
  try {
    // Parse JSON fields that were stringified
    const sizeColorQuantities = req.body.sizeColorQuantities ? JSON.parse(req.body.sizeColorQuantities) : [];
    const colorQuantities = req.body.colorQuantities ? JSON.parse(req.body.colorQuantities) : [];
    const sizeQuantities = req.body.sizeQuantities ? JSON.parse(req.body.sizeQuantities) : [];
    
    const product = new Product({
      name: req.body.name,
      details: req.body.details,
      brand: req.body.brand,
      category: req.body.category,
      stockQty: parseInt(req.body.stockQty) || 0,
      unit: req.body.unit,
      price: parseFloat(req.body.price),
      image: req.file ? `/uploads/${req.file.filename}` : '',
      
      // Variant data
      sizeOptions: req.body.sizeOptions ? req.body.sizeOptions.split(',').filter(s => s.trim()) : [],
      colorOptions: req.body.colorOptions ? req.body.colorOptions.split(',').filter(c => c.trim()) : [],
      sizeColorQuantities: sizeColorQuantities,
      colorQuantities: colorQuantities,
      sizeQuantities: sizeQuantities,
      variantSize: req.body.variantSize || '',
      variantColor: req.body.variantColor || '',
      
      location: req.body.location ? JSON.parse(req.body.location) : { x: 0, y: 0, floor: 'Ground Floor' }
    });
    
    const savedProduct = await product.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update product
app.put('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        product[key] = req.body[key];
      }
    });
    
    product.updatedAt = new Date();
    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete product
app.delete('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Search products (for kiosk)
app.get('/api/products/search/:query', async (req, res) => {
  try {
    const query = req.params.query;
    const products = await Product.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { details: { $regex: query, $options: 'i' } },
        { brand: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } }
      ],
      stockQty: { $gt: 0 } // Only show products in stock
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Category routes
app.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/categories', async (req, res) => {
  try {
    const category = new Category({
      name: req.body.name,
      description: req.body.description || ''
    });
    const savedCategory = await category.save();
    res.status(201).json(savedCategory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.delete('/categories/:id', async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Map routes

// Get all maps
app.get('/api/maps', async (req, res) => {
  try {
    const maps = await Map.find();
    res.json(maps);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get map by floor
app.get('/api/maps/:floor', async (req, res) => {
  try {
    const map = await Map.findOne({ floor: req.params.floor });
    if (!map) {
      return res.status(404).json({ message: 'Map not found' });
    }
    res.json(map);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Save/Update map
app.post('/api/maps', async (req, res) => {
  try {
    const existingMap = await Map.findOne({ floor: req.body.floor });
    
    if (existingMap) {
      // Update existing map
      existingMap.mapName = req.body.mapName;
      existingMap.mapData = req.body.mapData;
      existingMap.updatedAt = new Date();
      const updatedMap = await existingMap.save();
      res.json(updatedMap);
    } else {
      // Create new map
      const map = new Map({
        mapName: req.body.mapName,
        mapData: req.body.mapData,
        floor: req.body.floor
      });
      const savedMap = await map.save();
      res.status(201).json(savedMap);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;