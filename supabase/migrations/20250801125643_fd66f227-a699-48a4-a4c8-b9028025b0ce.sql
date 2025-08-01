-- Fix the current state: set all questionnaires to inactive, then activate the first one
UPDATE public.questionnaires SET is_active = false;
UPDATE public.questionnaires SET is_active = true WHERE title = 'Food Preferences Assessment';