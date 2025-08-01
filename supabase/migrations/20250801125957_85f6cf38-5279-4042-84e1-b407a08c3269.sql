-- Get the Employee Skills Assessment questionnaire ID and create sample data
DO $$
DECLARE
    skills_questionnaire_id uuid;
    leadership_category_id uuid;
    technical_category_id uuid;
    communication_category_id uuid;
BEGIN
    -- Get the Employee Skills Assessment questionnaire ID
    SELECT id INTO skills_questionnaire_id 
    FROM public.questionnaires 
    WHERE title = 'Employee Skills Assessment';

    -- Create categories for this questionnaire
    INSERT INTO public.categories (name, description, questionnaire_id) 
    VALUES 
        ('Leadership Skills', 'Assessment of leadership and management capabilities', skills_questionnaire_id),
        ('Technical Expertise', 'Evaluation of technical knowledge and problem-solving skills', skills_questionnaire_id),
        ('Communication', 'Assessment of verbal and written communication abilities', skills_questionnaire_id);

    -- Get the category IDs
    SELECT id INTO leadership_category_id FROM public.categories WHERE name = 'Leadership Skills' AND questionnaire_id = skills_questionnaire_id;
    SELECT id INTO technical_category_id FROM public.categories WHERE name = 'Technical Expertise' AND questionnaire_id = skills_questionnaire_id;
    SELECT id INTO communication_category_id FROM public.categories WHERE name = 'Communication' AND questionnaire_id = skills_questionnaire_id;

    -- Add sample questions for Leadership Skills
    INSERT INTO public.questions (questionnaire_id, category_id, text, type, order_number, options) VALUES
    (skills_questionnaire_id, leadership_category_id, 'How effectively do you delegate tasks to team members?', 'multiple_choice', 1, 
     '[{"text": "I rarely delegate and prefer to do tasks myself", "score": 1}, 
       {"text": "I delegate occasionally but often take back control", "score": 2}, 
       {"text": "I delegate regularly and provide clear guidance", "score": 3}, 
       {"text": "I delegate effectively and empower team members", "score": 4}]'),
    
    (skills_questionnaire_id, leadership_category_id, 'How do you handle conflicts within your team?', 'multiple_choice', 2, 
     '[{"text": "I avoid conflicts and hope they resolve themselves", "score": 1}, 
       {"text": "I address conflicts when they become serious issues", "score": 2}, 
       {"text": "I proactively identify and address potential conflicts", "score": 3}, 
       {"text": "I facilitate resolution and use conflicts as growth opportunities", "score": 4}]');

    -- Add sample questions for Technical Expertise  
    INSERT INTO public.questions (questionnaire_id, category_id, text, type, order_number, options) VALUES
    (skills_questionnaire_id, technical_category_id, 'How do you approach learning new technologies?', 'multiple_choice', 3, 
     '[{"text": "I wait for formal training opportunities", "score": 1}, 
       {"text": "I learn when required for specific projects", "score": 2}, 
       {"text": "I regularly explore new technologies in my spare time", "score": 3}, 
       {"text": "I actively research and experiment with emerging technologies", "score": 4}]'),
    
    (skills_questionnaire_id, technical_category_id, 'How do you handle complex technical problems?', 'multiple_choice', 4, 
     '[{"text": "I ask for help immediately when stuck", "score": 1}, 
       {"text": "I try briefly before seeking assistance", "score": 2}, 
       {"text": "I research and experiment before asking for help", "score": 3}, 
       {"text": "I systematically break down problems and find innovative solutions", "score": 4}]');

    -- Add sample questions for Communication
    INSERT INTO public.questions (questionnaire_id, category_id, text, type, order_number, options) VALUES
    (skills_questionnaire_id, communication_category_id, 'How effectively do you present ideas to stakeholders?', 'multiple_choice', 5, 
     '[{"text": "I struggle to articulate ideas clearly", "score": 1}, 
       {"text": "I can explain basic concepts but lack clarity on complex topics", "score": 2}, 
       {"text": "I present ideas clearly and adapt to my audience", "score": 3}, 
       {"text": "I excel at presenting complex ideas in simple, compelling ways", "score": 4}]'),
    
    (skills_questionnaire_id, communication_category_id, 'How do you handle feedback from colleagues?', 'multiple_choice', 6, 
     '[{"text": "I find feedback difficult to accept", "score": 1}, 
       {"text": "I accept feedback but don''t always act on it", "score": 2}, 
       {"text": "I welcome feedback and usually implement suggestions", "score": 3}, 
       {"text": "I actively seek feedback and use it for continuous improvement", "score": 4}]');

END $$;