import { ReactNode } from "react";
import { getUser } from "@/lib/supabase/server";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { SettingsProvider } from "@/lib/settings/context";
import AppShell from "@/components/layout/AppShell";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getUser();

  return (
    <AuthProvider user={user}>
      <SettingsProvider>
        <AppShell>{children}</AppShell>
      </SettingsProvider>
    </AuthProvider>
  );
}
