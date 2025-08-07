import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FaUserCircle, FaHome, FaMap, FaBox, FaPowerOff,
  FaSearch, FaTabletAlt, FaTrash, FaPen 
} from 'react-icons/fa';
import { Link, useLocation } from 'react-router-dom';

function InventoryManager() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
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
  const [editingId, setEditingId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [recentlyDeleted, setRecentlyDeleted] = useState([]);
  const [selectedUndo, setSelectedUndo] = useState([]);
  const [showUndoModal, setShowUndoModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [sortBy, setSortBy] = useState('name'); // 'name' or 'category'
  const [openVariantIndex, setOpenVariantIndex] = useState(null);
  const [hasVariant, setHasVariant] = useState(false);
  const [newSize, setNewSize] = useState('');
  const [newColor, setNewColor] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    const email = localStorage.getItem('currentUserEmail');
    if (email) setCurrentUser(email);
  
    const deletedFromStorage = localStorage.getItem('recentlyDeletedProducts');
    if (deletedFromStorage) {
      const parsed = JSON.parse(deletedFromStorage);
      const now = Date.now();
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  
      const expired = parsed.filter(item => now - item.deletedAt >= thirtyDays);
      const valid = parsed.filter(item => now - item.deletedAt < thirtyDays);
  
      setRecentlyDeleted(valid);
      localStorage.setItem('recentlyDeletedProducts', JSON.stringify(valid));
  
      expired.forEach(async (product) => {
        try {
          await axios.delete(`http://localhost:5000/api/products/${product._id}`);
          console.log(`Permanently deleted: ${product.name}`);
        } catch (err) {
          console.error(`Failed to permanently delete ${product.name}:`, err);
        }
      });
    }
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/products');
      const active = res.data.filter(p => !p.deletedAt);
      setProducts(active);
    } catch (err) {
      console.error('❌ Failed to fetch products:', err.message);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get('http://localhost:5000/categories');
      setCategories(res.data);
    } catch (err) {
      console.error('❌ Failed to fetch categories:', err.message);
    }
  };

  const uniqueCategories = ['All', ...Array.from(new Set(products.map(p => p.category || ''))).sort((a, b) => a.localeCompare(b))];

  const visibleProducts = products.filter((p) => {
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    const matchesSearch =
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.details?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  }).sort((a, b) => {
    const valA = sortBy === 'name' ? a.name?.toLowerCase() : a.category?.toLowerCase();
    const valB = sortBy === 'name' ? b.name?.toLowerCase() : b.category?.toLowerCase();
    return (valA || '').localeCompare(valB || '');
  });

  const getStatus = (qty) => {
    if (qty === 0) return { label: 'OUT OF STOCK', color: '#9e0b0f' };
    if (qty < 50) return { label: 'LOW STOCK', color: '#f44336' };
    return { label: 'IN STOCK', color: '#4caf50' };
  };

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
    } else if (name === 'image') {
      setFormData({ ...formData, image: files[0] });
    } else if (name === 'stockQty') {
      setFormData({ ...formData, stockQty: parseInt(value) || 0 });
    } else if (name === 'price') {
      setFormData({ ...formData, price: parseFloat(value) || 0 });
    } else {
      setFormData({ ...formData, [name]: value });
    }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
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
        } else if (val !== null && val !== undefined && val !== '') {
          uploadData.append(key, val);
        }
      });

      const config = { headers: { 'Content-Type': 'multipart/form-data' } };
      
      if (editingId) {
        await axios.put(`http://localhost:5000/api/products/${editingId}`, uploadData, config);
      } else {
        await axios.post('http://localhost:5000/api/products', uploadData, config);
      }
      
      resetForm();
      fetchProducts();
      setShowEditModal(false);
    } catch (err) {
      alert('❌ Error saving product');
      console.error(err);
    }
  };

  const resetForm = () => {
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
    setEditingId(null);
    setHasVariant(false);
    setNewSize('');
    setNewColor('');
  };

  const handleEdit = (product) => {
    setFormData({ 
      ...product, 
      image: null,
      sizeOptions: product.sizeOptions || [],
      colorOptions: product.colorOptions || [],
      sizeColorQuantities: product.sizeColorQuantities || [],
      colorQuantities: product.colorQuantities || [],
      sizeQuantities: product.sizeQuantities || [],
      location: product.location || { x: 0, y: 0, floor: 'Ground Floor' }
    });
    setEditingId(product._id);
    setHasVariant((product.sizeOptions && product.sizeOptions.length > 0) || (product.colorOptions && product.colorOptions.length > 0));
    setShowEditModal(true);
  };

  const handleRestock = async (id, amount) => {
    const product = products.find(p => p._id === id);
    if (!product) return;
    const newQty = product.stockQty + amount;
    if (newQty < 0) return alert('⚠️ Stock can't be negative');
    try {
      await axios.put(`http://localhost:5000/api/products/${id}`, {
        ...product,
        stockQty: newQty
      });
      fetchProducts();
    } catch {
      alert('❌ Stock update failed');
    }
  };

  const handleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(_id => _id !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    const allVisibleIds = visibleProducts.map(p => p._id);
    setSelectedIds(selectedIds.length === allVisibleIds.length ? [] : allVisibleIds);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    const selectedNames = products.filter(p => selectedIds.includes(p._id)).map(p => p.name).join(', ');
    const confirmMsg = `Are you sure you want to delete the selected ${selectedIds.length} product(s)?\n\nItems: ${selectedNames}`;
    if (!window.confirm(confirmMsg)) return;

    setDeleting(true);
    try {
      const toDelete = products.filter(p => selectedIds.includes(p._id));
      await Promise.all(toDelete.map(p => axios.delete(`http://localhost:5000/api/products/${p._id}`)));

      const withDate = toDelete.map(p => ({ ...p, deletedAt: Date.now() }));
      const updated = [...recentlyDeleted, ...withDate];
      setRecentlyDeleted(updated);
      localStorage.setItem('recentlyDeletedProducts', JSON.stringify(updated));
      setSelectedIds([]);
      fetchProducts();
    } catch (err) {
      alert('Failed to delete selected products');
    } finally {
      setDeleting(false);
    }
  };

  const handleUndoClick = () => {
    setSelectedUndo([]);
    setShowUndoModal(true);
  };

  const handleUndoDelete = async (productsToRestore) => {
    try {
      for (const product of productsToRestore) {
        await axios.patch(`http://localhost:5000/api/products/${product._id}/undo`);
      }
      setRecentlyDeleted(recentlyDeleted.filter(p => !selectedUndo.includes(p._id)));
      localStorage.setItem(
        'recentlyDeletedProducts',
        JSON.stringify(recentlyDeleted.filter(p => !selectedUndo.includes(p._id)))
      );
      fetchProducts();
    } catch (error) {
      console.error('Error undoing delete:', error);
    }
  };

  const formatVariants = (product) => {
    const variants = [];
    
    // Size/Color combinations
    if (product.sizeColorQuantities && product.sizeColorQuantities.length > 0) {
      product.sizeColorQuantities.forEach(variant => {
        if (variant.quantity > 0) {
          variants.push(`${variant.size}-${variant.color} (${variant.quantity})`);
        }
      });
    }
    
    // Color only variants
    if (product.colorQuantities && product.colorQuantities.length > 0) {
      product.colorQuantities.forEach(variant => {
        if (variant.quantity > 0) {
          variants.push(`${variant.color} (${variant.quantity})`);
        }
      });
    }
    
    // Size only variants
    if (product.sizeQuantities && product.sizeQuantities.length > 0) {
      product.sizeQuantities.forEach(variant => {
        if (variant.quantity > 0) {
          variants.push(`${variant.size} (${variant.quantity})`);
        }
      });
    }
    
    return variants.length > 0 ? variants.join(', ') : 'N/A';
  };

  const getTotalVariantStock = (product) => {
    let total = 0;
    
    if (product.sizeColorQuantities) {
      total += product.sizeColorQuantities.reduce((sum, variant) => sum + (variant.quantity || 0), 0);
    }
    
    if (product.colorQuantities) {
      total += product.colorQuantities.reduce((sum, variant) => sum + (variant.quantity || 0), 0);
    }
    
    if (product.sizeQuantities) {
      total += product.sizeQuantities.reduce((sum, variant) => sum + (variant.quantity || 0), 0);
    }
    
    return total > 0 ? total : product.stockQty;
  };

  const sidebarItem = (to, icon, label) => (
    <Link to={to} style={sidebarLink}>
      {icon}
      <span style={labelStyle}>{label}</span>
    </Link>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Arial', overflow: 'hidden' }}>
      <div style={sidebarStyle}>
        <div style={iconGroupStyle}>
          {sidebarItem('/users', <FaUserCircle size={22} color="#0066ff" />, currentUser?.email || currentUser || 'User')}
          {sidebarItem('/dashboard', <FaHome size={22} color="#0066ff" />, 'Dashboard')}
          {sidebarItem('/map-display', <FaMap size={22} color="#0066ff" />, 'Map')}
          {sidebarItem('/invent', <FaBox size={22} color="#0066ff" />, 'Inventory')}
          {sidebarItem('/kiosk', <FaTabletAlt size={22} color="#0066ff" />, 'Kiosk')}
        </div>
        <div>{sidebarItem('/login', <FaPowerOff size={22} color="#0066ff" />, 'Logout')}</div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '40px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FaBox size={20} color="#0066ff" /> Product Inventory 
        </h3>
        <hr style={{ marginBottom: '20px' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '15px' }}>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={filterSelectStyle}>
              {uniqueCategories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
            </select>

            <Link to="/AddProduct?role=manager" style={{ textDecoration: 'none' }}>
              <button style={addBtnStyle}> + Add Product </button>
            </Link>
          </div>

          {/* SELECT ALL, DESELECT, DELETE, UNDO */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {selectedIds.length === visibleProducts.length && visibleProducts.length > 0 ? (
              <>
                <button style={selectBtnStyle} disabled>
                  Select All ({visibleProducts.length})
                </button>
                <button
                  onClick={() => setSelectedIds([])}
                  style={{ ...addBtnStyle, backgroundColor: '#6c757d' }}
                  title="Clear all selected"
                >
                  Deselect All
                </button>
              </>
            ) : selectedIds.length > 0 ? (
              <button onClick={handleSelectAll} style={selectBtnStyle}>
                Selected ({selectedIds.length})
              </button>
            ) : (
              <button onClick={handleSelectAll} style={selectBtnStyle}>
                Select All
              </button>
            )}

            {selectedIds.length > 0 && (
              <button
                onClick={handleDeleteSelected}
                style={addBtnStyle}
                title="Delete Selected"
              >
                <FaTrash size={16} />
              </button>
            )}

            {recentlyDeleted.length > 0 && (
              <button
                onClick={() => setShowUndoModal(true)}
                style={{ ...addBtnStyle, backgroundColor: '#ffc107', color: '#000' }}
                title="Undo recently deleted"
              >
                ↩ Undo
              </button>
            )}
          </div>

          {/* SEARCH */}
          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ccc', borderRadius: '10px', padding: '4px 10px', width: '300px' }}>
            <FaSearch color="#888" />
            <input
              type="text"
              placeholder="Search product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: 'none', outline: 'none', marginLeft: '8px', width: '100%', padding: '6px' }}
            />
          </div>
        </div>

        {/* EDIT MODAL */}
        {showEditModal && (
          <div style={modalOverlayStyle}>
            <div style={{ ...modalBoxStyle, maxWidth: '800px' }}>
              <h3>Edit Product</h3>
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
                  <input 
                    type="text" 
                    name="name" 
                    placeholder="Product Name" 
                    value={formData.name} 
                    onChange={handleInputChange} 
                    style={inputStyle} 
                    required 
                  />
                  <input 
                    type="text" 
                    name="brand" 
                    placeholder="Brand" 
                    value={formData.brand} 
                    onChange={handleInputChange} 
                    style={inputStyle} 
                    required 
                  />
                  <textarea 
                    name="details" 
                    placeholder="Product Details" 
                    value={formData.details} 
                    onChange={handleInputChange} 
                    style={{ ...inputStyle, gridColumn: 'span 2', minHeight: '60px' }} 
                    required 
                  />
                  <select 
                    name="category" 
                    value={formData.category} 
                    onChange={handleInputChange} 
                    style={inputStyle}
                    required
                  >
                    <option value="">-- Select Category --</option>
                    {categories.map(c => (
                      <option key={c._id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                  <input 
                    type="text" 
                    name="unit" 
                    placeholder="Unit (e.g. pcs, box)" 
                    value={formData.unit} 
                    onChange={handleInputChange} 
                    style={inputStyle} 
                    required 
                  />
                  <input 
                    type="number" 
                    name="stockQty" 
                    placeholder="Stock Quantity" 
                    value={formData.stockQty} 
                    onChange={handleInputChange} 
                    style={inputStyle} 
                  />
                  <input 
                    type="number" 
                    step="0.01" 
                    name="price" 
                    placeholder="Price" 
                    value={formData.price} 
                    onChange={handleInputChange} 
                    style={inputStyle} 
                    required 
                  />
                  <input 
                    type="file" 
                    name="image" 
                    onChange={handleInputChange} 
                    style={{ ...inputStyle, gridColumn: 'span 2' }} 
                    accept="image/*"
                  />
                </div>

                {/* Variant Management in Edit */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                    <input
                      type="checkbox"
                      checked={hasVariant}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        if (!checked) {
                          setFormData(prev => ({
                            ...prev,
                            sizeOptions: [],
                            colorOptions: [],
                            sizeColorQuantities: [],
                            colorQuantities: [],
                            sizeQuantities: []
                          }));
                        }
                        setHasVariant(checked);
                      }}
                    />
                    <strong>Has Variants (Size/Color)?</strong>
                  </label>

                  {hasVariant && (
                    <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
                      {/* Size Management */}
                      <div style={{ marginBottom: '15px' }}>
                        <label style={{ fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>Sizes:</label>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                          <select 
                            value={newSize} 
                            onChange={(e) => setNewSize(e.target.value)} 
                            style={{ padding: '5px' }}
                          >
                            <option value="">Select Size</option>
                            {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(size => (
                              <option key={size} value={size}>{size}</option>
                            ))}
                          </select>
                          <button 
                            type="button" 
                            onClick={addSize} 
                            style={{ padding: '5px 10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
                          >
                            Add
                          </button>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                          {formData.sizeOptions.map(size => (
                            <span 
                              key={size} 
                              style={{ 
                                backgroundColor: '#e7f3ff', 
                                padding: '4px 8px', 
                                borderRadius: '12px', 
                                fontSize: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                              }}
                            >
                              {size}
                              <button 
                                type="button"
                                onClick={() => removeSize(size)}
                                style={{ 
                                  background: 'none', 
                                  border: 'none', 
                                  color: 'red', 
                                  cursor: 'pointer',
                                  fontSize: '12px'
                                }}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Color Management */}
                      <div>
                        <label style={{ fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>Colors:</label>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                          <input 
                            type="text"
                            value={newColor} 
                            onChange={(e) => setNewColor(e.target.value)} 
                            placeholder="Enter color"
                            style={{ padding: '5px' }}
                          />
                          <button 
                            type="button" 
                            onClick={addColor} 
                            style={{ padding: '5px 10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}
                          >
                            Add
                          </button>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                          {formData.colorOptions.map(color => (
                            <span 
                              key={color} 
                              style={{ 
                                backgroundColor: '#f0f8e8', 
                                padding: '4px 8px', 
                                borderRadius: '12px', 
                                fontSize: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                              }}
                            >
                              {color}
                              <button 
                                type="button"
                                onClick={() => removeColor(color)}
                                style={{ 
                                  background: 'none', 
                                  border: 'none', 
                                  color: 'red', 
                                  cursor: 'pointer',
                                  fontSize: '12px'
                                }}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Size/Color Quantity Grid */}
                      {formData.sizeOptions.length > 0 && formData.colorOptions.length > 0 && (
                        <div style={{ marginTop: '15px' }}>
                          <label style={{ fontWeight: 'bold', marginBottom: '10px', display: 'block' }}>
                            Size/Color Quantities:
                          </label>
                          {formData.sizeOptions.map(size => (
                            <div key={size} style={{ marginBottom: '10px' }}>
                              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Size: {size}</div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                {formData.colorOptions.map(color => {
                                  const existing = formData.sizeColorQuantities.find(
                                    q => q.size === size && q.color === color
                                  );
                                  return (
                                    <div key={`${size}-${color}`} style={{ display: 'flex', flexDirection: 'column', width: '80px' }}>
                                      <label style={{ fontSize: '11px', marginBottom: '2px' }}>{color}</label>
                                      <input
                                        type="number"
                                        min="0"
                                        placeholder="Qty"
                                        value={existing?.quantity || ''}
                                        onChange={(e) => handleQuantityChange(size, color, e.target.value)}
                                        style={{ padding: '4px', fontSize: '12px', width: '100%' }}
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="submit" style={editBtn}>Save</button>
                  <button type="button" onClick={() => { resetForm(); setShowEditModal(false); }} style={cancelBtn}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* INVENTORY TABLE */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, background: '#f9f9f9', zIndex: 1 }}>
              <tr style={{ textAlign: 'center' }}>
                <th style={thStyle}>Image</th>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Details</th>
                <th style={thStyle}>Brand</th>
                <th style={thStyle}>Category</th>
                <th style={thStyle}>Variants</th>
                <th style={thStyle}>Stock</th>
                <th style={thStyle}>Unit</th>
                <th style={thStyle}>Price</th>
                <th style={thStyle}>Location</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Action</th>
                <th style={thStyle}>Stock Control</th>
              </tr>
            </thead>
            <tbody>
              {visibleProducts.length === 0 ? (
                <tr>
                  <td colSpan="13" style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                    No products found.
                  </td>
                </tr>
              ) : (
                visibleProducts.map((item) => {
                  const effectiveStock = getTotalVariantStock(item);
                  const status = getStatus(effectiveStock);
                  return (
                    <tr key={item._id} style={{ textAlign: 'center' }}>
                      {/* Image */}
                      <td style={tdStyle}>
                        <img
                          src={item.image ? `http://localhost:5000${item.image}` : 'https://via.placeholder.com/60'}
                          alt={item.name}
                          style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }}
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/60'; }}
                        />
                      </td>

                      <td style={tdStyle}>{item.name}</td>
                      <td style={tdStyle}>
                        <div style={{ maxWidth: '150px', wordWrap: 'break-word' }}>
                          {item.details && item.details.length > 50 
                            ? `${item.details.substring(0, 50)}...` 
                            : item.details || 'N/A'}
                        </div>
                      </td>
                      <td style={tdStyle}>{item.brand || 'N/A'}</td>
                      <td style={tdStyle}>{item.category}</td>
                      
                      {/* Variants Display */}
                      <td style={{ ...tdStyle, maxWidth: '150px', fontSize: '12px' }}>
                        <div style={{ maxHeight: '60px', overflowY: 'auto', textAlign: 'left' }}>
                          {formatVariants(item)}
                        </div>
                      </td>
                      
                      <td style={tdStyle}>
                        <div>
                          <strong>{effectiveStock}</strong>
                          {effectiveStock !== item.stockQty && (
                            <div style={{ fontSize: '11px', color: '#666' }}>
                              (Base: {item.stockQty})
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={tdStyle}>{item.unit || 'pcs'}</td>
                      <td style={tdStyle}>₱{parseFloat(item.price || 0).toFixed(2)}</td>
                      
                      {/* Location */}
                      <td style={tdStyle}>
                        <div style={{ fontSize: '12px' }}>
                          <div>{item.location?.floor || 'Ground Floor'}</div>
                          <div style={{ color: '#666' }}>
                            {item.location?.x || 0}, {item.location?.y || 0}
                          </div>
                        </div>
                      </td>
                      
                      <td style={{ ...tdStyle, color: status.color, fontWeight: 'bold' }}>{status.label}</td>

                      {/* Actions */}
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', alignItems: 'center' }}>
                          <button onClick={() => handleEdit(item)} title="Edit" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                            <FaPen size={18} color="#007bff" />
                          </button>
                          <span
                            onClick={() => handleSelect(item._id)}
                            style={{ cursor: 'pointer', color: selectedIds.includes(item._id) ? 'red' : '#007bff' }}
                            title={selectedIds.includes(item._id) ? "Deselect" : "Mark for delete"}
                          >
                            <FaTrash size={18} />
                          </span>
                        </div>
                      </td>

                      {/* Stock control */}
                      <td style={tdStyle}>
                        <button onClick={() => handleRestock(item._id, 1)} style={restockBtnStyle}>+</button>
                        <button onClick={() => handleRestock(item._id, -1)} style={restockBtnStyle}>-</button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* UNDO MODAL */}
      {showUndoModal && (
        <div style={modalOverlayStyle}>
          <div style={modalBoxStyle}>
            <h3>Restore Deleted Products</h3>
            <p style={{ fontSize: '13px', color: '#aa0000', marginTop: '-8px', marginBottom: '12px' }}>
              ⚠️ Note: Deleted products will be permanently removed after 1 day.
            </p>

            {/* Select All */}
            <div style={{ textAlign: 'left', marginBottom: '10px' }}>
              <label>
                <input
                  type="checkbox"
                  checked={
                    recentlyDeleted.length > 0 &&
                    selectedUndo.length === recentlyDeleted.length
                  }
                  onChange={(e) => {
                    if (e.target.checked) {
                      const allIds = recentlyDeleted.map(item => item._id);
                      setSelectedUndo(allIds);
                    } else {
                      setSelectedUndo([]);
                    }
                  }}
                />{' '}
                <strong>Select All</strong>
              </label>
            </div>

            {/* Deleted items list */}
            <ul style={{ listStyle: 'none', padding: 0, maxHeight: '200px', overflowY: 'auto' }}>
              {recentlyDeleted.map(item => (
                <li key={item._id} style={{ marginBottom: '8px' }}>
                  <label>
                    <input
                      type="checkbox"
                      checked={selectedUndo.includes(item._id)}
                      onChange={(e) => {
                        setSelectedUndo(prev =>
                          e.target.checked
                            ? [...prev, item._id]
                            : prev.filter(id => id !== item._id)
                        );
                      }}
                    />
                    <span style={{ marginLeft: '8px' }}>{item.name}</span>
                  </label>
                </li>
              ))}
            </ul>

            {/* Footer */}
            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button
                onClick={() => {
                  const selectedItems = recentlyDeleted.filter(item =>
                    selectedUndo.includes(item._id)
                  );
                  handleUndoDelete(selectedItems);
                  setShowUndoModal(false);
                  setSelectedUndo([]);
                }}
                disabled={selectedUndo.length === 0}
                style={{
                  ...addBtnStyle,
                  backgroundColor: selectedUndo.length === 0 ? '#ccc' : '#ffc107',
                  color: '#333',
                  marginRight: '10px',
                  cursor: selectedUndo.length === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                Undo{selectedUndo.length > 0 ? ` (${selectedUndo.length})` : ''}
              </button>
              <button
                onClick={() => {
                  setShowUndoModal(false);
                  setSelectedUndo([]);
                }}
                style={{ ...addBtnStyle, backgroundColor: '#ddd', color: '#333' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Styles
const sidebarStyle = {
  width: '230px', background: '#ffffff', borderRight: '1px solid #ccc',
  boxShadow: '2px 0 8px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column',
  justifyContent: 'space-between', padding: '20px 12px'
};

const iconGroupStyle = {
  display: 'flex', flexDirection: 'column', gap: '20px'
};

const sidebarLink = {
  display: 'flex', alignItems: 'center', gap: '12px', padding: '10px',
  textDecoration: 'none', color: '#333', borderRadius: '8px'
};

const labelStyle = {
  fontSize: '15px', fontWeight: 'bold'
};

const addBtnStyle = {
  backgroundColor: '#1ec14c', color: 'white', padding: '8px 16px',
  borderRadius: '20px', fontWeight: 'bold', border: 'none', cursor: 'pointer'
};

const filterSelectStyle = {
  padding: '10px 20px', borderRadius: '20px', border: '2px solid #0066ff',
  backgroundColor: 'white', color: '#0066ff', fontWeight: 'bold', cursor: 'pointer'
};

const thStyle = {
  padding: '12px', borderBottom: '2px solid #bbb', fontSize: '14px', fontWeight: 'bold'
};

const tdStyle = {
  padding: '12px', borderBottom: '1px solid #ddd'
};

const selectBtnStyle = {
  padding: '6px 12px',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
};

const restockBtnStyle = {
  backgroundColor: '#ffc107', color: '#333', padding: '6px 10px',
  borderRadius: '5px', border: 'none', margin: '2px', fontWeight: 'bold',
  cursor: 'pointer'
};

const modalOverlayStyle = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 999
};

const modalBoxStyle = {
  backgroundColor: 'white',
  padding: '25px 30px',
  borderRadius: '12px',
  maxWidth: '600px',
  width: '100%',
  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
  textAlign: 'center',
  maxHeight: '90vh',
  overflowY: 'auto'
};

const inputStyle = {
  width: '100%', padding: '8px', marginBottom: '10px',
  borderRadius: '4px', border: '1px solid #ccc'
};

const editBtn = {
  backgroundColor: '#007bff', color: 'white', padding: '8px 16px',
  borderRadius: '6px', fontWeight: 'bold', border: 'none', cursor: 'pointer', marginRight: '10px'
};

const cancelBtn = {
  backgroundColor: '#ccc', color: 'black', padding: '8px 16px',
  borderRadius: '6px', fontWeight: 'bold', border: 'none', cursor: 'pointer'
};

export default InventoryManager;