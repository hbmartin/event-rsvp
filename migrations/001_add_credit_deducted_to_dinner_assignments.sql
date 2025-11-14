-- Migration: Add credit_deducted flag to dinner_assignments table
-- Date: 2025-01-14
-- Description: Tracks whether a credit was deducted when assigning a member to a dinner.
--              This ensures we only refund credits that were actually charged.

ALTER TABLE dinner_assignments 
ADD COLUMN IF NOT EXISTS credit_deducted BOOLEAN NOT NULL DEFAULT FALSE;

-- Backfill: Existing assignments default to FALSE (credit not deducted)
-- This is safe because we don't know the historical subscription status
COMMENT ON COLUMN dinner_assignments.credit_deducted IS 
  'True if a credit was deducted when this assignment was created (user had no active subscription at time of assignment)';
