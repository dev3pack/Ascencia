-- Add Ubounty integration fields to issues table
ALTER TABLE issues 
ADD COLUMN payment_method VARCHAR(50),
ADD COLUMN ubounty_bounty_id VARCHAR(255),
ADD COLUMN ubounty_url TEXT;

-- Create index on ubounty_bounty_id for faster lookups
CREATE INDEX idx_issues_ubounty_bounty_id ON issues(ubounty_bounty_id);

-- Add comment to describe the new columns
COMMENT ON COLUMN issues.payment_method IS 'Payment method for bounty (e.g., crypto, fiat)';
COMMENT ON COLUMN issues.ubounty_bounty_id IS 'External Ubounty bounty identifier';
COMMENT ON COLUMN issues.ubounty_url IS 'URL to the Ubounty bounty page';