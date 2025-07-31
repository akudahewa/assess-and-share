-- Insert sample data to demonstrate the food preference questionnaire system
-- This will provide a complete working example

-- Insert sample questionnaire
INSERT INTO questionnaires (title, description, is_active) 
VALUES ('Food Preferences Assessment', 'Discover your food preferences across different meal categories', true)
ON CONFLICT DO NOTHING;

-- Get the questionnaire ID
DO $$
DECLARE
    food_questionnaire_id uuid;
    breakfast_category_id uuid;
    lunch_category_id uuid;
    dinner_category_id uuid;
BEGIN
    -- Get questionnaire ID
    SELECT id INTO food_questionnaire_id 
    FROM questionnaires 
    WHERE title = 'Food Preferences Assessment' 
    LIMIT 1;
    
    -- Insert categories for the food questionnaire
    INSERT INTO categories (name, description, questionnaire_id) 
    VALUES 
        ('Breakfast', 'Morning meal preferences and habits', food_questionnaire_id),
        ('Lunch', 'Midday meal preferences and choices', food_questionnaire_id),
        ('Dinner', 'Evening meal preferences and dining habits', food_questionnaire_id)
    ON CONFLICT DO NOTHING;
    
    -- Get category IDs
    SELECT id INTO breakfast_category_id 
    FROM categories 
    WHERE name = 'Breakfast' AND questionnaire_id = food_questionnaire_id;
    
    SELECT id INTO lunch_category_id 
    FROM categories 
    WHERE name = 'Lunch' AND questionnaire_id = food_questionnaire_id;
    
    SELECT id INTO dinner_category_id 
    FROM categories 
    WHERE name = 'Dinner' AND questionnaire_id = food_questionnaire_id;
    
    -- Insert sample questions for Breakfast
    INSERT INTO questions (questionnaire_id, category_id, text, order_number, options)
    VALUES 
        (food_questionnaire_id, breakfast_category_id, 'What type of English breakfast do you prefer?', 1, 
         '[{"text": "Full English with sausages", "score": 3}, {"text": "Light breakfast sandwich", "score": 2}, {"text": "Just toast and chips", "score": 1}]'::jsonb),
        (food_questionnaire_id, breakfast_category_id, 'What Sri Lankan breakfast appeals to you most?', 2,
         '[{"text": "Rice and curry", "score": 3}, {"text": "Coconut sambol with bread", "score": 2}, {"text": "String hoppers with beans", "score": 1}]'::jsonb),
        (food_questionnaire_id, breakfast_category_id, 'How important is breakfast to you?', 3,
         '[{"text": "Essential - most important meal", "score": 3}, {"text": "Important but flexible", "score": 2}, {"text": "Not very important", "score": 1}]'::jsonb);
    
    -- Insert sample questions for Lunch  
    INSERT INTO questions (questionnaire_id, category_id, text, order_number, options)
    VALUES 
        (food_questionnaire_id, lunch_category_id, 'What is your preferred lunch style?', 4,
         '[{"text": "Traditional rice and curry", "score": 3}, {"text": "Western sandwich or salad", "score": 2}, {"text": "Fast food or takeaway", "score": 1}]'::jsonb),
        (food_questionnaire_id, lunch_category_id, 'Where do you usually eat lunch?', 5,
         '[{"text": "Home-cooked meal", "score": 3}, {"text": "Office cafeteria", "score": 2}, {"text": "Restaurant or food court", "score": 1}]'::jsonb);
         
    -- Insert sample questions for Dinner
    INSERT INTO questions (questionnaire_id, category_id, text, order_number, options)
    VALUES 
        (food_questionnaire_id, dinner_category_id, 'What type of dinner do you enjoy most?', 6,
         '[{"text": "Home-cooked family meal", "score": 3}, {"text": "Restaurant dining experience", "score": 2}, {"text": "Quick takeaway or delivery", "score": 1}]'::jsonb),
        (food_questionnaire_id, dinner_category_id, 'How adventurous are you with dinner choices?', 7,
         '[{"text": "Love trying new cuisines", "score": 3}, {"text": "Occasionally try new things", "score": 2}, {"text": "Prefer familiar foods", "score": 1}]'::jsonb);
END $$;