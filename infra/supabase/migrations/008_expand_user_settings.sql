-- Expand user_settings table with additional preference columns
-- This migration adds columns for theme, validation settings, and notification preferences

-- Add new columns to user_settings
ALTER TABLE public.user_settings
ADD COLUMN IF NOT EXISTS theme text NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
ADD COLUMN IF NOT EXISTS fcf_scale numeric(3,2) NOT NULL DEFAULT 1.50 CHECK (fcf_scale >= 0.5 AND fcf_scale <= 3.0),
ADD COLUMN IF NOT EXISTS show_gdt_symbols boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS date_format text NOT NULL DEFAULT 'iso' CHECK (date_format IN ('iso', 'us', 'eu')),
ADD COLUMN IF NOT EXISTS strict_mode boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_validate boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS warn_on_implicit_rfs boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS validate_on_export boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS max_datum_references smallint NOT NULL DEFAULT 3 CHECK (max_datum_references >= 1 AND max_datum_references <= 6),
ADD COLUMN IF NOT EXISTS email_notifications boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS validation_alerts boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS project_updates boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS weekly_digest boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

-- Update existing rows to have the created_at timestamp
UPDATE public.user_settings SET created_at = updated_at WHERE created_at IS NULL;

COMMENT ON TABLE public.user_settings IS 'User preferences for display, validation, and notifications';
COMMENT ON COLUMN public.user_settings.theme IS 'UI theme preference: light, dark, or system';
COMMENT ON COLUMN public.user_settings.fcf_scale IS 'Default scale for FCF preview rendering';
COMMENT ON COLUMN public.user_settings.date_format IS 'Preferred date display format: iso (YYYY-MM-DD), us (MM/DD/YYYY), eu (DD/MM/YYYY)';
COMMENT ON COLUMN public.user_settings.strict_mode IS 'Treat all validation warnings as errors';
COMMENT ON COLUMN public.user_settings.auto_validate IS 'Validate FCF as you type in builder';
COMMENT ON COLUMN public.user_settings.warn_on_implicit_rfs IS 'Show warning for redundant RFS notation';
COMMENT ON COLUMN public.user_settings.validate_on_export IS 'Run validation before exporting';
COMMENT ON COLUMN public.user_settings.max_datum_references IS 'Maximum datum references allowed per FCF';
