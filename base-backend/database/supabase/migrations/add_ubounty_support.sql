-- Add payment_method, ubounty_bounty_id, and ubounty_url columns to issues table
ALTER TABLE issues 
ADD COLUMN payment_method VARCHAR(50),
ADD COLUMN ubounty_bounty_id VARCHAR(255),
ADD COLUMN ubounty_url TEXT;

-- Create index on ubounty_bounty_id for faster lookups
CREATE INDEX idx_issues_ubounty_bounty_id ON issues(ubounty_bounty_id);

-- Add check constraint for payment_method
ALTER TABLE issues 
ADD CONSTRAINT chk_payment_method 
CHECK (payment_method IS NULL OR payment_method IN ('stripe', 'ubounty', 'manual'));