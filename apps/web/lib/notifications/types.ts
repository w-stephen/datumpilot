/**
 * Notification Types
 *
 * Type definitions for the notification system.
 * For v1, notifications are client-side only.
 * Future: Supabase table with RLS for server-side notifications.
 */

export type NotificationType = "system" | "validation" | "billing" | "team";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  href?: string;
  read: boolean;
  dismissible: boolean;
  createdAt: Date;
}

/**
 * Future database schema for notifications:
 *
 * CREATE TABLE public.notifications (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 *   type TEXT NOT NULL CHECK (type IN ('system', 'validation', 'billing', 'team')),
 *   title TEXT NOT NULL,
 *   message TEXT NOT NULL,
 *   href TEXT,
 *   read BOOLEAN NOT NULL DEFAULT FALSE,
 *   dismissible BOOLEAN NOT NULL DEFAULT TRUE,
 *   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 *   dismissed_at TIMESTAMPTZ
 * );
 *
 * CREATE INDEX notifications_user_created_idx
 *   ON public.notifications (user_id, created_at DESC);
 *
 * ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY notifications_owner_all ON public.notifications
 *   FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
 */
