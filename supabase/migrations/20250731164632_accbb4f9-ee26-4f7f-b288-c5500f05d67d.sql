-- Add questionnaire_id to categories to link categories to specific questionnaires
ALTER TABLE categories ADD COLUMN questionnaire_id uuid REFERENCES questionnaires(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX idx_categories_questionnaire_id ON categories(questionnaire_id);