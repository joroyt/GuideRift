-- Remove cpi task type: clean up existing data and enforce workink/mylead only

-- Delete any tasks still using the cpi type
DELETE FROM tasks WHERE task_type = 'cpi';

-- Ensure the task_type column exists with the correct default
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_type text NOT NULL DEFAULT 'workink';

-- Drop any pre-existing check constraint on task_type
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_task_type_check;

-- Enforce only valid types going forward
ALTER TABLE tasks ADD CONSTRAINT tasks_task_type_check CHECK (task_type IN ('workink', 'mylead'));
