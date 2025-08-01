-- Create a function to activate a questionnaire and deactivate all others
CREATE OR REPLACE FUNCTION public.activate_questionnaire(questionnaire_id uuid)
RETURNS void AS $$
BEGIN
  -- Deactivate all questionnaires
  UPDATE public.questionnaires SET is_active = false;
  
  -- Activate the specified questionnaire
  UPDATE public.questionnaires 
  SET is_active = true 
  WHERE id = questionnaire_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;