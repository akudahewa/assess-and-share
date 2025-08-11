import express from 'express';
import { body, validationResult } from 'express-validator';
import ScoringRule from '../models/ScoringRule.js';

const router = express.Router();

// Validation middleware
const validateScoringRule = [
  body('questionnaireId')
    .isMongoId()
    .withMessage('Valid questionnaire ID is required'),
  body('categoryId')
    .optional({ nullable: true, checkFalsy: false })
    .custom((value) => {
      // Allow null, undefined, or valid MongoDB ID
      if (value === null || value === undefined) {
        return true;
      }
      // If value is provided, it must be a valid MongoDB ID
      return /^[0-9a-fA-F]{24}$/.test(value);
    })
    .withMessage('Category ID must be a valid MongoDB ID or null'),
  body('minPercentage')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Minimum percentage must be between 0 and 100'),
  body('maxPercentage')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Maximum percentage must be between 0 and 100'),
  body('levelName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Level name must be between 1 and 50 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('color')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Color must be a valid hex color code')
];

// GET /api/scoring-rules - Get all scoring rules
router.get('/', async (req, res) => {
  try {
    const { 
      questionnaireId, 
      categoryId, 
      page = 1, 
      limit = 10,
      sortBy = 'minPercentage',
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
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const scoringRules = await ScoringRule.find(query)
      .populate('questionnaireId', 'title')
      .populate('categoryId', 'name')
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip);
    
    const total = await ScoringRule.countDocuments(query);
    
    res.json({
      success: true,
      data: scoringRules,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching scoring rules:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scoring rules'
    });
  }
});

// GET /api/scoring-rules/questionnaire/:questionnaireId - Get rules by questionnaire
router.get('/questionnaire/:questionnaireId', async (req, res) => {
  try {
    const scoringRules = await ScoringRule.findByQuestionnaire(req.params.questionnaireId);
    
    res.json({
      success: true,
      data: scoringRules
    });
  } catch (error) {
    console.error('Error fetching scoring rules by questionnaire:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scoring rules by questionnaire'
    });
  }
});

// GET /api/scoring-rules/category/:categoryId - Get rules by category
router.get('/category/:categoryId', async (req, res) => {
  try {
    const scoringRules = await ScoringRule.findByCategory(req.params.categoryId);
    
    res.json({
      success: true,
      data: scoringRules
    });
  } catch (error) {
    console.error('Error fetching scoring rules by category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scoring rules by category'
    });
  }
});

// GET /api/scoring-rules/:id - Get single scoring rule
router.get('/:id', async (req, res) => {
  try {
    const scoringRule = await ScoringRule.findById(req.params.id)
      .populate('questionnaireId', 'title')
      .populate('categoryId', 'name description');
    
    if (!scoringRule) {
      return res.status(404).json({
        success: false,
        error: 'Scoring rule not found'
      });
    }
    
    res.json({
      success: true,
      data: scoringRule
    });
  } catch (error) {
    console.error('Error fetching scoring rule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scoring rule'
    });
  }
});

// POST /api/scoring-rules - Create new scoring rule
router.post('/', validateScoringRule, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    // Validate percentage range
    if (req.body.minPercentage >= req.body.maxPercentage) {
      return res.status(400).json({
        success: false,
        error: 'Minimum percentage must be less than maximum percentage'
      });
    }
    
    const scoringRule = new ScoringRule(req.body);
    await scoringRule.save();
    
    res.status(201).json({
      success: true,
      data: scoringRule,
      message: 'Scoring rule created successfully'
    });
  } catch (error) {
    console.error('Error creating scoring rule:', error);
    
    if (error.message === 'Scoring rule ranges cannot overlap') {
      return res.status(400).json({
        success: false,
        error: 'Scoring rule ranges cannot overlap'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create scoring rule'
    });
  }
});

// PUT /api/scoring-rules/:id - Update scoring rule
router.put('/:id', validateScoringRule, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    // Validate percentage range
    if (req.body.minPercentage >= req.body.maxPercentage) {
      return res.status(400).json({
        success: false,
        error: 'Minimum percentage must be less than maximum percentage'
      });
    }
    
    const scoringRule = await ScoringRule.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!scoringRule) {
      return res.status(404).json({
        success: false,
        error: 'Scoring rule not found'
      });
    }
    
    res.json({
      success: true,
      data: scoringRule,
      message: 'Scoring rule updated successfully'
    });
  } catch (error) {
    console.error('Error updating scoring rule:', error);
    
    if (error.message === 'Scoring rule ranges cannot overlap') {
      return res.status(400).json({
        success: false,
        error: 'Scoring rule ranges cannot overlap'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to update scoring rule'
    });
  }
});

// DELETE /api/scoring-rules/:id - Delete scoring rule
router.delete('/:id', async (req, res) => {
  try {
    const scoringRule = await ScoringRule.findByIdAndDelete(req.params.id);
    
    if (!scoringRule) {
      return res.status(404).json({
        success: false,
        error: 'Scoring rule not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Scoring rule deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting scoring rule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete scoring rule'
    });
  }
});

// POST /api/scoring-rules/level - Get level for a percentage
router.post('/level', async (req, res) => {
  try {
    const { questionnaireId, categoryId, percentage } = req.body;
    
    if (!questionnaireId || percentage === undefined) {
      return res.status(400).json({
        success: false,
        error: 'questionnaireId and percentage are required'
      });
    }
    
    const level = await ScoringRule.getLevelForPercentage(
      questionnaireId, 
      categoryId, 
      percentage
    );
    
    res.json({
      success: true,
      data: { level, percentage }
    });
  } catch (error) {
    console.error('Error getting level for percentage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get level for percentage'
    });
  }
});

// POST /api/scoring-rules/bulk - Create multiple scoring rules
router.post('/bulk', async (req, res) => {
  try {
    const { rules } = req.body;
    
    if (!rules || !Array.isArray(rules)) {
      return res.status(400).json({
        success: false,
        error: 'rules array is required'
      });
    }
    
    const createdRules = [];
    const errors = [];
    
    for (let i = 0; i < rules.length; i++) {
      try {
        const rule = rules[i];
        
        // Validate each rule
        const ruleErrors = validationResult(req);
        if (!ruleErrors.isEmpty()) {
          errors.push({
            index: i,
            errors: ruleErrors.array()
          });
          continue;
        }
        
        const scoringRule = new ScoringRule(rule);
        await scoringRule.save();
        createdRules.push(scoringRule);
      } catch (error) {
        errors.push({
          index: i,
          error: error.message
        });
      }
    }
    
    res.status(201).json({
      success: true,
      data: createdRules,
      errors: errors.length > 0 ? errors : undefined,
      message: `Created ${createdRules.length} scoring rules${errors.length > 0 ? `, ${errors.length} failed` : ''}`
    });
  } catch (error) {
    console.error('Error creating bulk scoring rules:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create bulk scoring rules'
    });
  }
});

export default router; 