import express from 'express';
import { body, validationResult } from 'express-validator';
import Question from '../models/Question.js';

const router = express.Router();

// Validation middleware
const validateQuestion = [
  body(['questionnaireId', 'questionnaire_id'])
    .optional()
    .isMongoId()
    .withMessage('Valid questionnaire ID is required'),
  body(['categoryId', 'category_id'])
    .optional()
    .isMongoId()
    .withMessage('Valid category ID is required'),
  body('text')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Question text must be between 1 and 500 characters'),
  body('type')
    .isIn(['multiple_choice', 'text', 'rating'])
    .withMessage('Type must be multiple_choice, text, or rating'),
  body(['orderNumber', 'order_number'])
    .optional()
    .custom((value) => {
      if (value === null || value === undefined) {
        return true; // Allow null/undefined for auto-generation
      }
      if (!Number.isInteger(value) || value < 1) {
        throw new Error('Order number must be at least 1');
      }
      return true;
    })
    .withMessage('Order number must be at least 1'),
  body('isRequired')
    .optional()
    .isBoolean()
    .withMessage('isRequired must be a boolean'),
  body('options')
    .optional()
    .isArray()
    .withMessage('Options must be an array'),
  body('options.*.text')
    .optional()
    .isLength({ min: 1 })
    .withMessage('Option text is required'),
  body('options.*.score')
    .optional()
    .isNumeric()
    .withMessage('Option score must be a number'),
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
    
    // Custom validation to ensure required fields are present
    if (!req.body.questionnaire_id && !req.body.questionnaireId) {
      return res.status(400).json({
        success: false,
        error: 'Questionnaire ID is required'
      });
    }
    
    if (!req.body.category_id && !req.body.categoryId) {
      return res.status(400).json({
        success: false,
        error: 'Category ID is required'
      });
    }
    
    // Transform the request body to match the model schema
    const questionData = {
      questionnaireId: req.body.questionnaire_id || req.body.questionnaireId,
      categoryId: req.body.category_id || req.body.categoryId,
      text: req.body.text,
      type: req.body.type,
      orderNumber: req.body.order_number !== undefined ? req.body.order_number : req.body.orderNumber,
      isRequired: req.body.isRequired !== undefined ? req.body.isRequired : true,
      options: req.body.options ? req.body.options.map(option => ({
        value: option.text || option.value,
        label: option.text || option.label,
        score: option.score
      })) : undefined,
      settings: req.body.settings
    };
    
    // If orderNumber is not provided or is null, get the next available order number
    if (!questionData.orderNumber || questionData.orderNumber === null) {
      questionData.orderNumber = await Question.getNextOrderNumber(questionData.questionnaireId);
    }
    
    const question = new Question(questionData);
    await question.save();
    
    // Populate the references before sending response
    await question.populate('questionnaireId', 'title');
    await question.populate('categoryId', 'name description');
    
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
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: Object.values(error.errors).map(err => err.message)
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
    
    // Transform the request body to match the model schema
    const updateData = {};
    
    if (req.body.questionnaire_id || req.body.questionnaireId) {
      updateData.questionnaireId = req.body.questionnaire_id || req.body.questionnaireId;
    }
    
    if (req.body.category_id || req.body.categoryId) {
      updateData.categoryId = req.body.category_id || req.body.categoryId;
    }
    
    if (req.body.text !== undefined) {
      updateData.text = req.body.text;
    }
    
    if (req.body.type !== undefined) {
      updateData.type = req.body.type;
    }
    
    if (req.body.order_number !== undefined) {
      updateData.orderNumber = req.body.order_number;
    } else if (req.body.orderNumber !== undefined) {
      updateData.orderNumber = req.body.orderNumber;
    }
    
    if (req.body.isRequired !== undefined) {
      updateData.isRequired = req.body.isRequired;
    }
    
    if (req.body.options !== undefined) {
      updateData.options = req.body.options.map(option => ({
        value: option.text || option.value,
        label: option.text || option.label,
        score: option.score
      }));
    }
    
    if (req.body.settings !== undefined) {
      updateData.settings = req.body.settings;
    }
    
    const question = await Question.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!question) {
      return res.status(404).json({
        success: false,
        error: 'Question not found'
      });
    }
    
    // Populate the references before sending response
    await question.populate('questionnaireId', 'title');
    await question.populate('categoryId', 'name description');
    
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
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: Object.values(error.errors).map(err => err.message)
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