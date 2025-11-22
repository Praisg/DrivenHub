-- Add password field to members table
-- Run this in Supabase SQL Editor

-- Add password_hash column to members table
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_members_email_lookup ON members(email);

-- Update existing admin user with a default password (you should change this!)
-- Default password: "password" (hashed with bcrypt)
-- You can generate a new hash at: https://bcrypt-generator.com/
UPDATE members 
SET password_hash = '$2a$10$rOzJqZqZqZqZqZqZqZqZqOqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZq'
WHERE email = 'gavipraise@gmail.com' AND password_hash IS NULL;

