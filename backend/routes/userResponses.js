import express from 'express';
import { body, validationResult } from 'express-validator';
import UserResponse from '../models/UserResponse.js';

const router = express.Router();

// Validation middleware
const validateUserResponse = [
  body('questionnaireId')
    .isMongoId()
    .withMessage('Valid questionnaire ID is required'),
  body('userName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('User name cannot exceed 100 characters'),
  body('userEmail')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address'),
  body('responses')
    .isObject()
    .withMessage('Responses must be an object'),
  body('timeSpent')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Time spent must be a non-negative integer'),
  body('status')
    .optional()
    .isIn(['in_progress', 'completed', 'abandoned'])
    .withMessage('Status must be in_progress, completed, or abandoned')
];

// GET /api/user-responses - Get all user responses
router.get('/', async (req, res) => {
  try {
    const { 
      questionnaireId, 
      userEmail, 
      status, 
      page = 1, 
      limit = 10,
      sortBy = 'completedAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    
    // Filter by questionnaire
    if (questionnaireId) {
      query.questionnaireId = questionnaireId;
    }
    
    // Filter by user email
    if (userEmail) {
      query.userEmail = userEmail;
    }
    
    // Filter by status
    if (status) {
      query.status = status;
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const responses = await UserResponse.find(query)
      .populate('questionnaireId', 'title')
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip);
    
    const total = await UserResponse.countDocuments(query);
    
    res.json({
      success: true,
      data: responses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching user responses:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user responses'
    });
  }
});

// GET /api/user-responses/questionnaire/:questionnaireId - Get responses by questionnaire
router.get('/questionnaire/:questionnaireId', async (req, res) => {
  try {
    const responses = await UserResponse.findByQuestionnaire(req.params.questionnaireId);
    
    res.json({
      success: true,
      data: responses
    });
  } catch (error) {
    console.error('Error fetching responses by questionnaire:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch responses by questionnaire'
    });
  }
});

// GET /api/user-responses/user/:userEmail - Get responses by user email
router.get('/user/:userEmail', async (req, res) => {
  try {
    const responses = await UserResponse.findByUserEmail(req.params.userEmail);
    
    res.json({
      success: true,
      data: responses
    });
  } catch (error) {
    console.error('Error fetching responses by user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch responses by user'
    });
  }
});

// GET /api/user-responses/:id - Get single user response
router.get('/:id', async (req, res) => {
  try {
    const response = await UserResponse.findById(req.params.id)
      .populate('questionnaireId', 'title description');
    
    if (!response) {
      return res.status(404).json({
        success: false,
        error: 'User response not found'
      });
    }
    
    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Error fetching user response:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user response'
    });
  }
});

// POST /api/user-responses - Create new user response
router.post('/', validateUserResponse, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const userResponse = new UserResponse(req.body);
    await userResponse.save();
    
    res.status(201).json({
      success: true,
      data: userResponse,
      message: 'User response created successfully'
    });
  } catch (error) {
    console.error('Error creating user response:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create user response'
    });
  }
});

// PUT /api/user-responses/:id - Update user response
router.put('/:id', validateUserResponse, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const userResponse = await UserResponse.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!userResponse) {
      return res.status(404).json({
        success: false,
        error: 'User response not found'
      });
    }
    
    res.json({
      success: true,
      data: userResponse,
      message: 'User response updated successfully'
    });
  } catch (error) {
    console.error('Error updating user response:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user response'
    });
  }
});

// DELETE /api/user-responses/:id - Delete user response
router.delete('/:id', async (req, res) => {
  try {
    const userResponse = await UserResponse.findByIdAndDelete(req.params.id);
    
    if (!userResponse) {
      return res.status(404).json({
        success: false,
        error: 'User response not found'
      });
    }
    
    res.json({
      success: true,
      message: 'User response deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user response:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user response'
    });
  }
});

// PATCH /api/user-responses/:id/complete - Mark response as completed
router.patch('/:id/complete', async (req, res) => {
  try {
    const userResponse = await UserResponse.findById(req.params.id);
    
    if (!userResponse) {
      return res.status(404).json({
        success: false,
        error: 'User response not found'
      });
    }
    
    userResponse.status = 'completed';
    userResponse.completedAt = new Date();
    await userResponse.save();
    
    res.json({
      success: true,
      data: userResponse,
      message: 'Response marked as completed'
    });
  } catch (error) {
    console.error('Error completing response:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete response'
    });
  }
});

// PATCH /api/user-responses/:id/abandon - Mark response as abandoned
router.patch('/:id/abandon', async (req, res) => {
  try {
    const userResponse = await UserResponse.findById(req.params.id);
    
    if (!userResponse) {
      return res.status(404).json({
        success: false,
        error: 'User response not found'
      });
    }
    
    userResponse.status = 'abandoned';
    await userResponse.save();
    
    res.json({
      success: true,
      data: userResponse,
      message: 'Response marked as abandoned'
    });
  } catch (error) {
    console.error('Error abandoning response:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to abandon response'
    });
  }
});

export default router; 