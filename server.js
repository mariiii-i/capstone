const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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
  description: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true },
  category: { type: String, required: true },
  location: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    floor: { type: String, default: 'Ground Floor' }
  },
  imageUrl: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', productSchema);

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

// Add new product
app.post('/api/products', async (req, res) => {
  try {
    const product = new Product({
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      stock: req.body.stock,
      category: req.body.category,
      location: req.body.location || { x: 0, y: 0, floor: 'Ground Floor' },
      imageUrl: req.body.imageUrl || ''
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
        { description: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } }
      ],
      stock: { $gt: 0 } // Only show products in stock
    });
    res.json(products);
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