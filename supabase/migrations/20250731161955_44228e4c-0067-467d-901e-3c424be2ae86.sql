-- Update questions table to support scores in options
-- The options field will now store objects with both text and score
-- Example: [{"text": "Strongly Agree", "score": 5}, {"text": "Agree", "score": 4}]

-- No schema changes needed since options is already JSONB
-- Just adding a comment to document the new structure
COMMENT ON COLUMN questions.options IS 'JSONB array of objects with text and score properties: [{"text": "option text", "score": number}]';