import express from 'express';
import { body, validationResult } from 'express-validator';
import Category from '../models/Category.js';

const router = express.Router();

// Validation middleware
const validateCategory = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Category name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('iconUrl')
    .optional()
    .isURL()
    .withMessage('Icon URL must be a valid URL'),
  body('questionnaireId')
    .optional()
    .isMongoId()
    .withMessage('Invalid questionnaire ID'),
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a non-negative integer')
];

// GET /api/categories - Get all categories
router.get('/', async (req, res) => {
  try {
    const { 
      questionnaireId, 
      active, 
      page = 1, 
      limit = 10,
      sortBy = 'order',
      sortOrder = 'asc'
    } = req.query;

    const query = {};
    
    // Filter by questionnaire
    if (questionnaireId) {
      query.questionnaireId = questionnaireId;
    }
    
    // Filter by active status
    if (active !== undefined) {
      query.isActive = active === 'true';
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const categories = await Category.find(query)
      .populate('questionnaireId', 'title')
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip);
    
    const total = await Category.countDocuments(query);
    
    res.json({
      success: true,
      data: categories,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories'
    });
  }
});

// GET /api/categories/active - Get active categories
router.get('/active', async (req, res) => {
  try {
    const categories = await Category.findActive();
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching active categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active categories'
    });
  }
});

// GET /api/categories/questionnaire/:questionnaireId - Get categories by questionnaire
router.get('/questionnaire/:questionnaireId', async (req, res) => {
  try {
    const categories = await Category.findByQuestionnaire(req.params.questionnaireId);
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories by questionnaire:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories by questionnaire'
    });
  }
});

// GET /api/categories/:id - Get single category
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('questionnaireId', 'title description');
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }
    
    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch category'
    });
  }
});

// POST /api/categories - Create new category
router.post('/', validateCategory, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const category = new Category(req.body);
    await category.save();
    
    res.status(201).json({
      success: true,
      data: category,
      message: 'Category created successfully'
    });
  } catch (error) {
    console.error('Error creating category:', error);
    
    if (error.message === 'Category name already exists') {
      return res.status(400).json({
        success: false,
        error: 'Category name already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create category'
    });
  }
});

// PUT /api/categories/:id - Update category
router.put('/:id', validateCategory, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }
    
    res.json({
      success: true,
      data: category,
      message: 'Category updated successfully'
    });
  } catch (error) {
    console.error('Error updating category:', error);
    
    if (error.message === 'Category name already exists') {
      return res.status(400).json({
        success: false,
        error: 'Category name already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to update category'
    });
  }
});

// DELETE /api/categories/:id - Delete category
router.delete('/:id', async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete category'
    });
  }
});

// PATCH /api/categories/:id/activate - Activate category
router.patch('/:id/activate', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }
    
    await category.activate();
    
    res.json({
      success: true,
      data: category,
      message: 'Category activated successfully'
    });
  } catch (error) {
    console.error('Error activating category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to activate category'
    });
  }
});

// PATCH /api/categories/:id/deactivate - Deactivate category
router.patch('/:id/deactivate', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }
    
    await category.deactivate();
    
    res.json({
      success: true,
      data: category,
      message: 'Category deactivated successfully'
    });
  } catch (error) {
    console.error('Error deactivating category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deactivate category'
    });
  }
});

export default router; 