"use client";

import { useSearchParams } from "next/navigation";
import { AlertTriangle } from "lucide-react";

const ERROR_MESSAGES: Record<string, string> = {
  auth_failed: "Authentication failed. Please try again.",
  no_code: "Invalid authentication request. Please try again.",
  access_denied: "Access was denied. Please try again.",
  server_error: "An unexpected error occurred. Please try again.",
};

export function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (!error) {
    return null;
  }

  const message =
    errorDescription || ERROR_MESSAGES[error] || "An error occurred";

  return (
    <div className="flex items-start gap-3 p-4 bg-error-500/10 border border-error-500/30">
      <div className="flex-shrink-0 mt-0.5">
        <AlertTriangle className="w-4 h-4 text-error-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-mono text-xs text-error-500">{message}</p>
      </div>
    </div>
  );
}
