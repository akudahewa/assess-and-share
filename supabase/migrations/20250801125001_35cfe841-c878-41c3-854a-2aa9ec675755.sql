-- Create a second sample questionnaire
INSERT INTO public.questionnaires (title, description, is_active) 
VALUES ('Employee Skills Assessment', 'Comprehensive assessment to evaluate employee technical and soft skills', false);

-- Get the questionnaire ID for adding sample categories and questions
DO $$
DECLARE
    new_questionnaire_id uuid;
    leadership_category_id uuid;
    technical_category_id uuid;
    communication_category_id uuid;
BEGIN
    -- Get the new questionnaire ID
    SELECT id INTO new_questionnaire_id 
    FROM public.questionnaires 
    WHERE title = 'Employee Skills Assessment';

    -- Create categories for the new questionnaire
    INSERT INTO public.categories (name, description, questionnaire_id) 
    VALUES 
        ('Leadership Skills', 'Assessment of leadership and management capabilities', new_questionnaire_id),
        ('Technical Expertise', 'Evaluation of technical knowledge and problem-solving skills', new_questionnaire_id),
        ('Communication', 'Assessment of verbal and written communication abilities', new_questionnaire_id)
    RETURNING id INTO leadership_category_id;

    -- Get category IDs
    SELECT id INTO leadership_category_id FROM public.categories WHERE name = 'Leadership Skills' AND questionnaire_id = new_questionnaire_id;
    SELECT id INTO technical_category_id FROM public.categories WHERE name = 'Technical Expertise' AND questionnaire_id = new_questionnaire_id;
    SELECT id INTO communication_category_id FROM public.categories WHERE name = 'Communication' AND questionnaire_id = new_questionnaire_id;

    -- Add sample questions for Leadership Skills
    INSERT INTO public.questions (questionnaire_id, category_id, text, type, order_number, options) VALUES
    (new_questionnaire_id, leadership_category_id, 'How effectively do you delegate tasks to team members?', 'multiple_choice', 1, 
     '[{"text": "I rarely delegate and prefer to do tasks myself", "score": 1}, 
       {"text": "I delegate occasionally but often take back control", "score": 2}, 
       {"text": "I delegate regularly and provide clear guidance", "score": 3}, 
       {"text": "I delegate effectively and empower team members", "score": 4}]'),
    
    (new_questionnaire_id, leadership_category_id, 'How do you handle conflicts within your team?', 'multiple_choice', 2, 
     '[{"text": "I avoid conflicts and hope they resolve themselves", "score": 1}, 
       {"text": "I address conflicts when they become serious issues", "score": 2}, 
       {"text": "I proactively identify and address potential conflicts", "score": 3}, 
       {"text": "I facilitate resolution and use conflicts as growth opportunities", "score": 4}]');

    -- Add sample questions for Technical Expertise  
    INSERT INTO public.questions (questionnaire_id, category_id, text, type, order_number, options) VALUES
    (new_questionnaire_id, technical_category_id, 'How do you approach learning new technologies?', 'multiple_choice', 3, 
     '[{"text": "I wait for formal training opportunities", "score": 1}, 
       {"text": "I learn when required for specific projects", "score": 2}, 
       {"text": "I regularly explore new technologies in my spare time", "score": 3}, 
       {"text": "I actively research and experiment with emerging technologies", "score": 4}]'),
    
    (new_questionnaire_id, technical_category_id, 'How do you handle complex technical problems?', 'multiple_choice', 4, 
     '[{"text": "I ask for help immediately when stuck", "score": 1}, 
       {"text": "I try briefly before seeking assistance", "score": 2}, 
       {"text": "I research and experiment before asking for help", "score": 3}, 
       {"text": "I systematically break down problems and find innovative solutions", "score": 4}]');

    -- Add sample questions for Communication
    INSERT INTO public.questions (questionnaire_id, category_id, text, type, order_number, options) VALUES
    (new_questionnaire_id, communication_category_id, 'How effectively do you present ideas to stakeholders?', 'multiple_choice', 5, 
     '[{"text": "I struggle to articulate ideas clearly", "score": 1}, 
       {"text": "I can explain basic concepts but lack clarity on complex topics", "score": 2}, 
       {"text": "I present ideas clearly and adapt to my audience", "score": 3}, 
       {"text": "I excel at presenting complex ideas in simple, compelling ways", "score": 4}]'),
    
    (new_questionnaire_id, communication_category_id, 'How do you handle feedback from colleagues?', 'multiple_choice', 6, 
     '[{"text": "I find feedback difficult to accept", "score": 1}, 
       {"text": "I accept feedback but don''t always act on it", "score": 2}, 
       {"text": "I welcome feedback and usually implement suggestions", "score": 3}, 
       {"text": "I actively seek feedback and use it for continuous improvement", "score": 4}]');

    -- Add scoring rules for the new questionnaire
    INSERT INTO public.scoring_rules (questionnaire_id, category_id, level_name, min_percentage, max_percentage, description) VALUES
    -- Leadership Skills scoring
    (new_questionnaire_id, leadership_category_id, 'Developing Leader', 0, 50, 'Shows potential but needs significant development in leadership skills'),
    (new_questionnaire_id, leadership_category_id, 'Emerging Leader', 51, 75, 'Demonstrates good leadership foundation with room for growth'),
    (new_questionnaire_id, leadership_category_id, 'Strong Leader', 76, 90, 'Exhibits strong leadership capabilities across most areas'),
    (new_questionnaire_id, leadership_category_id, 'Exceptional Leader', 91, 100, 'Outstanding leadership skills with the ability to inspire and transform teams'),
    
    -- Technical Expertise scoring
    (new_questionnaire_id, technical_category_id, 'Technical Learner', 0, 50, 'Basic technical knowledge, requires guidance and support'),
    (new_questionnaire_id, technical_category_id, 'Competent Technician', 51, 75, 'Solid technical skills with ability to work independently'),
    (new_questionnaire_id, technical_category_id, 'Technical Expert', 76, 90, 'Advanced technical expertise with problem-solving capabilities'),
    (new_questionnaire_id, technical_category_id, 'Technical Innovator', 91, 100, 'Exceptional technical skills with ability to drive innovation'),
    
    -- Communication scoring
    (new_questionnaire_id, communication_category_id, 'Communication Learner', 0, 50, 'Basic communication skills, needs improvement in clarity and effectiveness'),
    (new_questionnaire_id, communication_category_id, 'Effective Communicator', 51, 75, 'Good communication skills with clear expression of ideas'),
    (new_questionnaire_id, communication_category_id, 'Strong Communicator', 76, 90, 'Excellent communication skills across various contexts and audiences'),
    (new_questionnaire_id, communication_category_id, 'Master Communicator', 91, 100, 'Outstanding communication abilities with influence and persuasion skills');

END $$;