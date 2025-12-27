-- Password reset SQL for yashir91lora@gmail.com
-- Password: 1234512345
-- Hash: $2b$12$HvmqJa5xoq6IcDrYuzZ28Oh52v3VH4ww7dAtMs5K.Cc4Kj4MtQQDm

UPDATE users 
SET password_hash = '$2b$12$HvmqJa5xoq6IcDrYuzZ28Oh52v3VH4ww7dAtMs5K.Cc4Kj4MtQQDm' 
WHERE LOWER(email) = 'yashir91lora@gmail.com';

-- Verify the update
SELECT id, username, email, 
       CASE WHEN password_hash IS NOT NULL THEN 'Password set' ELSE 'No password' END as password_status
FROM users 
WHERE LOWER(email) = 'yashir91lora@gmail.com';

