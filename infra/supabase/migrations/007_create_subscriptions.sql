-- Migration: Create subscriptions table
-- Description: Stores Stripe subscription data with RLS

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Stripe identifiers
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,

  -- Subscription details
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'team')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
    'active', 'canceled', 'incomplete', 'incomplete_expired',
    'past_due', 'paused', 'trialing', 'unpaid'
  )),

  -- Billing interval
  interval TEXT CHECK (interval IN ('month', 'year')),

  -- Period dates
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,

  -- Trial
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  UNIQUE (user_id),
  UNIQUE (stripe_customer_id),
  UNIQUE (stripe_subscription_id)
);

-- Create indexes
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_tier ON subscriptions(tier);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only view their own subscription
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own subscription (for initial free tier)
CREATE POLICY "Users can insert own subscription"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Only service role can update subscriptions (via webhooks)
-- No UPDATE policy for regular users

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_updated_at();

-- Function to get or create subscription for user
CREATE OR REPLACE FUNCTION get_or_create_subscription(p_user_id UUID)
RETURNS subscriptions AS $$
DECLARE
  v_subscription subscriptions;
BEGIN
  -- Try to get existing subscription
  SELECT * INTO v_subscription
  FROM subscriptions
  WHERE user_id = p_user_id;

  -- If not found, create free tier subscription
  IF v_subscription IS NULL THEN
    INSERT INTO subscriptions (user_id, tier, status)
    VALUES (p_user_id, 'free', 'active')
    RETURNING * INTO v_subscription;
  END IF;

  RETURN v_subscription;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON TABLE subscriptions IS 'User subscription data synced from Stripe';
COMMENT ON COLUMN subscriptions.tier IS 'Current subscription tier: free, pro, or team';
COMMENT ON COLUMN subscriptions.status IS 'Stripe subscription status';
