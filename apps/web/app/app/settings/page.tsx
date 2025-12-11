"use client";

import { useState, useEffect } from "react";
import {
  Ruler,
  Eye,
  Bell,
  Shield,
  User,
  Save,
  RotateCcw,
  Check,
  CreditCard,
  ExternalLink,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { createClient } from "@/lib/supabase/client";
import { TIERS, type Tier } from "@/lib/stripe/config";

type Tab = "display" | "validation" | "notifications" | "account";

interface DisplaySettings {
  defaultUnit: "mm" | "inch";
  decimalPlaces: number;
  showDualUnits: boolean;
  fcfScale: number;
  showGdtSymbols: boolean;
  dateFormat: "iso" | "us" | "eu";
}

interface ValidationSettings {
  strictMode: boolean;
  autoValidate: boolean;
  warnOnImplicitRfs: boolean;
  validateOnExport: boolean;
  maxDatumReferences: number;
}

interface NotificationSettings {
  emailNotifications: boolean;
  validationAlerts: boolean;
  projectUpdates: boolean;
  weeklyDigest: boolean;
}

interface UserData {
  id: string;
  email: string;
  name: string | null;
  organization: string | null;
  createdAt: string;
}

interface SubscriptionData {
  tier: Tier;
  status: string;
}

// Helper functions
function getInitials(nameOrEmail: string): string {
  if (nameOrEmail.includes("@")) {
    // It's an email - use first two characters of local part
    return nameOrEmail.split("@")[0].slice(0, 2).toUpperCase();
  }
  // It's a name - get first letter of first and last name
  const parts = nameOrEmail.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return nameOrEmail.slice(0, 2).toUpperCase();
}

function formatMemberSince(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// Technical panel wrapper
function TechnicalPanel({
  children,
  label,
  className,
  headerRight,
}: {
  children: React.ReactNode;
  label?: string;
  className?: string;
  headerRight?: React.ReactNode;
}) {
  return (
    <div className={cn("relative bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800", className)}>
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-slate-300 dark:border-slate-700" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-slate-300 dark:border-slate-700" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-slate-300 dark:border-slate-700" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-slate-300 dark:border-slate-700" />

      {(label || headerRight) && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/50 dark:border-slate-800/50">
          {label && (
            <span className="font-mono text-[10px] text-slate-500 tracking-widest">{label}</span>
          )}
          {headerRight}
        </div>
      )}
      {children}
    </div>
  );
}

// Toggle switch component
function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      className={cn(
        "w-10 h-5 transition-colors relative border",
        checked
          ? "bg-accent-500/20 border-accent-500"
          : "bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
      )}
    >
      <div
        className={cn(
          "absolute top-0.5 w-3.5 h-3.5 transition-transform",
          checked
            ? "translate-x-5 bg-accent-500"
            : "translate-x-0.5 bg-slate-400 dark:bg-slate-500"
        )}
      />
    </button>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("display");
  const [saved, setSaved] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [accountLoading, setAccountLoading] = useState(true);

  // Fetch user and subscription data
  useEffect(() => {
    async function fetchAccountData() {
      try {
        const supabase = createClient();

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setAccountLoading(false);
          return;
        }

        // Set user data
        setUserData({
          id: user.id,
          email: user.email || "",
          name: user.user_metadata?.full_name || user.user_metadata?.name || null,
          organization: user.user_metadata?.organization || null,
          createdAt: user.created_at,
        });

        // Fetch subscription data
        const res = await fetch("/api/billing");
        if (res.ok) {
          const data = await res.json();
          setSubscription({
            tier: data.tier,
            status: data.status,
          });
        }
      } catch (error) {
        console.error("Failed to fetch account data:", error);
      } finally {
        setAccountLoading(false);
      }
    }

    fetchAccountData();
  }, []);

  // Display settings
  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>({
    defaultUnit: "mm",
    decimalPlaces: 3,
    showDualUnits: false,
    fcfScale: 1.5,
    showGdtSymbols: true,
    dateFormat: "iso",
  });

  // Validation settings
  const [validationSettings, setValidationSettings] = useState<ValidationSettings>({
    strictMode: false,
    autoValidate: true,
    warnOnImplicitRfs: true,
    validateOnExport: true,
    maxDatumReferences: 3,
  });

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    validationAlerts: true,
    projectUpdates: false,
    weeklyDigest: false,
  });

  // Save handler
  const handleSave = () => {
    // In production, this would call the API
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Reset handler
  const handleReset = () => {
    setDisplaySettings({
      defaultUnit: "mm",
      decimalPlaces: 3,
      showDualUnits: false,
      fcfScale: 1.5,
      showGdtSymbols: true,
      dateFormat: "iso",
    });
    setValidationSettings({
      strictMode: false,
      autoValidate: true,
      warnOnImplicitRfs: true,
      validateOnExport: true,
      maxDatumReferences: 3,
    });
  };

  const tabs = [
    { id: "display", label: "DISPLAY", icon: Eye, code: "01" },
    { id: "validation", label: "VALIDATION", icon: Shield, code: "02" },
    { id: "notifications", label: "NOTIFICATIONS", icon: Bell, code: "03" },
    { id: "account", label: "ACCOUNT", icon: User, code: "04" },
  ] as const;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-200/50 dark:border-slate-800/50">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-px bg-accent-500" />
            <span className="font-mono text-xs text-accent-500 tracking-widest">SYS.CONFIG</span>
          </div>
          <h1 className="font-mono text-2xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
            SETTINGS
          </h1>
          <p className="text-slate-500 mt-1 font-mono text-sm">
            Configure DatumPilot preferences and defaults
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-3 py-2 border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-400 dark:hover:border-slate-600 font-mono text-xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            RESET
          </button>
          <button
            onClick={handleSave}
            className={cn(
              "flex items-center gap-2 px-4 py-2 font-mono text-xs font-semibold transition-all",
              saved
                ? "bg-accent-500/20 text-accent-500 border border-accent-500"
                : "bg-accent-500 text-slate-950 hover:bg-accent-400"
            )}
            style={{
              clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))',
            }}
          >
            {saved ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            {saved ? "SAVED" : "SAVE"}
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center gap-4 py-3 px-4 bg-slate-100/50 dark:bg-slate-900/30 border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-accent-500 animate-pulse" />
          <span className="font-mono text-xs text-accent-500">CONFIG ACTIVE</span>
        </div>
        <div className="h-4 w-px bg-slate-300 dark:bg-slate-700" />
        <span className="font-mono text-[10px] text-slate-500">
          TAB: {tabs.find(t => t.id === activeTab)?.label}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden pt-6">
        <div className="h-full flex gap-6">
          {/* Sidebar */}
          <nav className="w-56 flex-shrink-0">
            <TechnicalPanel label="NAV.TABS">
              <div className="p-4 space-y-1">
                {tabs.map(({ id, label, icon: Icon, code }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 transition-colors",
                      activeTab === id
                        ? "bg-accent-500/10 text-accent-500"
                        : "text-slate-600 dark:text-slate-500 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-300"
                    )}
                  >
                    {activeTab === id && (
                      <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-accent-500" />
                    )}
                    <span className={cn(
                      "font-mono text-[9px] w-5",
                      activeTab === id ? "text-accent-500" : "text-slate-400 dark:text-slate-700"
                    )}>
                      {code}
                    </span>
                    <Icon className="w-4 h-4" />
                    <span className="font-mono text-xs tracking-wide">{label}</span>
                  </button>
                ))}
                {/* Billing link */}
                <div className="mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-800/50">
                  <Link
                    href="/app/settings/billing"
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-600 dark:text-slate-500 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-300 transition-colors"
                  >
                    <span className="font-mono text-[9px] w-5 text-slate-400 dark:text-slate-700">
                      05
                    </span>
                    <CreditCard className="w-4 h-4" />
                    <span className="font-mono text-xs tracking-wide flex-1">BILLING</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </TechnicalPanel>
          </nav>

          {/* Main content */}
          <div className="flex-1 overflow-auto scrollbar-hide">
            {/* Display Settings */}
            {activeTab === "display" && (
              <div className="max-w-2xl space-y-6">
                <TechnicalPanel
                  label="UNITS.PRECISION"
                  headerRight={
                    <div className="flex items-center gap-2">
                      <Ruler className="w-3.5 h-3.5 text-primary-500" />
                    </div>
                  }
                >
                  <div className="p-4 space-y-6">
                    {/* Default Unit */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-mono text-xs text-slate-700 dark:text-slate-200">
                          DEFAULT UNIT
                        </label>
                        <p className="font-mono text-[10px] text-slate-500 dark:text-slate-600 mt-0.5">
                          Unit system for new FCF entries
                        </p>
                      </div>
                      <div className="flex items-center border border-slate-200 dark:border-slate-800">
                        {(["mm", "inch"] as const).map((unit) => (
                          <button
                            key={unit}
                            onClick={() =>
                              setDisplaySettings({ ...displaySettings, defaultUnit: unit })
                            }
                            className={cn(
                              "px-4 py-1.5 font-mono text-xs transition-colors uppercase",
                              displaySettings.defaultUnit === unit
                                ? "bg-accent-500/20 text-accent-400"
                                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            )}
                          >
                            {unit}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Decimal Places */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-mono text-xs text-slate-700 dark:text-slate-200">
                          DECIMAL PLACES
                        </label>
                        <p className="font-mono text-[10px] text-slate-500 dark:text-slate-600 mt-0.5">
                          Number of decimal places for tolerance values
                        </p>
                      </div>
                      <select
                        value={displaySettings.decimalPlaces}
                        onChange={(e) =>
                          setDisplaySettings({
                            ...displaySettings,
                            decimalPlaces: parseInt(e.target.value),
                          })
                        }
                        className="w-20 bg-white/60 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 px-3 py-2 font-mono text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-accent-500/50"
                      >
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Dual Units */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-mono text-xs text-slate-700 dark:text-slate-200">
                          DUAL UNITS
                        </label>
                        <p className="font-mono text-[10px] text-slate-500 dark:text-slate-600 mt-0.5">
                          Display both mm and inch values
                        </p>
                      </div>
                      <ToggleSwitch
                        checked={displaySettings.showDualUnits}
                        onChange={() =>
                          setDisplaySettings({
                            ...displaySettings,
                            showDualUnits: !displaySettings.showDualUnits,
                          })
                        }
                      />
                    </div>
                  </div>
                </TechnicalPanel>

                <TechnicalPanel
                  label="DISPLAY.OPTIONS"
                  headerRight={
                    <div className="flex items-center gap-2">
                      <Eye className="w-3.5 h-3.5 text-accent-500" />
                    </div>
                  }
                >
                  <div className="p-4 space-y-6">
                    {/* FCF Scale */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-mono text-xs text-slate-700 dark:text-slate-200">
                          FCF PREVIEW SCALE
                        </label>
                        <p className="font-mono text-[10px] text-slate-500 dark:text-slate-600 mt-0.5">
                          Default scale for FCF previews
                        </p>
                      </div>
                      <select
                        value={displaySettings.fcfScale}
                        onChange={(e) =>
                          setDisplaySettings({
                            ...displaySettings,
                            fcfScale: parseFloat(e.target.value),
                          })
                        }
                        className="w-20 bg-white/60 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 px-3 py-2 font-mono text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-accent-500/50"
                      >
                        {[1, 1.25, 1.5, 1.75, 2].map((s) => (
                          <option key={s} value={s}>
                            {s}x
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* GD&T Symbols */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-mono text-xs text-slate-700 dark:text-slate-200">
                          GD&T SYMBOLS
                        </label>
                        <p className="font-mono text-[10px] text-slate-500 dark:text-slate-600 mt-0.5">
                          Use Unicode symbols instead of text labels
                        </p>
                      </div>
                      <ToggleSwitch
                        checked={displaySettings.showGdtSymbols}
                        onChange={() =>
                          setDisplaySettings({
                            ...displaySettings,
                            showGdtSymbols: !displaySettings.showGdtSymbols,
                          })
                        }
                      />
                    </div>

                    {/* Date Format */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-mono text-xs text-slate-700 dark:text-slate-200">
                          DATE FORMAT
                        </label>
                        <p className="font-mono text-[10px] text-slate-500 dark:text-slate-600 mt-0.5">
                          Preferred date display format
                        </p>
                      </div>
                      <select
                        value={displaySettings.dateFormat}
                        onChange={(e) =>
                          setDisplaySettings({
                            ...displaySettings,
                            dateFormat: e.target.value as DisplaySettings["dateFormat"],
                          })
                        }
                        className="w-36 bg-white/60 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 px-3 py-2 font-mono text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-accent-500/50"
                      >
                        <option value="iso">ISO (YYYY-MM-DD)</option>
                        <option value="us">US (MM/DD/YYYY)</option>
                        <option value="eu">EU (DD/MM/YYYY)</option>
                      </select>
                    </div>
                  </div>
                </TechnicalPanel>
              </div>
            )}

            {/* Validation Settings */}
            {activeTab === "validation" && (
              <div className="max-w-2xl space-y-6">
                <TechnicalPanel
                  label="VALIDATION.RULES"
                  headerRight={
                    <div className="flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-warning-500" />
                    </div>
                  }
                >
                  <div className="p-4 space-y-6">
                    {/* Strict Mode */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-mono text-xs text-slate-700 dark:text-slate-200">
                          STRICT MODE
                        </label>
                        <p className="font-mono text-[10px] text-slate-500 dark:text-slate-600 mt-0.5">
                          Treat all warnings as errors
                        </p>
                      </div>
                      <ToggleSwitch
                        checked={validationSettings.strictMode}
                        onChange={() =>
                          setValidationSettings({
                            ...validationSettings,
                            strictMode: !validationSettings.strictMode,
                          })
                        }
                      />
                    </div>

                    {/* Auto Validate */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-mono text-xs text-slate-700 dark:text-slate-200">
                          AUTO VALIDATE
                        </label>
                        <p className="font-mono text-[10px] text-slate-500 dark:text-slate-600 mt-0.5">
                          Validate FCF as you type in builder
                        </p>
                      </div>
                      <ToggleSwitch
                        checked={validationSettings.autoValidate}
                        onChange={() =>
                          setValidationSettings({
                            ...validationSettings,
                            autoValidate: !validationSettings.autoValidate,
                          })
                        }
                      />
                    </div>

                    {/* Warn on Implicit RFS */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-mono text-xs text-slate-700 dark:text-slate-200">
                          WARN ON IMPLICIT RFS
                        </label>
                        <p className="font-mono text-[10px] text-slate-500 dark:text-slate-600 mt-0.5">
                          Show warning for redundant RFS notation
                        </p>
                      </div>
                      <ToggleSwitch
                        checked={validationSettings.warnOnImplicitRfs}
                        onChange={() =>
                          setValidationSettings({
                            ...validationSettings,
                            warnOnImplicitRfs: !validationSettings.warnOnImplicitRfs,
                          })
                        }
                      />
                    </div>

                    {/* Validate on Export */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-mono text-xs text-slate-700 dark:text-slate-200">
                          VALIDATE ON EXPORT
                        </label>
                        <p className="font-mono text-[10px] text-slate-500 dark:text-slate-600 mt-0.5">
                          Run validation before exporting
                        </p>
                      </div>
                      <ToggleSwitch
                        checked={validationSettings.validateOnExport}
                        onChange={() =>
                          setValidationSettings({
                            ...validationSettings,
                            validateOnExport: !validationSettings.validateOnExport,
                          })
                        }
                      />
                    </div>
                  </div>
                </TechnicalPanel>
              </div>
            )}

            {/* Notifications */}
            {activeTab === "notifications" && (
              <div className="max-w-2xl space-y-6">
                <TechnicalPanel
                  label="EMAIL.NOTIFICATIONS"
                  headerRight={
                    <div className="flex items-center gap-2">
                      <Bell className="w-3.5 h-3.5 text-purple-500" />
                    </div>
                  }
                >
                  <div className="p-4 space-y-6">
                    {/* Email Notifications */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-mono text-xs text-slate-700 dark:text-slate-200">
                          EMAIL NOTIFICATIONS
                        </label>
                        <p className="font-mono text-[10px] text-slate-500 dark:text-slate-600 mt-0.5">
                          Receive email notifications
                        </p>
                      </div>
                      <ToggleSwitch
                        checked={notificationSettings.emailNotifications}
                        onChange={() =>
                          setNotificationSettings({
                            ...notificationSettings,
                            emailNotifications: !notificationSettings.emailNotifications,
                          })
                        }
                      />
                    </div>

                    {/* Validation Alerts */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-mono text-xs text-slate-700 dark:text-slate-200">
                          VALIDATION ALERTS
                        </label>
                        <p className="font-mono text-[10px] text-slate-500 dark:text-slate-600 mt-0.5">
                          Get notified of validation failures
                        </p>
                      </div>
                      <ToggleSwitch
                        checked={notificationSettings.validationAlerts}
                        onChange={() =>
                          setNotificationSettings({
                            ...notificationSettings,
                            validationAlerts: !notificationSettings.validationAlerts,
                          })
                        }
                      />
                    </div>

                    {/* Project Updates */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-mono text-xs text-slate-700 dark:text-slate-200">
                          PROJECT UPDATES
                        </label>
                        <p className="font-mono text-[10px] text-slate-500 dark:text-slate-600 mt-0.5">
                          Get notified when team members update projects
                        </p>
                      </div>
                      <ToggleSwitch
                        checked={notificationSettings.projectUpdates}
                        onChange={() =>
                          setNotificationSettings({
                            ...notificationSettings,
                            projectUpdates: !notificationSettings.projectUpdates,
                          })
                        }
                      />
                    </div>

                    {/* Weekly Digest */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-mono text-xs text-slate-700 dark:text-slate-200">
                          WEEKLY DIGEST
                        </label>
                        <p className="font-mono text-[10px] text-slate-500 dark:text-slate-600 mt-0.5">
                          Receive weekly summary email
                        </p>
                      </div>
                      <ToggleSwitch
                        checked={notificationSettings.weeklyDigest}
                        onChange={() =>
                          setNotificationSettings({
                            ...notificationSettings,
                            weeklyDigest: !notificationSettings.weeklyDigest,
                          })
                        }
                      />
                    </div>
                  </div>
                </TechnicalPanel>
              </div>
            )}

            {/* Account */}
            {activeTab === "account" && (
              <div className="max-w-2xl space-y-6">
                <TechnicalPanel
                  label="ACCOUNT.INFO"
                  headerRight={
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-accent-500" />
                    </div>
                  }
                >
                  {accountLoading ? (
                    <div className="p-8 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
                    </div>
                  ) : userData ? (
                    <div className="p-4 space-y-6">
                      {/* User info */}
                      <div className="flex items-center gap-4 p-4 bg-slate-100/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
                        <div className="w-14 h-14 border border-accent-500/30 bg-accent-500/5 flex items-center justify-center font-mono text-lg font-bold text-accent-500">
                          {getInitials(userData.name || userData.email)}
                        </div>
                        <div>
                          <h4 className="font-mono text-sm text-slate-700 dark:text-slate-200">
                            {(userData.name || userData.email.split("@")[0]).toUpperCase()}
                          </h4>
                          <p className="font-mono text-xs text-slate-500">
                            {userData.email}
                          </p>
                          <p className="font-mono text-[10px] text-slate-500 dark:text-slate-600 mt-1">
                            Member since {formatMemberSince(userData.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="font-mono text-xs text-slate-700 dark:text-slate-200">
                            EMAIL
                          </label>
                          <p className="font-mono text-[10px] text-slate-500 dark:text-slate-600 mt-0.5">
                            Your account email address
                          </p>
                        </div>
                        <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
                          {userData.email}
                        </span>
                      </div>

                      {userData.organization && (
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="font-mono text-xs text-slate-700 dark:text-slate-200">
                              ORGANIZATION
                            </label>
                            <p className="font-mono text-[10px] text-slate-500 dark:text-slate-600 mt-0.5">
                              Your company or team
                            </p>
                          </div>
                          <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
                            {userData.organization.toUpperCase()}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="font-mono text-xs text-slate-700 dark:text-slate-200">
                            PLAN
                          </label>
                          <p className="font-mono text-[10px] text-slate-500 dark:text-slate-600 mt-0.5">
                            Your subscription plan
                          </p>
                        </div>
                        <span className={cn(
                          "px-3 py-1 font-mono text-[10px] border",
                          subscription?.tier === "pro" || subscription?.tier === "team"
                            ? "bg-accent-500/20 text-accent-400 border-accent-500/30"
                            : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700"
                        )}>
                          {subscription ? TIERS[subscription.tier].name.toUpperCase() : "FREE"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <p className="font-mono text-xs text-slate-500">
                        Unable to load account data
                      </p>
                    </div>
                  )}
                </TechnicalPanel>

                <TechnicalPanel
                  label="DANGER.ZONE"
                  className="border-error-500/30"
                  headerRight={
                    <span className="font-mono text-[10px] text-error-500">DESTRUCTIVE</span>
                  }
                >
                  <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="font-mono text-xs text-slate-700 dark:text-slate-200">
                          DELETE ACCOUNT
                        </label>
                        <p className="font-mono text-[10px] text-slate-500 dark:text-slate-600 mt-0.5">
                          Permanently delete your account and all data
                        </p>
                      </div>
                      <button className="px-4 py-2 font-mono text-xs bg-error-500/20 text-error-400 border border-error-500/30 hover:bg-error-500/30 transition-colors">
                        DELETE
                      </button>
                    </div>
                  </div>
                </TechnicalPanel>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
