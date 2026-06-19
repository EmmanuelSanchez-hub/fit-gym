"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useMounted } from "@/hooks/use-mounted";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  if (!mounted) {
    return (
      <div className="flex items-center gap-2">
        <Sun className="h-4 w-4" />
        <Switch checked={false} />
        <Moon className="h-4 w-4" />
      </div>
    );
  }

  const isDark = theme === "dark";

  return (
    <div className="flex items-center gap-2">
      <Sun className={`h-4 w-4 transition-colors ${!isDark ? "text-amber-500" : "text-muted-foreground"}`} />
      <Switch
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
        aria-label="Cambiar tema"
      />
      <Moon className={`h-4 w-4 transition-colors ${isDark ? "text-blue-400" : "text-muted-foreground"}`} />
    </div>
  );
}
