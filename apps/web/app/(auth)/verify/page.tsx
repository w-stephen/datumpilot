import { Mail, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Check Your Email | DatumPilot",
  description: "We sent you a magic link to sign in",
};

export default function VerifyPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-8 h-px bg-accent-500" />
          <span className="font-mono text-[10px] text-accent-500 tracking-widest">
            AUTH.VERIFY
          </span>
          <div className="w-8 h-px bg-accent-500" />
        </div>
        <h1 className="font-mono text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          CHECK YOUR EMAIL
        </h1>
      </div>

      {/* Email icon */}
      <div className="flex justify-center">
        <div className="relative">
          <div className="w-20 h-20 border-2 border-accent-500/30 flex items-center justify-center">
            <Mail className="w-8 h-8 text-accent-500" />
          </div>
          {/* Animated corners */}
          <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-accent-500 animate-pulse" />
          <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-accent-500 animate-pulse" />
          <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-accent-500 animate-pulse" />
          <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-accent-500 animate-pulse" />
        </div>
      </div>

      {/* Instructions */}
      <div className="space-y-4 text-center">
        <p className="font-mono text-sm text-slate-700 dark:text-slate-300">
          We sent a magic link to your email address.
        </p>
        <p className="font-mono text-xs text-slate-500 dark:text-slate-600">
          Click the link in the email to sign in to your account.
        </p>
      </div>

      {/* Status box */}
      <div className="bg-slate-100/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 p-4">
        <div className="flex items-start gap-3">
          <div className="w-1.5 h-1.5 bg-accent-500 mt-1.5 animate-pulse" />
          <div className="flex-1">
            <p className="font-mono text-xs text-slate-600 dark:text-slate-400">
              Link expires in 1 hour. Check your spam folder if you don&apos;t
              see it.
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <Link
          href="/login"
          className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs font-medium hover:border-accent-500/30 hover:bg-accent-500/5 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          RESEND EMAIL
        </Link>

        <Link
          href="/login"
          className="w-full flex items-center justify-center gap-2 px-4 py-3 text-slate-500 dark:text-slate-600 font-mono text-xs hover:text-accent-500 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          BACK TO LOGIN
        </Link>
      </div>
    </div>
  );
}
