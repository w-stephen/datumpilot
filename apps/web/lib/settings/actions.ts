"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  type UserSettings,
  type UserSettingsRow,
  DEFAULT_SETTINGS,
  rowToSettings,
  settingsToRow,
} from "./types";

// Types are exported from ./types - import UserSettings and DEFAULT_SETTINGS from there
export type { UserSettings } from "./types";

/**
 * Get the current user's settings from the database.
 * Creates default settings if none exist.
 */
export async function getUserSettings(): Promise<UserSettings> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return DEFAULT_SETTINGS;
  }

  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // No settings row exists - create one with defaults
  if (error?.code === "PGRST116") {
    const defaultRow = settingsToRow(DEFAULT_SETTINGS);
    const { data: newData, error: insertError } = await supabase
      .from("user_settings")
      .insert({ user_id: user.id, ...defaultRow })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to create user settings:", insertError);
      return DEFAULT_SETTINGS;
    }

    return rowToSettings(newData as UserSettingsRow);
  }

  if (error) {
    console.error("Failed to fetch user settings:", error);
    return DEFAULT_SETTINGS;
  }

  return rowToSettings(data as UserSettingsRow);
}

/**
 * Update user settings in the database.
 * Only updates the provided fields.
 */
export async function updateUserSettings(
  settings: Partial<UserSettings>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const updates = settingsToRow(settings);

  if (Object.keys(updates).length === 0) {
    return { success: true };
  }

  const { error } = await supabase
    .from("user_settings")
    .update(updates)
    .eq("user_id", user.id);

  if (error) {
    // If no row exists, try to insert
    if (error.code === "PGRST116") {
      const { error: insertError } = await supabase
        .from("user_settings")
        .insert({ user_id: user.id, ...updates });

      if (insertError) {
        console.error("Failed to create user settings:", insertError);
        return { success: false, error: insertError.message };
      }

      revalidatePath("/app/settings");
      return { success: true };
    }

    console.error("Failed to update user settings:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/app/settings");
  return { success: true };
}

/**
 * Reset user settings to defaults.
 */
export async function resetUserSettings(): Promise<{
  success: boolean;
  error?: string;
  settings?: UserSettings;
}> {
  const result = await updateUserSettings(DEFAULT_SETTINGS);

  if (result.success) {
    return { success: true, settings: DEFAULT_SETTINGS };
  }

  return result;
}
