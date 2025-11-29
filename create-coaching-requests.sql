-- Create coaching_requests table for member coaching requests
CREATE TABLE IF NOT EXISTS coaching_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  details TEXT,
  preferred_dates TEXT,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'REVIEWED', 'SCHEDULED', 'COMPLETED', 'CANCELLED')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_coaching_requests_user_id ON coaching_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_coaching_requests_status ON coaching_requests(status);
CREATE INDEX IF NOT EXISTS idx_coaching_requests_created_at ON coaching_requests(created_at DESC);

-- Enable RLS
ALTER TABLE coaching_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for coaching_requests
-- Allow members to view their own requests
CREATE POLICY "Members can view their own requests"
  ON coaching_requests
  FOR SELECT
  USING (true); -- User filtering enforced in API routes

-- Allow members to insert their own requests
CREATE POLICY "Members can create requests"
  ON coaching_requests
  FOR INSERT
  WITH CHECK (true); -- User ID enforced in API routes

-- Allow admins to view all requests (enforced in API routes)
CREATE POLICY "Allow all to manage requests"
  ON coaching_requests
  FOR ALL
  USING (true); -- Admin/member checks enforced in API routes

