/**
 * User Settings Types and Defaults
 *
 * Shared between client and server code.
 * NOT a server action file - safe to import during render.
 */

/**
 * User Settings Types
 */
export interface UserSettings {
  // Display settings
  unit: "mm" | "inch";
  decimals: 1 | 2 | 3 | 4;
  dualDisplay: boolean;
  fcfScale: number;
  showGdtSymbols: boolean;
  dateFormat: "iso" | "us" | "eu";
  theme: "light" | "dark" | "system";

  // Validation settings
  strictMode: boolean;
  autoValidate: boolean;
  warnOnImplicitRfs: boolean;
  validateOnExport: boolean;
  maxDatumReferences: number;

  // Notification settings
  emailNotifications: boolean;
  validationAlerts: boolean;
  projectUpdates: boolean;
  weeklyDigest: boolean;
}

export const DEFAULT_SETTINGS: UserSettings = {
  // Display
  unit: "mm",
  decimals: 3,
  dualDisplay: false,
  fcfScale: 1.5,
  showGdtSymbols: true,
  dateFormat: "iso",
  theme: "system",
  // Validation
  strictMode: false,
  autoValidate: true,
  warnOnImplicitRfs: true,
  validateOnExport: true,
  maxDatumReferences: 3,
  // Notifications
  emailNotifications: true,
  validationAlerts: true,
  projectUpdates: false,
  weeklyDigest: false,
};

// Database row shape (snake_case)
export interface UserSettingsRow {
  user_id: string;
  unit: string;
  decimals: number;
  dual_display: boolean;
  fcf_scale: number;
  show_gdt_symbols: boolean;
  date_format: string;
  theme: string;
  strict_mode: boolean;
  auto_validate: boolean;
  warn_on_implicit_rfs: boolean;
  validate_on_export: boolean;
  max_datum_references: number;
  email_notifications: boolean;
  validation_alerts: boolean;
  project_updates: boolean;
  weekly_digest: boolean;
  updated_at: string;
  created_at: string;
}

// Convert database row to frontend settings
export function rowToSettings(row: UserSettingsRow): UserSettings {
  return {
    unit: row.unit as UserSettings["unit"],
    decimals: row.decimals as UserSettings["decimals"],
    dualDisplay: row.dual_display,
    fcfScale: Number(row.fcf_scale),
    showGdtSymbols: row.show_gdt_symbols,
    dateFormat: row.date_format as UserSettings["dateFormat"],
    theme: row.theme as UserSettings["theme"],
    strictMode: row.strict_mode,
    autoValidate: row.auto_validate,
    warnOnImplicitRfs: row.warn_on_implicit_rfs,
    validateOnExport: row.validate_on_export,
    maxDatumReferences: row.max_datum_references,
    emailNotifications: row.email_notifications,
    validationAlerts: row.validation_alerts,
    projectUpdates: row.project_updates,
    weeklyDigest: row.weekly_digest,
  };
}

// Convert frontend settings to database columns
export function settingsToRow(
  settings: Partial<UserSettings>
): Partial<Omit<UserSettingsRow, "user_id" | "updated_at" | "created_at">> {
  const row: Record<string, unknown> = {};

  if (settings.unit !== undefined) row.unit = settings.unit;
  if (settings.decimals !== undefined) row.decimals = settings.decimals;
  if (settings.dualDisplay !== undefined) row.dual_display = settings.dualDisplay;
  if (settings.fcfScale !== undefined) row.fcf_scale = settings.fcfScale;
  if (settings.showGdtSymbols !== undefined) row.show_gdt_symbols = settings.showGdtSymbols;
  if (settings.dateFormat !== undefined) row.date_format = settings.dateFormat;
  if (settings.theme !== undefined) row.theme = settings.theme;
  if (settings.strictMode !== undefined) row.strict_mode = settings.strictMode;
  if (settings.autoValidate !== undefined) row.auto_validate = settings.autoValidate;
  if (settings.warnOnImplicitRfs !== undefined) row.warn_on_implicit_rfs = settings.warnOnImplicitRfs;
  if (settings.validateOnExport !== undefined) row.validate_on_export = settings.validateOnExport;
  if (settings.maxDatumReferences !== undefined) row.max_datum_references = settings.maxDatumReferences;
  if (settings.emailNotifications !== undefined) row.email_notifications = settings.emailNotifications;
  if (settings.validationAlerts !== undefined) row.validation_alerts = settings.validationAlerts;
  if (settings.projectUpdates !== undefined) row.project_updates = settings.projectUpdates;
  if (settings.weeklyDigest !== undefined) row.weekly_digest = settings.weeklyDigest;

  return row;
}
