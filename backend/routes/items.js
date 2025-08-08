import express from 'express';
import { body, validationResult } from 'express-validator';
import Item from '../models/Item.js';

const router = express.Router();

// Validation middleware
const validateItem = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Item name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('category')
    .isIn(['electronics', 'clothing', 'books', 'home', 'sports', 'other'])
    .withMessage('Invalid category'),
  body('inStock')
    .optional()
    .isBoolean()
    .withMessage('inStock must be a boolean'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('imageUrl')
    .optional()
    .isURL()
    .withMessage('Image URL must be a valid URL')
];

// GET /api/items - Get all items
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      inStock, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    
    // Filter by category
    if (category) {
      query.category = category;
    }
    
    // Filter by stock status
    if (inStock !== undefined) {
      query.inStock = inStock === 'true';
    }
    
    // Search functionality
    if (search) {
      query.$text = { $search: search };
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const items = await Item.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip);
    
    const total = await Item.countDocuments(query);
    
    res.json({
      success: true,
      data: items,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch items'
    });
  }
});

// GET /api/items/:id - Get single item
router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Item not found'
      });
    }
    
    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch item'
    });
  }
});

// POST /api/items - Create new item
router.post('/', validateItem, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const item = new Item(req.body);
    await item.save();
    
    res.status(201).json({
      success: true,
      data: item,
      message: 'Item created successfully'
    });
  } catch (error) {
    console.error('Error creating item:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Item with this name already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create item'
    });
  }
});

// PUT /api/items/:id - Update item
router.put('/:id', validateItem, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const item = await Item.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Item not found'
      });
    }
    
    res.json({
      success: true,
      data: item,
      message: 'Item updated successfully'
    });
  } catch (error) {
    console.error('Error updating item:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Item with this name already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to update item'
    });
  }
});

// DELETE /api/items/:id - Delete item
router.delete('/:id', async (req, res) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Item not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete item'
    });
  }
});

// PATCH /api/items/:id/toggle-stock - Toggle stock status
router.patch('/:id/toggle-stock', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Item not found'
      });
    }
    
    await item.toggleStock();
    
    res.json({
      success: true,
      data: item,
      message: `Item ${item.inStock ? 'restocked' : 'marked as out of stock'}`
    });
  } catch (error) {
    console.error('Error toggling stock:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle stock status'
    });
  }
});

// GET /api/items/category/:category - Get items by category
router.get('/category/:category', async (req, res) => {
  try {
    const items = await Item.findByCategory(req.params.category);
    
    res.json({
      success: true,
      data: items
    });
  } catch (error) {
    console.error('Error fetching items by category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch items by category'
    });
  }
});

// GET /api/items/stock/in-stock - Get items in stock
router.get('/stock/in-stock', async (req, res) => {
  try {
    const items = await Item.findInStock();
    
    res.json({
      success: true,
      data: items
    });
  } catch (error) {
    console.error('Error fetching items in stock:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch items in stock'
    });
  }
});

export default router; 