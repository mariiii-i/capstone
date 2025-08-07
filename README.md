# Dynamic Store Mapping & Inventory System

A comprehensive kiosk and inventory management system built with React.js and MongoDB for your capstone project.

## Features

### For Buyers (Kiosk Interface)
- **Product Search**: Search for products by name, description, or category
- **Product Details**: View detailed information including price, stock availability, and store location
- **Real-time Inventory**: Only shows products that are currently in stock
- **Location Information**: Shows floor and map coordinates for product location

### For Managers (Admin Interface)
- **Add Products**: Add new products with detailed information and location data
- **Inventory Management**: View, edit, and delete products with real-time stock tracking
- **Stock Monitoring**: Visual indicators for in-stock, low-stock, and out-of-stock items
- **Dynamic Map Editor**: (Placeholder for future implementation)

## Technology Stack

- **Frontend**: React.js with Material-UI
- **Backend**: Node.js with Express.js
- **Database**: MongoDB with Mongoose
- **API**: RESTful API for all operations
- **Routing**: React Router for navigation

## Prerequisites

Before running this application, make sure you have:

1. **Node.js** (version 14 or higher)
2. **MongoDB** (local installation or MongoDB Atlas)
3. **npm** or **yarn** package manager

## Installation & Setup

### 1. Clone and Install Dependencies

```bash
# Install all dependencies
npm install
```

### 2. MongoDB Setup

**Option A: Local MongoDB**
- Install MongoDB locally
- Start MongoDB service: `mongod`

**Option B: MongoDB Atlas (Cloud)**
- Create a MongoDB Atlas account
- Create a cluster and get connection string
- Update the connection string in `server.js`

### 3. Update Database Connection

Edit `server.js` and update the MongoDB connection string:

```javascript
// For local MongoDB
mongoose.connect('mongodb://localhost:27017/inventory_kiosk', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// For MongoDB Atlas
mongoose.connect('mongodb+srv://<username>:<password>@cluster.mongodb.net/inventory_kiosk', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
```

### 4. Run the Application

**Development Mode (runs both frontend and backend):**
```bash
npm run dev
```

**Or run separately:**

```bash
# Terminal 1 - Backend server
npm run server

# Terminal 2 - Frontend development server
npm start
```

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Default Mode**: Kiosk interface

## API Endpoints

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Add new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/products/search/:query` - Search products

### Maps (Future Implementation)
- `GET /api/maps` - Get all maps
- `GET /api/maps/:floor` - Get map by floor
- `POST /api/maps` - Save/update map

## Project Structure

```
src/
├── components/
│   ├── AddProduct.js          # Add product form component
│   ├── InventoryDisplay.js    # Inventory management component
│   └── KioskInterface.js      # Customer kiosk interface
├── services/
│   └── api.js                 # API service functions
├── App.js                     # Main application component
└── index.js                   # React entry point

server.js                      # Express.js backend server
package.json                   # Dependencies and scripts
```

## Usage Guide

### For Store Customers (Kiosk Mode)
1. Navigate to the kiosk interface (default page)
2. Use the search bar to find products
3. Click on any product card to view detailed information
4. View product location, price, and availability
5. Ask store staff for assistance in locating products

### For Store Managers (Admin Mode)
1. Toggle to "Admin Mode" using the switch in the navigation
2. **Add Products**: Go to "Add Product" tab to add new inventory
3. **Manage Inventory**: Use "Inventory Management" tab to view/edit/delete products
4. **Stock Monitoring**: Monitor stock levels with visual indicators
5. **Map Editor**: Future feature for dynamic map editing

## Key Connections Implemented

✅ **Add Product → Inventory**: Products added through the form are immediately saved to MongoDB and appear in inventory

✅ **Inventory → Kiosk**: All inventory changes (stock updates, new products) are immediately reflected in the kiosk search

✅ **Real-time Data**: Both interfaces use the same API endpoints ensuring data consistency

## Future Enhancements

1. **Dynamic Map Editor**: Visual map editor for store layouts
2. **Map Integration**: Connect product locations to visual store maps
3. **User Authentication**: Separate admin and customer access
4. **Advanced Analytics**: Sales tracking and inventory analytics
5. **Mobile Responsiveness**: Optimized mobile interface
6. **Barcode Integration**: Barcode scanning for products

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in server.js
   - Verify network access for MongoDB Atlas

2. **Port Already in Use**
   - Backend: Change PORT in server.js (default: 5000)
   - Frontend: React will prompt to use different port

3. **API Connection Failed**
   - Ensure backend server is running on port 5000
   - Check if CORS is properly configured
   - Verify API base URL in src/services/api.js

### Development Tips

- Use browser developer tools to check network requests
- Monitor backend console for error messages
- Check MongoDB logs for database issues

## Contributing

This is a capstone project. Feel free to extend functionality by:
1. Implementing the map editor component
2. Adding more product categories
3. Improving the UI/UX design
4. Adding data validation and error handling

## License

This project is for educational purposes as part of a capstone project.
