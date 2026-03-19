-- Add ubounty fields to issues table
ALTER TABLE issues 
ADD COLUMN payment_method VARCHAR(50),
ADD COLUMN ubounty_bounty_id VARCHAR(255),
ADD COLUMN ubounty_url TEXT;

-- Add index for ubounty_bounty_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_issues_ubounty_bounty_id ON issues(ubounty_bounty_id);