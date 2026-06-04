-- Add default_player_limit column to training_enrollment_forms
ALTER TABLE training_enrollment_forms 
ADD COLUMN default_player_limit integer NOT NULL DEFAULT 24;
