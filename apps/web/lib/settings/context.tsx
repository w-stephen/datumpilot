"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { getUserSettings, updateUserSettings, resetUserSettings } from "./actions";
import { type UserSettings, DEFAULT_SETTINGS } from "./types";
import { toast } from "sonner";

interface SettingsContextType {
  settings: UserSettings;
  isLoading: boolean;
  isSaving: boolean;
  updateSetting: <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => void;
  updateSettings: (updates: Partial<UserSettings>) => void;
  resetSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

interface SettingsProviderProps {
  children: ReactNode;
  initialSettings?: UserSettings;
}

export function SettingsProvider({
  children,
  initialSettings,
}: SettingsProviderProps) {
  const [settings, setSettings] = useState<UserSettings>(
    initialSettings ?? DEFAULT_SETTINGS
  );
  const [isLoading, setIsLoading] = useState(!initialSettings);
  const [isSaving, setIsSaving] = useState(false);

  // Debounce timer ref
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = useRef<Partial<UserSettings>>({});

  // Load settings on mount if not provided
  useEffect(() => {
    if (initialSettings) return;

    let cancelled = false;

    async function loadSettings() {
      try {
        const loadedSettings = await getUserSettings();
        if (!cancelled) {
          setSettings(loadedSettings);
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
        if (!cancelled) {
          toast.error("Failed to load settings");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadSettings();

    return () => {
      cancelled = true;
    };
  }, [initialSettings]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Debounced save function
  const debouncedSave = useCallback(async () => {
    const updates = pendingUpdatesRef.current;
    if (Object.keys(updates).length === 0) return;

    setIsSaving(true);
    pendingUpdatesRef.current = {};

    try {
      const result = await updateUserSettings(updates);
      if (result.success) {
        toast.success("Settings saved", {
          duration: 2000,
        });
      } else {
        toast.error(result.error || "Failed to save settings");
        // Revert optimistic update on failure
        const revertedSettings = await getUserSettings();
        setSettings(revertedSettings);
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings");
      // Revert optimistic update on failure
      const revertedSettings = await getUserSettings();
      setSettings(revertedSettings);
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Update a single setting with debounced save
  const updateSetting = useCallback(
    <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
      // Optimistic update
      setSettings((prev) => ({ ...prev, [key]: value }));

      // Queue the update
      pendingUpdatesRef.current = {
        ...pendingUpdatesRef.current,
        [key]: value,
      };

      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set new debounced save (500ms)
      saveTimeoutRef.current = setTimeout(debouncedSave, 500);
    },
    [debouncedSave]
  );

  // Update multiple settings at once
  const updateSettings = useCallback(
    (updates: Partial<UserSettings>) => {
      // Optimistic update
      setSettings((prev) => ({ ...prev, ...updates }));

      // Queue the updates
      pendingUpdatesRef.current = {
        ...pendingUpdatesRef.current,
        ...updates,
      };

      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set new debounced save (500ms)
      saveTimeoutRef.current = setTimeout(debouncedSave, 500);
    },
    [debouncedSave]
  );

  // Reset to defaults
  const resetSettingsHandler = useCallback(async () => {
    // Clear any pending saves
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    pendingUpdatesRef.current = {};

    setIsSaving(true);
    try {
      const result = await resetUserSettings();
      if (result.success && result.settings) {
        setSettings(result.settings);
        toast.success("Settings reset to defaults");
      } else {
        toast.error(result.error || "Failed to reset settings");
      }
    } catch (error) {
      console.error("Failed to reset settings:", error);
      toast.error("Failed to reset settings");
    } finally {
      setIsSaving(false);
    }
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoading,
        isSaving,
        updateSetting,
        updateSettings,
        resetSettings: resetSettingsHandler,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}

// Hook for accessing just the display settings (commonly used)
export function useDisplaySettings() {
  const { settings } = useSettings();
  return {
    unit: settings.unit,
    decimals: settings.decimals,
    dualDisplay: settings.dualDisplay,
    fcfScale: settings.fcfScale,
    showGdtSymbols: settings.showGdtSymbols,
    dateFormat: settings.dateFormat,
    theme: settings.theme,
  };
}

// Hook for accessing just the validation settings
export function useValidationSettings() {
  const { settings } = useSettings();
  return {
    strictMode: settings.strictMode,
    autoValidate: settings.autoValidate,
    warnOnImplicitRfs: settings.warnOnImplicitRfs,
    validateOnExport: settings.validateOnExport,
    maxDatumReferences: settings.maxDatumReferences,
  };
}
