import express from 'express';
import { body, validationResult } from 'express-validator';
import Questionnaire from '../models/Questionnaire.js';

const router = express.Router();

// Validation middleware
const validateQuestionnaire = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('createdBy')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Creator information is required'),
  body('settings.allowAnonymous')
    .optional()
    .isBoolean()
    .withMessage('allowAnonymous must be a boolean'),
  body('settings.requireEmail')
    .optional()
    .isBoolean()
    .withMessage('requireEmail must be a boolean'),
  body('settings.showResults')
    .optional()
    .isBoolean()
    .withMessage('showResults must be a boolean'),
  body('settings.maxAttempts')
    .optional()
    .isInt({ min: 1 })
    .withMessage('maxAttempts must be at least 1')
];

// GET /api/questionnaires - Get all questionnaires
router.get('/', async (req, res) => {
  try {
    const { 
      active, 
      createdBy, 
      page = 1, 
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    
    // Filter by active status
    if (active !== undefined) {
      query.isActive = active === 'true';
    }
    
    // Filter by creator
    if (createdBy) {
      query.createdBy = createdBy;
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const questionnaires = await Questionnaire.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip);
    
    const total = await Questionnaire.countDocuments(query);
    
    res.json({
      success: true,
      data: questionnaires,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching questionnaires:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch questionnaires'
    });
  }
});

// GET /api/questionnaires/active - Get active questionnaires
router.get('/active', async (req, res) => {
  try {
    const questionnaires = await Questionnaire.findActive();
    
    res.json({
      success: true,
      data: questionnaires
    });
  } catch (error) {
    console.error('Error fetching active questionnaires:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active questionnaires'
    });
  }
});

// GET /api/questionnaires/creator/:createdBy - Get questionnaires by creator
router.get('/creator/:createdBy', async (req, res) => {
  try {
    const questionnaires = await Questionnaire.findByCreator(req.params.createdBy);
    
    res.json({
      success: true,
      data: questionnaires
    });
  } catch (error) {
    console.error('Error fetching questionnaires by creator:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch questionnaires by creator'
    });
  }
});

// GET /api/questionnaires/:id - Get single questionnaire
router.get('/:id', async (req, res) => {
  try {
    const questionnaire = await Questionnaire.findById(req.params.id);
    
    if (!questionnaire) {
      return res.status(404).json({
        success: false,
        error: 'Questionnaire not found'
      });
    }
    
    res.json({
      success: true,
      data: questionnaire
    });
  } catch (error) {
    console.error('Error fetching questionnaire:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch questionnaire'
    });
  }
});

// POST /api/questionnaires - Create new questionnaire
router.post('/', validateQuestionnaire, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const questionnaire = new Questionnaire(req.body);
    await questionnaire.save();
    
    res.status(201).json({
      success: true,
      data: questionnaire,
      message: 'Questionnaire created successfully'
    });
  } catch (error) {
    console.error('Error creating questionnaire:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create questionnaire'
    });
  }
});

// PUT /api/questionnaires/:id - Update questionnaire
router.put('/:id', validateQuestionnaire, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const questionnaire = await Questionnaire.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!questionnaire) {
      return res.status(404).json({
        success: false,
        error: 'Questionnaire not found'
      });
    }
    
    res.json({
      success: true,
      data: questionnaire,
      message: 'Questionnaire updated successfully'
    });
  } catch (error) {
    console.error('Error updating questionnaire:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update questionnaire'
    });
  }
});

// DELETE /api/questionnaires/:id - Delete questionnaire
router.delete('/:id', async (req, res) => {
  try {
    const questionnaire = await Questionnaire.findByIdAndDelete(req.params.id);
    
    if (!questionnaire) {
      return res.status(404).json({
        success: false,
        error: 'Questionnaire not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Questionnaire deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting questionnaire:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete questionnaire'
    });
  }
});

// PATCH /api/questionnaires/:id/activate - Activate questionnaire
router.patch('/:id/activate', async (req, res) => {
  try {
    const questionnaire = await Questionnaire.findById(req.params.id);
    
    if (!questionnaire) {
      return res.status(404).json({
        success: false,
        error: 'Questionnaire not found'
      });
    }
    
    await questionnaire.activate();
    
    res.json({
      success: true,
      data: questionnaire,
      message: 'Questionnaire activated successfully'
    });
  } catch (error) {
    console.error('Error activating questionnaire:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to activate questionnaire'
    });
  }
});

// PATCH /api/questionnaires/:id/deactivate - Deactivate questionnaire
router.patch('/:id/deactivate', async (req, res) => {
  try {
    const questionnaire = await Questionnaire.findById(req.params.id);
    
    if (!questionnaire) {
      return res.status(404).json({
        success: false,
        error: 'Questionnaire not found'
      });
    }
    
    await questionnaire.deactivate();
    
    res.json({
      success: true,
      data: questionnaire,
      message: 'Questionnaire deactivated successfully'
    });
  } catch (error) {
    console.error('Error deactivating questionnaire:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deactivate questionnaire'
    });
  }
});

// PATCH /api/questionnaires/:id/update-metadata - Update questionnaire metadata
router.patch('/:id/update-metadata', async (req, res) => {
  try {
    const questionnaire = await Questionnaire.findById(req.params.id);
    
    if (!questionnaire) {
      return res.status(404).json({
        success: false,
        error: 'Questionnaire not found'
      });
    }
    
    await questionnaire.updateMetadata();
    
    res.json({
      success: true,
      data: questionnaire,
      message: 'Questionnaire metadata updated successfully'
    });
  } catch (error) {
    console.error('Error updating questionnaire metadata:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update questionnaire metadata'
    });
  }
});

export default router; 