-- Fix the activate_questionnaire function to include proper WHERE clauses
CREATE OR REPLACE FUNCTION public.activate_questionnaire(questionnaire_id uuid)
RETURNS void AS $$
BEGIN
  -- Deactivate all questionnaires (add WHERE clause that matches all rows)
  UPDATE public.questionnaires SET is_active = false WHERE is_active = true OR is_active = false;
  
  -- Activate the specified questionnaire
  UPDATE public.questionnaires 
  SET is_active = true 
  WHERE id = questionnaire_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;