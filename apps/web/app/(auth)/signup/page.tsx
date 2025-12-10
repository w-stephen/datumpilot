import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { AuthError } from "@/components/auth/AuthError";

export const metadata = {
  title: "Sign Up | DatumPilot",
  description: "Create your DatumPilot account",
};

export default function SignupPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-8 h-px bg-accent-500" />
          <span className="font-mono text-[10px] text-accent-500 tracking-widest">
            AUTH.SIGNUP
          </span>
          <div className="w-8 h-px bg-accent-500" />
        </div>
        <h1 className="font-mono text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          CREATE ACCOUNT
        </h1>
        <p className="font-mono text-xs text-slate-500 dark:text-slate-600 mt-2">
          Start interpreting GD&T with precision
        </p>
      </div>

      {/* Error display */}
      <Suspense fallback={null}>
        <AuthError />
      </Suspense>

      {/* OAuth buttons */}
      <OAuthButtons />

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200 dark:border-slate-800" />
        </div>
        <div className="relative flex justify-center">
          <span className="px-3 bg-white dark:bg-slate-900 font-mono text-[10px] text-slate-500 dark:text-slate-600 tracking-wider">
            OR SIGN UP WITH EMAIL
          </span>
        </div>
      </div>

      {/* Email form */}
      <LoginForm buttonText="Create Account" />

      {/* Footer links */}
      <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
        <p className="text-center font-mono text-xs text-slate-500 dark:text-slate-600">
          Already have an account?{" "}
          <a
            href="/login"
            className="text-accent-500 hover:text-accent-400 transition-colors"
          >
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
