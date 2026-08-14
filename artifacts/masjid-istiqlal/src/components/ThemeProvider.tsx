import { useEffect } from "react";
import { useGetSettings } from "@workspace/api-client-react";
import { applyThemeSettings } from "@/lib/theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: settings } = useGetSettings();

  useEffect(() => {
    if (!settings) return;
    applyThemeSettings(settings as Record<string, unknown>);
  }, [settings]);

  return <>{children}</>;
}
