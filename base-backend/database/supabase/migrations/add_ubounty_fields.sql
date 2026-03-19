-- Add Ubounty integration fields to issues table
ALTER TABLE issues 
ADD COLUMN payment_method VARCHAR(50),
ADD COLUMN ubounty_bounty_id VARCHAR(255),
ADD COLUMN ubounty_url TEXT;

-- Add constraints
ALTER TABLE issues
ADD CONSTRAINT chk_payment_method CHECK (payment_method IN ('crypto', 'fiat', 'mixed') OR payment_method IS NULL);

-- Add index for ubounty_bounty_id for faster lookups
CREATE INDEX idx_issues_ubounty_bounty_id ON issues(ubounty_bounty_id) WHERE ubounty_bounty_id IS NOT NULL;

-- Add unique constraint for ubounty_bounty_id to prevent duplicates
ALTER TABLE issues
ADD CONSTRAINT uq_issues_ubounty_bounty_id UNIQUE (ubounty_bounty_id);