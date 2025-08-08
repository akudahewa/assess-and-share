import express from 'express';
import { body, validationResult } from 'express-validator';
import Question from '../models/Question.js';

const router = express.Router();

// Validation middleware
const validateQuestion = [
  body('questionnaireId')
    .isMongoId()
    .withMessage('Valid questionnaire ID is required'),
  body('categoryId')
    .isMongoId()
    .withMessage('Valid category ID is required'),
  body('text')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Question text must be between 1 and 500 characters'),
  body('type')
    .isIn(['multiple_choice', 'text', 'rating'])
    .withMessage('Type must be multiple_choice, text, or rating'),
  body('orderNumber')
    .isInt({ min: 1 })
    .withMessage('Order number must be at least 1'),
  body('isRequired')
    .optional()
    .isBoolean()
    .withMessage('isRequired must be a boolean'),
  body('options')
    .optional()
    .isArray()
    .withMessage('Options must be an array'),
  body('settings.allowMultipleAnswers')
    .optional()
    .isBoolean()
    .withMessage('allowMultipleAnswers must be a boolean'),
  body('settings.minRating')
    .optional()
    .isInt({ min: 1 })
    .withMessage('minRating must be at least 1'),
  body('settings.maxRating')
    .optional()
    .isInt({ min: 1 })
    .withMessage('maxRating must be at least 1'),
  body('settings.ratingLabels')
    .optional()
    .isArray()
    .withMessage('ratingLabels must be an array')
];

// GET /api/questions - Get all questions
router.get('/', async (req, res) => {
  try {
    const { 
      questionnaireId, 
      categoryId, 
      type, 
      page = 1, 
      limit = 10,
      sortBy = 'orderNumber',
      sortOrder = 'asc'
    } = req.query;

    const query = {};
    
    // Filter by questionnaire
    if (questionnaireId) {
      query.questionnaireId = questionnaireId;
    }
    
    // Filter by category
    if (categoryId) {
      query.categoryId = categoryId;
    }
    
    // Filter by type
    if (type) {
      query.type = type;
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const questions = await Question.find(query)
      .populate('questionnaireId', 'title')
      .populate('categoryId', 'name')
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip);
    
    const total = await Question.countDocuments(query);
    
    res.json({
      success: true,
      data: questions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch questions'
    });
  }
});

// GET /api/questions/questionnaire/:questionnaireId - Get questions by questionnaire
router.get('/questionnaire/:questionnaireId', async (req, res) => {
  try {
    const questions = await Question.findByQuestionnaire(req.params.questionnaireId);
    
    res.json({
      success: true,
      data: questions
    });
  } catch (error) {
    console.error('Error fetching questions by questionnaire:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch questions by questionnaire'
    });
  }
});

// GET /api/questions/category/:categoryId - Get questions by category
router.get('/category/:categoryId', async (req, res) => {
  try {
    const questions = await Question.findByCategory(req.params.categoryId);
    
    res.json({
      success: true,
      data: questions
    });
  } catch (error) {
    console.error('Error fetching questions by category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch questions by category'
    });
  }
});

// GET /api/questions/:id - Get single question
router.get('/:id', async (req, res) => {
  try {
    const question = await Question.findById(req.params.id)
      .populate('questionnaireId', 'title')
      .populate('categoryId', 'name description');
    
    if (!question) {
      return res.status(404).json({
        success: false,
        error: 'Question not found'
      });
    }
    
    res.json({
      success: true,
      data: question
    });
  } catch (error) {
    console.error('Error fetching question:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch question'
    });
  }
});

// POST /api/questions - Create new question
router.post('/', validateQuestion, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    // If orderNumber is not provided, get the next available order number
    if (!req.body.orderNumber) {
      req.body.orderNumber = await Question.getNextOrderNumber(req.body.questionnaireId);
    }
    
    const question = new Question(req.body);
    await question.save();
    
    res.status(201).json({
      success: true,
      data: question,
      message: 'Question created successfully'
    });
  } catch (error) {
    console.error('Error creating question:', error);
    
    if (error.message.includes('Order number already exists')) {
      return res.status(400).json({
        success: false,
        error: 'Order number already exists in this questionnaire'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create question'
    });
  }
});

// PUT /api/questions/:id - Update question
router.put('/:id', validateQuestion, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const question = await Question.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!question) {
      return res.status(404).json({
        success: false,
        error: 'Question not found'
      });
    }
    
    res.json({
      success: true,
      data: question,
      message: 'Question updated successfully'
    });
  } catch (error) {
    console.error('Error updating question:', error);
    
    if (error.message.includes('Order number already exists')) {
      return res.status(400).json({
        success: false,
        error: 'Order number already exists in this questionnaire'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to update question'
    });
  }
});

// DELETE /api/questions/:id - Delete question
router.delete('/:id', async (req, res) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);
    
    if (!question) {
      return res.status(404).json({
        success: false,
        error: 'Question not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete question'
    });
  }
});

// POST /api/questions/reorder - Reorder questions
router.post('/reorder', async (req, res) => {
  try {
    const { questionnaireId, questionOrders } = req.body;
    
    if (!questionnaireId || !questionOrders || !Array.isArray(questionOrders)) {
      return res.status(400).json({
        success: false,
        error: 'questionnaireId and questionOrders array are required'
      });
    }
    
    await Question.reorderQuestions(questionnaireId, questionOrders);
    
    res.json({
      success: true,
      message: 'Questions reordered successfully'
    });
  } catch (error) {
    console.error('Error reordering questions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reorder questions'
    });
  }
});

// GET /api/questions/next-order/:questionnaireId - Get next order number
router.get('/next-order/:questionnaireId', async (req, res) => {
  try {
    const nextOrder = await Question.getNextOrderNumber(req.params.questionnaireId);
    
    res.json({
      success: true,
      data: { nextOrder }
    });
  } catch (error) {
    console.error('Error getting next order number:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get next order number'
    });
  }
});

export default router; 