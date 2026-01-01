-- SQL Query to verify migration 032 completed successfully
-- Run this in Railway PostgreSQL: railway connect postgres

-- Check columns
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_context' 
ORDER BY ordinal_position;

-- Check constraints (primary key, foreign keys)
SELECT 
  conname as constraint_name,
  CASE contype 
    WHEN 'p' THEN 'PRIMARY KEY'
    WHEN 'f' THEN 'FOREIGN KEY'
    WHEN 'u' THEN 'UNIQUE'
    ELSE contype::text
  END as constraint_type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'user_context'::regclass
ORDER BY contype, conname;

-- Quick verification
SELECT 
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_context' AND column_name = 'user_email'
  ) THEN '✅ user_email exists' ELSE '❌ user_email missing' END as user_email_check,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_context' AND column_name = 'user_id'
  ) THEN '❌ user_id still exists (should be dropped)' ELSE '✅ user_id correctly dropped' END as user_id_check,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'user_context'::regclass 
    AND contype = 'p' 
    AND pg_get_constraintdef(oid) LIKE '%user_email%'
  ) THEN '✅ user_email is PRIMARY KEY' ELSE '❌ user_email is NOT primary key' END as primary_key_check;

