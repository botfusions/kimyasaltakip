-- Migration: Add signature_id to users table
-- Purpose: Enable lab users to have unique signature IDs for recipe approval
-- Date: 2026-01-30

-- Add signature_id column for lab users
ALTER TABLE users ADD COLUMN signature_id VARCHAR(6) UNIQUE;

-- Create index for fast signature ID lookups
CREATE INDEX idx_users_signature_id ON users(signature_id) WHERE signature_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN users.signature_id IS 'Unique 4-6 digit signature ID for lab users to approve recipes. NULL for admin/production/warehouse roles.';
