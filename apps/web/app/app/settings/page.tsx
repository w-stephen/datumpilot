"use client";

import { useState } from "react";
import {
  Settings,
  Ruler,
  Calculator,
  Eye,
  Bell,
  Shield,
  Database,
  User,
  Save,
  RotateCcw,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

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

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("display");
  const [saved, setSaved] = useState(false);

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
    { id: "display", label: "Display", icon: Eye },
    { id: "validation", label: "Validation", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "account", label: "Account", icon: User },
  ] as const;

  return (
    <div className="h-full flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-mono font-bold text-slate-50 tracking-tight">
            Settings
          </h1>
          <p className="text-slate-400 mt-1">
            Configure your DatumPilot preferences and defaults
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleReset} className="btn-secondary text-sm">
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          <button onClick={handleSave} className="btn-primary text-sm">
            {saved ? (
              <Check className="w-4 h-4 text-success-400" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saved ? "Saved" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden pt-6">
        <div className="h-full flex gap-6">
          {/* Sidebar */}
          <nav className="w-56 flex-shrink-0">
            <div className="space-y-1">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors",
                    activeTab === id
                      ? "bg-primary-500/10 text-primary-400"
                      : "text-slate-400 hover:bg-slate-800 hover:text-slate-300"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </button>
              ))}
            </div>
          </nav>

          {/* Main content */}
          <div className="flex-1 overflow-auto">
            {/* Display Settings */}
            {activeTab === "display" && (
              <div className="max-w-2xl space-y-6">
                <div className="panel">
                  <div className="panel-header">
                    <div className="flex items-center gap-2">
                      <Ruler className="w-4 h-4 text-primary-500" />
                      <h3 className="panel-title">Units & Precision</h3>
                    </div>
                  </div>
                  <div className="space-y-6">
                    {/* Default Unit */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-slate-200">
                          Default Unit
                        </label>
                        <p className="text-xs text-slate-500">
                          Unit system for new FCF entries
                        </p>
                      </div>
                      <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
                        {(["mm", "inch"] as const).map((unit) => (
                          <button
                            key={unit}
                            onClick={() =>
                              setDisplaySettings({ ...displaySettings, defaultUnit: unit })
                            }
                            className={cn(
                              "px-4 py-1.5 text-sm rounded-md transition-colors",
                              displaySettings.defaultUnit === unit
                                ? "bg-primary-500/20 text-primary-400"
                                : "text-slate-400 hover:text-slate-300"
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
                        <label className="text-sm font-medium text-slate-200">
                          Decimal Places
                        </label>
                        <p className="text-xs text-slate-500">
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
                        className="w-24 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
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
                        <label className="text-sm font-medium text-slate-200">
                          Show Dual Units
                        </label>
                        <p className="text-xs text-slate-500">
                          Display both mm and inch values
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setDisplaySettings({
                            ...displaySettings,
                            showDualUnits: !displaySettings.showDualUnits,
                          })
                        }
                        className={cn(
                          "w-12 h-6 rounded-full transition-colors relative",
                          displaySettings.showDualUnits
                            ? "bg-primary-500"
                            : "bg-slate-700"
                        )}
                      >
                        <div
                          className={cn(
                            "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform",
                            displaySettings.showDualUnits
                              ? "translate-x-6"
                              : "translate-x-1"
                          )}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="panel">
                  <div className="panel-header">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-accent-500" />
                      <h3 className="panel-title">Display Options</h3>
                    </div>
                  </div>
                  <div className="space-y-6">
                    {/* FCF Scale */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-slate-200">
                          FCF Preview Scale
                        </label>
                        <p className="text-xs text-slate-500">
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
                        className="w-24 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
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
                        <label className="text-sm font-medium text-slate-200">
                          Show GD&T Symbols
                        </label>
                        <p className="text-xs text-slate-500">
                          Use Unicode symbols instead of text labels
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setDisplaySettings({
                            ...displaySettings,
                            showGdtSymbols: !displaySettings.showGdtSymbols,
                          })
                        }
                        className={cn(
                          "w-12 h-6 rounded-full transition-colors relative",
                          displaySettings.showGdtSymbols
                            ? "bg-primary-500"
                            : "bg-slate-700"
                        )}
                      >
                        <div
                          className={cn(
                            "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform",
                            displaySettings.showGdtSymbols
                              ? "translate-x-6"
                              : "translate-x-1"
                          )}
                        />
                      </button>
                    </div>

                    {/* Date Format */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-slate-200">
                          Date Format
                        </label>
                        <p className="text-xs text-slate-500">
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
                        className="w-32 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                      >
                        <option value="iso">ISO (YYYY-MM-DD)</option>
                        <option value="us">US (MM/DD/YYYY)</option>
                        <option value="eu">EU (DD/MM/YYYY)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Validation Settings */}
            {activeTab === "validation" && (
              <div className="max-w-2xl space-y-6">
                <div className="panel">
                  <div className="panel-header">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-warning-500" />
                      <h3 className="panel-title">Validation Rules</h3>
                    </div>
                  </div>
                  <div className="space-y-6">
                    {/* Strict Mode */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-slate-200">
                          Strict Mode
                        </label>
                        <p className="text-xs text-slate-500">
                          Treat all warnings as errors
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setValidationSettings({
                            ...validationSettings,
                            strictMode: !validationSettings.strictMode,
                          })
                        }
                        className={cn(
                          "w-12 h-6 rounded-full transition-colors relative",
                          validationSettings.strictMode
                            ? "bg-primary-500"
                            : "bg-slate-700"
                        )}
                      >
                        <div
                          className={cn(
                            "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform",
                            validationSettings.strictMode
                              ? "translate-x-6"
                              : "translate-x-1"
                          )}
                        />
                      </button>
                    </div>

                    {/* Auto Validate */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-slate-200">
                          Auto Validate
                        </label>
                        <p className="text-xs text-slate-500">
                          Validate FCF as you type in builder
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setValidationSettings({
                            ...validationSettings,
                            autoValidate: !validationSettings.autoValidate,
                          })
                        }
                        className={cn(
                          "w-12 h-6 rounded-full transition-colors relative",
                          validationSettings.autoValidate
                            ? "bg-primary-500"
                            : "bg-slate-700"
                        )}
                      >
                        <div
                          className={cn(
                            "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform",
                            validationSettings.autoValidate
                              ? "translate-x-6"
                              : "translate-x-1"
                          )}
                        />
                      </button>
                    </div>

                    {/* Warn on Implicit RFS */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-slate-200">
                          Warn on Implicit RFS
                        </label>
                        <p className="text-xs text-slate-500">
                          Show warning for redundant RFS notation
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setValidationSettings({
                            ...validationSettings,
                            warnOnImplicitRfs: !validationSettings.warnOnImplicitRfs,
                          })
                        }
                        className={cn(
                          "w-12 h-6 rounded-full transition-colors relative",
                          validationSettings.warnOnImplicitRfs
                            ? "bg-primary-500"
                            : "bg-slate-700"
                        )}
                      >
                        <div
                          className={cn(
                            "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform",
                            validationSettings.warnOnImplicitRfs
                              ? "translate-x-6"
                              : "translate-x-1"
                          )}
                        />
                      </button>
                    </div>

                    {/* Validate on Export */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-slate-200">
                          Validate on Export
                        </label>
                        <p className="text-xs text-slate-500">
                          Run validation before exporting JSON
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setValidationSettings({
                            ...validationSettings,
                            validateOnExport: !validationSettings.validateOnExport,
                          })
                        }
                        className={cn(
                          "w-12 h-6 rounded-full transition-colors relative",
                          validationSettings.validateOnExport
                            ? "bg-primary-500"
                            : "bg-slate-700"
                        )}
                      >
                        <div
                          className={cn(
                            "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform",
                            validationSettings.validateOnExport
                              ? "translate-x-6"
                              : "translate-x-1"
                          )}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications */}
            {activeTab === "notifications" && (
              <div className="max-w-2xl space-y-6">
                <div className="panel">
                  <div className="panel-header">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-purple-500" />
                      <h3 className="panel-title">Email Notifications</h3>
                    </div>
                  </div>
                  <div className="space-y-6">
                    {/* Email Notifications */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-slate-200">
                          Email Notifications
                        </label>
                        <p className="text-xs text-slate-500">
                          Receive email notifications
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setNotificationSettings({
                            ...notificationSettings,
                            emailNotifications: !notificationSettings.emailNotifications,
                          })
                        }
                        className={cn(
                          "w-12 h-6 rounded-full transition-colors relative",
                          notificationSettings.emailNotifications
                            ? "bg-primary-500"
                            : "bg-slate-700"
                        )}
                      >
                        <div
                          className={cn(
                            "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform",
                            notificationSettings.emailNotifications
                              ? "translate-x-6"
                              : "translate-x-1"
                          )}
                        />
                      </button>
                    </div>

                    {/* Validation Alerts */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-slate-200">
                          Validation Alerts
                        </label>
                        <p className="text-xs text-slate-500">
                          Get notified of validation failures
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setNotificationSettings({
                            ...notificationSettings,
                            validationAlerts: !notificationSettings.validationAlerts,
                          })
                        }
                        className={cn(
                          "w-12 h-6 rounded-full transition-colors relative",
                          notificationSettings.validationAlerts
                            ? "bg-primary-500"
                            : "bg-slate-700"
                        )}
                      >
                        <div
                          className={cn(
                            "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform",
                            notificationSettings.validationAlerts
                              ? "translate-x-6"
                              : "translate-x-1"
                          )}
                        />
                      </button>
                    </div>

                    {/* Project Updates */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-slate-200">
                          Project Updates
                        </label>
                        <p className="text-xs text-slate-500">
                          Get notified when team members update projects
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setNotificationSettings({
                            ...notificationSettings,
                            projectUpdates: !notificationSettings.projectUpdates,
                          })
                        }
                        className={cn(
                          "w-12 h-6 rounded-full transition-colors relative",
                          notificationSettings.projectUpdates
                            ? "bg-primary-500"
                            : "bg-slate-700"
                        )}
                      >
                        <div
                          className={cn(
                            "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform",
                            notificationSettings.projectUpdates
                              ? "translate-x-6"
                              : "translate-x-1"
                          )}
                        />
                      </button>
                    </div>

                    {/* Weekly Digest */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-slate-200">
                          Weekly Digest
                        </label>
                        <p className="text-xs text-slate-500">
                          Receive weekly summary email
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setNotificationSettings({
                            ...notificationSettings,
                            weeklyDigest: !notificationSettings.weeklyDigest,
                          })
                        }
                        className={cn(
                          "w-12 h-6 rounded-full transition-colors relative",
                          notificationSettings.weeklyDigest
                            ? "bg-primary-500"
                            : "bg-slate-700"
                        )}
                      >
                        <div
                          className={cn(
                            "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform",
                            notificationSettings.weeklyDigest
                              ? "translate-x-6"
                              : "translate-x-1"
                          )}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Account */}
            {activeTab === "account" && (
              <div className="max-w-2xl space-y-6">
                <div className="panel">
                  <div className="panel-header">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-success-500" />
                      <h3 className="panel-title">Account Information</h3>
                    </div>
                  </div>
                  <div className="space-y-6">
                    {/* Mock user info */}
                    <div className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-lg border border-slate-800">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-2xl font-bold text-white">
                        JD
                      </div>
                      <div>
                        <h4 className="text-lg font-medium text-slate-200">
                          John Doe
                        </h4>
                        <p className="text-sm text-slate-400">
                          john.doe@example.com
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Member since January 2024
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-slate-200">
                          Email
                        </label>
                        <p className="text-xs text-slate-500">
                          Your account email address
                        </p>
                      </div>
                      <span className="text-sm text-slate-300">
                        john.doe@example.com
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-slate-200">
                          Organization
                        </label>
                        <p className="text-xs text-slate-500">
                          Your company or team
                        </p>
                      </div>
                      <span className="text-sm text-slate-300">
                        Acme Manufacturing
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-slate-200">
                          Plan
                        </label>
                        <p className="text-xs text-slate-500">
                          Your subscription plan
                        </p>
                      </div>
                      <span className="px-3 py-1 text-xs font-medium bg-primary-500/20 text-primary-400 rounded-full">
                        Professional
                      </span>
                    </div>
                  </div>
                </div>

                <div className="panel border-error-500/30">
                  <div className="panel-header">
                    <h3 className="panel-title text-error-400">Danger Zone</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-slate-200">
                          Delete Account
                        </label>
                        <p className="text-xs text-slate-500">
                          Permanently delete your account and all data
                        </p>
                      </div>
                      <button className="px-4 py-2 text-sm bg-error-500/20 text-error-400 border border-error-500/30 rounded-lg hover:bg-error-500/30 transition-colors">
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
