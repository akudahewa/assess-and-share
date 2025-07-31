-- Add questionnaire_id to categories to link categories to specific questionnaires
ALTER TABLE categories ADD COLUMN questionnaire_id uuid REFERENCES questionnaires(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX idx_categories_questionnaire_id ON categories(questionnaire_id);

-- Add some sample data to demonstrate the structure
-- Insert a sample questionnaire
INSERT INTO questionnaires (title, description, is_active) 
VALUES ('What food do you like to eat?', 'A questionnaire about food preferences across different meals', true);

-- Get the questionnaire ID for the sample data
DO $$
DECLARE
    questionnaire_uuid uuid;
    breakfast_cat_id uuid;
    lunch_cat_id uuid;
    dinner_cat_id uuid;
BEGIN
    -- Get the questionnaire ID
    SELECT id INTO questionnaire_uuid FROM questionnaires WHERE title = 'What food do you like to eat?' LIMIT 1;
    
    -- Insert categories for this questionnaire
    INSERT INTO categories (name, description, questionnaire_id) 
    VALUES 
        ('Breakfast', 'Morning meal preferences', questionnaire_uuid),
        ('Lunch', 'Midday meal preferences', questionnaire_uuid),
        ('Dinner', 'Evening meal preferences', questionnaire_uuid)
    RETURNING id INTO breakfast_cat_id;
    
    -- Get category IDs
    SELECT id INTO breakfast_cat_id FROM categories WHERE name = 'Breakfast' AND questionnaire_id = questionnaire_uuid;
    SELECT id INTO lunch_cat_id FROM categories WHERE name = 'Lunch' AND questionnaire_id = questionnaire_uuid;
    SELECT id INTO dinner_cat_id FROM categories WHERE name = 'Dinner' AND questionnaire_id = questionnaire_uuid;
    
    -- Insert sample questions for Breakfast category
    INSERT INTO questions (questionnaire_id, category_id, text, order_number, options)
    VALUES 
        (questionnaire_uuid, breakfast_cat_id, 'What type of English breakfast do you prefer?', 1, 
         '[{"text": "Sausages", "score": 3}, {"text": "Sandwich", "score": 2}, {"text": "Chips", "score": 1}]'::jsonb),
        (questionnaire_uuid, breakfast_cat_id, 'What Sri Lankan breakfast do you like?', 2,
         '[{"text": "Rice", "score": 3}, {"text": "Sambol", "score": 2}, {"text": "Beans", "score": 1}]'::jsonb);
    
    -- Insert sample questions for Lunch category  
    INSERT INTO questions (questionnaire_id, category_id, text, order_number, options)
    VALUES 
        (questionnaire_uuid, lunch_cat_id, 'What is your preferred lunch style?', 3,
         '[{"text": "Rice and curry", "score": 3}, {"text": "Sandwich", "score": 2}, {"text": "Fast food", "score": 1}]'::jsonb);
         
    -- Insert sample questions for Dinner category
    INSERT INTO questions (questionnaire_id, category_id, text, order_number, options)
    VALUES 
        (questionnaire_uuid, dinner_cat_id, 'What dinner do you enjoy most?', 4,
         '[{"text": "Home cooked meal", "score": 3}, {"text": "Restaurant meal", "score": 2}, {"text": "Takeaway", "score": 1}]'::jsonb);
END $$;