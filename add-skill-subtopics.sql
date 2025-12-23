-- Migration to add subtopics to skills description
-- Run this in Supabase SQL Editor

ALTER TABLE skills ADD COLUMN IF NOT EXISTS what_it_develops TEXT;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS why_it_matters TEXT;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS how_it_works TEXT;

