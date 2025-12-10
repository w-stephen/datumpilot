"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signInWithEmail, type AuthActionResult } from "@/lib/auth/actions";
import { Mail, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

function SubmitButton({ text = "Send Magic Link" }: { text?: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "w-full flex items-center justify-center gap-2 px-4 py-3",
        "bg-accent-500 text-slate-950 font-mono text-xs font-semibold",
        "hover:bg-accent-400 transition-all",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900"
      )}
      style={{
        clipPath:
          "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
      }}
    >
      {pending ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          SENDING...
        </>
      ) : (
        <>
          <Mail className="w-3.5 h-3.5" />
          {text.toUpperCase()}
        </>
      )}
    </button>
  );
}

interface LoginFormProps {
  buttonText?: string;
}

export function LoginForm({ buttonText = "Send Magic Link" }: LoginFormProps) {
  const [state, formAction] = useActionState<AuthActionResult | null, FormData>(
    signInWithEmail,
    null
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block font-mono text-[10px] text-slate-500 dark:text-slate-500 tracking-wider"
        >
          EMAIL ADDRESS
        </label>
        <div className="relative">
          <input
            type="email"
            id="email"
            name="email"
            required
            autoComplete="email"
            placeholder="engineer@company.com"
            className={cn(
              "w-full px-4 py-3 bg-slate-100/50 dark:bg-slate-800/50",
              "border border-slate-200 dark:border-slate-800",
              "text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600",
              "font-mono text-sm",
              "focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500",
              "transition-colors"
            )}
          />
          {/* Input corner accents */}
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-slate-300 dark:border-slate-700 pointer-events-none" />
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-slate-300 dark:border-slate-700 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-slate-300 dark:border-slate-700 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-slate-300 dark:border-slate-700 pointer-events-none" />
        </div>
      </div>

      {state?.error && (
        <div className="flex items-start gap-2 p-3 bg-error-500/10 border border-error-500/30">
          <div className="w-1.5 h-1.5 bg-error-500 mt-1.5" />
          <p className="font-mono text-xs text-error-500">{state.error}</p>
        </div>
      )}

      <SubmitButton text={buttonText} />

      <p className="text-center font-mono text-[10px] text-slate-500 dark:text-slate-600">
        We&apos;ll send you a magic link to sign in
      </p>
    </form>
  );
}
